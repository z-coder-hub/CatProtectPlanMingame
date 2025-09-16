import { _decorator, Color, tween } from 'cc';
import { EnemyCategory, EnemyConfig, EnemyType } from '../../types/GameTypes';
import { EffectHelper } from '../../utils/EffectHelper';
import { BaseMouse } from './BaseMouse';

const { ccclass } = _decorator;

@ccclass('FastMouse')
export class FastMouse extends BaseMouse {


    // 私有属性（基类已提供 _graphics 和移动系统）

    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.FAST_MOUSE;

    // 实现BaseMouse的抽象方法 - 快速老鼠配置
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.FAST_MOUSE,
            name: "快速老鼠",
            category: EnemyCategory.FAST,
            health: 20,
            maxHealth: 20,
            moveSpeed: 160,
            goldReward: 5
        };
    }

    // 实现BaseMouse的抽象方法
    protected initializeMouseVisuals(): void {
        this.drawFastMouseAppearance();
    }

    // 继承父类的onLoad和start方法，无需重写
    // 基类已经处理了所有必要的初始化工作


    // 重写基类移动行为初始化，使用快速老鼠的参数
    protected initializeMovementBehavior(): void {
        // 快速老鼠的移动参数配置：偏爱dash和zigzag
        const patterns: ('zigzag' | 'dash')[] = ['zigzag', 'dash', 'dash']; // 2/3概率冲刺
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];

        // 设置更激进的移动参数
        this._zigzagAmplitude = 15 + Math.random() * 20; // 15-35像素的大幅摆动
        this._segmentCount = 3 + Math.floor(Math.random() * 4); // 3-6段移动（更少分段，更快）

        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }

    // 绘制快速老鼠外观
    private drawFastMouseAppearance(): void {
        // 获取Graphics组件绘制外观
        this._graphics = this.getGraphicsComponent();
        if (!this._graphics) return;

        this._graphics.clear();

        // 绘制快速老鼠身体（亮绿色，表示速度）
        this._graphics.fillColor = new Color(50, 205, 50); // 亮绿色
        this._graphics.circle(0, 0, 12);
        this._graphics.fill();

        // 绘制轮廓
        this._graphics.strokeColor = new Color(34, 139, 34); // 深绿色轮廓
        this._graphics.lineWidth = 2;
        this._graphics.circle(0, 0, 12);
        this._graphics.stroke();

        // 绘制速度线条（表示快速移动）
        this._graphics.strokeColor = new Color(255, 255, 0); // 黄色速度线
        this._graphics.lineWidth = 2;
        // 左侧速度线
        this._graphics.moveTo(-8, -8);
        this._graphics.lineTo(-12, -12);
        this._graphics.moveTo(-8, 0);
        this._graphics.lineTo(-12, 0);
        this._graphics.moveTo(-8, 8);
        this._graphics.lineTo(-12, 12);
        // 右侧速度线
        this._graphics.moveTo(8, -8);
        this._graphics.lineTo(12, -12);
        this._graphics.moveTo(8, 0);
        this._graphics.lineTo(12, 0);
        this._graphics.moveTo(8, 8);
        this._graphics.lineTo(12, 12);
        this._graphics.stroke();

        // 绘制眼睛（红色，表示警觉）
        this._graphics.fillColor = new Color(255, 0, 0); // 红色眼睛
        this._graphics.circle(-4, -4, 2);
        this._graphics.fill();
        this._graphics.circle(4, -4, 2);
        this._graphics.fill();
    }




    // 移除攻击特效方法

    // 重写受伤方法，添加受伤反馈
    protected onTakeDamage(damage: number): void {
        console.log(`快速老鼠受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);

        // 受伤闪烁效果
        this.playHurtEffect();
    }


    // 播放受伤效果
    private playHurtEffect(): void {
        if (!this._graphics) return;

        // 使用DrawingHelper绘制受伤效果，但用红色高亮
        this._graphics.clear();
        this._graphics.fillColor = new Color(255, 100, 100); // 红色受伤效果
        this._graphics.circle(0, 0, 12);
        this._graphics.fill();

        // 200ms后恢复原色，使用Tween系统替代scheduleOnce
        tween(this.node)
            .delay(0.2)
            .call(() => {
                if (this._graphics && this.node.isValid) {
                    this.drawFastMouseAppearance();
                }
            })
            .start();
    }

    // 重写创建死亡特效方法，添加快速老鼠的特殊特效
    protected createDeathEffect(): void {
        if (this.node.parent) {
            EffectHelper.createDeathEffect(this.node.position, this.node.parent);
        }
    }
}
