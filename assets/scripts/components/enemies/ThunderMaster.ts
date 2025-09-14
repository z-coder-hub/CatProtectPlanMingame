import { _decorator, Component, Color, Graphics, Vec3, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';
import { GameManager } from '../../managers/GameManager';

const { ccclass, property } = _decorator;

/**
 * 雷电大师 - 链式雷电攻击BOSS
 * 特点：链式雷电攻击，电流场护盾，雷电特效
 */
@ccclass('ThunderMaster')
export class ThunderMaster extends BaseMouse {

    /** 敌人类型 */
    public readonly enemyType: EnemyType = EnemyType.THUNDER_MASTER;

    /** 护盾强度 */
    private shieldStrength: number = 100;

    /** 当前护盾值 */
    private currentShield: number = 100;

    /** 电磁干扰冷却时间 */
    private interferenceeCooldown: number = 0;

    /** 雷电特效计时器 */
    private lightningEffectTimer: number = 0;
    
    /**
     * 初始化雷电大师属性
     */
    protected initializeMouseStats(): void {
        const config = this.GetConfig();
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
        this.shieldStrength = config.shieldStrength || 100;
        this.currentShield = this.shieldStrength;
    }

    /**
     * 获取雷电大师配置
     */
    protected GetConfig(): EnemyConfig {
        return {
            type: EnemyType.THUNDER_MASTER,
            name: "雷电大师",
            category: EnemyCategory.BOSS,
            health: 350,
            maxHealth: 350,
            moveSpeed: 80,
            goldReward: 110,
            chainTargets: 3,
            shieldStrength: 100
        };
    }

    /**
     * 初始化雷电大师移动行为 - 电光高频移动
     * 特点：使用zigzag和dash模式，体现雷电的高频闪现特性
     */
    protected initializeMovementBehavior(): void {
        // 雷电大师的移动模式 - Z字形和冲刺混合
        const patterns: ('zigzag' | 'dash')[] = ['zigzag', 'dash'];
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];

        // 中等幅度的电光闪现摆动 - 体现雷电的不可预测性
        this._zigzagAmplitude = 35 + Math.random() * 25; // 35-60像素的中幅摆动
        this._segmentCount = 10 + Math.floor(Math.random() * 6); // 10-15段移动，高频闪现效果

        console.log(`雷电大师移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }
    
    /**
     * 初始化雷电大师外观
     */
    protected initializeMouseVisuals(): void {
        const graphics = this.getGraphicsComponent();
        this.drawBasicVisuals(graphics);
    }
    
    /**
     * 绘制基础外观（不重新获取Graphics组件）
     */
    private drawBasicVisuals(graphics: Graphics): void {
        // 雷电色彩 - 紫蓝电光色
        graphics.fillColor = new Color(100, 100, 200, 255);   // 紫蓝色身体
        graphics.strokeColor = new Color(70, 70, 170, 255);   // 深紫蓝边框
        graphics.lineWidth = 3;
        
        // 法师身体 - 三角锥形
        graphics.moveTo(0, -25);
        graphics.lineTo(-15, 15);
        graphics.lineTo(15, 15);
        graphics.close();
        graphics.fill();
        graphics.stroke();
        
        // 雷电法师头部
        graphics.fillColor = new Color(120, 120, 220, 255);
        graphics.circle(0, -15, 10);
        graphics.fill();
        graphics.stroke();
        
        // 电光眼睛
        graphics.fillColor = new Color(255, 255, 100, 255);   // 亮黄色电光眼
        graphics.circle(-4, -15, 3);
        graphics.fill();
        graphics.circle(4, -15, 3);
        graphics.fill();
        
        // 雷电法杖
        graphics.strokeColor = new Color(200, 200, 250, 255);
        graphics.lineWidth = 4;
        graphics.moveTo(-18, 5);
        graphics.lineTo(-25, -10);
        graphics.stroke();
        
        // 法杖顶端的雷电球
        graphics.fillColor = new Color(255, 255, 150, 255);
        graphics.circle(-25, -10, 5);
        graphics.fill();
        
        // 电流护盾
        this.drawShield(graphics);
        
        // 身体电弧
        this.drawLightningArcs(graphics);
    }
    
    /**
     * 绘制电流护盾
     */
    private drawShield(graphics: Graphics): void {
        if (this.currentShield <= 0) return;
        
        const shieldAlpha = Math.floor((this.currentShield / this.shieldStrength) * 150);
        graphics.strokeColor = new Color(150, 200, 255, shieldAlpha);
        graphics.lineWidth = 3;
        graphics.circle(0, 0, 30);
        graphics.stroke();
        
        // 护盾电弧装饰
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * 28;
            const y = Math.sin(angle) * 28;
            graphics.strokeColor = new Color(200, 220, 255, shieldAlpha);
            graphics.lineWidth = 2;
            graphics.moveTo(x, y);
            graphics.lineTo(x * 1.2, y * 1.2);
            graphics.stroke();
        }
    }
    
    /**
     * 绘制雷电弧
     */
    private drawLightningArcs(graphics: Graphics): void {
        graphics.strokeColor = new Color(255, 255, 200, 200);
        graphics.lineWidth = 2;
        
        // 身体周围的电弧
        for (let i = 0; i < 4; i++) {
            const startAngle = (i * Math.PI) / 2;
            const endAngle = startAngle + Math.PI / 4;
            const startX = Math.cos(startAngle) * 12;
            const startY = Math.sin(startAngle) * 12;
            const endX = Math.cos(endAngle) * 20;
            const endY = Math.sin(endAngle) * 20;
            
            graphics.moveTo(startX, startY);
            graphics.lineTo(endX, endY);
            graphics.stroke();
        }
    }
    
    /**
     * 更新雷电特效和电磁干扰逻辑
     */
    protected update(dt: number): void {
        super.update(dt);

        // 更新雷电特效
        this.lightningEffectTimer += dt;
        if (this.lightningEffectTimer >= 0.4) {
            this.lightningEffectTimer = 0;
            this.updateLightningEffect();
        }

        // 电磁干扰冷却
        this.interferenceeCooldown -= dt;
        if (this.interferenceeCooldown <= 0) {
            try {
                const gameManager = GameManager.instance;
                if (gameManager && gameManager.deployedHeroes && gameManager.deployedHeroes.length > 0) {
                    this.performElectromagneticInterference();
                }
            } catch (error) {
                console.error("雷电大师电磁干扰时出错:", error);
            }
            this.interferenceeCooldown = 6.0; // 6秒一次电磁干扰
        }
    }
    
    /**
     * 更新雷电特效（减少Graphics组件重复访问）
     */
    private updateLightningEffect(): void {
        if (!this._graphics) {
            this._graphics = this.getGraphicsComponent();
        }
        if (!this._graphics) return;
        
        // 重绘基础外观
        this._graphics.clear();
        this.drawBasicVisuals(this._graphics);
        
        // 添加随机雷电闪烁
        this._graphics.strokeColor = new Color(255, 255, 100, Math.random() * 100 + 100);
        this._graphics.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const startX = (Math.random() - 0.5) * 30;
            const startY = (Math.random() - 0.5) * 30;
            const endX = (Math.random() - 0.5) * 40;
            const endY = (Math.random() - 0.5) * 40;
            this._graphics.moveTo(startX, startY);
            this._graphics.lineTo(endX, endY);
            this._graphics.stroke();
        }
    }
    
    /**
     * 执行电磁干扰效果
     */
    private performElectromagneticInterference(): void {
        const gameManager = GameManager.instance;

        try {
            if (!gameManager || !gameManager.deployedHeroes || gameManager.deployedHeroes.length === 0) {
                return;
            }

            console.log("雷电大师释放电磁干扰场！");

            // 选择范围内的英雄展示干扰特效（不造成伤害）
            const interferenceTargets = this.findInterferenceTargets();
            if (interferenceTargets.length > 0) {
                this.showElectromagneticInterferenceEffect(interferenceTargets);
            }

        } catch (error) {
            console.error("雷电大师: 电磁干扰执行出错:", error);
        }
    }
    
    /**
     * 找到干扰范围内的英雄
     */
    private findInterferenceTargets(): any[] {
        const gameManager = GameManager.instance;
        if (!gameManager || !gameManager.deployedHeroes) return [];

        const targets: any[] = [];
        const interferenceRange = 120;

        gameManager.deployedHeroes.forEach(heroNode => {
            if (!heroNode) return;
            const distance = Vec3.distance(this.node.position, heroNode.position);
            if (distance <= interferenceRange) {
                targets.push(heroNode);
            }
        });

        return targets;
    }
    
    /**
     * 显示电磁干扰特效
     */
    private showElectromagneticInterferenceEffect(targets: any[]): void {
        if (!this._graphics) {
            this._graphics = this.getGraphicsComponent();
        }
        if (!this._graphics) return;

        console.log(`雷电大师对${targets.length}个英雄展示电磁干扰特效`);

        // 电磁干扰场
        this._graphics.strokeColor = new Color(150, 200, 255, 200);
        this._graphics.lineWidth = 3;
        this._graphics.circle(0, 0, 120); // 干扰范围
        this._graphics.stroke();

        // 对每个目标显示干扰特效
        targets.forEach(target => {
            if (target) {
                const targetPos = target.position.subtract(this.node.position);

                // 电磁波线
                this._graphics.strokeColor = new Color(180, 220, 255, 150);
                this._graphics.lineWidth = 2;
                this._graphics.moveTo(0, 0);
                this._graphics.lineTo(targetPos.x, targetPos.y);
                this._graphics.stroke();

                // 干扰环效果
                this._graphics.strokeColor = new Color(120, 180, 255, 120);
                this._graphics.lineWidth = 2;
                this._graphics.circle(targetPos.x, targetPos.y, 15);
                this._graphics.stroke();

                const heroComponent = target.getComponent(BaseHero);
                if (heroComponent) {
                    console.log(`英雄${heroComponent.unitName}受到电磁干扰效果影响`);
                }
            }
        });

        // 2.5秒后恢复正常外观
        tween(this.node)
            .delay(2.5)
            .call(() => {
                if (this.node && this.node.isValid) {
                    if (this._graphics) {
                        this._graphics.clear();
                        this.drawBasicVisuals(this._graphics);
                    }
                }
            })
            .start();
    }
    
    /**
     * 护盾受伤处理
     */
    protected onTakeDamage(damage: number): void {
        if (this.currentShield > 0) {
            // 护盾吸收伤害
            const shieldDamage = Math.min(this.currentShield, damage);
            this.currentShield = Math.max(0, this.currentShield - shieldDamage);
            const remainingDamage = damage - shieldDamage;
            
            console.log(`雷电大师护盾吸收${shieldDamage}点伤害，剩余护盾${this.currentShield}`);
            
            if (remainingDamage > 0) {
                console.log(`护盾被击破，受到${remainingDamage}点实际伤害`);
            }
            
            // 护盾特效
            this.showShieldHitEffect();
        } else {
            console.log("雷电大师护盾已破，受到满额伤害！");
        }
    }
    
    /**
     * 显示护盾受击特效（减少Graphics组件重复访问）
     */
    private showShieldHitEffect(): void {
        if (!this._graphics) {
            this._graphics = this.getGraphicsComponent();
        }
        if (!this._graphics) return;
        
        // 护盾电弧爆发
        this._graphics.strokeColor = new Color(255, 255, 255, 255);
        this._graphics.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const startX = Math.cos(angle) * 25;
            const startY = Math.sin(angle) * 25;
            const endX = Math.cos(angle) * 40;
            const endY = Math.sin(angle) * 40;
            this._graphics.moveTo(startX, startY);
            this._graphics.lineTo(endX, endY);
            this._graphics.stroke();
        }
    }
    
    /**
     * 获取老鼠标签配置
     */
    protected getMouseLabelConfig(): {
        text: string;
        fontSize: number;
        color: Color;
        yOffset: number;
        size: { width: number; height: number };
    } {
        return {
            text: "雷电大师",
            fontSize: 22,
            color: new Color(255, 255, 255, 255),
            yOffset: 40,
            size: { width: 120, height: 30 }
        };
    }

    // 实现BaseMouse的抽象方法 - 血条配置
    protected getHealthBarConfig() {
        return {
            width: 130,
            height: 12,
            yOffset: 55,
            backgroundColor: new Color(60, 60, 60),
            foregroundColor: new Color(255, 255, 0), // 黄色前景配合雷电主题
            borderColor: new Color(255, 255, 255),
            borderWidth: 2
        };
    }
    
    /**
     * 雷电大师特殊死亡效果
     */
    protected onDie(): void {
        console.log("雷电大师化作雷光消散...");
        
        // 雷电消散特效
        if (!this._graphics) {
            this._graphics = this.getGraphicsComponent();
        }
        if (this._graphics) {
            this._graphics.clear();
            
            // 显示爆发的雷电
            this._graphics.strokeColor = new Color(255, 255, 200, 255);
            this._graphics.lineWidth = 4;
            for (let i = 0; i < 16; i++) {
                const angle = (i * Math.PI) / 8;
                const length = 30 + Math.random() * 30;
                const endX = Math.cos(angle) * length;
                const endY = Math.sin(angle) * length;
                this._graphics.moveTo(0, 0);
                this._graphics.lineTo(endX, endY);
                this._graphics.stroke();
            }
            
            // 中央雷电球
            this._graphics.fillColor = new Color(255, 255, 100, 255);
            this._graphics.circle(0, 0, 15);
            this._graphics.fill();
        }
        
        // 调用父类死亡处理
        super.onDie();
    }
}