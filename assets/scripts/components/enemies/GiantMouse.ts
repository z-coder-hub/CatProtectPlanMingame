import { _decorator, Color, Graphics } from 'cc';
import { EnemyCategory, EnemyConfig, EnemyType } from '../../types/GameTypes';
import { EffectHelper } from '../../utils/EffectHelper';
import { BaseMouse } from './BaseMouse';

const { ccclass, property } = _decorator;

@ccclass('GiantMouse')
export class GiantMouse extends BaseMouse {

    @property({ tooltip: "金币奖励", override: true })
    public goldReward: number = 8;

    // 私有属性（基类已提供 _graphics 和移动系统）

    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.GIANT_MOUSE;

    // 实现BaseMouse的抽象方法 - 巨型老鼠配置
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.GIANT_MOUSE,
            name: "巨型鼠",
            category: EnemyCategory.BASIC,
            health: 80,
            maxHealth: 80,
            moveSpeed: 80,
            goldReward: 8
        };
    }

    // 实现抽象方法：获取敌人图片路径
    protected getEnemyImagePath(): string | null {
        return "images/emeies/GiantMouse";
    }

    // 重写：初始化特殊外观（现在基类处理图片加载）
    protected initializeMouseVisuals(): void {
        // 基类已处理图片/Graphics显示，这里可以添加特殊效果
        // 无需额外的外观初始化
    }

    // 实现抽象方法：绘制Graphics外观（当图片不可用时的回退方案）
    protected drawEnemyGraphics(graphics: Graphics): void {
        graphics.clear();

        // 巨型老鼠 - 更大更威武的外观
        graphics.fillColor = new Color(100, 50, 25); // 深棕色
        graphics.circle(0, 0, 25); // 更大的身体
        graphics.fill();

        // 边框
        graphics.strokeColor = new Color(60, 30, 15);
        graphics.lineWidth = 2;
        graphics.circle(0, 0, 25);
        graphics.stroke();

        // 耳朵
        graphics.fillColor = new Color(80, 40, 20);
        graphics.circle(-15, 15, 8);
        graphics.fill();
        graphics.circle(15, 15, 8);
        graphics.fill();

        // 眼睛 - 凶恶的红眼
        graphics.fillColor = new Color(255, 0, 0);
        graphics.circle(-8, 8, 4);
        graphics.fill();
        graphics.circle(8, 8, 4);
        graphics.fill();

        // 獠牙
        graphics.fillColor = new Color(255, 255, 255);
        graphics.rect(-3, -8, 2, 8);
        graphics.fill();
        graphics.rect(1, -8, 2, 8);
        graphics.fill();

        // 尾巴
        graphics.strokeColor = new Color(100, 50, 25);
        graphics.lineWidth = 6;
        graphics.moveTo(20, -10);
        graphics.lineTo(35, -20);
        graphics.stroke();
    }

    private drawGiantMouseAppearance(): void {
        if (!this._graphics) return;

        this._graphics.clear();

        // 巨型老鼠 - 更大更威武的外观
        this._graphics.fillColor = new Color(100, 50, 25); // 深棕色
        this._graphics.circle(0, 0, 25); // 更大的身体
        this._graphics.fill();

        // 边框
        this._graphics.strokeColor = new Color(60, 30, 15);
        this._graphics.lineWidth = 2;
        this._graphics.circle(0, 0, 25);
        this._graphics.stroke();

        // 耳朵
        this._graphics.fillColor = new Color(80, 40, 20);
        this._graphics.circle(-15, 15, 8);
        this._graphics.fill();
        this._graphics.circle(15, 15, 8);
        this._graphics.fill();

        // 眼睛 - 凶恶的红眼
        this._graphics.fillColor = new Color(255, 0, 0);
        this._graphics.circle(-8, 8, 4);
        this._graphics.fill();
        this._graphics.circle(8, 8, 4);
        this._graphics.fill();

        // 獠牙
        this._graphics.fillColor = new Color(255, 255, 255);
        this._graphics.rect(-3, -8, 2, 8);
        this._graphics.fill();
        this._graphics.rect(1, -8, 2, 8);
        this._graphics.fill();

        // 尾巴
        this._graphics.strokeColor = new Color(100, 50, 25);
        this._graphics.lineWidth = 6;
        this._graphics.moveTo(20, -10);
        this._graphics.lineTo(35, -20);
        this._graphics.stroke();
    }

    // 重写基类移动行为初始化，使用巨型老鼠的参数
    protected initializeMovementBehavior(): void {
        // 巨型老鼠的移动参数配置：主要直线，偶尔zigzag
        const patterns: ('zigzag' | 'straight')[] = ['zigzag', 'zigzag', 'zigzag', 'straight']; // 3:1比例
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];

        // 设置笨重的移动参数
        this._zigzagAmplitude = 15 + Math.random() * 10; // 15-25像素（比基础老鼠小）
        this._segmentCount = 3 + Math.floor(Math.random() * 3); // 3-5段移动（更少分段）

        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }



    // 重写受伤方法，添加巨型老鼠的特殊反应
    public takeDamage(damage: number): void {
        super.takeDamage(damage);

        // 受伤时发出怒吼效果
        this.createRoarEffect();

        // 受伤时可能进入狂暴状态
        const originalMoveSpeed = this.getConfig().moveSpeed;
        if (this.currentHealth < this.maxHealth * 0.3 && this.moveSpeed === originalMoveSpeed) {
            this.enterBerserkMode();
        }
    }

    private createRoarEffect(): void {
        if (this.node.parent) {
            EffectHelper.createRoarEffect(this.node.position, this.node.parent);
        }
    }

    private enterBerserkMode(): void {
        console.log("巨型老鼠进入狂暴状态！");

        // 提升移动速度和攻击力
        this.moveSpeed *= 1.5;
        // 移除攻击力提升，巨型老鼠不再攻击

        // 变红色表示狂暴
        if (this._graphics) {
            this._graphics.clear();
            this._graphics.fillColor = new Color(150, 50, 50); // 深红色
            this._graphics.circle(0, 0, 25);
            this._graphics.fill();

            // 重绘其他部分...
            this.drawBerserkAppearance();
        }

        this.createBerserkEffect();
    }

    private drawBerserkAppearance(): void {
        if (!this._graphics) return;

        // 狂暴状态的外观 - 更加凶恶
        this._graphics.strokeColor = new Color(200, 0, 0);
        this._graphics.lineWidth = 3;
        this._graphics.circle(0, 0, 25);
        this._graphics.stroke();

        // 发光的红眼
        this._graphics.fillColor = new Color(255, 50, 50);
        this._graphics.circle(-8, 8, 5);
        this._graphics.fill();
        this._graphics.circle(8, 8, 5);
        this._graphics.fill();

        // 更大的獠牙
        this._graphics.fillColor = new Color(255, 255, 255);
        this._graphics.rect(-4, -10, 3, 10);
        this._graphics.fill();
        this._graphics.rect(1, -10, 3, 10);
        this._graphics.fill();
    }

    private createBerserkEffect(): void {
        if (this.node.parent) {
            EffectHelper.createBerserkEffect(this.node.position, this.node.parent);
        }
    }

    // 重写死亡处理，添加巨型老鼠特殊逻辑
    protected onDie(): void {
        console.log(`${this.unitName}被击败`);

        // 巨型老鼠死亡时有几率掉落额外金币
        if (Math.random() < 0.3) {
            this.dropBonusGold();
        }

        // 调用基类的死亡处理（包含注销、奖励、销毁等通用逻辑）
        super.onDie();
    }

    // 重写创建死亡特效方法
    protected createDeathEffect(): void {
        if (this.node.parent) {
            EffectHelper.createEnemyDeathEffect(this.node.position, this.node.parent);
        }

        // 变灰色表示死亡
        if (this._graphics) {
            this._graphics.fillColor = new Color(80, 80, 80);
            this.drawGiantMouseAppearance();
        }
    }

    private dropBonusGold(): void {
        if (this._gameManager) {
            const bonusGold = 2;
            this._gameManager.AddGold(bonusGold);
            console.log(`${this.unitName}掉落额外金币: ${bonusGold}`);

            // 创建金币掉落特效
            if (this.node.parent) {
                EffectHelper.createGoldDropEffect(this.node.position, this.node.parent);
            }
        }
    }

    // 基类已实现完整的移动管理，无需额外的startMoving方法

    // 获取敌人类型
    public getEnemyType(): EnemyType {
        return this.enemyType;
    }
}
