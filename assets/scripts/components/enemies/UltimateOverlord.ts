import { _decorator, Component, Color, Graphics, Vec3, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';
import { GameManager } from '../../managers/GameManager';

const { ccclass, property } = _decorator;

/**
 * 终极霸王 - 最终BOSS
 * 特点：融合所有BOSS能力，护甲、潜行、召唤、链式攻击、减伤
 */
@ccclass('UltimateOverlord')
export class UltimateOverlord extends BaseMouse {

    /** 敌人类型 */
    public readonly enemyType: EnemyType = EnemyType.ULTIMATE_OVERLORD;

    /** 护甲值 */
    private armorValue: number = 5;
    
    /** 潜行几率 */
    private stealthChance: number = 0.15;
    
    /** 召唤数量 */
    private summonCount: number = 2;
    
    /** 召唤类型 */
    private summonType: EnemyType = EnemyType.MOUSE_KING;
    
    /** 减伤比例 */
    private damageReduction: number = 0.1;

    /** 是否处于潜行状态 */
    private isStealthed: boolean = false;

    /** 能力冷却计时器 */
    private abilityCooldowns: { [key: string]: number } = {
        summon: 0,
        intimidation: 0,  // 威慑能力替代链式攻击
        stealth: 0
    };
    
    /** 特效计时器 */
    private effectTimer: number = 0;
    
    /** 当前激活的能力 */
    private activeAbility: string = '';
    
    /**
     * 初始化终极霸王属性
     */
    protected initializeMouseStats(): void {
        const config = this.GetConfig();
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
        this.armorValue = config.armorValue || 5;
        this.stealthChance = config.stealthChance || 0.15;
        this.summonCount = config.summonCount || 2;
        this.summonType = config.summonType || EnemyType.MOUSE_KING;
        this.damageReduction = config.damageReduction || 0.1;

        // 终极霸王体型最大
        this.node.scale = new Vec3(2.2, 2.2, 1);

        // 初始潜行判定
        this.checkStealthState();
    }

    /**
     * 获取终极霸王配置
     */
    protected GetConfig(): EnemyConfig {
        return {
            type: EnemyType.ULTIMATE_OVERLORD,
            name: "终极霸王",
            category: EnemyCategory.BOSS,
            health: 800,
            maxHealth: 800,
            moveSpeed: 60,
            goldReward: 200,
            armorValue: 5,
            stealthChance: 0.15,
            summonCount: 2,
            summonType: EnemyType.MOUSE_KING,
            chainTargets: 2,
            damageReduction: 0.1
        };
    }

    /**
     * 初始化终极霸王移动行为 - 综合所有复杂移动
     * 特点：使用spiral、curves、zigzag模式混合，体现终极BOSS的复杂性
     */
    protected initializeMovementBehavior(): void {
        // 终极霸王的移动模式 - 融合所有复杂移动模式
        const patterns: ('spiral' | 'curves' | 'zigzag')[] = ['spiral', 'curves', 'zigzag'];
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];

        // 大幅度的复杂摆动 - 体现终极BOSS的不可预测性和威胁
        this._zigzagAmplitude = 45 + Math.random() * 35; // 45-80像素的大幅摆动
        this._segmentCount = 12 + Math.floor(Math.random() * 6); // 12-17段移动，最复杂的移动路径

        console.log(`终极霸王移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }
    
    /**
     * 初始化终极霸王外观
     */
    protected initializeMouseVisuals(): void {
        const graphics = this.getGraphicsComponent();
        
        if (this.isStealthed) {
            this.drawStealthedForm(graphics);
        } else {
            this.drawNormalForm(graphics);
        }
        
        // 根据激活的能力添加特效
        this.addAbilityEffects(graphics);
    }
    
    /**
     * 绘制正常状态外观
     */
    private drawNormalForm(graphics: Graphics): void {
        // 终极霸王色彩 - 金紫色，象征至高无上
        graphics.fillColor = new Color(150, 100, 200, 255);   // 紫色主体
        graphics.strokeColor = new Color(200, 150, 50, 255);  // 金色边框
        graphics.lineWidth = 4;
        
        // 王冠形状的头部
        graphics.moveTo(0, -35);
        graphics.lineTo(-8, -45);
        graphics.lineTo(-15, -35);
        graphics.lineTo(-20, -45);
        graphics.lineTo(-25, -30);
        graphics.lineTo(-15, -20);
        graphics.lineTo(15, -20);
        graphics.lineTo(25, -30);
        graphics.lineTo(20, -45);
        graphics.lineTo(15, -35);
        graphics.lineTo(8, -45);
        graphics.close();
        graphics.fill();
        graphics.stroke();
        
        // 威严的身体 - 八角形
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const x = Math.cos(angle) * 25;
            const y = Math.sin(angle) * 20;
            if (i === 0) {
                graphics.moveTo(x, y);
            } else {
                graphics.lineTo(x, y);
            }
        }
        graphics.close();
        graphics.fill();
        graphics.stroke();
        
        // 霸王之眼 - 多色眼睛
        graphics.fillColor = new Color(255, 50, 50, 255);     // 红色左眼
        graphics.circle(-8, -25, 5);
        graphics.fill();
        graphics.fillColor = new Color(50, 255, 50, 255);     // 绿色右眼
        graphics.circle(8, -25, 5);
        graphics.fill();
        
        // 权杖 - 终极武器
        graphics.strokeColor = new Color(255, 200, 50, 255);  // 金色权杖
        graphics.lineWidth = 5;
        graphics.moveTo(-30, 0);
        graphics.lineTo(-45, -15);
        graphics.stroke();
        
        // 权杖顶端宝珠
        graphics.fillColor = new Color(100, 255, 255, 255);   // 青色宝珠
        graphics.circle(-45, -15, 8);
        graphics.fill();
        graphics.strokeColor = new Color(50, 200, 200, 255);
        graphics.lineWidth = 2;
        graphics.circle(-45, -15, 8);
        graphics.stroke();
        
        // 装甲护肩
        graphics.fillColor = new Color(120, 80, 160, 255);
        graphics.ellipse(-35, -10, 12, 8);
        graphics.fill();
        graphics.ellipse(35, -10, 12, 8);
        graphics.fill();
        
        // 能量核心
        graphics.fillColor = new Color(255, 255, 100, 200);
        graphics.circle(0, 0, 8);
        graphics.fill();
        
        // 神秘符文
        this.drawRuneSymbols(graphics);
    }
    
    /**
     * 绘制潜行状态外观
     */
    private drawStealthedForm(graphics: Graphics): void {
        // 半透明紫金色
        graphics.fillColor = new Color(150, 100, 200, 120);
        graphics.strokeColor = new Color(200, 150, 50, 150);
        graphics.lineWidth = 3;
        
        // 简化的轮廓
        graphics.circle(0, 0, 25);
        graphics.fill();
        graphics.stroke();
        
        // 暗影漩涡
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * 30;
            const y = Math.sin(angle) * 30;
            graphics.fillColor = new Color(100, 50, 150, 80);
            graphics.circle(x, y, 4);
            graphics.fill();
        }
    }
    
    /**
     * 绘制符文符号
     */
    private drawRuneSymbols(graphics: Graphics): void {
        graphics.strokeColor = new Color(255, 200, 100, 180);
        graphics.lineWidth = 2;
        
        // 在身体周围绘制神秘符文
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * 15;
            const y = Math.sin(angle) * 12;
            
            // 简单的符文形状
            graphics.moveTo(x - 3, y - 3);
            graphics.lineTo(x + 3, y - 3);
            graphics.lineTo(x, y + 3);
            graphics.close();
            graphics.stroke();
        }
    }
    
    /**
     * 添加能力特效
     */
    private addAbilityEffects(graphics: Graphics): void {
        switch (this.activeAbility) {
            case 'summon':
                this.addSummonEffect(graphics);
                break;
            case 'intimidation':
                this.addIntimidationEffect(graphics);
                break;
            case 'stealth':
                this.addStealthEffect(graphics);
                break;
        }
    }
    
    /**
     * 添加召唤特效
     */
    private addSummonEffect(graphics: Graphics): void {
        graphics.strokeColor = new Color(200, 100, 255, 200);
        graphics.lineWidth = 3;
        graphics.circle(0, 0, 50);
        graphics.stroke();
        graphics.circle(0, 0, 40);
        graphics.stroke();
    }
    
    /**
     * 添加链式攻击特效
     */
    private addIntimidationEffect(graphics: Graphics): void {
        graphics.strokeColor = new Color(255, 255, 100, 200);
        graphics.lineWidth = 4;
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const startX = Math.cos(angle) * 20;
            const startY = Math.sin(angle) * 20;
            const endX = Math.cos(angle) * 60;
            const endY = Math.sin(angle) * 60;
            graphics.moveTo(startX, startY);
            graphics.lineTo(endX, endY);
            graphics.stroke();
        }
    }
    
    /**
     * 添加潜行特效
     */
    private addStealthEffect(graphics: Graphics): void {
        graphics.strokeColor = new Color(150, 100, 200, 100);
        graphics.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI) / 6;
            const radius = 35 + Math.sin(Date.now() / 200 + i) * 5;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            graphics.circle(x, y, 2);
            graphics.stroke();
        }
    }
    
    /**
     * 检查潜行状态
     */
    private checkStealthState(): void {
        this.isStealthed = Math.random() < this.stealthChance;
    }
    
    /**
     * 更新终极霸王逻辑
     */
    protected update(dt: number): void {
        super.update(dt);
        
        // 更新特效
        this.effectTimer += dt;
        if (this.effectTimer >= 0.5) {
            this.effectTimer = 0;
            this.updateVisualEffects();
        }
        
        // 更新能力冷却
        for (const ability in this.abilityCooldowns) {
            this.abilityCooldowns[ability] -= dt;
        }
        
        // 潜行状态切换
        if (this.abilityCooldowns.stealth <= 0) {
            const wasStealthed = this.isStealthed;
            this.checkStealthState();
            if (wasStealthed !== this.isStealthed) {
                this.updateVisualEffects();
                console.log(`终极霸王${this.isStealthed ? '进入' : '脱离'}潜行状态`);
            }
            this.abilityCooldowns.stealth = 3.0;
        }
        
        // 使用能力
        this.useAbilities();
    }
    
    /**
     * 更新视觉特效（减少Graphics组件重复访问）
     */
    private updateVisualEffects(): void {
        if (!this._graphics) {
            this._graphics = this.getGraphicsComponent();
        }
        if (this._graphics) {
            this._graphics.clear();
            if (this.isStealthed) {
                this.drawStealthedForm(this._graphics);
            } else {
                this.drawNormalForm(this._graphics);
            }
        }
    }
    
    /**
     * 使用能力
     */
    private useAbilities(): void {
        // 召唤能力
        if (this.abilityCooldowns.summon <= 0) {
            this.performSummon();
            this.abilityCooldowns.summon = 10.0;
        }
        
        // 威慑展示
        if (this.abilityCooldowns.intimidation <= 0) {
            this.performIntimidationDisplay();
            this.abilityCooldowns.intimidation = 8.0;
        }
    }
    
    /**
     * 执行召唤
     */
    private performSummon(): void {
        const gameManager = GameManager.instance;
        if (!gameManager) return;
        
        this.activeAbility = 'summon';
        console.log(`终极霸王召唤${this.summonCount}只老鼠王！`);
        
        for (let i = 0; i < this.summonCount; i++) {
            const angle = (i * 2 * Math.PI) / this.summonCount;
            const distance = 100;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            gameManager.SpawnEnemyAtPosition(this.summonType,
                new Vec3(this.node.position.x + offsetX, this.node.position.y + offsetY, 0));
        }
        
        this.updateVisualEffects();
        
        // 2秒后清除能力特效
        tween(this.node)
            .delay(2.0)
            .call(() => {
                this.activeAbility = '';
                this.updateVisualEffects();
            })
            .start();
    }
    
    /**
     * 执行威慑展示
     */
    private performIntimidationDisplay(): void {
        const gameManager = GameManager.instance;
        if (!gameManager || gameManager.deployedHeroes.length === 0) return;
        
        this.activeAbility = 'intimidation';
        console.log(`终极霸王展示终极威慑气场！`);
        
        // 对范围内的英雄展示威慑特效（不造成伤害）
        const intimidationRange = 150;
        gameManager.deployedHeroes.forEach(heroNode => {
            if (!heroNode || !heroNode.isValid) return;

            const distance = Vec3.distance(this.node.position, heroNode.position);
            if (distance <= intimidationRange) {
                const heroComponent = heroNode.getComponent(BaseHero);
                if (heroComponent) {
                    console.log(`英雄${heroComponent.unitName}感受到终极霸王的威慑气场！`);
                }
            }
        });
        
        this.updateVisualEffects();
        
        // 3秒后清除能力特效
        tween(this.node)
            .delay(3.0)
            .call(() => {
                this.activeAbility = '';
                this.updateVisualEffects();
            })
            .start();
    }
    
    // 已移除链式攻击相关方法，符合塔防游戏设计原则
    
    // 已移除链式攻击相关方法，符合塔防游戏设计原则
    
    /**
     * 终极霸王复合受伤处理
     */
    protected onTakeDamage(damage: number): void {
        // 护甲减伤
        const armorReducedDamage = Math.max(1, damage - this.armorValue);
        
        // 减伤处理
        const finalDamage = armorReducedDamage * (1 - this.damageReduction);
        
        // 潜行状态可能完全躲避
        if (this.isStealthed && Math.random() < 0.3) {
            console.log("终极霸王在潜行中完全躲避了攻击！");
            return;
        }
        
        console.log(`终极霸王受到${finalDamage.toFixed(1)}点伤害（原始：${damage}，护甲减免：${damage - armorReducedDamage}，减伤：${(armorReducedDamage - finalDamage).toFixed(1)}）`);
        
        // 愤怒特效
        this.showDamageEffect();
        
        // 受到攻击后脱离潜行
        if (this.isStealthed) {
            this.isStealthed = false;
            this.updateVisualEffects();
        }
    }
    
    /**
     * 显示受伤特效
     */
    private showDamageEffect(): void {
        const graphics = this.getGraphicsComponent();
        if (!graphics) return;
        
        // 愤怒光环
        graphics.strokeColor = new Color(255, 0, 0, 255);
        graphics.lineWidth = 5;
        graphics.circle(0, 0, 60);
        graphics.stroke();
        
        // 能量爆发
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI) / 6;
            const x = Math.cos(angle) * 50;
            const y = Math.sin(angle) * 50;
            graphics.fillColor = new Color(255, 100, 100, 200);
            graphics.circle(x, y, 4);
            graphics.fill();
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
            text: "终极霸王",
            fontSize: 22,
            color: new Color(255, 255, 255, 255),
            yOffset: 40,
            size: { width: 120, height: 30 }
        };
    }

    // 实现BaseMouse的抽象方法 - 血条配置
    protected getHealthBarConfig() {
        return {
            width: 200,
            height: 20,
            yOffset: 70,
            backgroundColor: new Color(60, 60, 60),
            foregroundColor: new Color(255, 0, 0), // 红色前景配合终极霸王主题
            borderColor: new Color(255, 215, 0), // 金色边框
            borderWidth: 4
        };
    }
    
    /**
     * 终极霸王终极死亡效果
     */
    protected onDie(): void {
        console.log("终极霸王的统治时代结束了！世界恢复和平...");
        
        // 终极死亡特效
        const graphics = this.getGraphicsComponent();
        if (graphics) {
            graphics.clear();
            
            // 巨大的爆炸
            graphics.fillColor = new Color(255, 255, 255, 255);
            graphics.circle(0, 0, 50);
            graphics.fill();
            
            // 彩色能量环
            const colors = [
                new Color(255, 100, 100, 200),
                new Color(100, 255, 100, 200),
                new Color(100, 100, 255, 200),
                new Color(255, 255, 100, 200),
                new Color(255, 100, 255, 200),
                new Color(100, 255, 255, 200)
            ];
            
            for (let i = 0; i < 6; i++) {
                graphics.strokeColor = colors[i];
                graphics.lineWidth = 8;
                graphics.circle(0, 0, 40 + (i * 15));
                graphics.stroke();
            }
            
            // 胜利光芒
            graphics.strokeColor = new Color(255, 255, 200, 255);
            graphics.lineWidth = 6;
            for (let i = 0; i < 16; i++) {
                const angle = (i * Math.PI) / 8;
                const endX = Math.cos(angle) * 100;
                const endY = Math.sin(angle) * 100;
                graphics.moveTo(0, 0);
                graphics.lineTo(endX, endY);
                graphics.stroke();
            }
        }
        
        // 调用父类死亡处理
        super.onDie();
    }
}