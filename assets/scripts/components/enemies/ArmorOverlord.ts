import { _decorator, Color, tween, Sprite } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';

const { ccclass } = _decorator;

/**
 * 重甲统领 - 超高护甲值BOSS
 * 特点：减伤80%，超高护甲和血量，但移动较慢
 */
@ccclass('ArmorOverlord')
export class ArmorOverlord extends BaseMouse {

    /** 护甲值 */
    private armorValue: number = 0;
    
    public readonly enemyType: EnemyType = EnemyType.ARMOR_OVERLORD;
    
    // 实现BaseMouse的抽象方法 - 重甲统领配置
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.ARMOR_OVERLORD,
            name: "重甲统领",
            category: EnemyCategory.BOSS,
            health: 400,
            maxHealth: 400,
            moveSpeed: 50,
            goldReward: 100,
            armorValue: 8
        };
    }

    protected onLoad(): void {
        // 先调用父类onLoad，再初始化特殊属性
        super.onLoad();

        const config = this.getConfig();
        this.armorValue = config.armorValue || 8;
    }

    // 重写基类移动行为初始化，使用重甲统领的参数
    protected initializeMovementBehavior(): void {
        // 重甲统领的移动参数配置：主要straight，稳定前进
        this._movementPattern = 'straight';

        // 设置稳重的移动参数
        this._zigzagAmplitude = 5 + Math.random() * 7; // 5-12像素（极小摆动）
        this._segmentCount = 2 + Math.floor(Math.random() * 3); // 2-4段移动（少分段，稳重）


        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }
    
    /**
     * 初始化重甲统领外观
     */
    // 实现抽象方法：获取敌人图片路径
    protected getEnemyImagePath(): string {
        return "images/emeies/ArmorOverlord";
    }

    // 重写：初始化特殊外观（现在基类处理图片加载）
    protected initializeMouseVisuals(): void {
        // 基类已处理图片/Graphics显示，这里可以添加特殊效果
        // 无需额外的外观初始化
    }


    
    /**
     * 护甲减伤处理
     */
    protected onTakeDamage(damage: number): void {
        // 护甲减伤计算
        const reducedDamage = Math.max(1, damage - this.armorValue);
        const actualDamage = damage - reducedDamage;

        // 显示护甲减伤效果
        if (actualDamage > 0) {
            console.log(`重甲统领护甲减伤: ${actualDamage}点伤害被护甲吸收`);
        }

        // 简化的受伤效果
        this.showArmorEffect();
    }
    
    /**
     * 显示护甲防护特效
     */
    private showArmorEffect(): void {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) return;

        // 护甲闪蓝效果
        sprite.color = new Color(100, 150, 255);

        // 0.3秒后恢复正常
        tween(this.node)
            .delay(0.3)
            .call(() => {
                if (sprite && this.node.isValid) {
                    sprite.color = Color.WHITE;
                }
            })
            .start();
    }
    
    
    /**
     * 重甲统领特殊死亡效果
     */
    protected onDie(): void {
        console.log("重甲统领被击败！装甲破碎！");

        // 简化的死亡效果
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(70, 70, 70, 150);
        }

        // 延迟销毁，展示破碎效果
        tween(this.node)
            .delay(0.5)
            .call(() => {
                if (this.node && this.node.isValid) {
                    super.onDie();
                }
            })
            .start();
    }

    /**
     * 对象池重用时的额外初始化
     * 重置重甲统领的护甲值
     */
    protected onReuse(): void {
        // 重新初始化护甲值
        const config = this.getConfig();
        this.armorValue = config.armorValue || 8;

        console.log(`[ArmorOverlord] 🔄 重用时重置护甲值: ${this.armorValue}`);
    }

}