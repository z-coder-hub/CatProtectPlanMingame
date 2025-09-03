import { _decorator, Component, Node, Vec3, instantiate } from 'cc';
import { WaveConfig, EnemyType } from '../types/GameTypes';
import { GAME_CONFIG } from '../types/GameConstants';
import { GameManager } from './GameManager';
import { BattleManager } from './BattleManager';
import { ResourceManager, ResourceManagerHelper } from './ResourceManager';
import { BasicMouse } from '../components/enemies/BasicMouse';
import { FastMouse } from '../components/enemies/FastMouse';
import { ArmoredMouse } from '../components/enemies/ArmoredMouse';
import { GiantMouse } from '../components/enemies/GiantMouse';
import { SpeedMouse } from '../components/enemies/SpeedMouse';
import { GridDeploymentSystem } from '../systems/GridDeploymentSystem';

const { ccclass, property } = _decorator;

// 波次状态
export enum WaveState {
    WAITING = "waiting",     // 等待开始
    SPAWNING = "spawning",   // 生成中
    COMPLETED = "completed", // 已完成
    FAILED = "failed"        // 失败
}

// 敌人生成信息
interface EnemySpawnInfo {
    type: EnemyType;
    remainingCount: number;
    spawnDelay: number;
    nextSpawnTime: number;
}

@ccclass('WaveManager')
export class WaveManager extends Component {
    
    
    @property({ tooltip: "波次间隔时间(秒)" })
    public wavePrepareTime: number = 5;
    
    @property({ tooltip: "是否自动开始下一波" })
    public autoStartNextWave: boolean = false;
    
    // 当前波次状态
    private _currentWaveIndex: number = 0;
    private _waveState: WaveState = WaveState.WAITING;
    private _currentWaveConfig: WaveConfig | null = null;
    
    // 敌人生成管理
    private _enemySpawnQueue: EnemySpawnInfo[] = [];
    private _waveTimer: number = 0;
    private _prepareTimer: number = 0;
    
    // 引用其他管理器
    private _gameManager: GameManager | null = null;
    private _battleManager: BattleManager | null = null;
    private _resourceManager: ResourceManager | null = null;
    
    // 获取当前波次状态
    public get waveState(): WaveState {
        return this._waveState;
    }
    
    public get currentWaveNumber(): number {
        return this._currentWaveIndex + 1;
    }
    
    public get totalWaves(): number {
        return GAME_CONFIG.waves.length;
    }
    
    public get isLastWave(): boolean {
        return this._currentWaveIndex >= this.totalWaves - 1;
    }
    
    // 单例实例
    private static _instance: WaveManager | null = null;
    
    public static get instance(): WaveManager | null {
        return WaveManager._instance;
    }
    
    protected onLoad(): void {
        // 设置单例
        if (WaveManager._instance) {
            console.warn("WaveManager实例已存在，销毁重复实例");
            this.node.destroy();
            return;
        }
        
        WaveManager._instance = this;
        console.log("WaveManager初始化完成");
    }
    
    protected start(): void {
        // 获取管理器引用
        this._gameManager = GameManager.instance;
        this._battleManager = BattleManager.instance;
        this._resourceManager = ResourceManager.instance;
        
        if (!this._gameManager) {
            console.error("未找到GameManager实例");
        }
        if (!this._battleManager) {
            console.error("未找到BattleManager实例");
        }
        if (!this._resourceManager) {
            console.error("未找到ResourceManager实例");
        }
    }
    
    protected onDestroy(): void {
        if (WaveManager._instance === this) {
            WaveManager._instance = null;
        }
    }
    
    protected update(dt: number): void {
        switch (this._waveState) {
            case WaveState.WAITING:
                this.updateWaitingState(dt);
                break;
            case WaveState.SPAWNING:
                this.updateSpawningState(dt);
                break;
            case WaveState.COMPLETED:
                this.updateCompletedState(dt);
                break;
        }
    }
    
    
    // 开始波次（参考老项目接口）
    public StartWave(waveNumber: number): void {
        if (this._waveState === WaveState.SPAWNING) {
            console.warn("波次已经在进行中");
            return;
        }
        
        // 使用传入的波次编号
        this._currentWaveIndex = waveNumber - 1; // 转换为索引
        
        if (this._currentWaveIndex >= GAME_CONFIG.waves.length || this._currentWaveIndex < 0) {
            console.log(`无效的波次编号: ${waveNumber}`);
            return;
        }
        
        this._currentWaveConfig = GAME_CONFIG.waves[this._currentWaveIndex];
        this.setupWaveSpawning();
        this._waveState = WaveState.SPAWNING;
        this._waveTimer = 0;
        
        console.log(`[WaveManager] 开始第 ${this.currentWaveNumber} 波（索引: ${this._currentWaveIndex}）`);
        
        // 通知GameManager同步当前波次
        if (this._gameManager) {
            this._gameManager.currentWave = this.currentWaveNumber;
        }
    }
    
    // 设置波次生成队列
    private setupWaveSpawning(): void {
        if (!this._currentWaveConfig) return;
        
        this._enemySpawnQueue = [];
        
        for (const enemyConfig of this._currentWaveConfig.enemies) {
            this._enemySpawnQueue.push({
                type: enemyConfig.type,
                remainingCount: enemyConfig.count,
                spawnDelay: enemyConfig.spawnDelay,
                nextSpawnTime: 0
            });
        }
        
        console.log(`波次配置完成: ${this._enemySpawnQueue.length} 种敌人类型`);
    }
    
    // 更新等待状态
    private updateWaitingState(dt: number): void {
        this._prepareTimer += dt;
        
        if (this._prepareTimer >= this.wavePrepareTime) {
            this._prepareTimer = 0;
            if (this.autoStartNextWave) {
                this.StartWave(this.currentWaveNumber);
            }
        }
    }
    
    // 更新生成状态
    private updateSpawningState(dt: number): void {
        this._waveTimer += dt;
        
        // 更新敌人生成
        let hasRemainingEnemies = false;
        
        for (const spawnInfo of this._enemySpawnQueue) {
            if (spawnInfo.remainingCount > 0) {
                hasRemainingEnemies = true;
                
                if (this._waveTimer >= spawnInfo.nextSpawnTime) {
                    this.spawnEnemy(spawnInfo.type);
                    spawnInfo.remainingCount--;
                    spawnInfo.nextSpawnTime = this._waveTimer + spawnInfo.spawnDelay;
                }
            }
        }
        
        // 检查波次是否完成
        if (!hasRemainingEnemies) {
            this.completeCurrentWave();
        }
    }
    
    // 更新完成状态
    private updateCompletedState(dt: number): void {
        // 检查是否还有活跃的敌人
        if (this._gameManager && this._gameManager.activeEnemies.length === 0) {
            // 所有敌人都被清理，通知游戏管理器波次完成
            console.log(`第 ${this.currentWaveNumber} 波所有敌人已清理`);
            
            // 通知GameManager波次完成
            if (this._gameManager) {
                this._gameManager.OnWaveComplete();
            }
            
            // 重置波次状态，等待下一波开始
            this._waveState = WaveState.WAITING;
            this._prepareTimer = 0;
        }
    }
    
    // 生成敌人
    private async spawnEnemy(enemyType: EnemyType): Promise<void> {
        if (!this._gameManager) return;
        
        try {
            // 动态创建敌人（暂时简化，后续可从预制体加载）
            const enemyNode = await this.createEnemyNode(enemyType);
            if (!enemyNode) {
                console.error(`创建敌人失败: ${enemyType}`);
                return;
            }
            
            // 设置生成位置为网格上方的随机位置
            const spawnPosition = this.getRandomSpawnPosition();
            enemyNode.setPosition(spawnPosition);
            enemyNode.parent = this.node.parent; // 添加到场景
            
            // 添加到活跃敌人列表
            this._gameManager.AddActiveEnemy(enemyNode);
            
            // 注册到BattleManager
            if (this._battleManager) {
                this._battleManager.RegisterEnemy(enemyNode);
            }
            
            console.log(`[WaveManager] 生成敌人: ${enemyType} 位置: (${spawnPosition.x}, ${spawnPosition.y})`);
            
        } catch (error) {
            console.error(`生成敌人异常: ${enemyType}`, error);
        }
    }
    
    // 获取网格上方的随机生成位置
    private getRandomSpawnPosition(): Vec3 {
        // 从网格系统获取动态的网格边界信息
        const gridSystem = GridDeploymentSystem.instance;
        
        if (!gridSystem) {
            // 如果网格系统未初始化，使用屏幕上方作为备用生成位置
            console.warn("GridDeploymentSystem未初始化，使用屏幕上方作为生成位置");
            const randomX = -200 + Math.random() * 400; // -200 到 200 的随机X坐标
            const fallbackSpawnY = 300; // 屏幕上方300像素位置作为备用
            return new Vec3(randomX, fallbackSpawnY, 0);
        }

        // 获取网格的边界信息
        const gridBounds = gridSystem.GetGridBounds();
        
        // 在网格的X范围内随机生成敌人位置
        const minX = gridBounds.left;
        const maxX = gridBounds.right;
        const randomX = minX + Math.random() * (maxX - minX);
        
        // Y坐标设置为网格顶部上方100像素的位置
        const spawnY = gridBounds.top + 100;
        
        console.log(`敌人生成位置: (${randomX.toFixed(1)}, ${spawnY.toFixed(1)}) - 网格范围: X[${minX.toFixed(1)}, ${maxX.toFixed(1)}], 顶部Y: ${gridBounds.top.toFixed(1)}`);
        
        return new Vec3(randomX, spawnY, 0);
    }
    
    // 创建敌人节点（参考老项目）
    private async createEnemyNode(enemyType: EnemyType): Promise<Node | null> {
        const enemyNode = new Node(`Enemy_${enemyType}_${Date.now()}`);
        
        // 根据敌人类型添加对应组件
        switch (enemyType) {
            case EnemyType.BASIC_MOUSE:
                enemyNode.addComponent(BasicMouse);
                break;
            case EnemyType.FAST_MOUSE:
                enemyNode.addComponent(FastMouse);
                break;
            case EnemyType.ARMORED_MOUSE:
                enemyNode.addComponent(ArmoredMouse);
                break;
            case EnemyType.GIANT_MOUSE:
                enemyNode.addComponent(GiantMouse);
                break;
            case EnemyType.SPEED_MOUSE:
                enemyNode.addComponent(SpeedMouse);
                break;
            default:
                console.warn(`未知或未实现的敌人类型: ${enemyType}`);
                enemyNode.destroy();
                return null;
        }
        
        return enemyNode;
    }
    
    // 完成当前波次
    private completeCurrentWave(): void {
        this._waveState = WaveState.COMPLETED;
        console.log(`第 ${this.currentWaveNumber} 波生成完成`);
    }
    
    // 准备下一波（现在由GameManager调用）
    public PrepareNextWave(): void {
        this._currentWaveIndex++;
        
        console.log(`[WaveManager] prepareNextWave调用，当前索引增加到: ${this._currentWaveIndex}，波次号: ${this.currentWaveNumber}`);
        
        if (this._currentWaveIndex >= GAME_CONFIG.waves.length) {
            // 所有波次完成
            console.log("所有波次已完成，准备结束游戏");
            this.onAllWavesCompleted();
        } else {
            // 准备下一波
            this._waveState = WaveState.WAITING;
            this._prepareTimer = 0;
            console.log(`准备第 ${this.currentWaveNumber} 波（索引: ${this._currentWaveIndex}），等待手动开始`);
        }
    }
    
    // 所有波次完成
    private onAllWavesCompleted(): void {
        console.log("所有波次已完成，游戏胜利！");
        
        if (this._gameManager) {
            this._gameManager.EndGame(true);
        }
    }
    
    // 停止当前波次
    public StopCurrentWave(): void {
        this._waveState = WaveState.WAITING;
        this._enemySpawnQueue = [];
        console.log("当前波次已停止");
    }
    
    // 跳过等待时间，立即开始下一波
    public SkipWaiting(): void {
        if (this._waveState === WaveState.WAITING) {
            this._prepareTimer = this.wavePrepareTime;
        }
    }
    
    // 重置波次管理器
    public ResetWaves(): void {
        this._currentWaveIndex = 0;
        this._waveState = WaveState.WAITING;
        this._enemySpawnQueue = [];
        this._waveTimer = 0;
        this._prepareTimer = 0;
        console.log(`[WaveManager] 波次管理器已重置，当前索引: ${this._currentWaveIndex}，波次号: ${this.currentWaveNumber}`);
    }
    
    // 获取波次统计信息
    public GetWaveStats(): {
        currentWave: number;
        totalWaves: number;
        waveState: WaveState;
        remainingEnemies: number;
        activeEnemies: number;
        preparationTimeLeft: number;
    } {
        const remainingEnemies = this._enemySpawnQueue.reduce(
            (total, spawn) => total + spawn.remainingCount, 0
        );
        
        const preparationTimeLeft = Math.max(0, this.wavePrepareTime - this._prepareTimer);
        
        return {
            currentWave: this.currentWaveNumber,
            totalWaves: this.totalWaves,
            waveState: this._waveState,
            remainingEnemies: remainingEnemies,
            activeEnemies: this._gameManager?.activeEnemies.length || 0,
            preparationTimeLeft: preparationTimeLeft
        };
    }
}