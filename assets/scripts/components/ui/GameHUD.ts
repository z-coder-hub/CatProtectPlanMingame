import { _decorator, Color, Component, Graphics, Label, Node, UITransform, view, Button } from 'cc';
import { GameManager } from '../../managers/GameManager';
import { WaveManager } from '../../managers/WaveManager';
import { GameState } from '../../types/GameTypes';

const { ccclass, property } = _decorator;

@ccclass('GameHUD')
export class GameHUD extends Component {

    // UI组件引用
    private _goldLabel: Label | null = null;
    private _waveLabel: Label | null = null;
    private _castleHealthLabel: Label | null = null;
    private _castleHealthBar: Graphics | null = null;
    private _playPauseButton: Node | null = null;
    private _restartButton: Node | null = null;

    // 管理器引用
    private _gameManager: GameManager | null = null;
    private _waveManager: WaveManager | null = null;

    protected onLoad(): void {
        this.createHUDInterface();
        console.log("GameHUD初始化完成");
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

    protected update(dt: number): void {
        // 更新UI显示
        this.updateDisplays();
    }

    // 创建HUD界面
    private createHUDInterface(): void {
        // 创建顶部区域
        this.createTopArea();
    }

    // 创建顶部区域
    private createTopArea(): void {
        const topAreaNode = new Node("TopArea");
        topAreaNode.parent = this.node;
        topAreaNode.setPosition(0, view.getVisibleSize().height / 2 - 50); // 屏幕顶部

        // 顶部区域背景 (适应屏幕)
        const topBg = topAreaNode.addComponent(Graphics);
        topBg.fillColor = new Color(50, 50, 50, 200);
        const screenWidth = view.getVisibleSize().width;
        topBg.rect(-screenWidth/2, -40, screenWidth, 80);
        topBg.fill();

        // 创建左侧信息面板
        this.createInfoPanel(topAreaNode);

        // 创建右侧控制按钮面板
        this.createControlPanel(topAreaNode);
    }

    // 创建左侧信息面板
    private createInfoPanel(parent: Node): void {
        const infoPanelNode = new Node("InfoPanel");
        infoPanelNode.parent = parent;
        const screenWidth = view.getVisibleSize().width;
        infoPanelNode.setPosition(-screenWidth/4, 0); // 位于屏幕左侧1/4处

        // 根据屏幕宽度调整元素间距
        const elementSpacing = Math.max(80, screenWidth * 0.15); // 自适应间距

        // 金币显示
        this.createGoldDisplay(infoPanelNode, -elementSpacing);

        // 波次显示
        this.createWaveDisplay(infoPanelNode, elementSpacing);
        
        // 城堡血量显示
        this.createCastleHealthDisplay(infoPanelNode);
    }

    // 创建金币显示
    private createGoldDisplay(parent: Node, xPosition: number = -120): void {
        const goldNode = new Node("GoldDisplay");
        goldNode.parent = parent;
        goldNode.setPosition(xPosition, 0); // 使用传入的位置参数

        // 金币图标 (适中大小)
        const goldIcon = goldNode.addComponent(Graphics);
        goldIcon.fillColor = new Color(255, 215, 0); // 金色
        goldIcon.circle(-30, 0, 12);
        goldIcon.fill();

        // 金币文本
        const goldLabelNode = new Node("GoldLabel");
        goldLabelNode.parent = goldNode;
        goldLabelNode.setPosition(0, 0);

        this._goldLabel = goldLabelNode.addComponent(Label);
        this._goldLabel.string = "0";
        this._goldLabel.fontSize = 24; // 适中字体
        this._goldLabel.color = new Color(255, 255, 255);
    }

    // 创建波次显示
    private createWaveDisplay(parent: Node, xPosition: number = 120): void {
        const waveNode = new Node("WaveDisplay");
        waveNode.parent = parent;
        waveNode.setPosition(xPosition, 0); // 使用传入的位置参数

        this._waveLabel = waveNode.addComponent(Label);
        this._waveLabel.string = "第1/3波";
        this._waveLabel.fontSize = 24; // 适中字体
        this._waveLabel.color = new Color(255, 255, 255);
    }
    
    // 创建城堡血量显示
    private createCastleHealthDisplay(parent: Node): void {
        const healthNode = new Node("CastleHealthDisplay");
        healthNode.parent = parent;
        healthNode.setPosition(0, -30); // 在波次下方
        
        // 血量条背景
        const healthBgNode = new Node("HealthBarBg");
        healthBgNode.parent = healthNode;
        const healthBg = healthBgNode.addComponent(Graphics);
        healthBg.fillColor = new Color(100, 100, 100); // 灰色背景
        healthBg.rect(-60, -8, 120, 16);
        healthBg.fill();
        
        // 血量条前景
        const healthBarNode = new Node("HealthBar");
        healthBarNode.parent = healthNode;
        this._castleHealthBar = healthBarNode.addComponent(Graphics);
        this._castleHealthBar.fillColor = new Color(255, 0, 0); // 红色血量
        this._castleHealthBar.rect(-60, -8, 120, 16);
        this._castleHealthBar.fill();
        
        // 血量文本
        const healthLabelNode = new Node("HealthLabel");
        healthLabelNode.parent = healthNode;
        healthLabelNode.setPosition(0, -25);
        
        this._castleHealthLabel = healthLabelNode.addComponent(Label);
        this._castleHealthLabel.string = "城堡: 100/100";
        this._castleHealthLabel.fontSize = 18;
        this._castleHealthLabel.color = new Color(255, 255, 255);
    }


    // 创建右侧控制面板
    private createControlPanel(parent: Node): void {
        const controlPanelNode = new Node("ControlPanel");
        controlPanelNode.parent = parent;
        const screenWidth = view.getVisibleSize().width;
        controlPanelNode.setPosition(screenWidth/4, 0); // 位于屏幕右侧1/4处

        // 根据屏幕宽度调整按钮间距
        const buttonSpacing = Math.max(50, screenWidth * 0.08); // 自适应按钮间距

        // 播放/暂停切换按钮 (简化文字)
        this._playPauseButton = this.createButton("开始", -buttonSpacing, () => {
            this.onPlayPauseButtonClicked();
        });
        this._playPauseButton.parent = controlPanelNode;

        // 重新开始按钮 (简化文字)
        this._restartButton = this.createButton("重启", buttonSpacing, () => {
            this.onRestartButtonClicked();
        });
        this._restartButton.parent = controlPanelNode;
    }

    // 创建按钮 (使用Button组件)
    private createButton(text: string, xPos: number, callback: () => void): Node {
        const buttonNode = new Node(`Button_${text}`);
        buttonNode.setPosition(xPos, 0);

        // 设置按钮尺寸 - 增大以适合手机触摸
        const screenWidth = view.getVisibleSize().width;
        const buttonWidth = Math.max(80, screenWidth * 0.12); // 自适应宽度
        const buttonHeight = Math.max(40, screenWidth * 0.06); // 自适应高度
        const transform = buttonNode.addComponent(UITransform);
        transform.setContentSize(buttonWidth, buttonHeight);

        // 添加Button组件
        const button = buttonNode.addComponent(Button);
        
        // 按钮背景
        const buttonBg = buttonNode.addComponent(Graphics);
        this.drawButtonBackground(buttonBg, buttonWidth, buttonHeight, new Color(70, 130, 180));

        // 设置Button组件的目标
        button.target = buttonNode;

        // 按钮文本 - 根据按钮大小调整字体
        const labelNode = new Node("Label");
        labelNode.parent = buttonNode;
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = Math.max(16, buttonHeight * 0.4); // 自适应字体大小
        label.color = new Color(255, 255, 255);

        // 添加点击事件
        button.node.on(Button.EventType.CLICK, callback, this);

        return buttonNode;
    }

    // 绘制按钮背景
    private drawButtonBackground(graphics: Graphics, width: number, height: number, color: Color): void {
        graphics.clear();
        graphics.fillColor = color;
        graphics.rect(-width / 2, -height / 2, width, height);
        graphics.fill();

        // 按钮边框
        graphics.strokeColor = new Color(255, 255, 255);
        graphics.lineWidth = 1;
        graphics.rect(-width / 2, -height / 2, width, height);
        graphics.stroke();
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
        
        const maxHealth = 100; // 从GameManager获取最大血量
        const healthPercent = Math.max(0, currentHealth / maxHealth);
        
        // 更新血量文本
        this._castleHealthLabel.string = `城堡: ${Math.round(currentHealth)}/${maxHealth}`;
        
        // 更新血量条
        this._castleHealthBar.clear();
        
        // 根据血量百分比改变颜色
        if (healthPercent > 0.6) {
            this._castleHealthBar.fillColor = new Color(0, 255, 0); // 绿色
        } else if (healthPercent > 0.3) {
            this._castleHealthBar.fillColor = new Color(255, 255, 0); // 黄色
        } else {
            this._castleHealthBar.fillColor = new Color(255, 0, 0); // 红色
        }
        
        // 绘制当前血量条
        const healthWidth = 120 * healthPercent;
        this._castleHealthBar.rect(-60, -8, healthWidth, 16);
        this._castleHealthBar.fill();
    }

    // 更新按钮状态
    private updateButtonStates(gameState: GameState): void {
        if (!this._playPauseButton || !this._restartButton) return;

        switch (gameState) {
            case GameState.MENU:
                this.setButtonEnabled(this._playPauseButton, true);
                this.setButtonEnabled(this._restartButton, false);
                this.setButtonText(this._playPauseButton, "开始");
                break;

            case GameState.DEPLOYMENT:
                this.setButtonEnabled(this._playPauseButton, true);
                this.setButtonEnabled(this._restartButton, true);
                this.setButtonText(this._playPauseButton, "开始");
                break;

            case GameState.BATTLE:
            case GameState.PLAYING:
                this.setButtonEnabled(this._playPauseButton, true);
                this.setButtonEnabled(this._restartButton, true);
                this.setButtonText(this._playPauseButton, "暂停");
                break;

            case GameState.RESTING:
                this.setButtonEnabled(this._playPauseButton, false);
                this.setButtonEnabled(this._restartButton, true);
                if (this._gameManager) {
                    this.setButtonText(this._playPauseButton, `休息${Math.ceil(this._gameManager.restTimer)}s`);
                }
                break;

            case GameState.PAUSED:
                this.setButtonEnabled(this._playPauseButton, true);
                this.setButtonEnabled(this._restartButton, true);
                this.setButtonText(this._playPauseButton, "继续");
                break;

            case GameState.GAME_OVER:
            case GameState.VICTORY:
                this.setButtonEnabled(this._playPauseButton, false);
                this.setButtonEnabled(this._restartButton, true);
                break;
        }
    }

    // 设置按钮启用状态
    private setButtonEnabled(buttonNode: Node, enabled: boolean): void {
        const button = buttonNode.getComponent(Button);
        const graphics = buttonNode.getComponent(Graphics);
        
        if (button) {
            button.interactable = enabled;
        }
        
        if (graphics) {
            const color = enabled ?
                new Color(70, 130, 180) : // 启用状态：钢蓝色
                new Color(100, 100, 100); // 禁用状态：灰色

            // 获取按钮实际尺寸进行重绘
            const transform = buttonNode.getComponent(UITransform);
            const size = transform ? transform.contentSize : { width: 100, height: 50 };
            this.drawButtonBackground(graphics, size.width, size.height, color);
        }

        // 设置文本透明度
        const labelNode = buttonNode.getChildByName("Label");
        if (labelNode) {
            const label = labelNode.getComponent(Label);
            if (label) {
                label.color = enabled ? 
                    new Color(255, 255, 255, 255) : 
                    new Color(255, 255, 255, 128); // 禁用时半透明
            }
        }
    }

    // 设置按钮文本
    private setButtonText(button: Node, text: string): void {
        const labelNode = button.getChildByName("Label");
        if (labelNode) {
            const label = labelNode.getComponent(Label);
            if (label) {
                label.string = text;
            }
        }
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
                this._gameManager.pauseGame();
                break;
            case GameState.PAUSED:
                this._gameManager.resumeGame();
                break;
        }
    }

    private onRestartButtonClicked(): void {
        console.log("重新开始按钮被点击");
        if (this._gameManager) {
            this._gameManager.restartGame();
        }
        if (this._waveManager) {
            this._waveManager.resetWaves();
        }
    }

    // 显示游戏结束信息
    public showGameOverMessage(isVictory: boolean): void {
        const messageNode = new Node("GameOverMessage");
        messageNode.parent = this.node;
        messageNode.setPosition(0, 0);

        // 消息背景 (适中大小)
        const messageBg = messageNode.addComponent(Graphics);
        messageBg.fillColor = new Color(0, 0, 0, 150);
        messageBg.rect(-300, -150, 600, 300);
        messageBg.fill();

        // 消息文本 (适中字体)
        const messageLabel = messageNode.addComponent(Label);
        messageLabel.string = isVictory ? "胜利！" : "游戏结束";
        messageLabel.fontSize = 48;
        messageLabel.color = isVictory ? new Color(0, 255, 0) : new Color(255, 0, 0);

        // 5秒后自动隐藏
        setTimeout(() => {
            if (messageNode && messageNode.isValid) {
                messageNode.destroy();
            }
        }, 5000);
    }
}
