import { _decorator, Color, Component, Graphics, Label, Node } from 'cc';
import { GameManager } from '../../managers/GameManager';
import { GAME_CONSTANTS } from '../../types/GameConstants';

const { ccclass, property } = _decorator;

@ccclass('Castle')
export class Castle extends Component {


    // 私有属性
    private _graphics: Graphics | null = null;
    private _gameManager: GameManager | null = null;
    private _healthLabel: Label | null = null;

    // 城堡尺寸 - 横跨屏幕的长条形
    private readonly _castleWidth: number = 600;
    private readonly _castleHeight: number = 40;

    protected onLoad(): void {
        this.initializeCastleVisuals();
        this.createHealthLabel();
    }

    protected start(): void {
        // 获取GameManager引用
        this._gameManager = GameManager.instance;
        if (!this._gameManager) {
            console.error("未找到GameManager实例");
            return;
        }

        // 设置城堡位置
        this.node.setPosition(GAME_CONSTANTS.CASTLE_POSITION.x, GAME_CONSTANTS.CASTLE_POSITION.y);

        // 注册到GameManager
        this._gameManager.castleNode = this.node;

        console.log("城堡初始化完成");
    }

    // 初始化城堡外观
    private initializeCastleVisuals(): void {
        this._graphics = this.node.addComponent(Graphics);

        this.drawCastle();
    }

    // 绘制城堡 - 简单蓝色长条
    private drawCastle(): void {
        if (!this._graphics) return;

        this._graphics.clear();

        // 绘制城堡主体（蓝色长条）
        this._graphics.fillColor = new Color(70, 130, 180); // 蓝色
        this._graphics.rect(
            -this._castleWidth / 2,
            -this._castleHeight / 2,
            this._castleWidth,
            this._castleHeight
        );
        this._graphics.fill();
    }

    // 创建血量文本显示
    private createHealthLabel(): void {
        const labelNode = new Node("HealthLabel");
        labelNode.parent = this.node;
        labelNode.setPosition(0, 0); // 居中显示在城堡内部

        this._healthLabel = labelNode.addComponent(Label);
        this._healthLabel.string = "HP: 100/100";
        this._healthLabel.fontSize = 18;
        this._healthLabel.color = new Color(255, 255, 255); // 白色文字
    }

    // 更新血量文本
    private updateHealthDisplay(): void {
        if (!this._gameManager || !this._healthLabel) return;

        const currentHealth = this._gameManager.castleHealth;
        const maxHealth = 100;
        this._healthLabel.string = `HP: ${Math.ceil(currentHealth)}/${maxHealth}`;
    }






    // 城堡受到攻击时的震动效果
    public playDamageEffect(): void {
        if (!this.node) return;

        const originalPos = this.node.position.clone();
        const shakeAmount = 5;
        let shakeCount = 0;
        const maxShakes = 6;

        const shake = () => {
            if (shakeCount >= maxShakes) {
                this.node.setPosition(originalPos);
                return;
            }

            const offsetX = (Math.random() - 0.5) * shakeAmount;
            const offsetY = (Math.random() - 0.5) * shakeAmount;
            this.node.setPosition(
                originalPos.x + offsetX,
                originalPos.y + offsetY,
                originalPos.z
            );

            shakeCount++;
            setTimeout(shake, 50);
        };

        shake();
    }

    protected update(): void {
        // 更新血量文本显示
        if (this._gameManager) {
            this.updateHealthDisplay();
        }
    }

    // 城堡被摧毁时的特殊效果
    public onCastleDestroyed(): void {
        console.log("城堡被摧毁！");

        // 创建爆炸特效
        this.createExplosionEffect();

        // 改变外观为废墟
        if (this._graphics) {
            this._graphics.clear();
            this._graphics.fillColor = new Color(64, 64, 64); // 变成灰色废墟
            this._graphics.rect(
                -this._castleWidth / 2,
                -this._castleHeight / 2,
                this._castleWidth,
                this._castleHeight
            );
            this._graphics.fill();
        }
    }

    // 创建爆炸特效
    private createExplosionEffect(): void {
        console.log("城堡爆炸特效！");
        // 简化爆炸效果，只打印日志
    }
}
