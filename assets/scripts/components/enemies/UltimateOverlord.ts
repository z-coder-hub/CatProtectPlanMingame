import { _decorator, Color, Sprite, Vec3, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';
import { GameManager } from '../../managers/GameManager';
import { BattleManager } from '../../managers/BattleManager';
import { BaseHero } from '../heroes/BaseHero';
import { EnemyFactory } from '../../systems/EnemyFactory';

const { ccclass } = _decorator;

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
    
    protected onLoad(): void {
        super.onLoad();

        // 特殊属性配置
        const config = this.getConfig();
        this.armorValue = config.armorValue || 5;
        this.stealthChance = config.stealthChance || 0.15;
        this.summonCount = config.summonCount || 2;
        this.summonType = config.summonType || EnemyType.MOUSE_KING;
        this.damageReduction = config.damageReduction || 0.1;

        // 初始潜行判定
        this.checkStealthState();
    }

    /**
     * 获取终极霸王配置
     */
    protected getConfig(): EnemyConfig {
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

        // 适度的复杂摆动 - 体现终极BOSS的不可预测性
        this._zigzagAmplitude = 25 + Math.random() * 15; // 25-40像素的适度摆动
        this._segmentCount = 8 + Math.floor(Math.random() * 3); // 8-10段移动，复杂但不过度


        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }
    
    /**
     * 初始化终极霸王外观
     */
    // 实现抽象方法：获取敌人图片路径
    protected getEnemyImagePath(): string {
        return "images/enemies/UltimateOverlord";
    }

    // 实现抽象方法：绘制Graphics外观（没有图片资源，使用Graphics绘制）
    protected drawEnemyGraphics(_graphics: any): void {
        // 终极霸王已迁移到Sprite颜色系统
        this.drawNormalForm();
    }

    /**
     * 绘制正常状态外观（改为Sprite颜色）
     */
    private drawNormalForm(): void {
        // 终极霸王色彩 - 金紫色，象征至高无上
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(150, 100, 200); // 紫色主体
        }

        // 神秘符文特效
        this.drawRuneSymbols();
    }
    
    /**
     * 绘制潜行状态外观（改为Sprite颜色）
     */
    private drawStealthedForm(): void {
        // 半透明紫金色
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(150, 100, 200, 120); // 半透明紫色
        }
        console.log("终极霸王潜行状态外观");
    }
    
    /**
     * 绘制符文符号（改为日志输出）
     */
    private drawRuneSymbols(): void {
        // 神秘符文特效已经通过Sprite颜色变化体现
        console.log("终极霸王身体周围神秘符文效果");
    }
    
    /**
     * 添加能力特效（改为Sprite颜色变化）
     */
    private addAbilityEffects(): void {
        switch (this.activeAbility) {
            case 'summon':
                this.addSummonEffect();
                break;
            case 'intimidation':
                this.addIntimidationEffect();
                break;
            case 'stealth':
                this.addStealthEffect();
                break;
        }
    }
    
    /**
     * 添加召唤特效（改为Sprite颜色变化）
     */
    private addSummonEffect(): void {
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(200, 100, 255); // 紫红色召唤特效
        }
        console.log("终极霸王召唤特效");
    }
    
    /**
     * 添加威慑特效（改为Sprite颜色变化）
     */
    private addIntimidationEffect(): void {
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 255, 100); // 金黄色威慑特效
        }
        console.log("终极霸王威慑特效");
    }
    
    /**
     * 添加潜行特效（改为Sprite颜色变化）
     */
    private addStealthEffect(): void {
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(150, 100, 200, 100); // 半透明潜行特效
        }
        console.log("终极霸王潜行特效");
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
     * 更新视觉特效（改为Sprite颜色变化）
     */
    private updateVisualEffects(): void {
        if (this.isStealthed) {
            this.drawStealthedForm();
        } else {
            this.drawNormalForm();
        }

        // 添加能力特效
        if (this.activeAbility) {
            this.addAbilityEffects();
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
            
            // 🎯 新架构：使用EnemyFactory直接创建敌人
            const summonPosition = new Vec3(this.node.position.x + offsetX, this.node.position.y + offsetY, 0);
            const summonedEnemy = EnemyFactory.createEnemy(this.summonType, this.node.parent, {
                x: summonPosition.x,
                y: summonPosition.y
            });

            if (!summonedEnemy) {
                console.error(`${this.unitName}召唤${this.summonType}失败`);
            }
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
        const battleManager = BattleManager.instance;
        if (!battleManager) return;

        const deployedHeroes = battleManager.getAllDeployedHeroes();
        if (deployedHeroes.length === 0) return;

        this.activeAbility = 'intimidation';
        console.log(`终极霸王展示终极威慑气场！`);

        // 对范围内的英雄展示威慑特效（不造成伤害）
        const intimidationRange = 150;
        deployedHeroes.forEach(heroNode => {
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
     * 显示受伤特效（改为Sprite颜色变化）
     */
    private showDamageEffect(): void {
        // 愤怒特效 - 改为Sprite颜色变化
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 0, 0); // 红色愤怒特效

            // 短暂闪烁后恢复
            tween(this.node)
                .delay(0.4)
                .call(() => {
                    if (this.node && this.node.isValid && sprite) {
                        this.updateVisualEffects(); // 恢复正常外观
                    }
                })
                .start();
        }
        console.log("终极霸王愤怒特效");
    }
    
    /**
     * 获取老鼠标签配置
     */
    
    /**
     * 终极霸王终极死亡效果
     */
    protected onDie(): void {
        console.log("终极霸王的统治时代结束了！世界恢复和平...");

        // 终极死亡特效 - 改为Sprite颜色变化
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 255, 255); // 白色终极爆炸
        }

        // 调用父类死亡处理
        super.onDie();
    }

    /**
     * 对象池重用时的额外初始化
     * 重置终极霸王的特殊属性
     */
    protected onReuse(): void {
        // 重新初始化所有特殊属性
        const config = this.getConfig();
        this.armorValue = config.armorValue || 5;
        this.stealthChance = config.stealthChance || 0.15;
        this.summonCount = config.summonCount || 2;
        this.summonType = config.summonType || EnemyType.MOUSE_KING;
        this.damageReduction = config.damageReduction || 0.1;

        // 重置状态
        this.activeAbility = '';
        this.checkStealthState();

        console.log(`[UltimateOverlord] 🔄 重用时重置特殊属性: 护甲=${this.armorValue}, 潜行=${this.stealthChance}, 召唤=${this.summonCount}`);
    }
}