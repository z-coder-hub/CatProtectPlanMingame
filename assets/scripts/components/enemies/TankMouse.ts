import { _decorator, Color, Sprite, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';

const { ccclass, property } = _decorator;

/**
 * 坦克老鼠 - 装甲单位，极高血量和护甲，移动极慢
 * 特点：血量150，移速30，护甲值5（减少受到的伤害），奖励10金币
 */
@ccclass('TankMouse')
export class TankMouse extends BaseMouse {
    
    public readonly enemyType: EnemyType = EnemyType.TANK_MOUSE;

    // 私有属性

    @property({ tooltip: "护甲值(减少受到的伤害)" })
    public armorValue: number = 3;

    // 实现BaseMouse的抽象方法 - 坦克老鼠配置
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.TANK_MOUSE,
            name: "铁甲鼠",
            category: EnemyCategory.ARMORED,
            health: 120,
            maxHealth: 120,
            moveSpeed: 60,
            goldReward: 12,
            armorValue: 3
        };
    }

    // 重写基类移动行为初始化，使用坠克老鼠的参数
    protected initializeMovementBehavior(): void {
        // 坠克老鼠的移动参数配置：主要straight，极小摆动
        this._movementPattern = 'straight';

        // 设置极小的移动参数（最笨重的单位）
        this._zigzagAmplitude = 3 + Math.random() * 4; // 3-7像素（极小摆动）
        this._segmentCount = 2 + Math.floor(Math.random() * 2); // 2-3段移动（最少分段）


        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }
    
    // 实现抽象方法：获取敌人图片路径
    protected getEnemyImagePath(): string {
        return "images/enemies/TankMouse";
    }


    /**
     * 通过Sprite颜色变化实现装甲效果
     * @param showArmor 是否显示装甲效果
     */
    private updateArmorAppearance(showArmor: boolean = false): void {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) return;

        if (showArmor) {
            // 装甲效果时显示稍亮的灰色
            sprite.color = new Color(120, 120, 120, 255);
        } else {
            // 正常时深灰色装甲
            sprite.color = new Color(80, 80, 80, 255);
        }
    }
    
    /**
     * 重写受到伤害方法，应用护甲减伤效果
     */
    public takeDamage(damage: number): void {
        if (!this.isAlive) return;

        // 护甲减伤：最终伤害 = 原始伤害 - 护甲值（最低为1）
        const actualDamage = Math.max(1, damage - this.armorValue);

        this.currentHealth = Math.max(0, this.currentHealth - actualDamage);

        // 更新血条显示
        this.updateMouseHealthBarDisplay();

        this.onTakeDamage(actualDamage);

        if (this.currentHealth <= 0) {
            this.die();
        }

        console.log(`${this.unitName}护甲减伤: ${damage} → ${actualDamage} 实际伤害`);
    }
    
    /**
     * 获取坦克老鼠标签配置
     */
    
    /**
     * 重写受伤回调，显示护甲减伤信息
     */
    protected onTakeDamage(actualDamage: number): void {
        console.log(`${this.unitName}受到 ${actualDamage} 点实际伤害（护甲减伤${this.armorValue}），剩余血量: ${this.currentHealth}`);
        
        // 创建护甲防护特效（可选）
        this.createArmorEffect();

        // 显示装甲效果
        this.updateArmorAppearance(true);

        // 0.2秒后恢复正常颜色
        tween(this.node)
            .delay(0.2)
            .call(() => {
                if (this.node && this.node.isValid) {
                    this.updateArmorAppearance(false);
                }
            })
            .start();
    }
    
    /**
     * 创建护甲防护特效
     */
    private createArmorEffect(): void {
        // 简单的护甲特效 - 节点轻微闪烁
        // 子类可以实现更复杂的特效
        const originalScale = this.node.scale.clone();
        
        // 护甲特效：稍微缩放表示防护
        this.node.setScale(originalScale.x * 0.95, originalScale.y * 0.95, originalScale.z);
        
        // 使用Tween系统替代scheduleOnce
        tween(this.node)
            .delay(0.1)
            .call(() => {
                if (this.node && this.node.isValid) {
                    this.node.setScale(originalScale);
                }
            })
            .start();
    }
    
    /**
     * 创建死亡特效 - 重型单位的特殊死亡效果
     */
    protected createDeathEffect(): void {
        // 重型单位死亡震动效果
        const originalPos = this.node.position.clone();
        
        // 使用Tween系统创建震动效果
        for (let i = 0; i < 3; i++) {
            tween(this.node)
                .delay(i * 0.05)
                .call(() => {
                    if (this.node && this.node.isValid) {
                        const offsetX = (Math.random() - 0.5) * 10;
                        const offsetY = (Math.random() - 0.5) * 10;
                        this.node.setPosition(originalPos.x + offsetX, originalPos.y + offsetY, originalPos.z);
                    }
                })
                .start();
        }
        
        console.log(`${this.unitName}死亡，装甲破碎！`);
    }
}