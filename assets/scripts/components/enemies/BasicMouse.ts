import { _decorator, Color, Sprite, tween } from 'cc';
import { EnemyCategory, EnemyConfig, EnemyType } from '../../types/GameTypes';
import { EffectHelper } from '../../utils/EffectHelper';
import { BaseMouse } from './BaseMouse';

const { ccclass } = _decorator;

@ccclass('BasicMouse')
export class BasicMouse extends BaseMouse {

    // 私有属性（基类已提供移动系统）

    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.BASIC_MOUSE;

    // 实现BaseMouse的抽象方法 - 基础老鼠配置
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.BASIC_MOUSE,
            name: "小老鼠",
            category: EnemyCategory.BASIC,
            health: 25,
            maxHealth: 25,
            moveSpeed: 120,
            goldReward: 3
        };
    }

    // 实现抽象方法：获取敌人图片路径
    protected getEnemyImagePath(): string {
        return "images/enemies/BasicMouse";
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
        console.log(`小老鼠受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);

        // 使用素材的受伤效果（如颜色闪烁）
        this.playHurtEffect();
    }

    // 播放受伤效果
    private playHurtEffect(): void {
        if (!this._sprite) return;

        // 使用颜色闪烁效果替代Graphics绘制
        const originalColor = this._sprite.color.clone();
        this._sprite.color = new Color(255, 100, 100, 255); // 红色闪烁

        // 200ms后恢复原色
        tween(this._sprite)
            .delay(0.2)
            .call(() => {
                if (this._sprite && this._sprite.isValid) {
                    this._sprite.color = originalColor;
                }
            })
            .start();
    }

    // 重写死亡特效方法
    protected createDeathEffect(): void {
        if (this.node.parent) {
            EffectHelper.createDeathEffect(this.node.position, this.node.parent);
        }

        // 使用颜色变暗效果表示死亡
        if (this._sprite) {
            this._sprite.color = new Color(64, 64, 64, 255); // 暗灰色死亡效果
        }
    }

}
