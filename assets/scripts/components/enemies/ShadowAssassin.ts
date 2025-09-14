import { _decorator, Component, Color, Graphics, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';

const { ccclass, property } = _decorator;

/**
 * 潜影刺客 - 高潜行几率BOSS
 * 特点：60%潜行几率，30%减伤，高速移动的刺客型BOSS
 */
@ccclass('ShadowAssassin')
export class ShadowAssassin extends BaseMouse {

    /** 潜行几率 */
    private stealthChance: number = 0.6;
    
    public readonly enemyType: EnemyType = EnemyType.SHADOW_ASSASSIN;
    
    /** 减伤比例 */
    private damageReduction: number = 0.3;
    
    /** 是否处于潜行状态 */
    private isStealthed: boolean = false;
    
    /** 潜行状态切换计时器 */
    private stealthTimer: number = 0;
    
    // 实现BaseMouse的抽象方法 - 潜影刺客配置
    protected GetConfig(): EnemyConfig {
        return {
            type: EnemyType.SHADOW_ASSASSIN,
            name: "潜影刺客",
            category: EnemyCategory.BOSS,
            health: 300,
            maxHealth: 300,
            moveSpeed: 120,
            goldReward: 80,
            stealthChance: 0.6,
            damageReduction: 0.3
        };
    }

    /**
     * 初始化潜影刺客属性
     */
    protected initializeMouseStats(): void {
        const config = this.GetConfig();
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
        this.stealthChance = (config as any).stealthChance || 0.6;
        this.damageReduction = (config as any).damageReduction || 0.3;
        
        // 初始潜行状态判定
        this.checkStealthState();
    }

    // 重写基类移动行为初始化，使用潜影刺客的参数
    protected initializeMovementBehavior(): void {
        // 潜影刺客的移动参数配置：主要stealth_sway和dash，隐蔽移动
        const patterns: ('stealth_sway' | 'dash')[] = ['stealth_sway', 'stealth_sway', 'dash']; // 2:1比例
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)] as any;

        // 设置隐蔽移动参数
        this._zigzagAmplitude = 20 + Math.random() * 15; // 20-35像素（较大摆动）
        this._segmentCount = 4 + Math.floor(Math.random() * 5); // 4-8段移动（复杂路径）

        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }
    
    /**
     * 初始化潜影刺客外观
     */
    protected initializeMouseVisuals(): void {
        const graphics = this.getGraphicsComponent();
        
        if (this.isStealthed) {
            // 潜行状态 - 半透明紫黑色
            this.drawStealthedForm(graphics);
        } else {
            // 显现状态 - 深色刺客形态
            this.drawVisibleForm(graphics);
        }
    }
    
    /**
     * 绘制潜行状态外观
     */
    private drawStealthedForm(graphics: Graphics): void {
        graphics.fillColor = new Color(80, 40, 120, 100);     // 半透明紫色
        graphics.strokeColor = new Color(60, 20, 100, 120);   // 紫色边框
        graphics.lineWidth = 2;
        
        // 半透明身体轮廓
        graphics.circle(0, 0, 15);
        graphics.fill();
        graphics.stroke();
        
        // 暗影效果
        graphics.fillColor = new Color(40, 20, 60, 80);
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * 20;
            const y = Math.sin(angle) * 20;
            graphics.circle(x, y, 3);
            graphics.fill();
        }
    }
    
    /**
     * 绘制显现状态外观
     */
    private drawVisibleForm(graphics: Graphics): void {
        graphics.fillColor = new Color(50, 50, 50, 255);      // 深灰色身体
        graphics.strokeColor = new Color(30, 30, 30, 255);    // 黑色边框
        graphics.lineWidth = 2;
        
        // 刺客身体 - 流线型
        graphics.ellipse(0, 0, 16, 20);
        graphics.fill();
        graphics.stroke();
        
        // 刺客面具
        graphics.fillColor = new Color(20, 20, 20, 255);      // 黑色面具
        graphics.ellipse(0, -8, 12, 8);
        graphics.fill();
        
        // 红色眼睛
        graphics.fillColor = new Color(200, 50, 50, 255);
        graphics.circle(-4, -8, 2);
        graphics.fill();
        graphics.circle(4, -8, 2);
        graphics.fill();
        
        // 暗影刀刃（伸出的武器）
        graphics.strokeColor = new Color(150, 150, 150, 255);
        graphics.lineWidth = 3;
        graphics.moveTo(-20, -5);
        graphics.lineTo(-25, -8);
        graphics.stroke();
        graphics.moveTo(20, -5);
        graphics.lineTo(25, -8);
        graphics.stroke();
    }
    
    /**
     * 检查潜行状态
     */
    private checkStealthState(): void {
        this.isStealthed = Math.random() < this.stealthChance;
    }
    
    /**
     * 更新潜行状态
     */
    protected update(dt: number): void {
        super.update(dt);
        
        // 每2秒重新判定潜行状态
        this.stealthTimer += dt;
        if (this.stealthTimer >= 2.0) {
            this.stealthTimer = 0;
            const wasStealthed = this.isStealthed;
            this.checkStealthState();
            
            // 如果潜行状态发生变化，更新外观
            if (wasStealthed !== this.isStealthed) {
                const graphics = this.getGraphicsComponent();
                graphics.clear();
                if (this.isStealthed) {
                    this.drawStealthedForm(graphics);
                } else {
                    this.drawVisibleForm(graphics);
                }
                
                console.log(`潜影刺客${this.isStealthed ? '进入' : '脱离'}潜行状态`);
            }
        }
    }
    
    /**
     * 潜行和减伤处理
     */
    protected onTakeDamage(damage: number): void {
        if (this.isStealthed) {
            // 潜行状态受到攻击时有几率完全躲避
            if (Math.random() < 0.5) {
                console.log("潜影刺客完全躲避了攻击！");
                return;
            }
        }
        
        // 应用减伤
        const reducedDamage = damage * (1 - this.damageReduction);
        console.log(`潜影刺客减伤: ${damage - reducedDamage}点伤害被减免`);
        
        // 受到攻击后强制脱离潜行
        if (this.isStealthed) {
            this.isStealthed = false;
            const graphics = this.getGraphicsComponent();
            graphics.clear();
            this.drawVisibleForm(graphics);
        }
    }
    
    /**
     * 潜影刺客特殊死亡效果
     */
    protected onDie(): void {
        console.log("潜影刺客消失在阴影中...");
        
        // 阴影消散特效
        const graphics = this.getGraphicsComponent();
        graphics.clear();
        
        // 显示消散的暗影粒子
        graphics.fillColor = new Color(40, 20, 60, 150);
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5;
            const distance = 10 + (i * 5);
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            graphics.circle(x, y, 2);
            graphics.fill();
        }
        
        // 延迟销毁，展示消散效果
        tween(this.node)
            .delay(0.8)
            .call(() => {
                if (this.node && this.node.isValid) {
                    super.onDie();
                }
            })
            .start();
    }
    
    /**
     * 实现标签配置
     */
    protected getMouseLabelConfig(): {
        text: string;
        fontSize: number;
        color: Color;
        yOffset: number;
        size: { width: number; height: number };
    } {
        return {
            text: this.unitName,
            fontSize: 22,
            color: this.isStealthed ? new Color(150, 100, 200, 180) : new Color(200, 200, 200, 255),
            yOffset: 40,
            size: { width: 120, height: 30 }
        };
    }

    // 实现BaseMouse的抽象方法 - 血条配置
    protected getHealthBarConfig() {
        return {
            width: 100,
            height: 8,
            yOffset: 50,
            backgroundColor: new Color(60, 60, 60),
            foregroundColor: new Color(150, 100, 200), // 紫色前景配合潜影主题
            borderColor: new Color(255, 255, 255),
            borderWidth: 2
        };
    }
}