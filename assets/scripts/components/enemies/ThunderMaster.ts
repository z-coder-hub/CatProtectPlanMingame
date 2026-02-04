import { _decorator, Color, Sprite, Vec3, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';
import { BattleManager } from '../../managers/BattleManager';
import { BaseHero } from '../heroes/BaseHero';

const { ccclass } = _decorator;

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
    protected onLoad(): void {
        super.onLoad();

        const config = this.getConfig();
        this.shieldStrength = config.shieldStrength || 100;
        this.currentShield = this.shieldStrength;
    }

    /**
     * 获取雷电大师配置
     */
    protected getConfig(): EnemyConfig {
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

        // 适度的电光闪现摆动 - 体现雷电的活跃性
        this._zigzagAmplitude = 20 + Math.random() * 15; // 20-35像素的适度摆动
        this._segmentCount = 6 + Math.floor(Math.random() * 3); // 6-8段移动，保持闪现效果


        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }
    
    /**
     * 初始化雷电大师外观
     */
    // 实现抽象方法：获取敌人图片路径
    protected getEnemyImagePath(): string {
        return "images/enemies/ThunderMaster";
    }

    // 实现抽象方法：绘制Graphics外观（没有图片资源，使用Graphics绘制）
    protected drawEnemyGraphics(_graphics: any): void {
        // 雷电大师已迁移到Sprite颜色系统
        this.drawBasicVisuals();
    }

    /**
     * 绘制基础外观（改为Sprite颜色）
     */
    private drawBasicVisuals(): void {
        // 雷电色彩 - 紫蓝电光色
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(100, 100, 200); // 紫蓝色身体
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
                const battleManager = BattleManager.instance;
                if (battleManager) {
                    const deployedHeroes = battleManager.getAllDeployedHeroes();
                    if (deployedHeroes && deployedHeroes.length > 0) {
                        this.performElectromagneticInterference();
                    }
                }
            } catch (error) {
                console.error("雷电大师电磁干扰时出错:", error);
            }
            this.interferenceeCooldown = 6.0; // 6秒一次电磁干扰
        }
    }
    
    /**
     * 更新雷电特效（改为Sprite颜色变化）
     */
    private updateLightningEffect(): void {
        // 重绘基础外观
        this.drawBasicVisuals();

        // 添加随机雷电闪烁 - 改为颜色闪烁效果
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            const flickerIntensity = Math.random() * 0.5 + 0.5;
            sprite.color = new Color(
                Math.floor(100 + flickerIntensity * 155),
                Math.floor(100 + flickerIntensity * 155),
                Math.floor(200 + flickerIntensity * 55)
            );
        }

        console.log("雷电大师更新雷电闪烁特效");
    }
    
    /**
     * 执行电磁干扰效果
     */
    private performElectromagneticInterference(): void {
        const battleManager = BattleManager.instance;

        try {
            if (!battleManager) {
                return;
            }

            const deployedHeroes = battleManager.getAllDeployedHeroes();
            if (!deployedHeroes || deployedHeroes.length === 0) {
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
        const battleManager = BattleManager.instance;
        if (!battleManager) return [];

        const deployedHeroes = battleManager.getAllDeployedHeroes();
        if (!deployedHeroes) return [];

        const targets: any[] = [];
        const interferenceRange = 120;

        deployedHeroes.forEach(heroNode => {
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
        console.log(`雷电大师对${targets.length}个英雄展示电磁干扰特效`);

        // 电磁干扰特效 - 改为Sprite颜色变化
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(150, 200, 255); // 蓝色电磁场色
        }

        // 对每个目标显示干扰特效
        targets.forEach(target => {
            if (target) {
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
                    const sprite = this.node.getComponent(Sprite);
                    if (sprite) {
                        sprite.color = new Color(100, 100, 200); // 恢复紫蓝色
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
     * 显示护盾受击特效（改为Sprite颜色变化）
     */
    private showShieldHitEffect(): void {
        // 护盾受击特效 - 改为Sprite颜色变化
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 255, 255); // 白色闪烁

            // 短暂闪烁后恢复
            tween(this.node)
                .delay(0.2)
                .call(() => {
                    if (this.node && this.node.isValid && sprite) {
                        sprite.color = new Color(100, 100, 200); // 恢复紫蓝色
                    }
                })
                .start();
        }
        console.log("雷电大师护盾受击特效");
    }
    
    
    /**
     * 雷电大师特殊死亡效果
     */
    protected onDie(): void {
        console.log("雷电大师化作雷光消散...");

        // 雷电消散特效 - 改为Sprite颜色变化
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 255, 100); // 亮黄色雷电爆发
        }

        // 调用父类死亡处理
        super.onDie();
    }

    /**
     * 对象池重用时的额外初始化
     * 重置雷电大师的护盾强度
     */
    protected onReuse(): void {
        // 重新初始化护盾强度
        const config = this.getConfig();
        this.shieldStrength = config.shieldStrength || 100;

        // 🔧 修复：重置所有计时器
        this.currentShield = this.shieldStrength;
        this.interferenceeCooldown = 0;
        this.lightningEffectTimer = 0;

        console.log(`[ThunderMaster] 🔄 重用时重置雷电系统: 护盾=${this.shieldStrength}, 计时器已重置`);
    }
}