import { _decorator, Color, Component, Graphics, Label, Node, UITransform } from 'cc';
import { GameManager } from '../../managers/GameManager';
import { UIHelper } from '../../utils/UIHelper';

const { ccclass } = _decorator;

@ccclass('Castle')
export class Castle extends Component {


    // 私有属性
    private _graphics: Graphics | null = null;
    private _gameManager: GameManager | null = null;
    private _healthLabel: Label | null = null;

    // 城堡尺寸 - 横跨屏幕的长条形
    private readonly _castleHeight: number = 48; // 自定义高度

    protected onLoad(): void {
        this.setupCastlePosition();
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


        // 注册到GameManager
        this._gameManager.castleNode = this.node;

        console.log("城堡初始化完成");
    }

    // 设置城堡位置 - 位于英雄面板上方，距离底部200像素
    private setupCastlePosition(): void {
        // 使用Widget全宽底部对齐，距离底部200像素（英雄面板144px + 间距）
        UIHelper.SetupBottomAlignWidget(this.node, this._castleHeight, 200);
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

        // 获取节点的实际宽度（由Widget设置）
        const transform = this.node.getComponent(UITransform);
        const castleWidth = transform ? transform.width : 720;

        // 绘制城堡主体（蓝色长条）
        this._graphics.fillColor = new Color(70, 130, 180); // 蓝色
        this._graphics.rect(
            -castleWidth / 2,
            -this._castleHeight / 2,
            castleWidth,
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
        this._healthLabel.fontSize = 22; // 18 * 1.2 = 21.6 ≈ 22
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
        const shakeAmount = 6; // 5 * 1.2 = 6，放大震动幅度
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
            // 使用Cocos Creator调度系统而不是setTimeout
            this.scheduleOnce(shake, 0.05);
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
            
            // 获取节点的实际宽度（由Widget设置）
            const transform = this.node.getComponent(UITransform);
            const castleWidth = transform ? transform.width : 720;
            
            this._graphics.fillColor = new Color(64, 64, 64); // 变成灰色废墟
            this._graphics.rect(
                -castleWidth / 2,
                -this._castleHeight / 2,
                castleWidth,
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
