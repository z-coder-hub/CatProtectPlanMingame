import { _decorator, Component, Node, Label, Graphics, Color, EventTouch, UITransform } from 'cc';
import { GameManager } from '../../managers/GameManager';
import { WaveManager } from '../../managers/WaveManager';
import { GameState } from '../../types/GameTypes';
import { UI_CONSTANTS } from '../../types/GameConstants';

const { ccclass, property } = _decorator;

@ccclass('GameHUD')
export class GameHUD extends Component {
    
    // UI组件引用
    private _goldLabel: Label | null = null;
    private _waveLabel: Label | null = null;
    private _castleHealthLabel: Label | null = null;
    private _startButton: Node | null = null;
    private _pauseButton: Node | null = null;
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
        // 创建顶部状态栏
        this.createTopStatusBar();
        
        // 创建控制按钮
        this.createControlButtons();
    }
    
    // 创建顶部状态栏
    private createTopStatusBar(): void {
        const statusBarNode = new Node("StatusBar");
        statusBarNode.parent = this.node;
        statusBarNode.setPosition(0, 580); // 屏幕顶部
        
        // 状态栏背景
        const statusBg = statusBarNode.addComponent(Graphics);
        statusBg.fillColor = new Color(50, 50, 50, 200);
        statusBg.rect(-360, -25, 720, 50);
        statusBg.fill();
        
        // 金币显示
        this.createGoldDisplay(statusBarNode);
        
        // 波次显示
        this.createWaveDisplay(statusBarNode);
        
        // 城堡血量显示
        this.createCastleHealthDisplay(statusBarNode);
    }
    
    // 创建金币显示
    private createGoldDisplay(parent: Node): void {
        const goldNode = new Node("GoldDisplay");
        goldNode.parent = parent;
        goldNode.setPosition(-250, 0);
        
        // 金币图标
        const goldIcon = goldNode.addComponent(Graphics);
        goldIcon.fillColor = new Color(255, 215, 0); // 金色
        goldIcon.circle(-20, 0, 8);
        goldIcon.fill();
        
        // 金币文本
        const goldLabelNode = new Node("GoldLabel");
        goldLabelNode.parent = goldNode;
        goldLabelNode.setPosition(0, 0);
        
        this._goldLabel = goldLabelNode.addComponent(Label);
        this._goldLabel.string = "0";
        this._goldLabel.fontSize = 20;
        this._goldLabel.color = new Color(255, 255, 255);
    }
    
    // 创建波次显示
    private createWaveDisplay(parent: Node): void {
        const waveNode = new Node("WaveDisplay");
        waveNode.parent = parent;
        waveNode.setPosition(0, 0);
        
        this._waveLabel = waveNode.addComponent(Label);
        this._waveLabel.string = "Wave 1/3";
        this._waveLabel.fontSize = 22;
        this._waveLabel.color = new Color(255, 255, 255);
    }
    
    // 创建城堡血量显示
    private createCastleHealthDisplay(parent: Node): void {
        const healthNode = new Node("HealthDisplay");
        healthNode.parent = parent;
        healthNode.setPosition(250, 0);
        
        // 城堡图标
        const castleIcon = healthNode.addComponent(Graphics);
        castleIcon.fillColor = new Color(70, 130, 180);
        castleIcon.rect(-25, -8, 16, 16);
        castleIcon.fill();
        
        // 血量文本
        const healthLabelNode = new Node("HealthLabel");
        healthLabelNode.parent = healthNode;
        healthLabelNode.setPosition(0, 0);
        
        this._castleHealthLabel = healthLabelNode.addComponent(Label);
        this._castleHealthLabel.string = "100/100";
        this._castleHealthLabel.fontSize = 18;
        this._castleHealthLabel.color = new Color(255, 255, 255);
    }
    
    // 创建控制按钮
    private createControlButtons(): void {
        const buttonContainer = new Node("ButtonContainer");
        buttonContainer.parent = this.node;
        buttonContainer.setPosition(0, -580); // 屏幕底部
        
        // 开始按钮
        this._startButton = this.createButton("开始游戏", -120, () => {
            this.onStartButtonClicked();
        });
        this._startButton.parent = buttonContainer;
        
        // 暂停/恢复按钮
        this._pauseButton = this.createButton("暂停", 0, () => {
            this.onPauseButtonClicked();
        });
        this._pauseButton.parent = buttonContainer;
        
        // 重新开始按钮
        this._restartButton = this.createButton("重新开始", 120, () => {
            this.onRestartButtonClicked();
        });
        this._restartButton.parent = buttonContainer;
    }
    
    // 创建按钮
    private createButton(text: string, xPos: number, callback: () => void): Node {
        const buttonNode = new Node(`Button_${text}`);
        buttonNode.setPosition(xPos, 0);
        
        // 设置按钮尺寸
        const transform = buttonNode.addComponent(UITransform);
        transform.setContentSize(UI_CONSTANTS.BUTTON_SIZE.width, UI_CONSTANTS.BUTTON_SIZE.height);
        
        // 按钮背景
        const buttonBg = buttonNode.addComponent(Graphics);
        buttonBg.fillColor = new Color(70, 130, 180); // 钢蓝色
        buttonBg.rect(
            -UI_CONSTANTS.BUTTON_SIZE.width / 2,
            -UI_CONSTANTS.BUTTON_SIZE.height / 2,
            UI_CONSTANTS.BUTTON_SIZE.width,
            UI_CONSTANTS.BUTTON_SIZE.height
        );
        buttonBg.fill();
        
        // 按钮边框
        buttonBg.strokeColor = new Color(255, 255, 255);
        buttonBg.lineWidth = 2;
        buttonBg.rect(
            -UI_CONSTANTS.BUTTON_SIZE.width / 2,
            -UI_CONSTANTS.BUTTON_SIZE.height / 2,
            UI_CONSTANTS.BUTTON_SIZE.width,
            UI_CONSTANTS.BUTTON_SIZE.height
        );
        buttonBg.stroke();
        
        // 按钮文本
        const labelNode = new Node("Label");
        labelNode.parent = buttonNode;
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 16;
        label.color = new Color(255, 255, 255);
        
        // 添加触摸事件
        buttonNode.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            this.playButtonPressEffect(buttonBg);
            callback();
        }, this);
        
        return buttonNode;
    }
    
    // 播放按钮按下效果
    private playButtonPressEffect(graphics: Graphics): void {
        // 临时变色表示按下
        graphics.clear();
        graphics.fillColor = new Color(100, 100, 100); // 按下时变灰
        graphics.rect(
            -UI_CONSTANTS.BUTTON_SIZE.width / 2,
            -UI_CONSTANTS.BUTTON_SIZE.height / 2,
            UI_CONSTANTS.BUTTON_SIZE.width,
            UI_CONSTANTS.BUTTON_SIZE.height
        );
        graphics.fill();
        
        // 200ms后恢复
        setTimeout(() => {
            graphics.clear();
            graphics.fillColor = new Color(70, 130, 180); // 恢复原色
            graphics.rect(
                -UI_CONSTANTS.BUTTON_SIZE.width / 2,
                -UI_CONSTANTS.BUTTON_SIZE.height / 2,
                UI_CONSTANTS.BUTTON_SIZE.width,
                UI_CONSTANTS.BUTTON_SIZE.height
            );
            graphics.fill();
        }, 200);
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
            this._waveLabel.string = `Wave ${waveStats.currentWave}/${waveStats.totalWaves}`;
        }
        
        // 更新城堡血量显示
        if (this._castleHealthLabel) {
            this._castleHealthLabel.string = `${Math.ceil(stats.castleHealth)}/100`;
            
            // 根据血量设置颜色
            if (stats.castleHealthPercent > 0.6) {
                this._castleHealthLabel.color = new Color(0, 255, 0);
            } else if (stats.castleHealthPercent > 0.3) {
                this._castleHealthLabel.color = new Color(255, 255, 0);
            } else {
                this._castleHealthLabel.color = new Color(255, 0, 0);
            }
        }
        
        // 更新按钮状态
        this.updateButtonStates(stats.gameState);
    }
    
    // 更新按钮状态
    private updateButtonStates(gameState: GameState): void {
        if (!this._startButton || !this._pauseButton || !this._restartButton) return;
        
        switch (gameState) {
            case GameState.MENU:
                this.setButtonEnabled(this._startButton, true);
                this.setButtonEnabled(this._pauseButton, false);
                this.setButtonEnabled(this._restartButton, false);
                this.setButtonText(this._startButton, "开始游戏");
                break;
                
            case GameState.DEPLOYMENT:
                this.setButtonEnabled(this._startButton, true);
                this.setButtonEnabled(this._pauseButton, false);
                this.setButtonEnabled(this._restartButton, true);
                this.setButtonText(this._startButton, "开始战斗");
                break;
                
            case GameState.BATTLE:
                this.setButtonEnabled(this._startButton, false);
                this.setButtonEnabled(this._pauseButton, true);
                this.setButtonEnabled(this._restartButton, true);
                this.setButtonText(this._startButton, "战斗中");
                this.setButtonText(this._pauseButton, "暂停");
                break;
                
            case GameState.RESTING:
                this.setButtonEnabled(this._startButton, false);
                this.setButtonEnabled(this._pauseButton, false);
                this.setButtonEnabled(this._restartButton, true);
                if (this._gameManager) {
                    this.setButtonText(this._startButton, `休息中 ${Math.ceil(this._gameManager.restTimer)}s`);
                }
                break;
                
            case GameState.PLAYING:
                this.setButtonEnabled(this._startButton, false);
                this.setButtonEnabled(this._pauseButton, true);
                this.setButtonEnabled(this._restartButton, true);
                this.setButtonText(this._pauseButton, "暂停");
                break;
                
            case GameState.PAUSED:
                this.setButtonEnabled(this._startButton, false);
                this.setButtonEnabled(this._pauseButton, true);
                this.setButtonEnabled(this._restartButton, true);
                this.setButtonText(this._pauseButton, "继续");
                break;
                
            case GameState.GAME_OVER:
            case GameState.VICTORY:
                this.setButtonEnabled(this._startButton, false);
                this.setButtonEnabled(this._pauseButton, false);
                this.setButtonEnabled(this._restartButton, true);
                break;
        }
    }
    
    // 设置按钮启用状态
    private setButtonEnabled(button: Node, enabled: boolean): void {
        const graphics = button.getComponent(Graphics);
        if (graphics) {
            const color = enabled ? 
                new Color(70, 130, 180) : // 启用状态：钢蓝色
                new Color(100, 100, 100); // 禁用状态：灰色
            
            graphics.clear();
            graphics.fillColor = color;
            graphics.rect(
                -UI_CONSTANTS.BUTTON_SIZE.width / 2,
                -UI_CONSTANTS.BUTTON_SIZE.height / 2,
                UI_CONSTANTS.BUTTON_SIZE.width,
                UI_CONSTANTS.BUTTON_SIZE.height
            );
            graphics.fill();
        }
        
        // 设置触摸响应
        if (enabled) {
            button.resumeSystemEvents(true);
        } else {
            button.pauseSystemEvents(true);
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
    private onStartButtonClicked(): void {
        console.log("开始按钮被点击");
        if (!this._gameManager) return;
        
        const gameState = this._gameManager.gameState;
        
        if (gameState === GameState.MENU) {
            this._gameManager.startGame();
        } else if (gameState === GameState.DEPLOYMENT) {
            this._gameManager.startBattle();
        }
    }
    
    private onPauseButtonClicked(): void {
        console.log("暂停按钮被点击");
        if (!this._gameManager) return;
        
        const gameState = this._gameManager.gameState;
        if (gameState === GameState.BATTLE || gameState === GameState.PLAYING) {
            this._gameManager.pauseGame();
        } else if (gameState === GameState.PAUSED) {
            this._gameManager.resumeGame();
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
        
        // 消息背景
        const messageBg = messageNode.addComponent(Graphics);
        messageBg.fillColor = new Color(0, 0, 0, 150);
        messageBg.rect(-200, -100, 400, 200);
        messageBg.fill();
        
        // 消息文本
        const messageLabel = messageNode.addComponent(Label);
        messageLabel.string = isVictory ? "胜利！" : "游戏结束";
        messageLabel.fontSize = 36;
        messageLabel.color = isVictory ? new Color(0, 255, 0) : new Color(255, 0, 0);
        
        // 5秒后自动隐藏
        setTimeout(() => {
            if (messageNode && messageNode.isValid) {
                messageNode.destroy();
            }
        }, 5000);
    }
}