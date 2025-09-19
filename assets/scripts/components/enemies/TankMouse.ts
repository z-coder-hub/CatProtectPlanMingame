import { _decorator, Color, Graphics, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyState, EnemyConfig, EnemyCategory } from '../../types/GameTypes';

const { ccclass, property } = _decorator;

/**
 * 坦克老鼠 - 装甲单位，极高血量和护甲，移动极慢
 * 特点：血量150，移速30，护甲值5（减少受到的伤害），奖励10金币
 */
@ccclass('TankMouse')
export class TankMouse extends BaseMouse {
    
    public readonly enemyType: EnemyType = EnemyType.TANK_MOUSE;

    // 私有属性（基类已提供 _graphics）

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
    protected getEnemyImagePath(): string | null {
        return "images/emeies/TankMouse";
    }

    // 重写：初始化特殊外观（现在基类处理图片加载）
    protected initializeMouseVisuals(): void {
        // 基类已处理图片/Graphics显示，这里可以添加特殊效果
        // 无需额外的外观初始化
    }

    // 实现抽象方法：绘制Graphics外观（当图片不可用时的回退方案）
    protected drawEnemyGraphics(graphics: Graphics): void {
        graphics.clear();

        // 坦克老鼠 - 深灰色厚重外观
        graphics.fillColor = new Color(70, 70, 70); // 深灰色
        graphics.roundRect(-20, -15, 40, 30, 5); // 矩形坦克身体
        graphics.fill();

        // 厚重边框
        graphics.strokeColor = new Color(40, 40, 40);
        graphics.lineWidth = 4;
        graphics.roundRect(-20, -15, 40, 30, 5);
        graphics.stroke();

        // 炮塔
        graphics.fillColor = new Color(80, 80, 80);
        graphics.circle(0, -5, 12);
        graphics.fill();
        graphics.stroke();

        // 炮管
        graphics.fillColor = new Color(60, 60, 60);
        graphics.rect(8, -8, 15, 6);
        graphics.fill();
        graphics.stroke();

        // 履带
        graphics.fillColor = new Color(50, 50, 50);
        graphics.rect(-22, 12, 44, 8);
        graphics.fill();
        graphics.stroke();

        // 履带轮
        for (let i = 0; i < 6; i++) {
            const x = -20 + (i * 8);
            graphics.fillColor = new Color(30, 30, 30);
            graphics.circle(x, 16, 3);
            graphics.fill();
        }

        // 装甲板纹理
        graphics.strokeColor = new Color(90, 90, 90);
        graphics.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const y = -10 + (i * 7);
            graphics.moveTo(-15, y);
            graphics.lineTo(15, y);
            graphics.stroke();
        }
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