import { _decorator, Color, Graphics, tween } from 'cc';
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
    protected getEnemyImagePath(): string | null {
        return null; // 使用Graphics回退绘制
    }

    // 重写：初始化特殊外观（现在基类处理图片加载）
    protected initializeMouseVisuals(): void {
        // 基类已处理图片/Graphics显示，这里可以添加特殊效果
        // 无需额外的外观初始化
    }

    // 实现抽象方法：绘制Graphics外观（没有图片资源，使用Graphics绘制）
    protected drawEnemyGraphics(graphics: Graphics): void {
        graphics.clear();

        // 重甲统领 - 深灰色的重型坦克
        graphics.fillColor = new Color(70, 70, 70);    // 深灰色装甲
        graphics.strokeColor = new Color(50, 50, 50);  // 边框
        graphics.lineWidth = 4;

        // 主装甲体
        graphics.roundRect(-25, -20, 50, 40, 8);
        graphics.fill();
        graphics.stroke();

        // 重型头盔
        graphics.fillColor = new Color(60, 60, 60);
        graphics.circle(0, 15, 15);
        graphics.fill();
        graphics.stroke();

        // 装甲刺
        const spikes = [
            { x: -20, y: -15 }, { x: 0, y: -25 }, { x: 20, y: -15 },
            { x: -15, y: 0 }, { x: 15, y: 0 }
        ];
        graphics.fillColor = new Color(90, 90, 90);
        for (const spike of spikes) {
            graphics.moveTo(spike.x, spike.y);
            graphics.lineTo(spike.x - 3, spike.y - 8);
            graphics.lineTo(spike.x + 3, spike.y - 8);
            graphics.close();
            graphics.fill();
        }

        // 红色威慑眼光
        graphics.fillColor = new Color(255, 50, 50);
        graphics.rect(-10, 12, 8, 3);
        graphics.fill();
        graphics.rect(2, 12, 8, 3);
        graphics.fill();
    }

    private initializeArmorOverlordVisuals(): void {
        const graphics = this.getGraphicsComponent();
        
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
        const graphics = this.getGraphicsComponent();
        if (!graphics) return;
        
        // 添加蓝色护甲光环效果
        graphics.strokeColor = new Color(100, 150, 255, 200);
        graphics.lineWidth = 4;
        graphics.circle(0, 0, 35);
        graphics.stroke();
        
        // 0.3秒后恢复正常
        tween(this.node)
            .delay(0.3)
            .call(() => {
                if (this.node && this.node.isValid) {
                    this.redrawMouseVisuals();
                }
            })
            .start();
    }
    
    /**
     * 重新绘制外观（不重复添加Graphics组件）
     */
    private redrawMouseVisuals(): void {
        const graphics = this.getGraphicsComponent();
        if (!graphics) return;
        
        // 清理现有绘制
        graphics.clear();
        
        // 重新绘制重型装甲外观 - 深灰色的重型坦克
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
     * 重甲统领特殊死亡效果
     */
    protected onDie(): void {
        console.log("重甲统领被击败！装甲破碎！");
        
        // 护甲破碎特效
        const graphics = this.getGraphicsComponent();
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
        tween(this.node)
            .delay(0.5)
            .call(() => {
                if (this.node && this.node.isValid) {
                    super.onDie();
                }
            })
            .start();
    }
    
}