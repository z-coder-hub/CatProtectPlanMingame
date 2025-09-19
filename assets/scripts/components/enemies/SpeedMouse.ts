import { _decorator, Color, Sprite, tween } from 'cc';
import { EnemyCategory, EnemyConfig, EnemyType } from '../../types/GameTypes';
import { EffectHelper } from '../../utils/EffectHelper';
import { BaseMouse } from './BaseMouse';

const { ccclass, property } = _decorator;

@ccclass('SpeedMouse')
export class SpeedMouse extends BaseMouse {

    @property({ tooltip: "金币奖励", override: true })
    public goldReward: number = 5;


    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.SPEED_MOUSE;

    // 实现BaseMouse的抽象方法 - 疾速老鼠配置
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.SPEED_MOUSE,
            name: "闪电鼠",
            category: EnemyCategory.FAST,
            health: 15,
            maxHealth: 15,
            moveSpeed: 200,
            goldReward: 8
        };
    }

    // 实现抽象方法：获取敌人图片路径
    protected getEnemyImagePath(): string {
        return "images/emeies/SpeedMouse";
    }

    // 重写：初始化特殊外观（现在基类处理图片加载）
    protected initializeMouseVisuals(): void {
        // 基类已处理图片/Graphics显示，这里可以添加特殊效果
        // 无需额外的外观初始化
    }

    // 实现抽象方法：绘制Graphics外观（当图片不可用时的回退方案）

    // 痾速老鼠不再有攻击能力，移除 performAttack 方法

    // 继承父类的onLoad和start方法，无需重写
    // 基类已经处理了所有必要的初始化工作


    // 重写基类移动行为初始化，使用疾速老鼠的参数
    protected initializeMovementBehavior(): void {
        // 痾速老鼠的移动参数配置：主要dash和straight，极快冲刺
        const patterns: ('dash' | 'straight')[] = ['dash', 'dash', 'dash', 'straight']; // 3:1比例
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];

        // 设置极快移动参数
        this._zigzagAmplitude = 10 + Math.random() * 10; // 10-20像素（较小摆动）
        this._segmentCount = 2 + Math.floor(Math.random() * 3); // 2-4段移动（更少分段，更快）


        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }

    // 删除不必要的中间层函数initializeVisuals()

    /**
     * 通过Sprite颜色变化实现速度效果
     * @param isBoosted 是否加速状态
     */
    private updateSpeedAppearance(isBoosted: boolean = false): void {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) return;

        if (isBoosted) {
            // 加速时更亮的黄色
            sprite.color = new Color(255, 255, 150, 255);
        } else {
            // 正常时亮黄色
            sprite.color = new Color(200, 200, 50, 255);
        }
    }





    // 城堡碰撞检测由基类统一处理，无需重复实现

    // 重写受伤方法，疾速老鼠受伤时会加速
    public takeDamage(damage: number): void {
        super.takeDamage(damage);

        // 受伤时短暂加速
        this.temporarySpeedBoost();

        // 受伤闪烁效果
        this.createHurtEffect();
    }

    private temporarySpeedBoost(): void {
        const originalSpeed = this.moveSpeed;
        this.moveSpeed *= 1.3;

        console.log("疾速老鼠受伤后加速！");

        // 1秒后恢复正常速度，使用Tween系统替代scheduleOnce
        tween(this.node)
            .delay(1)
            .call(() => {
                this.moveSpeed = originalSpeed;
            })
            .start();

        // 加速视觉效果
        this.updateSpeedAppearance(true);

        // 1秒后恢复正常颜色
        tween(this.node)
            .delay(1)
            .call(() => {
                if (this.node && this.node.isValid) {
                    this.updateSpeedAppearance(false);
                }
            })
            .start();
    }

    private createHurtEffect(): void {
        if (this.node.parent) {
            EffectHelper.createEnemyHurtEffect(this.node.position, this.node.parent);
        }

        // 受伤时红色闪烁效果
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            const originalColor = sprite.color.clone();
            sprite.color = new Color(255, 100, 100, 255);

            tween(this.node)
                .delay(0.1)
                .call(() => {
                    if (this.node && this.node.isValid && sprite) {
                        sprite.color = originalColor;
                    }
                })
                .start();
        }
    }

    // 使用基类的onDie实现，无需重复实现金币奖励和清理逻辑
    // 基类已统一处理所有逻辑：金币奖励、注销、清理、销毁
    protected onDie(): void {
        console.log("疾速老鼠被击败");

        // 调用基类实现，它已统一处理所有必要逻辑
        super.onDie();
    }


    protected createDeathEffect(): void {
        if (this.node.parent) {
            EffectHelper.createEnemyDeathEffect(this.node.position, this.node.parent);
        }

        // 创建速度爆发效果
        if (this.node.parent) {
            EffectHelper.createSpeedBurstEffect(this.node.position, this.node.parent);
        }

        // 死亡时变灰色
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(80, 80, 80, 255);
        }
    }

    // 移动由基类自动启动，无需手动控制

    // 获取敌人类型
    public getEnemyType(): EnemyType {
        return this.enemyType;
    }

    protected onDestroy(): void {

    }
}
