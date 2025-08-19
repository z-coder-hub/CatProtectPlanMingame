import { _decorator, Button, Color, Component, Graphics, Label, Node, UITransform, view } from 'cc';
import { GameManager } from '../../managers/GameManager';
import { WaveManager } from '../../managers/WaveManager';
import { GridDeploymentSystem } from '../../systems/GridDeploymentSystem';
import { HeroFactory } from '../../systems/HeroFactory';
import { GameState, HeroType } from '../../types/GameTypes';
import { IHeroDeploymentHandler } from './HeroSelectionPanel';

const { ccclass } = _decorator;

@ccclass('GameHUD')
export class GameHUD extends Component implements IHeroDeploymentHandler {

    // UI组件引用 - 信息显示
    private _goldLabel: Label | null = null;
    private _waveLabel: Label | null = null;
    private _castleHealthLabel: Label | null = null;
    private _castleHealthBar: Graphics | null = null;
    private _playPauseButton: Node | null = null;
    private _restartButton: Node | null = null;


    // 管理器引用
    private _gameManager: GameManager | null = null;
    private _waveManager: WaveManager | null = null;
    private _gridSystem: GridDeploymentSystem | null = null;

    protected onLoad(): void {
        this.createCompleteInterface();
        console.log("GameHUD初始化完成 - 完整版本");
    }

    protected start(): void {
        // 获取管理器引用
        this._gameManager = GameManager.instance;
        this._waveManager = WaveManager.instance;
        this._gridSystem = GridDeploymentSystem.instance;

        if (!this._gameManager) {
            console.error("未找到GameManager实例");
        }
        if (!this._waveManager) {
            console.error("未找到WaveManager实例");
        }
        if (!this._gridSystem) {
            console.error("未找到GridDeploymentSystem实例");
        } else {
            // 建立与网格系统的连接
            this._gridSystem.setGameHUD(this);
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
        // topAreaNode的初始位置在屏幕顶部左边，下方50
        topAreaNode.setPosition(-view.getVisibleSize().width / 2, view.getVisibleSize().height / 2 - 50);

        // 顶部区域背景 - 根据topAreaNode的范围确定
        const topBg = topAreaNode.addComponent(Graphics);
        topBg.fillColor = new Color(30, 30, 30, 200);
        const screenWidth = view.getVisibleSize().width;
        topBg.rect(0, 0, screenWidth, 50);
        topBg.fill();

        // 创建信息面板
        this.createInfoPanel(topAreaNode);

        // 创建控制按钮
        this.createControlButtons(topAreaNode);
    }

    // 创建信息面板
    private createInfoPanel(parent: Node): void {
        const infoPanelNode = new Node("InfoPanel");
        infoPanelNode.parent = parent;
        //topArea到位置是在左上角，往下50个高度的位置，这样子就是在topArea的中间了
        infoPanelNode.setPosition(0, 25);


        // 金币显示
        this.createGoldDisplay(infoPanelNode, 40);

        // 波次显示
        this.createWaveDisplay(infoPanelNode, 200);

        // 城堡血量显示
        this.createCastleHealthDisplay(infoPanelNode, 350);
    }

    // 创建金币显示
    private createGoldDisplay(parent: Node, xPosition: number): void {
        const goldNode = new Node("GoldDisplay");
        goldNode.parent = parent;
        goldNode.setPosition(xPosition, 0);

        // 金币图标
        const goldIcon = goldNode.addComponent(Graphics);
        goldIcon.fillColor = new Color(255, 215, 0);
        goldIcon.circle(0, 0, 12);
        goldIcon.fill();
        goldIcon.strokeColor = new Color(255, 140, 0);
        goldIcon.lineWidth = 2;
        goldIcon.circle(0, 0, 12);
        goldIcon.stroke();

        // 金币文本
        const goldLabelNode = new Node("GoldLabel");
        goldLabelNode.parent = goldNode;
        goldLabelNode.setPosition(50, 0);

        const goldLabel = goldLabelNode.addComponent(Label);
        this._goldLabel = goldLabel;
        this._goldLabel.string = "100";
        this._goldLabel.fontSize = 24;
        this._goldLabel.color = new Color(255, 215, 0);
    }

    // 创建波次显示
    private createWaveDisplay(parent: Node, xPosition: number): void {
        const waveNode = new Node("WaveDisplay");
        waveNode.parent = parent;
        waveNode.setPosition(xPosition, 0);

        const waveLabel = waveNode.addComponent(Label);
        this._waveLabel = waveLabel;
        this._waveLabel.string = "第1/3波";
        this._waveLabel.fontSize = 22;
        this._waveLabel.color = new Color(255, 255, 255);
    }

    // 创建城堡血量显示
    private createCastleHealthDisplay(parent: Node, xPosition: number): void {
        const healthNode = new Node("CastleHealthDisplay");
        healthNode.parent = parent;
        healthNode.setPosition(xPosition, 0);

        // 血量条背景
        const healthBgNode = new Node("HealthBarBg");
        healthBgNode.parent = healthNode;
        const healthBg = healthBgNode.addComponent(Graphics);
        healthBg.fillColor = new Color(100, 100, 100);
        healthBg.rect(-50, -6, 100, 12);
        healthBg.fill();

        // 血量条前景
        const healthBarNode = new Node("HealthBar");
        healthBarNode.parent = healthNode;
        const healthBar = healthBarNode.addComponent(Graphics);
        this._castleHealthBar = healthBar;
        this._castleHealthBar.fillColor = new Color(255, 0, 0);
        this._castleHealthBar.rect(-50, -6, 100, 12);
        this._castleHealthBar.fill();

        // 血量文本
        const healthLabelNode = new Node("HealthLabel");
        healthLabelNode.parent = healthNode;
        healthLabelNode.setPosition(0, -20);

        const healthLabel = healthLabelNode.addComponent(Label);
        this._castleHealthLabel = healthLabel;
        this._castleHealthLabel.string = "城堡 100/100";
        this._castleHealthLabel.fontSize = 16;
        this._castleHealthLabel.color = new Color(255, 255, 255);
    }

    // 创建控制按钮
    private createControlButtons(parent: Node): void {
        const controlPanelNode = new Node("ControlPanel");
        controlPanelNode.parent = parent;
        const screenWidth = view.getVisibleSize().width;
        controlPanelNode.setPosition(screenWidth - 150, 25);

        // 计算按钮宽度和间距
        const buttonWidth = Math.max(80, screenWidth * 0.12);
        const buttonSpacing = Math.max(100, buttonWidth + 20); // 确保按钮间有足够间距

        // 开始/暂停按钮
        this._playPauseButton = this.createButton("开始", -buttonSpacing / 2, () => {
            this.onPlayPauseButtonClicked();
        });
        this._playPauseButton.parent = controlPanelNode;

        // 重启按钮
        this._restartButton = this.createButton("重启", buttonSpacing / 2, () => {
            this.onRestartButtonClicked();
        });
        this._restartButton.parent = controlPanelNode;
    }


    // ========== 英雄部署功能 ==========

    /**
     * 部署英雄到网格
     */
    public deployHeroToGrid(heroType: HeroType, gridRow: number, gridCol: number): boolean {
        console.log(`🚀 开始部署英雄: ${heroType} 到位置 (${gridRow}, ${gridCol})`);

        if (!this._gameManager || !this._gridSystem) {
            console.log("❌ 缺少必要的管理器引用");
            return false;
        }

        const heroCost = HeroFactory.getHeroCost(heroType);

        // 检查金币
        if (this._gameManager.getGameStats().gold < heroCost) {
            console.log("金币不足，无法部署英雄");
            return false;
        }

        // 检查网格位置
        if (!this._gridSystem.canDeployHero(gridRow, gridCol)) {
            console.log("网格位置不可用");
            return false;
        }

        // 创建英雄
        console.log(`🏭 创建英雄: ${heroType}`);
        const heroNode = HeroFactory.createHero(heroType, this._gridSystem.node);
        if (!heroNode) {
            console.log("❌ 英雄创建失败");
            return false;
        }
        console.log(`✅ 英雄创建成功: ${heroNode.name}`);

        // 部署到网格
        console.log(`🗺️ 部署英雄到网格位置 (${gridRow}, ${gridCol})`);
        const success = this._gridSystem.deployHero(heroNode, gridRow, gridCol);
        if (success) {
            // 扣除金币
            console.log(`💰 扣除金币: ${heroCost}`);
            this._gameManager.spendGold(heroCost);

            // 添加到已部署列表
            this._gameManager.addDeployedHero(heroNode);

            console.log(`✅ 成功部署 ${heroType}，消耗 ${heroCost} 金币`);
            return true;
        } else {
            // 部署失败，销毁英雄节点
            heroNode.destroy();
            console.log("❌ 英雄部署失败");
            return false;
        }
    }




    // 创建按钮
    private createButton(text: string, xPos: number, callback: () => void): Node {
        const buttonNode = new Node(`Button_${text}`);
        buttonNode.setPosition(xPos, 0);

        const screenWidth = view.getVisibleSize().width;
        const buttonWidth = Math.max(80, screenWidth * 0.12);
        const buttonHeight = Math.max(35, screenWidth * 0.05);
        const transform = buttonNode.addComponent(UITransform);
        transform.setContentSize(buttonWidth, buttonHeight);

        const button = buttonNode.addComponent(Button);

        const buttonBg = buttonNode.addComponent(Graphics);
        this.drawButtonBackground(buttonBg, buttonWidth, buttonHeight, new Color(70, 130, 180));

        button.target = buttonNode;

        const labelNode = new Node("Label");
        labelNode.parent = buttonNode;
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = Math.max(14, buttonHeight * 0.4);
        label.color = new Color(255, 255, 255);

        button.node.on(Button.EventType.CLICK, callback, this);

        return buttonNode;
    }

    // 绘制按钮背景
    private drawButtonBackground(graphics: Graphics, width: number, height: number, color: Color): void {
        graphics.clear();
        graphics.fillColor = color;
        graphics.rect(-width / 2, -height / 2, width, height);
        graphics.fill();

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

        const healthWidth = 100 * healthPercent;
        this._castleHealthBar.rect(-50, -6, healthWidth, 12);
        this._castleHealthBar.fill();
    }

    // 更新按钮状态
    private updateButtonStates(gameState: GameState): void {
        if (!this._playPauseButton || !this._restartButton) return;

        switch (gameState) {
            case GameState.MENU:
                this.setButtonText(this._playPauseButton, "开始");
                break;
            case GameState.DEPLOYMENT:
                this.setButtonText(this._playPauseButton, "战斗");
                break;
            case GameState.BATTLE:
            case GameState.PLAYING:
                this.setButtonText(this._playPauseButton, "暂停");
                break;
            case GameState.PAUSED:
                this.setButtonText(this._playPauseButton, "继续");
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

        const messageBg = messageNode.addComponent(Graphics);
        messageBg.fillColor = new Color(0, 0, 0, 180);
        messageBg.rect(-200, -100, 400, 200);
        messageBg.fill();

        const messageLabel = messageNode.addComponent(Label);
        messageLabel.string = isVictory ? "胜利！" : "失败！";
        messageLabel.fontSize = 48;
        messageLabel.color = isVictory ? new Color(0, 255, 0) : new Color(255, 0, 0);

        setTimeout(() => {
            if (messageNode && messageNode.isValid) {
                messageNode.destroy();
            }
        }, 5000);
    }

    // 公共接口方法
    public getSelectedHeroType(): HeroType | null {
        // 现在由 HeroSelectionPanel 独立管理，返回null
        return null;
    }

    protected onDestroy(): void {
        // 清理工作已委托给HeroSelectionPanel
    }
}
