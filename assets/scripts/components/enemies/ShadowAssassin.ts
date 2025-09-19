import { _decorator, Color, Graphics, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';

const { ccclass } = _decorator;

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
    protected getConfig(): EnemyConfig {
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

    protected onLoad(): void {
        super.onLoad();

        // 初始化潜影刺客特有属性
        const config = this.getConfig();
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

        const alpha = this.isStealthed ? 80 : 255;

        // 潜影刺客 - 暗黑色刺客形态
        graphics.fillColor = new Color(64, 0, 128, alpha); // 深紫色
        graphics.circle(0, 0, 16);
        graphics.fill();

        // 刺客面具
        graphics.fillColor = new Color(32, 0, 64, alpha);
        graphics.rect(-14, 10, 28, 8);
        graphics.fill();

        // 发光的暗影眼睛
        graphics.fillColor = new Color(128, 0, 255, alpha);
        graphics.circle(-6, 12, 2);
        graphics.fill();
        graphics.circle(6, 12, 2);
        graphics.fill();

        // 暗影刺刀
        graphics.strokeColor = new Color(200, 200, 200, alpha);
        graphics.lineWidth = 2;
        graphics.moveTo(-18, -5);
        graphics.lineTo(-25, -10);
        graphics.moveTo(18, -5);
        graphics.lineTo(25, -10);
        graphics.stroke();

        // 潜影波纹
        graphics.strokeColor = new Color(128, 0, 255, 60);
        graphics.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
            graphics.circle(0, 0, 16 + i * 6);
            graphics.stroke();
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
}