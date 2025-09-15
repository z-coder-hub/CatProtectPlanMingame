import { _decorator, Color, tween } from 'cc';
import { EnemyCategory, EnemyConfig, EnemyType } from '../../types/GameTypes';
import { DrawingHelper } from '../../utils/DrawingHelper';
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
            name: "基础老鼠",
            category: EnemyCategory.BASIC,
            health: 25,
            maxHealth: 25,
            moveSpeed: 120,
            goldReward: 3
        };
    }

    // 实现抽象方法：初始化老鼠外观
    protected initializeMouseVisuals(): void {
        // 合并函数，消除不必要的中间层
        this._graphics = this.getGraphicsComponent();
        this.drawMouseAppearance();
    }

    // 基础老鼠使用基类默认移动参数，无需重写
    // 基类已提供相同的移动配置


    // 绘制老鼠外观
    private drawMouseAppearance(): void {
        if (!this._graphics) return;
        DrawingHelper.drawEnemyAppearance(this._graphics, 'basicMouse', 1.2);
    }


    protected update(dt: number): void {
        super.update(dt);
        // 基类Tween系统自动处理移动，无需额外处理
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
        console.log(`基础老鼠受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);

        // 受伤闪烁效果
        this.playHurtEffect();
    }


    // 播放受伤效果
    private playHurtEffect(): void {
        if (!this._graphics) return;

        // 使用DrawingHelper绘制受伤效果
        DrawingHelper.drawHurtEffect(this._graphics, 'basicMouse', 1.2);

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

        // 改变外观表示死亡
        if (this._graphics) {
            this._graphics.clear();
            this._graphics.fillColor = new Color(64, 64, 64); // 变暗
            DrawingHelper.drawEnemyAppearance(this._graphics, 'basicMouse', 1.2);
        }
    }

}
