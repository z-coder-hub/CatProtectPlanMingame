import { _decorator, Color, Graphics } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyState } from '../../types/GameTypes';
import { ENEMY_CONFIGS } from '../../types/GameConstants';

const { ccclass, property } = _decorator;

/**
 * 坦克老鼠 - 装甲单位，极高血量和护甲，移动极慢
 * 特点：血量150，移速30，护甲值5（减少受到的伤害），奖励10金币
 */
@ccclass('TankMouse')
export class TankMouse extends BaseMouse {
    
    public readonly enemyType: EnemyType = EnemyType.TANK_MOUSE;
    
    // 私有属性
    private _graphics: Graphics | null = null;
    
    @property({ tooltip: "护甲值(减少受到的伤害)" })
    public armorValue: number = 5;
    
    protected initializeMouseStats(): void {
        const config = ENEMY_CONFIGS[this.enemyType];
        
        // 基础属性配置
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
        
        // 特殊属性：护甲值
        this.armorValue = config.armorValue || 5;
        
        console.log(`初始化${this.unitName}: 血量${this.maxHealth}, 移速${this.moveSpeed}, 护甲${this.armorValue}, 奖励${this.goldReward}金币`);
    }
    
    protected initializeMouseVisuals(): void {
        // 创建坦克老鼠外观 - 深灰色厚重外观
        this._graphics = this.node.addComponent(Graphics);
        
        this.drawTankMouseAppearance();
    }
    
    /**
     * 绘制坦克老鼠外观
     */
    private drawTankMouseAppearance(): void {
        if (!this._graphics) return;
        
        // 绘制坦克老鼠身体（厚重的矩形 + 装甲细节）
        this._graphics.fillColor = new Color(80, 80, 80, 255);      // 深灰色装甲
        this._graphics.strokeColor = new Color(50, 50, 50, 255);    // 更深的边框
        this._graphics.lineWidth = 3;
        
        // 主体 - 厚重的矩形
        this._graphics.roundRect(-18, -12, 36, 24, 4);
        this._graphics.fill();
        this._graphics.stroke();
        
        // 装甲板细节
        this._graphics.fillColor = new Color(100, 100, 100, 255);   // 稍亮的装甲细节
        this._graphics.roundRect(-14, -8, 28, 16, 2);
        this._graphics.fill();
        
        // 装甲纹理线条
        this._graphics.strokeColor = new Color(120, 120, 120, 255);
        this._graphics.lineWidth = 1;
        this._graphics.moveTo(-12, -6);
        this._graphics.lineTo(12, -6);
        this._graphics.moveTo(-12, 0);
        this._graphics.lineTo(12, 0);
        this._graphics.moveTo(-12, 6);
        this._graphics.lineTo(12, 6);
        this._graphics.stroke();
        
        // 眼睛 - 小而坚毅
        this._graphics.fillColor = new Color(255, 0, 0, 255);       // 红色眼睛
        this._graphics.circle(-6, 3, 2);
        this._graphics.fill();
        this._graphics.circle(6, 3, 2);
        this._graphics.fill();
        
        // 履带/脚部
        this._graphics.fillColor = new Color(60, 60, 60, 255);
        this._graphics.rect(-16, -16, 8, 4);
        this._graphics.fill();
        this._graphics.rect(8, -16, 8, 4);
        this._graphics.fill();
        
        console.log(`${this.unitName}外观创建完成`);
    }
    
    /**
     * 重写受到伤害方法，应用护甲减伤效果
     */
    public takeDamage(damage: number): void {
        if (!this.isAlive) return;
        
        // 护甲减伤：最终伤害 = 原始伤害 - 护甲值（最低为1）
        const actualDamage = Math.max(1, damage - this.armorValue);
        
        this.currentHealth = Math.max(0, this.currentHealth - actualDamage);
        this.onTakeDamage(actualDamage);
        
        if (this.currentHealth <= 0) {
            this.die();
        }
        
        console.log(`${this.unitName}护甲减伤: ${damage} → ${actualDamage} 实际伤害`);
    }
    
    /**
     * 获取坦克老鼠标签配置
     */
    protected getMouseLabelConfig() {
        return {
            text: "坦克老鼠",
            fontSize: 22,
            color: new Color(200, 200, 200),      // 灰色字体配合装甲主题
            yOffset: 35,
            size: { width: 70, height: 28 }      // 稍宽的标签
        };
    }
    
    /**
     * 重写受伤回调，显示护甲减伤信息
     */
    protected onTakeDamage(actualDamage: number): void {
        console.log(`${this.unitName}受到 ${actualDamage} 点实际伤害（护甲减伤${this.armorValue}），剩余血量: ${this.currentHealth}`);
        
        // 创建护甲防护特效（可选）
        this.createArmorEffect();
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
        
        this.scheduleOnce(() => {
            this.node.setScale(originalScale);
        }, 0.1);
    }
    
    /**
     * 创建死亡特效 - 重型单位的特殊死亡效果
     */
    protected createDeathEffect(): void {
        // 重型单位死亡震动效果
        const originalPos = this.node.position.clone();
        
        // 震动效果
        for (let i = 0; i < 3; i++) {
            this.scheduleOnce(() => {
                if (this.node && this.node.isValid) {
                    const offsetX = (Math.random() - 0.5) * 10;
                    const offsetY = (Math.random() - 0.5) * 10;
                    this.node.setPosition(originalPos.x + offsetX, originalPos.y + offsetY, originalPos.z);
                }
            }, i * 0.05);
        }
        
        console.log(`${this.unitName}死亡，装甲破碎！`);
    }
}