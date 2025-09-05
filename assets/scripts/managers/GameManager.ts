import { _decorator, Component, Node, Vec3 } from 'cc';
import { 
    GameState, GameEvents, EnemyType, LevelConfig, WorldConfig,
    LevelCompletionStatus, RewardType
} from '../types/GameTypes';
import { GAME_CONFIG } from '../types/GameConstants';
import { LEVEL_CONFIGS } from '../types/LevelConfigs';
import { BaseHero } from '../components/heroes/BaseHero';
import { BaseMouse } from '../components/enemies/BaseMouse';
import { BattleManager } from './BattleManager';
import { WaveManager } from './WaveManager';
import { LevelManager } from './LevelManager';
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
    
    // ====================== 关卡系统状态 ======================
    private _currentWorldId: number = 1;           // 当前选择的世界ID
    private _currentLevelId: string = "1-1";       // 当前选择的关卡ID
    private _currentLevelConfig: LevelConfig | null = null; // 当前关卡配置
    
    // 游戏状态
    private _gameState: GameState = GameState.WORLD_SELECTION; // 改为世界选择开始
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
    private _levelManagerCache: LevelManager | null = null;
    private _gridSystemCache: GridDeploymentSystem | null = null;
    
    // 获取游戏状态
    public get gameState(): GameState {
        return this._gameState;
    }
    
    // 获取城堡血量百分比
    public get castleHealthPercent(): number {
        return this.castleHealth / this._maxCastleHealth;
    }
    
    // ====================== 关卡系统访问方法 ======================
    
    // 获取当前世界ID
    public get currentWorldId(): number {
        return this._currentWorldId;
    }
    
    // 获取当前关卡ID
    public get currentLevelId(): string {
        return this._currentLevelId;
    }
    
    // 获取当前关卡配置
    public get currentLevelConfig(): LevelConfig | null {
        return this._currentLevelConfig;
    }
    
    // 获取当前世界配置
    public get currentWorldConfig(): WorldConfig | null {
        return LEVEL_CONFIGS.getWorldById(this._currentWorldId);
    }
    
    // 获取当前关卡名称
    public get currentLevelName(): string {
        return this._currentLevelConfig?.name || "未知关卡";
    }
    
    // 获取当前世界名称
    public get currentWorldName(): string {
        return this.currentWorldConfig?.name || "未知世界";
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
        // 设置默认关卡
        this.selectLevel("1-1");
        
        // 设置初始游戏状态为世界选择
        this._gameState = GameState.WORLD_SELECTION;
        console.log("游戏初始化完成，状态设置为世界选择");
    }
    
    // ====================== 关卡选择和管理方法 ======================
    
    // 选择世界
    public SelectWorld(worldId: number): boolean {
        const world = LEVEL_CONFIGS.getWorldById(worldId);
        if (!world) {
            console.error(`未找到世界: ${worldId}`);
            return false;
        }
        
        this._currentWorldId = worldId;
        console.log(`选择世界: ${world.name} (ID: ${worldId})`);
        this.setGameState(GameState.LEVEL_SELECTION);
        return true;
    }
    
    // 选择关卡
    public SelectLevel(levelId: string): boolean {
        const levelConfig = LEVEL_CONFIGS.getLevelById(levelId);
        if (!levelConfig) {
            console.error(`未找到关卡配置: ${levelId}`);
            return false;
        }
        
        this._currentLevelId = levelId;
        this._currentLevelConfig = levelConfig;
        this._currentWorldId = levelConfig.worldId;
        
        // 应用关卡配置
        this.applyLevelConfig(levelConfig);
        
        console.log(`选择关卡: ${levelConfig.name} (${levelId})`);
        return true;
    }
    
    // 简化的选择关卡方法（兼容旧代码）
    private selectLevel(levelId: string): boolean {
        return this.SelectLevel(levelId);
    }
    
    // 应用关卡配置
    private applyLevelConfig(config: LevelConfig): void {
        // 设置初始金币
        this.currentGold = config.initialGold;
        
        // 设置城堡生命值
        this.castleHealth = GAME_CONFIG.castleHealth;
        this._maxCastleHealth = GAME_CONFIG.castleHealth;
        
        // 重置波次
        this.currentWave = 1;
        
        // 通知WaveManager更新关卡配置
        const waveManager = this.GetWaveManager();
        if (waveManager) {
            waveManager.SetLevelConfig(config);
        }
        
        console.log(`应用关卡配置: ${config.name}, 初始金币: ${config.initialGold}`);
    }
    
    // 开始关卡（进入部署阶段）
    public StartLevel(): void {
        if (!this._currentLevelConfig) {
            console.error("未选择关卡，无法开始");
            return;
        }
        
        console.log(`开始关卡: ${this.currentLevelName}`);
        this.setGameState(GameState.DEPLOYMENT);
    }
    
    // 开始游戏（保持兼容性）
    public StartGame(): void {
        this.StartLevel();
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
    
    // 关卡完成处理
    public CompleteLevel(isVictory: boolean): void {
        if (!this._currentLevelConfig) {
            console.error("当前没有进行中的关卡");
            return;
        }
        
        if (isVictory) {
            this.handleLevelVictory();
        } else {
            this.handleLevelDefeat();
        }
    }
    
    // 处理关卡胜利
    private handleLevelVictory(): void {
        const levelConfig = this._currentLevelConfig!;
        console.log(`关卡胜利: ${levelConfig.name}`);
        
        // 计算完成时间和分数（简化计算）
        const completionTime = this.calculateCompletionTime();
        const score = this.calculateLevelScore();
        
        // 记录关卡完成到LevelManager
        const levelManager = this.GetLevelManager();
        if (levelManager) {
            levelManager.RecordLevelCompletion(levelConfig.id, true, completionTime, score);
        } else {
            console.warn("未找到LevelManager，无法记录关卡完成");
        }
        
        // 发放奖励（在LevelManager处理解锁后）
        this.processLevelRewards(levelConfig.rewards);
        
        // 设置胜利状态
        this.setGameState(GameState.VICTORY);
    }
    
    // 计算关卡完成时间（简化实现）
    private calculateCompletionTime(): number {
        // TODO: 实现准确的时间计算
        const estimatedTime = (this._currentLevelConfig?.estimatedDuration || 5) * 60;
        return estimatedTime * 0.8; // 假设80%时间内完成
    }
    
    // 计算关卡分数（简化实现）
    private calculateLevelScore(): number {
        // TODO: 实现复杂的分数计算
        const baseScore = 1000;
        const goldBonus = this.currentGold * 2;
        const healthBonus = this.castleHealth * 10;
        return baseScore + goldBonus + healthBonus;
    }
    
    // 处理关卡失败
    private handleLevelDefeat(): void {
        console.log(`关卡失败: ${this.currentLevelName}`);
        this.setGameState(GameState.GAME_OVER);
    }
    
    // 处理关卡奖励
    private processLevelRewards(rewards: any[]): void {
        for (const reward of rewards) {
            switch (reward.type) {
                case RewardType.GOLD:
                    this.AddGold(reward.value as number);
                    console.log(`获得金币奖励: ${reward.value}`);
                    break;
                case RewardType.HERO_UNLOCK:
                    // TODO: 集成英雄解锁系统
                    console.log(`解锁英雄: ${reward.value}`);
                    break;
                case RewardType.ACHIEVEMENT:
                    // TODO: 集成成就系统
                    console.log(`获得成就: ${reward.value}`);
                    break;
                default:
                    console.log(`获得奖励: ${reward.type} - ${reward.value}`);
            }
        }
    }
    
    // 游戏结束（兼容旧代码）
    public EndGame(isVictory: boolean): void {
        this.CompleteLevel(isVictory);
    }
    
    // 重新开始关卡
    public RestartLevel(): void {
        if (!this._currentLevelConfig) {
            console.error("没有当前关卡可以重启");
            return;
        }
        
        // 重新应用关卡配置
        this.applyLevelConfig(this._currentLevelConfig);
        
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
        
        console.log(`重新开始关卡: ${this.currentLevelName}`);
    }
    
    // 返回关卡选择
    public BackToLevelSelection(): void {
        // 清理游戏状态
        this.ClearAllHeroes();
        this.ClearAllEnemies();
        
        // 重置波次管理器
        const waveManager = this.GetWaveManager();
        if (waveManager) {
            waveManager.ResetWaves();
        }
        
        this.setGameState(GameState.LEVEL_SELECTION);
        console.log("返回关卡选择界面");
    }
    
    // 返回世界选择
    public BackToWorldSelection(): void {
        // 清理游戏状态
        this.ClearAllHeroes();
        this.ClearAllEnemies();
        
        // 重置波次管理器
        const waveManager = this.GetWaveManager();
        if (waveManager) {
            waveManager.ResetWaves();
        }
        
        this.setGameState(GameState.WORLD_SELECTION);
        console.log("返回世界选择界面");
    }
    
    // 重新开始游戏（兼容旧代码）
    public RestartGame(): void {
        this.RestartLevel();
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
    
    // 波次完成
    public OnWaveComplete(): void {
        if (!this._currentLevelConfig) {
            console.error("没有当前关卡配置");
            return;
        }
        
        console.log(`第 ${this.currentWave} 波完成`);
        
        // 每波奖励金币
        this.AddGold(30); // 减少每波奖励，因为关卡完成会有更多奖励
        
        // 检查是否是最后一波
        const totalWaves = this._currentLevelConfig.waves.length;
        if (this.currentWave >= totalWaves) {
            // 关卡完成
            console.log(`关卡 ${this.currentLevelName} 所有波次完成！`);
            this.CompleteLevel(true); // 关卡胜利
        } else {
            // 进入休息阶段，准备下一波
            this.setGameState(GameState.RESTING);
            this._restTimer = this._restDuration;
            this.ClearAllHeroes(); // 清空英雄重新部署
            this.ClearAllEnemies(); // 清理所有剩余的敌人尸体
        }
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
        if (!this._currentLevelConfig) {
            console.error("没有当前关卡配置");
            return;
        }
        
        // 通知WaveManager准备下一波
        const waveManager = this.GetWaveManager();
        if (waveManager) {
            waveManager.PrepareNextWave();
            // 同步当前波次到GameManager
            this.currentWave = waveManager.currentWaveNumber;
        }
        
        const totalWaves = this._currentLevelConfig.waves.length;
        
        // 检查是否超过关卡最大波次
        if (this.currentWave > totalWaves) {
            console.log(`关卡 ${this.currentLevelName} 完成，总共 ${totalWaves} 波`);
            this.CompleteLevel(true);
        } else {
            console.log(`进入第 ${this.currentWave} 波部署阶段 (共 ${totalWaves} 波)`);
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
        // 基础信息
        wave: number;
        gold: number;
        castleHealth: number;
        castleHealthPercent: number;
        heroesCount: number;
        enemiesCount: number;
        gameState: GameState;
        // 关卡信息
        worldId: number;
        worldName: string;
        levelId: string;
        levelName: string;
        totalWaves: number;
        levelProgress: number; // 关卡进度百分比
    } {
        const totalWaves = this._currentLevelConfig?.waves.length || 0;
        const levelProgress = totalWaves > 0 ? (this.currentWave / totalWaves) * 100 : 0;
        
        return {
            // 基础信息
            wave: this.currentWave,
            gold: this.currentGold,
            castleHealth: this.castleHealth,
            castleHealthPercent: this.castleHealthPercent,
            heroesCount: this._deployedHeroes.length,
            enemiesCount: this._activeEnemies.length,
            gameState: this._gameState,
            // 关卡信息
            worldId: this._currentWorldId,
            worldName: this.currentWorldName,
            levelId: this._currentLevelId,
            levelName: this.currentLevelName,
            totalWaves: totalWaves,
            levelProgress: Math.min(levelProgress, 100)
        };
    }
    
    // 获取组件引用（参考老项目的缓存机制）
    public GetBattleManager(): BattleManager | null {
        return this.getCachedComponent('_battleManagerCache', BattleManager);
    }
    
    public GetWaveManager(): WaveManager | null {
        return this.getCachedComponent('_waveManagerCache', WaveManager);
    }
    
    public GetLevelManager(): LevelManager | null {
        return this.getCachedComponent('_levelManagerCache', LevelManager);
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