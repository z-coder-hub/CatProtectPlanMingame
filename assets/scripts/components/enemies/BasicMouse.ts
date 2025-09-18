import { _decorator, Color, Graphics, tween } from 'cc';
import { EnemyCategory, EnemyConfig, EnemyType } from '../../types/GameTypes';
import { EffectHelper } from '../../utils/EffectHelper';
import { BaseMouse } from './BaseMouse';

const { ccclass } = _decorator;

@ccclass('BasicMouse')
export class BasicMouse extends BaseMouse {

    // 私有属性（基类已提供 _graphics 和移动系统）

    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.BASIC_MOUSE;

    // 实现BaseMouse的抽象方法 - 基础老鼠配置
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.BASIC_MOUSE,
            name: "基础鼠",
            category: EnemyCategory.BASIC,
            health: 25,
            maxHealth: 25,
            moveSpeed: 120,
            goldReward: 3
        };
    }

    // 实现抽象方法：获取敌人图片路径
    protected getEnemyImagePath(): string | null {
        return "images/emeies/BasicMouse";
    }

    // 重写：初始化特殊外观（现在基类处理图片加载）
    protected initializeMouseVisuals(): void {
        // 基类已处理图片/Graphics显示，这里可以添加特殊效果
        // 无需额外的外观初始化
    }

    // 实现抽象方法：绘制Graphics外观（当图片不可用时的回退方案）
    protected drawEnemyGraphics(graphics: Graphics): void {
        graphics.clear();

        // 基础老鼠 - 棕色圆形身体
        graphics.fillColor = new Color(139, 69, 19);
        graphics.circle(0, 0, 15);
        graphics.fill();

        // 边框
        graphics.strokeColor = new Color(101, 67, 33);
        graphics.lineWidth = 2;
        graphics.circle(0, 0, 15);
        graphics.stroke();

        // 耳朵
        graphics.fillColor = new Color(160, 82, 45);
        graphics.circle(-10, 10, 5);
        graphics.fill();
        graphics.circle(10, 10, 5);
        graphics.fill();

        // 眼睛
        graphics.fillColor = new Color(0, 0, 0);
        graphics.circle(-5, 5, 2);
        graphics.fill();
        graphics.circle(5, 5, 2);
        graphics.fill();

        // 尾巴
        graphics.strokeColor = new Color(139, 69, 19);
        graphics.lineWidth = 3;
        graphics.moveTo(12, -8);
        graphics.lineTo(20, -15);
        graphics.stroke();
    }

    // 基础老鼠使用基类默认移动参数，无需重写
    // 基类已提供相同的移动配置


    // 绘制老鼠外观
    private drawMouseAppearance(): void {
        if (!this._graphics) return;

        // 直接使用基类定义的drawEnemyGraphics方法
        this.drawEnemyGraphics(this._graphics);
    }



    // 基类已实现完整的Tween移动系统，无需重复实现

    // 重写城堡到达特效方法
    protected createCastleReachEffect(): void {
        if (this.node.parent) {
            EffectHelper.createAttackEffect(this.node.position, this.node.parent);
        }
    }

    // 重写受伤方法，添加受伤反馈
    protected onTakeDamage(damage: number): void {
        console.log(`基础鼠受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);

        // 受伤闪烁效果
        this.playHurtEffect();
    }


    // 播放受伤效果
    private playHurtEffect(): void {
        if (!this._graphics) return;

        // 直接绘制受伤效果 - 红色闪烁
        this._graphics.clear();

        // 基础老鼠 - 红色受伤外观
        this._graphics.fillColor = new Color(255, 100, 100); // 红色身体
        this._graphics.circle(0, 0, 15);
        this._graphics.fill();

        // 红色边框
        this._graphics.strokeColor = new Color(200, 50, 50);
        this._graphics.lineWidth = 2;
        this._graphics.circle(0, 0, 15);
        this._graphics.stroke();

        // 受伤的耳朵
        this._graphics.fillColor = new Color(255, 120, 120);
        this._graphics.circle(-10, 10, 5);
        this._graphics.fill();
        this._graphics.circle(10, 10, 5);
        this._graphics.fill();

        // 眼睛保持黑色
        this._graphics.fillColor = new Color(0, 0, 0);
        this._graphics.circle(-5, 5, 2);
        this._graphics.fill();
        this._graphics.circle(5, 5, 2);
        this._graphics.fill();

        // 尾巴
        this._graphics.strokeColor = new Color(255, 100, 100);
        this._graphics.lineWidth = 3;
        this._graphics.moveTo(12, -8);
        this._graphics.lineTo(20, -15);
        this._graphics.stroke();

        // 200ms后恢复原色
        tween(this.node)
            .delay(0.2)
            .call(() => {
                if (this._graphics && this.node.isValid) {
                    this.drawMouseAppearance();
                }
            })
            .start();
    }

    // 重写死亡特效方法
    protected createDeathEffect(): void {
        if (this.node.parent) {
            EffectHelper.createDeathEffect(this.node.position, this.node.parent);
        }

        // 改变外观表示死亡 - 变暗效果
        if (this._graphics) {
            this._graphics.clear();

            // 基础老鼠 - 暗灰色死亡外观
            this._graphics.fillColor = new Color(64, 64, 64); // 暗灰色身体
            this._graphics.circle(0, 0, 15);
            this._graphics.fill();

            // 暗灰色边框
            this._graphics.strokeColor = new Color(40, 40, 40);
            this._graphics.lineWidth = 2;
            this._graphics.circle(0, 0, 15);
            this._graphics.stroke();

            // 暗灰色耳朵
            this._graphics.fillColor = new Color(80, 80, 80);
            this._graphics.circle(-10, 10, 5);
            this._graphics.fill();
            this._graphics.circle(10, 10, 5);
            this._graphics.fill();

            // 暗灰色眼睛（死亡状态）
            this._graphics.fillColor = new Color(20, 20, 20);
            this._graphics.circle(-5, 5, 2);
            this._graphics.fill();
            this._graphics.circle(5, 5, 2);
            this._graphics.fill();

            // 暗灰色尾巴
            this._graphics.strokeColor = new Color(64, 64, 64);
            this._graphics.lineWidth = 3;
            this._graphics.moveTo(12, -8);
            this._graphics.lineTo(20, -15);
            this._graphics.stroke();
        }
    }

}
