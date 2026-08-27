import { _decorator, Color, Component, Graphics, Label, Node, UITransform, find } from 'cc';
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
import { Castle } from '../components/game/Castle';
import { AdManager } from '../ad/AdManager';
import { UIHelper } from '../utils/UIHelper';

// vivo小游戏全局对象（浏览器调试环境不存在）
declare const qg: any;

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    @property({ tooltip: "城堡生命值" })
    public castleHealth: number = GAME_CONFIG.castleHealth;

    @property({ tooltip: "当前金币数量" })
    public currentGold: number = GAME_CONFIG.initialGold;

    @property({ tooltip: "当前波次" })
    public currentWave: number = 1;

    @property({ tooltip: "城堡节点引用", type: Node })
    public castleNode: Node | null = null;

    // ====================== 关卡系统状态 ======================
    private _currentLevelIndex: number = 0;        // 当前关卡索引（0-19，对应20个关卡）
    private _currentLevelConfig: LevelConfig | null = null; // 当前关卡配置

    // 游戏状态
    private _gameState: GameState = GameState.MENU; // 从菜单开始
    private _maxCastleHealth: number = GAME_CONFIG.castleHealth;

    // 事件回调
    private _eventCallbacks = new Map<keyof GameEvents, Function[]>();

    // 休息阶段相关（参考老项目）
    private _restTimer: number = 0;
    private _restDuration: number = GAME_CONFIG.restDuration;

    // 其他管理器的直接引用
    protected _battleManager: BattleManager | null = null;
    protected _waveManager: WaveManager | null = null;
    protected _levelManager: LevelManager | null = null;


    // 状态转换计时器（符合Cocos Creator生命周期规范）
    private _stateTransitionTimer: number = 0;
    private _pendingStateTransition: GameState | null = null;
    private _stateTransitionDelay: number = 3.0; // 3秒延迟

    // 城堡复活相关
    private _reviveDialog: Node | null = null;      // 复活确认弹窗节点
    private _isReviveAdShowing: boolean = false;    // 复活弹窗/激励视频展示中标志，防止重复触发

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

        // 获取其他管理器的直接引用
        this._battleManager = this.node.parent?.getComponentInChildren(BattleManager) || null;
        this._waveManager = this.node.parent?.getComponentInChildren(WaveManager) || null;
        this._levelManager = this.node.parent?.getComponentInChildren(LevelManager) || null;

        // 🎯 设置事件监听器 - GameManager作为事件中心
        this.setupEventListeners();

        // 初始化游戏配置
        this.initializeGameConfig();

        // 初始化完成
    }

    protected start(): void {
        // 游戏开始时保持菜单状态，等待玩家操作
        // 游戏加载完成
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
        // 清理事件监听器
        this.cleanupEventListeners();

        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
    }

    // ====================== 事件中心系统 ======================

    /**
     * 设置事件监听器 - GameManager作为事件中心
     */
    private setupEventListeners(): void {
        // 监听BattleManager事件
        if (this._battleManager) {
            this._battleManager.node.on('enemy-killed', this.onEnemyKilled, this);
            console.log("✅ BattleManager事件监听器已设置");
        }

        // 监听WaveManager事件
        if (this._waveManager) {
            this._waveManager.node.on('wave-started', this.onWaveStarted, this);
            this._waveManager.node.on('wave-enemies-cleared', this.onWaveEnemiesCleared, this);
            this._waveManager.node.on('level-all-waves-completed', this.onLevelAllWavesCompleted, this);
            console.log("✅ WaveManager事件监听器已设置");
        }

        // 监听LevelManager事件 (现有事件系统)
        if (this._levelManager) {
            this._levelManager.node.on('hero-unlocked', this.onHeroUnlocked, this);
            console.log("✅ LevelManager事件监听器已设置");
        }
    }

    /**
     * 清理事件监听器
     */
    private cleanupEventListeners(): void {
        if (this._battleManager) {
            this._battleManager.node.off('enemy-killed', this.onEnemyKilled, this);
        }

        if (this._waveManager) {
            this._waveManager.node.off('wave-started', this.onWaveStarted, this);
            this._waveManager.node.off('wave-enemies-cleared', this.onWaveEnemiesCleared, this);
            this._waveManager.node.off('level-all-waves-completed', this.onLevelAllWavesCompleted, this);
        }

        if (this._levelManager) {
            this._levelManager.node.off('hero-unlocked', this.onHeroUnlocked, this);
        }

        // 简化日志：清理完成
    }

    // ====================== 事件处理方法 ======================

    /**
     * 处理敌人被击杀事件
     */
    private onEnemyKilled(event: { enemy: any, goldReward: number }): void {
        // 原GameManager业务逻辑：给予金币奖励
        this.AddGold(event.goldReward);
        // 简化日志：敌人击杀奖励已在UI中显示
    }


    /**
     * 处理波次开始事件
     */
    private onWaveStarted(event: { waveNumber: number, levelId: string }): void {
        // 同步当前波次到GameManager
        this.currentWave = event.waveNumber;
        // 简化日志：波次开始信息已在UI中显示
    }

    /**
     * 处理波次敌人清理完成事件
     */
    private onWaveEnemiesCleared(event: { waveNumber: number, levelId: string }): void {
        // 简化日志：波次完成信息已在UI中显示

        if (!this._currentLevelConfig) {
            console.error("没有当前关卡配置");
            return;
        }

        // 波次完成业务逻辑
        // 简化日志：波次完成信息已在UI中显示

        // 每波奖励金币
        this.AddGold(30);

        // 检查是否是最后一波
        const totalWaves = this._currentLevelConfig.waves.length;
        if (event.waveNumber >= totalWaves) {
            // 关卡完成 - 清理英雄准备下一关
            if (this._battleManager) {
                this._battleManager.ClearAllDeployedHeroes();
            }

            console.log(`关卡 ${this.currentLevelName} 所有波次完成！`);
            this.CompleteLevel(true); // 关卡胜利
        } else {
            this.NextWave(); // 准备下一波，WaveManager会自动等待5秒后开始
        }
    }

    /**
     * 处理关卡所有波次完成事件
     */
    private onLevelAllWavesCompleted(event: { levelId: string, levelName: string }): void {
        // 简化日志：关卡完成信息已在UI中显示
        this.CompleteLevel(true);
    }

    /**
     * 处理英雄解锁事件
     */
    private onHeroUnlocked(event: { heroType: any }): void {
        // 简化日志：英雄解锁信息已在UI中显示
        // 可以在这里添加UI通知等逻辑
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

    /**
     * 退出游戏（先展示原生盒子广告，用户关闭或展示失败后退出）
     * 供UI调用（目前可能没有退出按钮，但预留接口）
     */
    public ExitGame(): void {
        AdManager.instance?.showExitBoxAd(() => {
            if (typeof qg !== 'undefined' && qg.exitApplication) {
                qg.exitApplication();
            }
        });
    }


    // 应用关卡配置
    private applyLevelConfig(config: LevelConfig): void {
        // 设置初始金币
        this.currentGold = config.initialGold;

        // 设置城堡生命值
        this.castleHealth = GAME_CONFIG.castleHealth;
        this._maxCastleHealth = GAME_CONFIG.castleHealth;

        // 恢复城堡外观
        if (this.castleNode) {
            const castleComponent = this.castleNode.getComponent(Castle);
            if (castleComponent) {
                castleComponent.restoreCastleAppearance();
            }
        }

        // 重置波次
        this.currentWave = 1;

        // 通知WaveManager更新关卡配置
        if (this._waveManager) {
            this._waveManager.SetLevelConfig(config);
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
        // 简化日志：战斗开始信息已在UI中显示

        // 启动波次管理器
        if (this._waveManager) {
            // 简化日志：启动波次信息已在UI中显示
            this._waveManager.StartWave(this.currentWave);
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
            // 忽略重复调用
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
        // 简化日志：关卡胜利

        // 立即处理英雄解锁奖励（确保玩家立即看到解锁的英雄）
        // 处理英雄解锁奖励
        this.processLevelRewards(levelConfig.rewards);

        // 计算完成时间和分数（简化计算）
        const completionTime = this.calculateCompletionTime();
        const score = this.calculateLevelScore();

        // 记录关卡完成到LevelManager
        if (this._levelManager) {
            this._levelManager.RecordLevelCompletion(levelConfig.id, true, completionTime, score);
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

            // 先暂停WaveManager，避免它在休息期间自动开始
            if (this._waveManager) {
                this._waveManager.StopCurrentWave();
            }
        }
    }

    // 计算关卡完成时间
    private calculateCompletionTime(): number {
        const estimatedTime = 5 * 60; // 固定5分钟预期时长
        return estimatedTime * 0.8; // 假设80%时间内完成
    }

    // 计算关卡分数
    private calculateLevelScore(): number {
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
                    const heroType = reward.value as HeroType;
                    console.log(`尝试解锁英雄: ${heroType} (type: ${typeof heroType})`);
                    if (this._levelManager && this._levelManager.UnlockHero(heroType)) {
                        console.log(`成功解锁英雄: ${heroType}`);
                        // 触发英雄解锁事件通知UI
                        this.emitEvent('hero-unlocked', { heroType: heroType });
                    } else {
                        console.warn(`英雄解锁失败: ${heroType}`);
                    }
                    break;
                default:
                    // 处理其他类型的奖励（成就、称号等）
                    console.log(`获得特殊奖励: ${reward.value} - ${reward.description}`);
            }
        }
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
        if (this._waveManager) {
            this._waveManager.ResetWaves();
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
        const previousGold = this.currentGold;
        this.currentGold += amount;
        // 简化日志：金币变化已在UI中显示

        // 发出金币变化事件
        this.emitEvent('gold-changed', {
            currentGold: this.currentGold,
            previousGold: previousGold,
            change: amount
        });
    }

    // 消费金币
    public SpendGold(amount: number): boolean {
        if (this.currentGold >= amount) {
            const previousGold = this.currentGold;
            this.currentGold -= amount;
            // 简化日志：金币消费已在UI中显示

            // 发出金币变化事件
            this.emitEvent('gold-changed', {
                currentGold: this.currentGold,
                previousGold: previousGold,
                change: -amount
            });

            return true;
        }

        console.log(`金币不足，需要: ${amount}, 当前: ${this.currentGold}`);
        return false;
    }

    // 城堡受伤
    public CastleTakeDamage(damage: number): void {
        // 复活弹窗/激励视频展示中：血量保持为0，不重复扣血、不重复触发
        if (this._isReviveAdShowing) return;

        this.castleHealth = Math.max(0, this.castleHealth - damage);
        console.log(`城堡受到伤害: ${damage}, 剩余血量: ${this.castleHealth}`);

        // 检查游戏失败
        if (this.castleHealth <= 0) {
            this.handleCastleDestroyed();
        }
    }

    /**
     * 城堡被摧毁时的处理 - 弹出复活确认弹窗，通过激励视频复活
     */
    private handleCastleDestroyed(): void {
        // 防止重复调用（已在失败流程或弹窗展示中）
        if (this._gameState === GameState.GAME_OVER || this._isReviveAdShowing) return;
        if (this._reviveDialog && this._reviveDialog.isValid) return;

        console.log("🏰 城堡血量归零，弹出复活确认弹窗");
        this._isReviveAdShowing = true;
        this.showReviveDialog();
    }

    /**
     * 展示复活确认弹窗（看视频复活 / 放弃）
     */
    private showReviveDialog(): void {
        const canvasNode = find('Canvas');
        if (!canvasNode) {
            console.error("无法获取Canvas节点，直接走失败流程");
            this._isReviveAdShowing = false;
            this.CompleteLevel(false);
            return;
        }

        const dialogNode = new Node("ReviveDialog");
        dialogNode.parent = canvasNode;
        dialogNode.setSiblingIndex(99999); // 置顶显示

        // 居中布局
        UIHelper.SetupCenterWidget(dialogNode, 560, 360);

        // 半透明背景遮罩（Graphics绘制，不使用Mask组件）
        const bgGraphics = UIHelper.CreatePanelWithBackground(dialogNode, new Color(0, 0, 0, 220));
        bgGraphics.strokeColor = new Color(150, 150, 150, 200);
        bgGraphics.lineWidth = 2;
        bgGraphics.stroke();

        // 标题
        const titleNode = new Node("Title");
        titleNode.parent = dialogNode;
        titleNode.setPosition(0, 100);
        const titleLabel = titleNode.addComponent(Label);
        titleLabel.string = "城堡被摧毁！";
        titleLabel.fontSize = 48;
        titleLabel.color = new Color(255, 90, 90);

        // 副标题
        const subTitleNode = new Node("SubTitle");
        subTitleNode.parent = dialogNode;
        subTitleNode.setPosition(0, 40);
        const subLabel = subTitleNode.addComponent(Label);
        subLabel.string = "观看视频立即复活，继续战斗！";
        subLabel.fontSize = 26;
        subLabel.color = new Color(255, 255, 255);

        // 按钮容器
        const buttonContainer = new Node("ButtonContainer");
        buttonContainer.parent = dialogNode;
        buttonContainer.setPosition(0, -80);
        UIHelper.SetupCenterWidget(buttonContainer, 480, 100);

        // 两个按钮：看视频复活（绿色） / 放弃（红色）
        const reviveButtons = UIHelper.CreateEqualWidthButtons(
            ["看视频复活", "放弃"],
            buttonContainer,
            0.7,
            20,
            new Color(80, 160, 80),
            [
                () => this.onReviveAdButtonClicked(),
                () => this.onReviveCancelButtonClicked()
            ],
            this
        );

        // 重绘「放弃」按钮背景为红色，与「看视频复活」区分
        if (reviveButtons.length > 1) {
            const abandonButton = reviveButtons[1];
            const abandonGraphics = abandonButton.getComponent(Graphics);
            const abandonTransform = abandonButton.getComponent(UITransform);
            if (abandonGraphics && abandonTransform) {
                UIHelper.DrawButtonBackground(abandonGraphics, abandonTransform.width, abandonTransform.height, new Color(160, 70, 70));
            }
        }

        this._reviveDialog = dialogNode;
        console.log("复活确认弹窗已展示");
    }

    /**
     * 点击「看视频复活」按钮 - 调用激励视频广告
     */
    private onReviveAdButtonClicked(): void {
        const adManager = AdManager.instance;
        if (!adManager) {
            console.error("AdManager不可用，直接走失败流程");
            this.closeReviveDialog();
            this.CompleteLevel(false);
            return;
        }

        adManager.showRewardedAd(
            () => this.onReviveAdComplete(),
            () => this.onReviveAdCancel()
        );
    }

    /**
     * 激励视频完整看完 - 复活城堡
     */
    private onReviveAdComplete(): void {
        console.log("✅ 激励视频完整看完，城堡复活！");
        this.closeReviveDialog();
        this.reviveCastle();
    }

    /**
     * 激励视频取消/没看完 - 正常走游戏失败逻辑
     */
    private onReviveAdCancel(): void {
        console.log("❌ 激励视频取消/没看完，走失败流程");
        this.closeReviveDialog();
        this.CompleteLevel(false);
    }

    /**
     * 点击「放弃」按钮 - 直接走游戏失败逻辑
     */
    private onReviveCancelButtonClicked(): void {
        console.log("放弃复活，走失败流程");
        this.closeReviveDialog();
        this.CompleteLevel(false);
    }

    /**
     * 关闭复活确认弹窗
     */
    private closeReviveDialog(): void {
        this._isReviveAdShowing = false;
        if (this._reviveDialog && this._reviveDialog.isValid) {
            this._reviveDialog.destroy();
        }
        this._reviveDialog = null;
    }

    /**
     * 城堡复活 - 恢复满血继续游戏
     */
    private reviveCastle(): void {
        this.castleHealth = this._maxCastleHealth;
        console.log("🏰 城堡复活！血量已恢复满！");

        // 恢复城堡外观
        if (this.castleNode) {
            const castleComponent = this.castleNode.getComponent(Castle);
            if (castleComponent) {
                castleComponent.restoreCastleAppearance();
            }
        }

        // 复活成功提示
        this.showReviveSuccessTip();
    }

    /**
     * 复活成功提示（简短Label提示）
     */
    private showReviveSuccessTip(): void {
        const canvasNode = find('Canvas');
        if (!canvasNode) return;

        const tipNode = new Node("ReviveSuccessTip");
        tipNode.parent = canvasNode;
        tipNode.setSiblingIndex(99998);

        UIHelper.SetupCenterWidget(tipNode, 420, 80);

        const tipBg = UIHelper.CreatePanelWithBackground(tipNode, new Color(0, 90, 0, 220));
        tipBg.strokeColor = new Color(100, 220, 100, 220);
        tipBg.lineWidth = 2;
        tipBg.stroke();

        const tipLabelNode = new Node("TipLabel");
        tipLabelNode.parent = tipNode;
        const tipLabel = tipLabelNode.addComponent(Label);
        tipLabel.string = "🎉 复活成功！城堡恢复满血！";
        tipLabel.fontSize = 28;
        tipLabel.color = new Color(150, 255, 150);

        // 游戏逻辑中的定时消失效果（非UI初始化，允许使用）
        this.scheduleOnce(() => {
            if (tipNode && tipNode.isValid) {
                tipNode.destroy();
            }
        }, 1.5);
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
                if (this._waveManager) {
                    this._waveManager.StartWave(this.currentWave);
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
                if (this._waveManager) {
                    this._waveManager.StartWave(this.currentWave);
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
        if (this._waveManager) {
            this._waveManager.PrepareNextWave();
            // 同步当前波次到GameManager
            this.currentWave = this._waveManager.currentWaveNumber;
        }

        const totalWaves = this._currentLevelConfig.waves.length;

        // 检查是否超过关卡最大波次
        if (this.currentWave > totalWaves) {
            console.log(`关卡 ${this.currentLevelName} 完成，总共 ${totalWaves} 波`);
            this.CompleteLevel(true);
        } else {
            console.log(`准备第 ${this.currentWave} 波，${this._waveManager?.wavePrepareTime || 5}秒后自动开始 (共 ${totalWaves} 波)`);
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


    // ====================== 状态转换管理方法（符合Cocos Creator规范）======================

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
