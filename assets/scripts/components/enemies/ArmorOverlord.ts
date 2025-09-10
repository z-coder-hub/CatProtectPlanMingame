import { _decorator, Component, Color, Graphics } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyCategory } from '../../types/GameTypes';
import { ENEMY_CONFIGS } from '../../types/GameConstants';

const { ccclass, property } = _decorator;

/**
 * 重甲统领 - 超高护甲值BOSS
 * 特点：减伤80%，超高护甲和血量，但移动较慢
 */
@ccclass('ArmorOverlord')
export class ArmorOverlord extends BaseMouse {

    /** 护甲值 */
    private armorValue: number = 0;
    
    /**
     * 初始化重甲统领属性
     */
    protected initializeMouseStats(): void {
        const config = ENEMY_CONFIGS[EnemyType.ARMOR_OVERLORD];
        this.mouseType = EnemyType.ARMOR_OVERLORD;
        this.mouseCategory = EnemyCategory.BOSS;
        this.mouseName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
        this.armorValue = (config as any).armorValue || 8;
    }
    
    /**
     * 初始化重甲统领外观
     */
    protected initializeMouseVisuals(): void {
        const graphics = this.node.addComponent(Graphics);
        
        // 绘制重型装甲外观 - 深灰色的重型坦克
        graphics.fillColor = new Color(70, 70, 70, 255);    // 深灰色装甲
        graphics.strokeColor = new Color(50, 50, 50, 255);  // 边框
        graphics.lineWidth = 3;
        
        // 主体装甲 - 矩形坦克形状
        graphics.roundRect(-25, -20, 50, 40, 5);
        graphics.fill();
        graphics.stroke();
        
        // 装甲板装饰
        graphics.fillColor = new Color(90, 90, 90, 255);    // 浅灰色装甲板
        graphics.rect(-20, -15, 15, 8);
        graphics.fill();
        graphics.rect(5, -15, 15, 8);
        graphics.fill();
        graphics.rect(-20, 7, 15, 8);
        graphics.fill();
        graphics.rect(5, 7, 15, 8);
        graphics.fill();
        
        // 护甲光泽效果
        graphics.fillColor = new Color(120, 120, 120, 180);  // 半透明高光
        graphics.rect(-22, -17, 44, 3);
        graphics.fill();
        
        // 履带或重型腿部
        graphics.fillColor = new Color(40, 40, 40, 255);     // 黑色履带
        graphics.rect(-25, 20, 50, 8);
        graphics.fill();
        graphics.rect(-25, -28, 50, 8);
        graphics.fill();
        
        // 重甲统领标识 - 头顶装甲尖刺
        graphics.fillColor = new Color(100, 100, 100, 255);
        graphics.moveTo(0, -25);
        graphics.lineTo(-8, -35);
        graphics.lineTo(8, -35);
        graphics.close();
        graphics.fill();
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
        
        // 护甲光芒效果（被攻击时）
        this.showArmorEffect();
    }
    
    /**
     * 显示护甲防护特效
     */
    private showArmorEffect(): void {
        const graphics = this.node.getComponent(Graphics);
        if (!graphics) return;
        
        // 添加蓝色护甲光环效果
        graphics.strokeColor = new Color(100, 150, 255, 200);
        graphics.lineWidth = 4;
        graphics.circle(0, 0, 35);
        graphics.stroke();
        
        // 0.3秒后恢复正常
        this.scheduleOnce(() => {
            this.initializeMouseVisuals();
        }, 0.3);
    }
    
    /**
     * 重甲统领特殊死亡效果
     */
    protected onDie(): void {
        console.log("重甲统领被击败！装甲破碎！");
        
        // 护甲破碎特效
        const graphics = this.node.getComponent(Graphics);
        if (graphics) {
            graphics.clear();
            
            // 显示破碎装甲片
            graphics.fillColor = new Color(70, 70, 70, 150);
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                const x = Math.cos(angle) * 20;
                const y = Math.sin(angle) * 20;
                graphics.rect(x - 3, y - 3, 6, 6);
                graphics.fill();
            }
        }
        
        // 延迟销毁，展示破碎效果
        this.scheduleOnce(() => {
            this.node.destroy();
        }, 0.5);
    }
}