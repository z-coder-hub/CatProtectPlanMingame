import { _decorator, Component, Vec3 } from 'cc';
import { EnemyFactory } from '../systems/EnemyFactory';
import { GridDeploymentSystem } from '../systems/GridDeploymentSystem';
import { EnemyType, LevelConfig, WaveConfig } from '../types/GameTypes';
import { BattleManager } from './BattleManager';

const { ccclass, property } = _decorator;

// 波次状态
export enum WaveState {
    WAITING = "waiting",     // 等待开始
    SPAWNING = "spawning",   // 生成中
    COMPLETED = "completed", // 已完成
    FAILED = "failed",       // 失败
    STOPPED = "stopped"      // 已停止（关卡间休息）
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
    public autoStartNextWave: boolean = true;

    // 关卡配置
    private _currentLevelConfig: LevelConfig | null = null;

    // 当前波次状态
    private _currentWaveIndex: number = 0;
    private _waveState: WaveState = WaveState.WAITING;
    private _currentWaveConfig: WaveConfig | null = null;

    // 敌人生成管理
    private _enemySpawnQueue: EnemySpawnInfo[] = [];
    private _waveTimer: number = 0;
    private _prepareTimer: number = 0;

    // 引用其他管理器
    private _battleManager: BattleManager | null = null;

    // 获取当前波次状态
    public get waveState(): WaveState {
        return this._waveState;
    }

    public get currentWaveNumber(): number {
        return this._currentWaveIndex + 1;
    }

    public get totalWaves(): number {
        return this._currentLevelConfig ? this._currentLevelConfig.waves.length : 0;
    }

    public get isLastWave(): boolean {
        return this._currentWaveIndex >= this.totalWaves - 1;
    }

    // 获取当前关卡配置
    public get currentLevelConfig(): LevelConfig | null {
        return this._currentLevelConfig;
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
        // WaveManager初始化完成
    }

    protected start(): void {
        // 获取管理器引用 - WaveManager现在作为纯执行层，不依赖GameManager
        this._battleManager = BattleManager.instance;

        if (!this._battleManager) {
            console.error("未找到BattleManager实例");
        }

        // WaveManager启动完成
    }

    // ====================== 关卡配置管理 ======================

    /**
     * 设置关卡配置
     */
    public SetLevelConfig(levelConfig: LevelConfig): void {
        this._currentLevelConfig = levelConfig;
        // 简化日志：设置关卡配置完成

        // 重置波次状态
        this.ResetWaves();
    }


    protected onDestroy(): void {
        if (WaveManager._instance === this) {
            WaveManager._instance = null;
        }
    }

    protected update(dt: number): void {
        // WaveManager 现在只管理自己的状态，不需要检查游戏总状态
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
            case WaveState.STOPPED:
                // 已停止状态，不执行任何更新
                break;
        }
    }


    // 开始波次
    public StartWave(waveNumber: number): void {
        if (this._waveState === WaveState.SPAWNING) {
            console.warn("波次已经在进行中");
            return;
        }

        if (!this._currentLevelConfig) {
            console.error("未设置关卡配置，无法开始波次");
            return;
        }

        // 使用传入的波次编号
        this._currentWaveIndex = waveNumber - 1; // 转换为索引

        if (this._currentWaveIndex >= this._currentLevelConfig.waves.length || this._currentWaveIndex < 0) {
            console.error(`无效的波次编号: ${waveNumber}, 关卡波次总数: ${this._currentLevelConfig.waves.length}`);
            return;
        }

        this._currentWaveConfig = this._currentLevelConfig.waves[this._currentWaveIndex];
        this.setupWaveSpawning();
        this._waveState = WaveState.SPAWNING;
        this._waveTimer = 0;

        // 简化日志：波次开始信息已在UI中显示

        // 🎯 新架构：通过事件通知波次开始
        this.node.emit('wave-started', {
            waveNumber: this.currentWaveNumber,
            levelId: this._currentLevelConfig.id
        });
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

        // 简化日志：波次配置完成
    }

    // 更新等待状态
    private updateWaitingState(dt: number): void {
        this._prepareTimer += dt;

        if (this._prepareTimer >= this.wavePrepareTime) {
            this._prepareTimer = 0;
            if (this.autoStartNextWave) {
                // 开始当前设置的波次（这个值已经在PrepareNextWave中被正确设置）
                this.StartWave(this.currentWaveNumber);
                // 简化日志：自动开始波次
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
    private updateCompletedState(_dt: number): void {
        // 检查是否还有活跃的敌人
        const battleManager = BattleManager.instance;
        if (battleManager && battleManager.registeredEnemies.length === 0) {
            // 所有敌人都被清理，通过事件通知波次完成
            console.log(`第 ${this.currentWaveNumber} 波所有敌人已清理`);

            // 先设置为STOPPED状态，避免重复进入这个逻辑
            this._waveState = WaveState.STOPPED;

            // 🎯 新架构：通过事件通知波次清理完成，让GameManager决定下一步动作
            // 注意：这个事件会立即同步执行GameManager的处理逻辑
            this.node.emit('wave-enemies-cleared', {
                waveNumber: this.currentWaveNumber,
                levelId: this._currentLevelConfig?.id || "unknown"
            });

            console.log(`第 ${this.currentWaveNumber} 波完成，事件已发送，当前状态: ${this._waveState}`);
        }
    }

    // 生成敌人
    private async spawnEnemy(enemyType: EnemyType): Promise<void> {
        try {
            // 设置生成位置为网格上方的随机位置
            const spawnPosition = this.getRandomSpawnPosition();

            // 使用EnemyFactory创建敌人
            const enemyNode = EnemyFactory.createEnemy(enemyType, this.node.parent, {
                x: spawnPosition.x,
                y: spawnPosition.y
            });

            if (!enemyNode) {
                console.error(`创建敌人失败: ${enemyType}`);
                return;
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

    // 完成当前波次
    private completeCurrentWave(): void {
        this._waveState = WaveState.COMPLETED;
        console.log(`第 ${this.currentWaveNumber} 波生成完成`);
    }

    // 准备下一波（现在由GameManager调用）
    public PrepareNextWave(): void {
        this._currentWaveIndex++;

        console.log(`[WaveManager] prepareNextWave调用，当前索引增加到: ${this._currentWaveIndex}，波次号: ${this.currentWaveNumber}`);

        if (!this._currentLevelConfig) {
            console.error("没有关卡配置，无法准备下一波");
            return;
        }

        if (this._currentWaveIndex >= this._currentLevelConfig.waves.length) {
            // 关卡所有波次完成
            console.log(`关卡 ${this._currentLevelConfig.name} 所有波次已完成`);
            this.onAllWavesCompleted();
        } else {
            // 准备下一波
            this._waveState = WaveState.WAITING;
            this._prepareTimer = 0;
            console.log(`准备关卡 ${this._currentLevelConfig.name} 第 ${this.currentWaveNumber} 波（索引: ${this._currentWaveIndex}），等待${this.wavePrepareTime}秒后自动开始`);
        }
    }

    // 所有波次完成
    private onAllWavesCompleted(): void {
        console.log("所有波次已完成！");

        // 🎯 新架构：通过事件通知关卡所有波次完成
        this.node.emit('level-all-waves-completed', {
            levelId: this._currentLevelConfig?.id || "unknown",
            levelName: this._currentLevelConfig?.name || "未知关卡"
        });
    }

    // 停止当前波次（关卡间休息时使用）
    public StopCurrentWave(): void {
        this._waveState = WaveState.STOPPED;
        this._enemySpawnQueue = [];
        this._prepareTimer = 0;
        this._waveTimer = 0;
        console.log("波次管理器已完全停止（关卡间休息）");
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
        // 重置后不自动开始波次：启动页/菜单/部署阶段（非战斗状态）不得自动生成老鼠。
        // 自动开始只由 PrepareNextWave()（波次间等待）显式武装为 WAITING 后触发；
        // 各战斗入口（StartBattle/RestartGame后的用户操作等）都会显式调用 StartWave()。
        this._waveState = WaveState.STOPPED;
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
        levelName: string;
        levelId: string;
        waveProgress: number;
    } {
        const remainingEnemies = this._enemySpawnQueue.reduce(
            (total, spawn) => total + spawn.remainingCount, 0
        );

        const preparationTimeLeft = Math.max(0, this.wavePrepareTime - this._prepareTimer);
        const waveProgress = this.totalWaves > 0 ? (this.currentWaveNumber / this.totalWaves) * 100 : 0;

        return {
            currentWave: this.currentWaveNumber,
            totalWaves: this.totalWaves,
            waveState: this._waveState,
            remainingEnemies: remainingEnemies,
            activeEnemies: BattleManager.instance?.registeredEnemies.length || 0,
            preparationTimeLeft: preparationTimeLeft,
            levelName: this._currentLevelConfig?.name || "未知关卡",
            levelId: this._currentLevelConfig?.id || "unknown",
            waveProgress: Math.min(waveProgress, 100)
        };
    }
}
