import { _decorator, Color, Component, Graphics, Label, Node, UITransform } from 'cc';
import { GameManager } from '../../managers/GameManager';
import { WaveManager } from '../../managers/WaveManager';
import { GameState } from '../../types/GameTypes';
import { UIHelper } from '../../utils/UIHelper';

const { ccclass } = _decorator;

@ccclass('GameHUD')
export class GameHUD extends Component {

    // UI组件引用 - 信息显示
    private _goldLabel: Label | null = null;
    private _waveLabel: Label | null = null;
    private _castleHealthLabel: Label | null = null;
    private _castleHealthBar: Graphics | null = null;
    private _playPauseButton: Node | null = null;


    // 管理器引用
    private _gameManager: GameManager | null = null;
    private _waveManager: WaveManager | null = null;

    protected onLoad(): void {
        // 使用UIHelper设置GameHUD节点的全屏顶部对齐
        UIHelper.SetupFullWidthTopWidget(this.node, 60);

        this.createCompleteInterface();
        console.log("GameHUD初始化完成 - 完整版本");
    }

    protected start(): void {
        // 获取管理器引用
        this._gameManager = GameManager.instance;
        this._waveManager = WaveManager.instance;

        if (!this._gameManager) {
            console.error("未找到GameManager实例");
        }
        if (!this._waveManager) {
            console.error("未找到WaveManager实例");
        }
    }


    protected update(_dt: number): void {
        // 更新UI显示
        this.updateDisplays();
    }

    // ========== 界面创建 ==========

    // 创建完整界面
    private createCompleteInterface(): void {
        // 创建顶部信息区域
        this.createTopInfoArea();
    }


    // 创建顶部信息区域
    private createTopInfoArea(): void {
        const topAreaNode = new Node("TopInfoArea");
        topAreaNode.parent = this.node;

        // 使用UIHelper设置布局
        UIHelper.SetupFullWidthTopWidget(topAreaNode, 58.5);

        // 创建背景
        UIHelper.CreatePanelWithBackground(topAreaNode, new Color(30, 30, 30, 200));

        // 创建信息面板
        this.createInfoPanel(topAreaNode);

        // 创建控制按钮
        this.createControlButtons(topAreaNode);
    }

    // 创建信息面板
    private createInfoPanel(parent: Node): void {
        const infoPanelNode = new Node("InfoPanel");
        infoPanelNode.parent = parent;

        // 使用UIHelper设置布局 - 左对齐填充高度
        UIHelper.SetupLeftAlignWidget(infoPanelNode, 600, 58.5, 0, 0, 0);

        // 金币显示
        this.createGoldDisplay(infoPanelNode);

        // 波次显示
        this.createWaveDisplay(infoPanelNode);

        // 城堡血量显示
        this.createCastleHealthDisplay(infoPanelNode);
    }

    // 创建金币显示
    private createGoldDisplay(parent: Node): void {
        const goldNode = new Node("GoldDisplay");
        goldNode.parent = parent;

        // 使用UIHelper设置布局
        UIHelper.SetupLeftAlignWidget(goldNode, 30, 58.5, 15);

        // 使用UIHelper创建金币图标
        const goldNodeTransform = goldNode.getComponent(UITransform);
        if (goldNodeTransform) {
            UIHelper.CreateCircleIcon(goldNode, goldNodeTransform.height / 2,
                new Color(255, 215, 0), new Color(255, 140, 0), 2.34);
        }

        // 金币文本
        const goldLabelNode = new Node("GoldLabel");
        goldLabelNode.parent = goldNode;

        // 使用UIHelper设置文本标签的布局
        UIHelper.SetupLeftAlignWidget(goldLabelNode, 30, 58.5, 30 + 15 + 15);

        const goldLabel = goldLabelNode.addComponent(Label);
        this._goldLabel = goldLabel;
        this._goldLabel.string = "100";
        this._goldLabel.fontSize = 28.08;
        this._goldLabel.color = new Color(255, 215, 0);
    }

    // 创建波次显示
    private createWaveDisplay(parent: Node): void {
        const waveNode = new Node("WaveDisplay");
        waveNode.parent = parent;

        // 使用UIHelper设置布局
        UIHelper.SetupLeftAlignWidget(waveNode, 30, 58.5, 30 + 15 + 15 + 30 + 100);

        const waveLabel = waveNode.addComponent(Label);
        this._waveLabel = waveLabel;
        this._waveLabel.string = "第1/3波";
        this._waveLabel.fontSize = 25.74;
        this._waveLabel.color = new Color(255, 255, 255);
    }

    // 创建城堡血量显示
    private createCastleHealthDisplay(parent: Node): void {
        const healthNode = new Node("CastleHealthDisplay");
        healthNode.parent = parent;

        // 使用UIHelper设置布局，设置在中央位置
        UIHelper.SetupLeftAlignWidget(healthNode, 117, 58.5, 300);

        // 血量条背景
        const healthBgNode = new Node("HealthBarBg");
        healthBgNode.parent = healthNode;
        const healthBg = healthBgNode.addComponent(Graphics);
        healthBg.fillColor = new Color(100, 100, 100);
        healthBg.rect(-58.5, -7.02, 117, 14.04);
        healthBg.fill();

        // 血量条前景
        const healthBarNode = new Node("HealthBar");
        healthBarNode.parent = healthNode;
        const healthBar = healthBarNode.addComponent(Graphics);
        this._castleHealthBar = healthBar;
        this._castleHealthBar.fillColor = new Color(255, 0, 0);
        this._castleHealthBar.rect(-58.5, -7.02, 117, 14.04);
        this._castleHealthBar.fill();

        // 血量文本
        const healthLabelNode = new Node("HealthLabel");
        healthLabelNode.parent = healthNode;
        healthLabelNode.setPosition(0, -23.4);

        const healthLabel = healthLabelNode.addComponent(Label);
        this._castleHealthLabel = healthLabel;
        this._castleHealthLabel.string = "城堡 100/100";
        this._castleHealthLabel.fontSize = 18.72;
        this._castleHealthLabel.color = new Color(255, 255, 255);
    }

    // 创建控制按钮
    private createControlButtons(parent: Node): void {
        const controlPanelNode = new Node("ControlPanel");
        controlPanelNode.parent = parent;

        // 使用UIHelper设置右对齐布局
        UIHelper.SetupRightAlignWidget(controlPanelNode, 250, 58.5, 10);

        // 使用UIHelper创建单个按钮，高度占容器的70%
        const buttons = UIHelper.CreateEqualWidthButtons(
            ["开始"], 
            controlPanelNode, 
            0.7, // 按钮高度占容器高度的70%
            10,  // 按钮间距10像素
            new Color(70, 130, 180),
            [
                () => this.onPlayPauseButtonClicked()
            ],
            this
        );

        // 保存按钮引用
        this._playPauseButton = buttons[0];
    }


    // 更新显示信息
    private updateDisplays(): void {
        if (!this._gameManager) return;

        const stats = this._gameManager.getGameStats();

        // 更新金币显示
        if (this._goldLabel) {
            this._goldLabel.string = stats.gold.toString();
        }

        // 更新波次显示
        if (this._waveLabel && this._waveManager) {
            const waveStats = this._waveManager.getWaveStats();
            this._waveLabel.string = `第${waveStats.currentWave}/${waveStats.totalWaves}波`;
        }

        // 更新城堡血量显示
        this.updateCastleHealthDisplay(stats.castleHealth);

        // 更新按钮状态
        this.updateButtonStates(stats.gameState);
    }

    // 更新城堡血量显示
    private updateCastleHealthDisplay(currentHealth: number): void {
        if (!this._castleHealthLabel || !this._castleHealthBar || !this._gameManager) return;

        const maxHealth = 100;
        const healthPercent = Math.max(0, currentHealth / maxHealth);

        this._castleHealthLabel.string = `城堡 ${Math.round(currentHealth)}/${maxHealth}`;

        this._castleHealthBar.clear();

        if (healthPercent > 0.6) {
            this._castleHealthBar.fillColor = new Color(0, 255, 0);
        } else if (healthPercent > 0.3) {
            this._castleHealthBar.fillColor = new Color(255, 255, 0);
        } else {
            this._castleHealthBar.fillColor = new Color(255, 0, 0);
        }

        const healthWidth = 117 * healthPercent;
        this._castleHealthBar.rect(-58.5, -7.02, healthWidth, 14.04);
        this._castleHealthBar.fill();
    }

    // 更新按钮状态
    private updateButtonStates(gameState: GameState): void {
        if (!this._playPauseButton) return;

        switch (gameState) {
            case GameState.MENU:
                this.setButtonText(this._playPauseButton, "开始");
                break;
            case GameState.DEPLOYMENT:
                this.setButtonText(this._playPauseButton, "战斗");
                break;
            case GameState.BATTLE:
            case GameState.PLAYING:
                this.setButtonText(this._playPauseButton, "战斗中");
                break;
            case GameState.RESTING:
                if (this._gameManager) {
                    this.setButtonText(this._playPauseButton, `休息${Math.ceil(this._gameManager.restTimer)}s`);
                }
                break;
        }
    }

    // 设置按钮文本
    private setButtonText(button: Node, text: string): void {
        UIHelper.SetButtonText(button, text);
    }

    // 按钮点击事件处理
    private onPlayPauseButtonClicked(): void {
        console.log("播放/暂停按钮被点击");
        if (!this._gameManager) return;

        const gameState = this._gameManager.gameState;

        switch (gameState) {
            case GameState.MENU:
                this._gameManager.startGame();
                break;
            case GameState.DEPLOYMENT:
                this._gameManager.startBattle();
                break;
            case GameState.BATTLE:
            case GameState.PLAYING:
                // 战斗中不允许暂停，按钮显示状态
                break;
        }
    }


    // 显示游戏结束信息
    public showGameOverMessage(isVictory: boolean): void {
        const messageNode = new Node("GameOverMessage");
        messageNode.parent = this.node;

        // 使用UIHelper设置居中布局
        UIHelper.SetupCenterWidget(messageNode, 468, 234);

        // 使用UIHelper创建背景
        UIHelper.CreatePanelWithBackground(messageNode, new Color(0, 0, 0, 180));

        const messageLabel = messageNode.addComponent(Label);
        messageLabel.string = isVictory ? "胜利！" : "失败！";
        messageLabel.fontSize = 56.16;
        messageLabel.color = isVictory ? new Color(0, 255, 0) : new Color(255, 0, 0);

        setTimeout(() => {
            if (messageNode && messageNode.isValid) {
                messageNode.destroy();
            }
        }, 5000);
    }


    protected onDestroy(): void {
        // UI组件清理工作在这里处理
        if (this._goldLabel) this._goldLabel = null;
        if (this._waveLabel) this._waveLabel = null;
        if (this._castleHealthLabel) this._castleHealthLabel = null;
        if (this._castleHealthBar) this._castleHealthBar = null;
        if (this._playPauseButton) this._playPauseButton = null;
    }
}
