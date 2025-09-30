import { _decorator, Color, Component, Graphics, Label, Node, UITransform, Widget } from 'cc';
import { GameManager } from '../../managers/GameManager';
import { WaveManager } from '../../managers/WaveManager';
import { GameBootstrap } from '../../systems/GameBootstrap';
import { GameState } from '../../types/GameTypes';
import { UIHelper } from '../../utils/UIHelper';
import { GAME_CONFIG } from '../../types/GameConstants';

const { ccclass } = _decorator;

@ccclass('GameHUD')
export class GameHUD extends Component {

    // UI组件引用 - 信息显示
    private _goldLabel: Label | null = null;
    private _waveLabel: Label | null = null;
    private _levelLabel: Label | null = null;        // 关卡信息标签
    private _castleHealthLabel: Label | null = null;
    private _castleHealthBar: Graphics | null = null;
    private _playPauseButton: Node | null = null;
    private _gameOverDialog: Node | null = null;


    // 管理器引用
    private _gameManager: GameManager | null = null;
    private _waveManager: WaveManager | null = null;

    protected onLoad(): void {
        // 使用UIHelper设置GameHUD节点的全屏顶部对齐
        UIHelper.SetupFullWidthTopWidget(this.node, 65);

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
        // 创建独立的信息显示区域
        this.createInfoDisplayArea();

        // 创建独立的控制按钮区域（大幅下移）
        this.createControlButtonArea();
    }


    // 创建信息显示区域（轻微下移）
    private createInfoDisplayArea(): void {
        const infoAreaNode = new Node("InfoDisplayArea");
        infoAreaNode.parent = this.node;

        // 左对齐布局，占据左侧600像素宽度，增加高度以容纳关卡信息
        UIHelper.SetupLeftAlignWidget(infoAreaNode, 450, 100, 0, 0, 0);

        // 创建背景
        UIHelper.CreatePanelWithBackground(infoAreaNode, new Color(30, 30, 30, 200));

        // 创建信息面板内容
        this.createInfoPanel(infoAreaNode);
    }

    // 创建控制按钮区域（大幅下移）
    private createControlButtonArea(): void {
        const controlAreaNode = new Node("ControlButtonArea");
        controlAreaNode.parent = this.node;

        // 大幅下移50像素，避开微信小游戏系统UI
        UIHelper.SetupRightAlignWidget(controlAreaNode, 250, 58.5, 10, 50);

        // 创建背景
        UIHelper.CreatePanelWithBackground(controlAreaNode, new Color(30, 30, 30, 200));

        // 创建控制按钮
        this.createControlButtons(controlAreaNode);
    }

    // 创建信息面板
    private createInfoPanel(parent: Node): void {
        const infoPanelNode = new Node("InfoPanel");
        infoPanelNode.parent = parent;

        // 使用UIHelper设置布局 - 左对齐填充高度
        UIHelper.SetupLeftAlignWidget(infoPanelNode, 600, 100, 0, 0, 0);

        // 金币显示
        this.createGoldDisplay(infoPanelNode);

        // 波次显示
        this.createWaveDisplay(infoPanelNode);

        // 关卡信息显示（在波次下方）
        this.createLevelDisplay(infoPanelNode);

        // 城堡血量显示
        this.createCastleHealthDisplay(infoPanelNode);
    }

    // 创建关卡信息显示（在信息面板内）
    private createLevelDisplay(parent: Node): void {
        const levelNode = new Node("LevelDisplay");
        levelNode.parent = parent;

        // 使用UIHelper设置布局 - 左对齐在金币文本下方
        UIHelper.SetupLeftAlignWidget(levelNode, 400, 25, 15, 100);

        const levelLabel = levelNode.addComponent(Label);
        this._levelLabel = levelLabel;
        this._levelLabel.string = "关卡1: 新手训练";
        this._levelLabel.fontSize = 18;
        this._levelLabel.color = new Color(135, 206, 235); // 天蓝色
        this._levelLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
    }

    // 创建金币显示
    private createGoldDisplay(parent: Node): void {
        const goldNode = new Node("GoldDisplay");
        goldNode.parent = parent;

        // 使用UIHelper设置布局 - 回到最左侧位置
        UIHelper.SetupLeftAlignWidget(goldNode, 30, 58.5, 15);

        // 使用UIHelper创建金币图标
        const goldNodeTransform = goldNode.getComponent(UITransform);
        if (goldNodeTransform) {
            UIHelper.CreateCircleIcon(goldNode, 12,
                new Color(255, 215, 0), new Color(255, 140, 0), 2.34);
        }

        // 金币文本
        const goldLabelNode = new Node("GoldLabel");
        goldLabelNode.parent = goldNode;

        // 使用UIHelper设置文本标签的布局 - 调整到金币图标右侧
        UIHelper.SetupLeftAlignWidget(goldLabelNode, 30, 58.5, 15 + 30 + 15);

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

        // 使用UIHelper设置布局 - 调整位置，紧跟金币显示之后
        UIHelper.SetupLeftAlignWidget(waveNode, 30, 58.5, 15 + 30 + 15 + 30 + 100);

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

        // 使用UIHelper设置布局，设置在中央位置，向下移动以适应关卡信息
        UIHelper.SetupLeftAlignWidget(healthNode, 117, 58.5, 300, 30);

        // 血量条背景
        const healthBgNode = new Node("HealthBarBg");
        healthBgNode.parent = healthNode;

        // 使用Widget居中对齐血量条背景
        const bgTransform = healthBgNode.addComponent(UITransform);
        bgTransform.setContentSize(117, 14.04);
        const bgWidget = healthBgNode.addComponent(Widget);
        bgWidget.isAlignHorizontalCenter = true;
        bgWidget.isAlignVerticalCenter = true;
        bgWidget.verticalCenter = 14; // 从healthNode顶部向下22像素
        bgWidget.updateAlignment();

        const healthBg = healthBgNode.addComponent(Graphics);
        healthBg.fillColor = new Color(100, 100, 100);
        healthBg.rect(-58.5, -7.02, 117, 14.04);
        healthBg.fill();

        // 血量条前景
        const healthBarNode = new Node("HealthBar");
        healthBarNode.parent = healthNode;

        // 使用Widget居中对齐血量条前景
        const barTransform = healthBarNode.addComponent(UITransform);
        barTransform.setContentSize(117, 14.04);
        const barWidget = healthBarNode.addComponent(Widget);
        barWidget.isAlignHorizontalCenter = true;
        barWidget.isAlignVerticalCenter = true;
        barWidget.verticalCenter = 14;
        barWidget.updateAlignment();

        const healthBar = healthBarNode.addComponent(Graphics);
        this._castleHealthBar = healthBar;
        this._castleHealthBar.fillColor = new Color(255, 0, 0);
        this._castleHealthBar.rect(-58.5, -7.02, 117, 14.04);
        this._castleHealthBar.fill();

        // 血量文本
        const healthLabelNode = new Node("HealthLabel");
        healthLabelNode.parent = healthNode;

        // 使用Widget居中对齐血量文本
        const labelTransform = healthLabelNode.addComponent(UITransform);
        labelTransform.setContentSize(117, 18.72);
        const labelWidget = healthLabelNode.addComponent(Widget);
        labelWidget.isAlignHorizontalCenter = true;
        labelWidget.isAlignVerticalCenter = true;
        labelWidget.verticalCenter = -14
        labelWidget.updateAlignment();

        const healthLabel = healthLabelNode.addComponent(Label);
        this._castleHealthLabel = healthLabel;
        this._castleHealthLabel.string = `城堡 ${GAME_CONFIG.castleHealth}/${GAME_CONFIG.castleHealth}`;
        this._castleHealthLabel.fontSize = 18.72;
        this._castleHealthLabel.color = new Color(255, 255, 255);
    }

    // 创建控制按钮
    private createControlButtons(parent: Node): void {
        const controlPanelNode = new Node("ControlPanel");
        controlPanelNode.parent = parent;

        // 控制面板现在直接填充父容器
        const transform = controlPanelNode.addComponent(UITransform);
        transform.setContentSize(250, 58.5);

        const widget = controlPanelNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.isAlignBottom = true;
        widget.top = 0;
        widget.left = 0;
        widget.right = 0;
        widget.bottom = 0;
        widget.updateAlignment();

        // 使用UIHelper创建单个按钮，高度占容器的70%
        const buttons = UIHelper.CreateEqualWidthButtons(
            ["开始战斗"],
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

        const stats = this._gameManager.GetGameStats();

        // 更新关卡信息显示
        if (this._levelLabel && this._gameManager) {
            // 在休闲时间显示特殊信息，避免误导玩家
            if (stats.gameState === GameState.RESTING) {
                const remainingTime = Math.ceil(this._gameManager.restTimer);
                const nextLevelIndex = this._gameManager.currentLevelIndex + 1;
                this._levelLabel.string = `关卡间休息 - ${remainingTime}秒后进入关卡${nextLevelIndex + 1}`;
            } else {
                const levelIndex = this._gameManager.currentLevelIndex;
                const currentLevel = this._gameManager.currentLevelConfig;
                if (currentLevel) {
                    this._levelLabel.string = `关卡${levelIndex + 1}: ${currentLevel.name}`;
                } else {
                    this._levelLabel.string = "未选择关卡";
                }
            }
        }

        // 更新金币显示
        if (this._goldLabel) {
            this._goldLabel.string = stats.gold.toString();
        }

        // 更新波次显示
        if (this._waveLabel && this._waveManager) {
            const waveStats = this._waveManager.GetWaveStats();
            this._waveLabel.string = `第${waveStats.currentWave}/${waveStats.totalWaves}波`;
        }

        // 更新城堡血量显示
        this.updateCastleHealthDisplay(stats.castleHealth);

        // 更新按钮状态
        this.updateButtonStates(stats.gameState);

        // 检测游戏失败状态并显示对话框
        if (stats.gameState === GameState.GAME_OVER) {
            this.createGameOverDialog();
        }
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
                this.setButtonText(this._playPauseButton, "开始战斗");
                break;
            case GameState.DEPLOYMENT:
                this.setButtonText(this._playPauseButton, "开始战斗");
                break;
            case GameState.BATTLE:
            case GameState.PLAYING:
                this.setButtonText(this._playPauseButton, "战斗中");
                break;
            case GameState.RESTING:
                if (this._gameManager) {
                    const remainingTime = Math.ceil(this._gameManager.restTimer);
                    this.setButtonText(this._playPauseButton, `跳过休息(${remainingTime}s)`);
                }
                break;
            case GameState.GAME_OVER:
                this.setButtonText(this._playPauseButton, "游戏失败");
                break;
            case GameState.VICTORY:
                this.setButtonText(this._playPauseButton, "游戏胜利");
                break;
        }
    }

    // 设置按钮文本
    private setButtonText(button: Node, text: string): void {
        UIHelper.SetButtonText(button, text);
    }

    // 创建游戏失败对话框
    private createGameOverDialog(): void {
        // 避免重复创建
        if (this._gameOverDialog && this._gameOverDialog.isValid) {
            return;
        }

        // 获取Canvas根节点以实现全局覆盖
        const bootstrap = GameBootstrap.instance;
        const canvasNode = bootstrap?.canvasNode;

        if (!canvasNode) {
            console.error("无法获取Canvas节点，对话框将添加到GameHUD节点");
        }

        const dialogNode = new Node("GameOverDialog");
        dialogNode.parent = canvasNode || this.node; // 优先使用Canvas节点，实现全局覆盖
        this._gameOverDialog = dialogNode;

        // 设置为最高层级，确保显示在所有UI之上
        dialogNode.setSiblingIndex(99999);

        // 使用UIHelper设置居中布局 - 更大尺寸以覆盖更多屏幕
        UIHelper.SetupCenterWidget(dialogNode, 600, 400);

        // 使用UIHelper创建半透明背景 - 更高透明度实现遮罩效果
        UIHelper.CreatePanelWithBackground(dialogNode, new Color(0, 0, 0, 220));

        // 创建标题文本
        const titleNode = new Node("Title");
        titleNode.parent = dialogNode;
        titleNode.setPosition(0, 80);

        const titleLabel = titleNode.addComponent(Label);
        titleLabel.string = "游戏失败";
        titleLabel.fontSize = 56; // 更大的字体
        titleLabel.color = new Color(255, 80, 80);

        // 创建按钮容器
        const buttonContainer = new Node("ButtonContainer");
        buttonContainer.parent = dialogNode;
        buttonContainer.setPosition(0, -50);

        // 使用UIHelper设置按钮容器布局 - 更大的按钮
        UIHelper.SetupCenterWidget(buttonContainer, 250, 80);

        // 使用UIHelper创建重新开始按钮
        UIHelper.CreateEqualWidthButtons(
            ["重新开始"],
            buttonContainer,
            0.7, // 按钮高度占容器高度的70%
            10,  // 按钮间距
            new Color(80, 160, 80),
            [
                () => this.onRestartButtonClicked()
            ],
            this
        );

        console.log("游戏失败对话框已创建");
    }

    // 重启按钮点击事件处理
    private onRestartButtonClicked(): void {
        console.log("重启按钮被点击");

        if (!this._gameManager) {
            console.error("未找到GameManager实例");
            return;
        }

        // 销毁失败对话框
        if (this._gameOverDialog && this._gameOverDialog.isValid) {
            this._gameOverDialog.destroy();
            this._gameOverDialog = null;
        }

        // 调用GameManager的重启游戏方法
        this._gameManager.RestartGame();
    }

    // 按钮点击事件处理
    private onPlayPauseButtonClicked(): void {
        console.log("开始战斗按钮被点击");
        if (!this._gameManager) return;

        const gameState = this._gameManager.gameState;

        switch (gameState) {
            case GameState.MENU:
                // 直接进入部署阶段并开始战斗
                this._gameManager.StartGame();
                // 立即开始战斗，跳过部署等待
                // 使用Cocos Creator的调度系统而不是setTimeout
                this.scheduleOnce(() => {
                    if (this._gameManager && this._gameManager.gameState === GameState.DEPLOYMENT) {
                        this._gameManager.StartBattle();
                    }
                }, 0.1); // 短暂延迟确保状态切换完成
                break;
            case GameState.DEPLOYMENT:
                // 直接开始战斗
                this._gameManager.StartBattle();
                break;
            case GameState.BATTLE:
            case GameState.PLAYING:
                // 战斗中不允许暂停，按钮显示状态
                break;
            case GameState.RESTING:
                // 休息阶段允许手动跳过
                this._gameManager.SkipRestPhase();
                break;
        }
    }




    protected onDestroy(): void {
        // UI组件清理工作在这里处理
        if (this._goldLabel) this._goldLabel = null;
        if (this._waveLabel) this._waveLabel = null;
        if (this._castleHealthLabel) this._castleHealthLabel = null;
        if (this._castleHealthBar) this._castleHealthBar = null;
        if (this._playPauseButton) this._playPauseButton = null;
        if (this._gameOverDialog) this._gameOverDialog = null;
    }
}
