import { _decorator, Component, Node } from 'cc';
import { GAME_CONFIG } from '../types/GameConstants';
import {
    GameEvents,
    GameState,
    HeroType,
    LevelConfig,
    RewardType
} from '../types/GameTypes';
import { LEVEL_CONFIGS } from '../types/LevelConfigs';
import { BattleManager } from './BattleManager';
import { LevelManager } from './LevelManager';
import { WaveManager } from './WaveManager';

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
    private _currentLevelIndex: number = 0;        // 当前关卡索引（0-19，对应20个关卡）
    private _currentLevelConfig: LevelConfig | null = null; // 当前关卡配置

    // 游戏状态
    private _gameState: GameState = GameState.MENU; // 从菜单开始
    private _maxCastleHealth: number = 100;

    // 注意：英雄和敌人数据统一由BattleManager托管
    // 移除重复的数据存储，通过BattleManager获取数据

    // 事件回调
    private _eventCallbacks = new Map<keyof GameEvents, Function[]>();

    // 休息阶段相关（参考老项目）
    private _restTimer: number = 0;
    private _restDuration: number = GAME_CONFIG.restDuration;


    // 状态转换计时器（符合Cocos Creator生命周期规范）
    private _stateTransitionTimer: number = 0;
    private _pendingStateTransition: GameState | null = null;
    private _stateTransitionDelay: number = 3.0; // 3秒延迟

    // 获取游戏状态
    public get gameState(): GameState {
        return this._gameState;
    }

    // 获取城堡血量百分比
    public get castleHealthPercent(): number {
        return this.castleHealth / this._maxCastleHealth;
    }

    // ====================== 关卡系统访问方法 ======================

    // 获取当前关卡索引
    public get currentLevelIndex(): number {
        return this._currentLevelIndex;
    }

    // 获取当前关卡配置
    public get currentLevelConfig(): LevelConfig | null {
        return this._currentLevelConfig;
    }

    // 获取当前关卡ID
    public get currentLevelId(): string {
        return this._currentLevelConfig?.id || "unknown";
    }

    // 获取当前关卡名称
    public get currentLevelName(): string {
        return this._currentLevelConfig?.name || "未知关卡";
    }

    // 获取游戏总关卡数
    public get totalLevels(): number {
        return LEVEL_CONFIGS.getAllLevels().length;
    }

    // 注意：英雄和敌人数据已迁移到BattleManager，请直接使用 BattleManager.instance
    // 移除代理模式，避免不必要的间接层

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

        // 更新状态转换计时器（替代setTimeout的规范实现）
        if (this._pendingStateTransition && this._stateTransitionTimer > 0) {
            this._stateTransitionTimer -= dt;
            if (this._stateTransitionTimer <= 0) {
                this.executeStateTransition();
            }
        }


    }

    protected onDestroy(): void {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
    }

    // 初始化游戏配置
    private initializeGameConfig(): void {
        // 设置从第一关开始
        this.LoadLevel(0);

        // 设置初始游戏状态为菜单
        this._gameState = GameState.MENU;
        console.log("游戏初始化完成，准备从第一关开始");
    }

    // ====================== 线性关卡管理方法 ======================

    // 加载指定索引的关卡
    public LoadLevel(levelIndex: number): boolean {
        const totalLevels = LEVEL_CONFIGS.getAllLevels().length;
        if (levelIndex < 0 || levelIndex >= totalLevels) {
            console.error(`无效的关卡索引: ${levelIndex}, 总关卡数: ${totalLevels}`);
            return false;
        }

        this._currentLevelIndex = levelIndex;
        // 直接使用 LEVEL_CONFIGS 中的完整配置，包含英雄解锁奖励
        const fullLevelConfig = LEVEL_CONFIGS.getAllLevels()[levelIndex];
        if (fullLevelConfig) {
            this._currentLevelConfig = fullLevelConfig;
            console.log(`🎯 使用完整关卡配置: ${fullLevelConfig.name}, 奖励数量: ${fullLevelConfig.rewards.length}`);
        } else {
            console.error(`❌ 无法获取关卡配置，索引: ${levelIndex}，总数: ${LEVEL_CONFIGS.getAllLevels().length}`);
            return false;
        }

        // 应用关卡配置
        this.applyLevelConfig(this._currentLevelConfig);

        console.log(`加载关卡: ${this._currentLevelConfig.name} - 索引: ${levelIndex}`);
        return true;
    }

    // 重新开始游戏（从第一关开始）
    public RestartGame(): void {
        console.log("重新开始游戏，从第一关开始");
        this.LoadLevel(0);
        this.setGameState(GameState.MENU);
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

        // 防止重复处理关卡完成
        if (this._gameState === GameState.VICTORY || this._gameState === GameState.GAME_OVER) {
            console.log("关卡已经完成处理，忽略重复调用");
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

        // 立即处理英雄解锁奖励（确保玩家立即看到解锁的英雄）
        console.log("🎉 关卡胜利！立即处理英雄解锁奖励...");
        this.processLevelRewards(levelConfig.rewards);

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

        // 检查是否有下一关
        const nextIndex = this._currentLevelIndex + 1;
        const totalLevels = this.totalLevels;

        if (nextIndex >= totalLevels) {
            // 所有关卡完成，游戏通关
            this.setGameState(GameState.VICTORY);
            console.log("🎉 恭喜！所有关卡已完成，游戏通关！");
        } else {
            // 有下一关，进入关卡间休息阶段（120秒）
            this.setGameState(GameState.RESTING);
            this._restTimer = this._restDuration; // 120秒休息时间
            console.log(`关卡胜利！进入关卡间休息阶段，${this._restDuration}秒后自动进入第${nextIndex + 1}关...`);

            // 注意：单位清理已迁移到BattleManager处理

            // 先暂停WaveManager，避免它在休息期间自动开始
            const waveManager = this.GetWaveManager();
            if (waveManager) {
                waveManager.StopCurrentWave();
            }
        }
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
        console.log("游戏失败，将从第一关重新开始");

        // 设置游戏失败状态
        this.setGameState(GameState.GAME_OVER);

        // 使用组件生命周期规范的状态转换机制
        this.scheduleGameRestart(this._stateTransitionDelay);
    }

    // 处理关卡奖励
    private processLevelRewards(rewards: any[]): void {
        console.log(`📦 处理关卡奖励，总数: ${rewards.length}`);
        for (const reward of rewards) {
            console.log(`🎁 处理奖励: type=${reward.type}, value=${reward.value}, description=${reward.description}`);
            switch (reward.type) {
                case RewardType.GOLD:
                    this.AddGold(reward.value as number);
                    console.log(`获得金币奖励: ${reward.value}`);
                    break;
                case RewardType.HERO_UNLOCK:
                    // 集成英雄解锁系统
                    const levelManager = this.GetLevelManager();
                    const heroType = reward.value as HeroType;
                    console.log(`尝试解锁英雄: ${heroType} (type: ${typeof heroType})`);
                    if (levelManager && levelManager.UnlockHero(heroType)) {
                        console.log(`成功解锁英雄: ${heroType}`);
                        // 触发英雄解锁事件通知UI
                        this.emitEvent('hero-unlocked', { heroType: heroType });
                    } else {
                        console.warn(`英雄解锁失败: ${heroType}`);
                    }
                    break;
                case RewardType.ACHIEVEMENT:
                    // TODO: 集成成就系统
                    console.log(`获得成就: ${reward.value}`);
                    break;
                case RewardType.BUFF:
                    // 处理增益效果
                    console.log(`获得增益: ${reward.value} - ${reward.description}`);
                    break;
                case RewardType.TITLE:
                    // 处理称号奖励
                    console.log(`获得称号: ${reward.value} - ${reward.description}`);
                    break;
                default:
                    console.log(`获得未知奖励: ${reward.type} - ${reward.value}`);
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

        // 注意：单位清理功能已迁移到BattleManager

        // 重置波次管理器
        const waveManager = this.GetWaveManager();
        if (waveManager) {
            waveManager.ResetWaves();
        }

        // 重置游戏状态到部署阶段
        this.setGameState(GameState.DEPLOYMENT);

        console.log(`重新开始关卡: ${this.currentLevelName}`);
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
            this.NextWave(); // 准备下一波，WaveManager会自动等待5秒后开始
        }
    }

    // 更新休息阶段（关卡间休息）
    private updateRestPhase(dt: number): void {
        this._restTimer -= dt;
        if (this._restTimer <= 0) {
            // 关卡间休息结束，加载下一关并进入部署阶段
            const nextIndex = this._currentLevelIndex + 1;
            console.log(`关卡间休息结束，加载第${nextIndex + 1}关`);

            if (this.LoadLevel(nextIndex)) {
                // 直接开始战斗，不需要部署阶段
                this.setGameState(GameState.BATTLE);
                console.log(`休息结束，自动开始第${nextIndex + 1}关第${this.currentWave}波`);

                // 启动波次管理器
                const waveManager = this.GetWaveManager();
                if (waveManager) {
                    waveManager.StartWave(this.currentWave);
                } else {
                    console.error("未找到WaveManager，无法启动波次");
                }
            } else {
                console.error("加载下一关失败");
            }
        }
    }

    // 手动跳过休息阶段（关卡间）
    public SkipRestPhase(): void {
        if (this._gameState === GameState.RESTING) {
            console.log("手动跳过关卡间休息阶段，立即进入下一关");
            this._restTimer = 0;

            // 加载下一关
            const nextIndex = this._currentLevelIndex + 1;
            if (this.LoadLevel(nextIndex)) {
                // 可以选择直接开始战斗或进入部署阶段
                this.setGameState(GameState.BATTLE);
                console.log(`跳过休息，直接开始第${nextIndex + 1}关第${this.currentWave}波`);

                // 启动波次管理器
                const waveManager = this.GetWaveManager();
                if (waveManager) {
                    waveManager.StartWave(this.currentWave);
                } else {
                    console.error("未找到WaveManager，无法启动波次");
                }
            } else {
                console.error("跳过休息时加载下一关失败");
            }
        } else {
            console.warn("只能在关卡间休息阶段跳过休息");
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
            console.log(`准备第 ${this.currentWave} 波，${waveManager?.wavePrepareTime || 5}秒后自动开始 (共 ${totalWaves} 波)`);
            // 保持战斗状态，让WaveManager处理等待和自动开始
            this.setGameState(GameState.BATTLE);
        }
    }

    // 注意：所有英雄和敌人管理功能已迁移到BattleManager
    // 请直接使用 BattleManager.instance 的相关方法

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
        gameState: GameState;
        // 关卡信息
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
            gameState: this._gameState,
            // 关卡信息
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

    // 注意：网格系统访问已迁移，请直接获取 GridDeploymentSystem 组件

    // 统一的组件缓存获取方法
    private getCachedComponent<T extends Component>(cacheKey: string, componentClass: new () => T): T | null {
        const cache = (this as any)[cacheKey];
        if (cache && cache.isValid) {
            return cache;
        }

        const component = this.node.parent?.getComponentInChildren(componentClass) || null;
        (this as any)[cacheKey] = component;
        return component;
    }

    // ====================== 状态转换管理方法（符合Cocos Creator规范）======================

    /**
     * 安排状态转换（替代setTimeout的规范实现）
     * @param targetState 目标状态
     * @param delay 延迟时间（秒）
     */
    private _scheduleStateTransition(targetState: GameState, delay: number): void {
        this._pendingStateTransition = targetState;
        this._stateTransitionTimer = delay;
        console.log(`已安排状态转换: ${targetState}, 延迟: ${delay}秒`);
    }

    /**
     * 执行待定的状态转换
     */
    private executeStateTransition(): void {
        if (!this._pendingStateTransition) return;

        const targetState = this._pendingStateTransition;
        this._pendingStateTransition = null;
        this._stateTransitionTimer = 0;

        this.setGameState(targetState);

        if (targetState === GameState.DEPLOYMENT) {
            console.log("自动进入下一关");
        }
    }

    /**
     * 安排游戏重启（替代setTimeout的规范实现）
     * @param delay 延迟时间（秒）
     */
    private scheduleGameRestart(delay: number): void {
        // 使用特殊标记表示重启操作
        this._pendingStateTransition = null; // 清除状态转换
        this._stateTransitionTimer = delay;

        // 使用scheduleOnce进行游戏重启（这里是合规的游戏逻辑使用）
        this.scheduleOnce(() => {
            this.RestartGame();
        }, delay);

        console.log(`已安排游戏重启, 延迟: ${delay}秒`);
    }

}
