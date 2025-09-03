import { _decorator, Component, Node, Vec3 } from 'cc';
import { GameState, GameEvents, EnemyType } from '../types/GameTypes';
import { GAME_CONFIG } from '../types/GameConstants';
import { BaseHero } from '../components/heroes/BaseHero';
import { BaseMouse } from '../components/enemies/BaseMouse';
import { BattleManager } from './BattleManager';
import { WaveManager } from './WaveManager';
import { GridDeploymentSystem } from '../systems/GridDeploymentSystem';
import { EnemyFactory } from '../systems/EnemyFactory';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    
    @property({ tooltip: "城堡生命值" })
    public castleHealth: number = 100;
    
    @property({ tooltip: "当前金币数量" })
    public currentGold: number = 110;  // 与GAME_CONFIG.initialGold保持一致
    
    @property({ tooltip: "当前波次" })
    public currentWave: number = 1;
    
    @property({ tooltip: "城堡节点引用", type: Node })
    public castleNode: Node | null = null;
    
    // 游戏状态
    private _gameState: GameState = GameState.MENU;
    private _maxCastleHealth: number = 100;
    
    // 已部署的英雄列表
    private _deployedHeroes: Node[] = [];
    
    // 活跃的敌人列表
    private _activeEnemies: Node[] = [];
    
    // 事件回调
    private _eventCallbacks = new Map<keyof GameEvents, Function[]>();
    
    // 休息阶段相关（参考老项目）
    private _restTimer: number = 0;
    private _restDuration: number = GAME_CONFIG.restDuration;
    
    // 组件引用缓存（参考老项目）
    private _battleManagerCache: BattleManager | null = null;
    private _waveManagerCache: WaveManager | null = null;
    private _gridSystemCache: GridDeploymentSystem | null = null;
    
    // 获取游戏状态
    public get gameState(): GameState {
        return this._gameState;
    }
    
    // 获取城堡血量百分比
    public get castleHealthPercent(): number {
        return this.castleHealth / this._maxCastleHealth;
    }
    
    // 获取已部署英雄列表
    public get deployedHeroes(): Node[] {
        return [...this._deployedHeroes];
    }
    
    // 获取活跃敌人列表
    public get activeEnemies(): Node[] {
        return [...this._activeEnemies];
    }
    
    // 获取休息计时器
    public get restTimer(): number {
        return this._restTimer;
    }
    
    public get restDuration(): number {
        return this._restDuration;
    }
    
    // 单例实例
    private static _instance: GameManager | null = null;
    
    public static get instance(): GameManager | null {
        return GameManager._instance;
    }
    
    protected onLoad(): void {
        // 设置单例
        if (GameManager._instance) {
            console.warn("GameManager实例已存在，销毁重复实例");
            this.node.destroy();
            return;
        }
        
        GameManager._instance = this;
        
        // 初始化游戏配置
        this.initializeGameConfig();
        
        console.log("GameManager初始化完成");
    }
    
    protected start(): void {
        // 游戏开始时保持菜单状态，等待玩家操作
        console.log("游戏已加载，等待玩家开始");
    }
    
    protected update(dt: number): void {
        // 更新休息阶段计时器
        if (this._gameState === GameState.RESTING) {
            this.updateRestPhase(dt);
        }
    }
    
    protected onDestroy(): void {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
    }
    
    // 初始化游戏配置
    private initializeGameConfig(): void {
        this.currentGold = GAME_CONFIG.initialGold;
        this.castleHealth = GAME_CONFIG.castleHealth;
        this._maxCastleHealth = GAME_CONFIG.castleHealth;
        
        // 设置初始游戏状态为部署阶段，这样英雄面板会显示
        this._gameState = GameState.DEPLOYMENT;
        console.log("游戏状态设置为部署阶段");
    }
    
    // 开始游戏
    public StartGame(): void {
        console.log("游戏开始！");
        this.setGameState(GameState.DEPLOYMENT);
    }
    
    // 开始战斗
    public StartBattle(): void {
        if (this._gameState !== GameState.DEPLOYMENT) {
            console.warn("只能在部署状态开始战斗");
            return;
        }
        
        this.setGameState(GameState.BATTLE);
        console.log(`[GameManager] 战斗开始！当前波次: ${this.currentWave}`);
        
        // 启动波次管理器
        const waveManager = this.GetWaveManager();
        if (waveManager) {
            console.log(`[GameManager] 启动第 ${this.currentWave} 波`);
            waveManager.StartWave(this.currentWave);
        } else {
            console.error("[GameManager] 未找到WaveManager，无法启动波次");
        }
    }
    
    // 游戏结束
    public EndGame(isVictory: boolean): void {
        if (isVictory) {
            this.setGameState(GameState.VICTORY);
            console.log("游戏胜利！");
        } else {
            this.setGameState(GameState.GAME_OVER);
            console.log("游戏失败！等待玩家重启...");
        }
    }
    
    // 重新开始游戏
    public RestartGame(): void {
        // 重置游戏数据
        this.currentWave = 1;
        this.initializeGameConfig();
        
        // 清理已部署的英雄
        this.ClearAllHeroes();
        
        // 清理敌人
        this.ClearAllEnemies();
        
        // 重置波次管理器
        const waveManager = this.GetWaveManager();
        if (waveManager) {
            waveManager.ResetWaves();
        }
        
        // 重置游戏状态到部署阶段
        this.setGameState(GameState.DEPLOYMENT);
        
        console.log("游戏已重新开始，准备重新部署英雄");
    }
    
    // 设置游戏状态
    private setGameState(newState: GameState): void {
        const oldState = this._gameState;
        this._gameState = newState;
        
        // 触发状态变化事件
        this.emitEvent('game-state-changed', { newState, oldState });
    }
    
    // 添加金币
    public AddGold(amount: number): void {
        this.currentGold += amount;
        console.log(`获得金币: +${amount}, 当前金币: ${this.currentGold}`);
    }
    
    // 消费金币
    public SpendGold(amount: number): boolean {
        if (this.currentGold >= amount) {
            this.currentGold -= amount;
            console.log(`消费金币: -${amount}, 当前金币: ${this.currentGold}`);
            return true;
        }
        
        console.log(`金币不足，需要: ${amount}, 当前: ${this.currentGold}`);
        return false;
    }
    
    // 城堡受伤
    public CastleTakeDamage(damage: number): void {
        this.castleHealth = Math.max(0, this.castleHealth - damage);
        console.log(`城堡受到伤害: ${damage}, 剩余血量: ${this.castleHealth}`);
        
        // 检查游戏失败
        if (this.castleHealth <= 0) {
            this.EndGame(false);
        }
    }
    
    // 在指定位置召唤敌人（用于老鼠王召唤等特殊情况）
    public spawnEnemyAtPosition(enemyType: EnemyType, position: Vec3): Node | null {
        try {
            console.log(`在位置(${position.x.toFixed(1)}, ${position.y.toFixed(1)})召唤敌人: ${enemyType}`);
            
            // 使用EnemyFactory创建敌人
            const enemyNode = EnemyFactory.createEnemy(
                enemyType, 
                this.node, 
                { x: position.x, y: position.y }
            );
            
            if (enemyNode) {
                // 添加到活跃敌人列表
                this.AddActiveEnemy(enemyNode);
                console.log(`敌人召唤成功: ${enemyType}`);
                return enemyNode;
            } else {
                console.error(`敌人召唤失败: ${enemyType}`);
                return null;
            }
        } catch (error) {
            console.error(`召唤敌人时发生错误: ${enemyType}`, error);
            return null;
        }
    }
    
    // 波次完成（参考老项目）
    public OnWaveComplete(): void {
        console.log(`第 ${this.currentWave} 波完成`);
        this.AddGold(50); // 每波奖励50金币
        this.setGameState(GameState.RESTING);
        this._restTimer = this._restDuration;
        this.ClearAllHeroes(); // 清空英雄重新部署
        this.ClearAllEnemies(); // 清理所有剩余的敌人尸体
    }
    
    // 更新休息阶段
    private updateRestPhase(dt: number): void {
        this._restTimer -= dt;
        if (this._restTimer <= 0) {
            this.NextWave();
        }
    }
    
    // 手动跳过休息阶段
    public SkipRestPhase(): void {
        if (this._gameState === GameState.RESTING) {
            console.log("手动跳过休息阶段，立即开始下一波");
            this._restTimer = 0;
            this.NextWave();
        } else {
            console.warn("只能在休息阶段跳过休息");
        }
    }
    
    // 进入下一波
    public NextWave(): void {
        // 通知WaveManager准备下一波
        const waveManager = this.GetWaveManager();
        if (waveManager) {
            waveManager.PrepareNextWave();
            // 同步当前波次到GameManager
            this.currentWave = waveManager.currentWaveNumber;
        }
        
        // 检查是否达到最大波次
        if (this.currentWave > GAME_CONFIG.waves.length) {
            this.EndGame(true);
        } else {
            console.log(`进入第 ${this.currentWave} 波部署阶段`);
            this.setGameState(GameState.DEPLOYMENT);
        }
    }
    
    // 添加英雄到已部署列表
    public AddDeployedHero(heroNode: Node): void {
        if (!this._deployedHeroes.includes(heroNode)) {
            this._deployedHeroes.push(heroNode);
            console.log(`英雄已部署，当前英雄数: ${this._deployedHeroes.length}`);
        }
    }
    
    // 移除已部署的英雄
    public RemoveDeployedHero(heroNode: Node): void {
        const index = this._deployedHeroes.indexOf(heroNode);
        if (index >= 0) {
            this._deployedHeroes.splice(index, 1);
            console.log(`英雄已移除，当前英雄数: ${this._deployedHeroes.length}`);
        }
    }
    
    // 清理所有英雄
    public ClearAllHeroes(): void {
        const gridSystem = this.GetGridSystem();
        
        this.cleanupIndividualHeroes(gridSystem);
        this.clearHeroArrayAndGrid(gridSystem);
        
        console.log("所有英雄已清理");
    }
    
    // 清理单个英雄
    private cleanupIndividualHeroes(gridSystem: GridDeploymentSystem | null): void {
        for (const hero of this._deployedHeroes) {
            if (hero && hero.isValid) {
                this.cleanupSingleHero(hero, gridSystem);
            }
        }
    }
    
    // 清理单个英雄的所有关联
    private cleanupSingleHero(hero: Node, gridSystem: GridDeploymentSystem | null): void {
        // 清理网格占用状态
        if (gridSystem) {
            gridSystem.ClearHeroFromGrid(hero);
        }
        
        // 从BattleManager注销
        const battleManager = this.GetBattleManager();
        if (battleManager) {
            battleManager.UnregisterHero(hero);
        }
        
        hero.destroy();
    }
    
    // 清理英雄数组和网格系统
    private clearHeroArrayAndGrid(gridSystem: GridDeploymentSystem | null): void {
        this._deployedHeroes = [];
        
        // 双重保险：确保网格系统完全清理
        if (gridSystem) {
            gridSystem.ClearAllGridPositions();
        }
    }
    
    // 添加敌人到活跃列表
    public AddActiveEnemy(enemyNode: Node): void {
        if (!this._activeEnemies.includes(enemyNode)) {
            this._activeEnemies.push(enemyNode);
        }
    }
    
    // 移除活跃敌人
    public RemoveActiveEnemy(enemyNode: Node): void {
        const index = this._activeEnemies.indexOf(enemyNode);
        if (index >= 0) {
            this._activeEnemies.splice(index, 1);
        }
    }
    
    // 清理所有敌人
    public ClearAllEnemies(): void {
        for (const enemy of this._activeEnemies) {
            if (enemy && enemy.isValid) {
                enemy.destroy();
            }
        }
        this._activeEnemies = [];
        console.log("所有敌人已清理");
    }
    
    // 事件系统
    public AddEventListener<K extends keyof GameEvents>(
        event: K, 
        callback: (data: GameEvents[K]) => void
    ): void {
        if (!this._eventCallbacks.has(event)) {
            this._eventCallbacks.set(event, []);
        }
        this._eventCallbacks.get(event)!.push(callback);
    }
    
    public RemoveEventListener<K extends keyof GameEvents>(
        event: K, 
        callback: (data: GameEvents[K]) => void
    ): void {
        const callbacks = this._eventCallbacks.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index >= 0) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    private emitEvent<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
        const callbacks = this._eventCallbacks.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件回调执行错误: ${event}`, error);
                }
            });
        }
    }
    
    // 获取游戏统计信息
    public GetGameStats(): {
        wave: number;
        gold: number;
        castleHealth: number;
        castleHealthPercent: number;
        heroesCount: number;
        enemiesCount: number;
        gameState: GameState;
    } {
        return {
            wave: this.currentWave,
            gold: this.currentGold,
            castleHealth: this.castleHealth,
            castleHealthPercent: this.castleHealthPercent,
            heroesCount: this._deployedHeroes.length,
            enemiesCount: this._activeEnemies.length,
            gameState: this._gameState
        };
    }
    
    // 获取组件引用（参考老项目的缓存机制）
    public GetBattleManager(): BattleManager | null {
        return this.getCachedComponent('_battleManagerCache', BattleManager);
    }
    
    public GetWaveManager(): WaveManager | null {
        return this.getCachedComponent('_waveManagerCache', WaveManager);
    }
    
    public GetGridSystem(): GridDeploymentSystem | null {
        return this.getCachedComponent('_gridSystemCache', GridDeploymentSystem);
    }
    
    // 统一的组件缓存获取方法
    private getCachedComponent<T extends Component>(cacheKey: string, componentClass: new() => T): T | null {
        const cache = (this as any)[cacheKey];
        if (cache && cache.isValid) {
            return cache;
        }
        
        const component = this.node.parent?.getComponentInChildren(componentClass) || null;
        (this as any)[cacheKey] = component;
        return component;
    }
}