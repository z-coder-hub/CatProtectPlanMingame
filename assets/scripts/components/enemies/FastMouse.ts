import { _decorator, Color, tween, Sprite } from 'cc';
import { EnemyCategory, EnemyConfig, EnemyType } from '../../types/GameTypes';
import { EffectHelper } from '../../utils/EffectHelper';
import { BaseMouse } from './BaseMouse';

const { ccclass } = _decorator;

@ccclass('FastMouse')
export class FastMouse extends BaseMouse {


    // 私有属性（基类已提供 _gameManager 和移动系统）

    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.FAST_MOUSE;

    // 实现BaseMouse的抽象方法 - 快速老鼠配置
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.FAST_MOUSE,
            name: "疾风鼠",
            category: EnemyCategory.FAST,
            health: 20,
            maxHealth: 20,
            moveSpeed: 160,
            goldReward: 5
        };
    }

    // 实现抽象方法：获取敌人图片路径
    protected getEnemyImagePath(): string {
        return "images/enemies/FastMouse";
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





    // 移除攻击特效方法

    // 重写受伤方法，添加受伤反馈
    protected onTakeDamage(damage: number): void {
        console.log(`快速老鼠受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);

        // 受伤闪烁效果
        this.playHurtEffect();
    }


    // 播放受伤效果
    private playHurtEffect(): void {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) return;

        // 受伤闪红效果
        sprite.color = new Color(255, 100, 100);

        // 200ms后恢复原色
        tween(this.node)
            .delay(0.2)
            .call(() => {
                if (sprite && this.node.isValid) {
                    sprite.color = Color.WHITE;
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
