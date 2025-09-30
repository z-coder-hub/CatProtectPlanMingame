import { _decorator, Color, Component, Graphics, Label, Node, tween, UITransform } from 'cc';
import { GameManager } from '../../managers/GameManager';
import { UIHelper } from '../../utils/UIHelper';
import { GAME_CONFIG } from '../../types/GameConstants';

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
        UIHelper.SetupBottomAlignWidget(this.node, this._castleHeight, 150);
    }

    // 初始化城堡外观
    private initializeCastleVisuals(): void {
        this._graphics = this.node.addComponent(Graphics);
        this.drawCastle();
    }

    // 绘制蓝色长城
    private drawCastle(): void {
        if (!this._graphics) return;

        this._graphics.clear();

        // 获取节点的实际宽度（由Widget设置）
        const transform = this.node.getComponent(UITransform);
        const castleWidth = transform ? transform.width : 720;

        // 城墙基座 - 深蓝色
        this._graphics.fillColor = new Color(50, 100, 150);
        this._graphics.rect(
            -castleWidth / 2,
            -this._castleHeight / 2,
            castleWidth,
            this._castleHeight * 0.6
        );
        this._graphics.fill();

        // 城墙垛口 - 浅蓝色
        this._graphics.fillColor = new Color(70, 130, 180);
        const battlmentCount = Math.floor(castleWidth / 30); // 每30像素一个垛口
        const battlmentWidth = castleWidth / battlmentCount;
        const battlmentHeight = this._castleHeight * 0.4;

        for (let i = 0; i < battlmentCount; i++) {
            // 交替绘制高低垛口，形成锯齿状
            if (i % 2 === 0) {
                const x = -castleWidth / 2 + i * battlmentWidth;
                this._graphics.rect(
                    x,
                    this._castleHeight * 0.1,
                    battlmentWidth,
                    battlmentHeight
                );
                this._graphics.fill();
            }
        }

        // 城门 - 暗蓝色
        const gateWidth = castleWidth * 0.08;
        const gateHeight = this._castleHeight * 0.5;
        this._graphics.fillColor = new Color(30, 60, 100);
        this._graphics.rect(
            -gateWidth / 2,
            -this._castleHeight / 2,
            gateWidth,
            gateHeight
        );
        this._graphics.fill();

        // 城墙边框 - 白色描边
        this._graphics.strokeColor = new Color(200, 220, 240);
        this._graphics.lineWidth = 2;
        this._graphics.rect(
            -castleWidth / 2,
            -this._castleHeight / 2,
            castleWidth,
            this._castleHeight
        );
        this._graphics.stroke();
    }

    // 创建血量文本显示
    private createHealthLabel(): void {
        const labelNode = new Node("HealthLabel");
        labelNode.parent = this.node;
        labelNode.setPosition(0, 0); // 居中显示在城堡内部

        this._healthLabel = labelNode.addComponent(Label);
        this._healthLabel.string = `HP: ${GAME_CONFIG.castleHealth}/${GAME_CONFIG.castleHealth}`;
        this._healthLabel.fontSize = 22; // 18 * 1.2 = 21.6 ≈ 22
        this._healthLabel.color = new Color(255, 255, 255); // 白色文字
    }

    // 更新血量文本
    private updateHealthDisplay(): void {
        if (!this._gameManager || !this._healthLabel) return;

        const currentHealth = this._gameManager.castleHealth;
        const maxHealth = GAME_CONFIG.castleHealth;
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
            // 使用Tween系统替代scheduleOnce
            tween(this.node)
                .delay(0.05)
                .call(shake)
                .start();
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

        // 改变城堡外观为灰色废墟效果
        if (this._graphics) {
            this._graphics.clear();

            // 获取节点的实际宽度（由Widget设置）
            const transform = this.node.getComponent(UITransform);
            const castleWidth = transform ? transform.width : 720;

            // 绘制废墟效果 - 灰色
            this._graphics.fillColor = new Color(64, 64, 64);
            this._graphics.rect(
                -castleWidth / 2,
                -this._castleHeight / 2,
                castleWidth,
                this._castleHeight
            );
            this._graphics.fill();
        }
    }

    // 恢复城堡正常外观（血量恢复时调用）
    public restoreCastleAppearance(): void {
        console.log("恢复城堡正常外观");
        this.drawCastle(); // 重新绘制正常的城堡外观
    }

    // 创建爆炸特效
    private createExplosionEffect(): void {
        console.log("城堡爆炸特效！");
        // 简化爆炸效果，只打印日志
    }
}
