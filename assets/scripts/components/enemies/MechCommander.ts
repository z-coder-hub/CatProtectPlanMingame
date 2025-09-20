import { _decorator, Color, Sprite, tween, Vec3 } from 'cc';
import { GameManager } from '../../managers/GameManager';
import { EnemyCategory, EnemyConfig, EnemyType } from '../../types/GameTypes';
import { BaseMouse } from './BaseMouse';
import { EnemyFactory } from '../../systems/EnemyFactory';

const { ccclass } = _decorator;

/**
 * 机械军团长 - 召唤机械兵BOSS
 * 特点：召唤机械老鼠，自我修复能力，机械科技风格
 *
 * ## ⚠️ 敌人设计原则 - 纯塔防机制
 *
 * ### 🎯 核心设计哲学
 * **核心理念**: 敌人不能攻击或伤害英雄，这是塔防游戏的基本设计理念。
 *
 * **✅ 允许的敌人行为**：
 * - 移动到城堡：敌人的唯一目标是突破防线到达城堡
 * - 对城堡造成伤害：到达城堡后对城堡造成伤害
 * - 防御性特殊能力：护盾、护甲、减伤、潜行等防御机制
 * - 控制效果：视觉干扰、电磁干扰、地形阻挡、威慑效果（不直接造成伤害）
 *
 * **❌ 严格禁止的敌人行为**：
 * - 直接攻击英雄：敌人不能主动攻击或伤害英雄
 * - 对英雄造成伤害：任何形式的直接伤害都不允许
 * - 攻击相关属性：攻击力、攻击范围、攻击速度等属性
 *
 * ### 🏗️ BaseMouse 架构设计
 *
 * **DRY 原则重构架构** - BaseMouse统一管理：
 * - 外观渲染系统：统一的Sprite组件管理和显示
 * - 标签系统：统一的名称标签创建和配置（22px大字体）
 * - 血条系统：统一的血条创建、显示和更新
 * - 移动系统：完整的Tween移动系统，支持6种移动模式
 * - 生命周期管理：统一的初始化、受伤、死亡处理流程
 *
 * **强制抽象方法** - 子类必须实现：
 * ```typescript
 * public abstract readonly enemyType: EnemyType;           // 敌人类型标识
 * protected abstract getConfig(): EnemyConfig;            // 配置信息
 * protected abstract initializeMouseVisuals(): void;      // 外观初始化
 * ```
 *
 * **可选重写方法** - 子类可以重写：
 * ```typescript
 * protected initializeMovementBehavior(): void     // 移动行为定制
 * protected onTakeDamage(damage: number): void     // 受伤回调
 * protected onDie(): void                          // 死亡回调
 * ```
 *
 * ## 外观渲染优化模式
 * initializeMouseVisuals() 方法应当直接实现渲染逻辑，避免不必要的中间层方法：
 *
 * ✅ 推荐的简洁模式：
 * ```typescript
 * protected initializeMouseVisuals(): void {
 *     this.updateAppearance();
 * }
 * ```
 *
 * ❌ 避免的冗余模式：
 * ```typescript
 * protected initializeMouseVisuals(): void {
 *     this.initializeVisuals();  // 不必要的中间层
 * }
 *
 * private initializeVisuals(): void {
 *     this.updateAppearance();
 * }
 * ```
 *
 * ## 设计原则
 * - 遵循DRY原则，消除不必要的方法调用链
 * - 保持代码简洁直接，提高可读性和维护性
 * - 在抽象方法实现中直接处理核心逻辑
 * - 严格遵循纯塔防机制，敌人专注突破而非攻击
 *
 * ## 相关文档
 * - 完整设计文档：`ENEMIES_DESIGN_PRINCIPLES.md`
 * - 项目架构：`CLAUDE.md`
 * - 基类实现：`BaseMouse.ts`
 */

@ccclass('MechCommander')
export class MechCommander extends BaseMouse {

    /** 敌人类型 */
    public readonly enemyType: EnemyType = EnemyType.MECH_COMMANDER;

    /** 召唤数量限制 */
    private summonCount: number = 6;

    /** 召唤类型 */
    private summonType: EnemyType = EnemyType.MECH_MOUSE;

    /** 自我修复速度 */
    private healRate: number = 20;

    /** 召唤冷却时间 */
    private summonCooldown: number = 0;

    /** 修复冷却时间 */
    private healCooldown: number = 0;

    /** 已召唤的机械兵数量 */
    private spawnedCount: number = 0;

    /** 机械特效计时器 */
    private mechEffectTimer: number = 0;

    /**
     * 获取机械军团长配置
     */
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.MECH_COMMANDER,
            name: "机械军团长",
            category: EnemyCategory.BOSS,
            health: 400,
            maxHealth: 400,
            moveSpeed: 85,
            goldReward: 150,
            summonCount: 6,
            summonType: EnemyType.MECH_MOUSE,
            healRate: 20
        };
    }


    /**
     * 初始化机械军团长属性
     */
    protected onLoad(): void {
        super.onLoad();

        const config = this.getConfig();
        this.summonCount = config.summonCount || 6;
        this.summonType = config.summonType || EnemyType.MECH_MOUSE;
        this.healRate = config.healRate || 20;
    }

    /**
     * 初始化机械军团长移动行为 - 精确稳定移动
     * 特点：使用straight和zigzag模式，体现机械精度和稳定性
     */
    protected initializeMovementBehavior(): void {
        // 机械军团长的移动模式 - 直线和Z字形混合，体现机械精度
        const patterns: ('straight' | 'zigzag')[] = ['straight', 'zigzag'];
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];

        // 中小幅度的精确摆动 - 体现机械的精度和可控性
        this._zigzagAmplitude = 15 + Math.random() * 20; // 15-35像素的精确摆动
        this._segmentCount = 6 + Math.floor(Math.random() * 3); // 6-8段移动，保持稳定


        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }

    /**
     * 初始化机械军团长外观
     */
    // 实现抽象方法：获取敌人图片路径
    protected getEnemyImagePath(): string {
        return "images/enemies/MechCommander";
    }

    // 实现抽象方法：绘制Graphics外观（没有图片资源，使用Graphics绘制）
    protected drawEnemyGraphics(graphics: any): void {
        // 机械军团长已迁移到Sprite颜色系统
        this.drawBasicVisuals();
    }

    /**
     * 绘制基础机械外观（使用Sprite颜色代替Graphics）
     */
    private drawBasicVisuals(): void {
        // 机械色彩 - 银灰色机械风
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(140, 140, 140); // 银灰色主体
        }
    }


    /**
     * 更新机械特效和逻辑
     */
    protected update(dt: number): void {
        super.update(dt);

        // 机械特效更新
        this.mechEffectTimer += dt;
        if (this.mechEffectTimer >= 0.8) {
            this.mechEffectTimer = 0;
            this.updateMechanicalEffect();
        }

        // 召唤冷却
        this.summonCooldown -= dt;
        if (this.summonCooldown <= 0 && this.spawnedCount < this.summonCount) {
            this.summonMechUnits();
            this.summonCooldown = 3.0; // 3秒召唤一次
        }

        // 自我修复冷却
        this.healCooldown -= dt;
        if (this.healCooldown <= 0) {
            this.performSelfRepair();
            this.healCooldown = 2.0; // 2秒修复一次
        }
    }

    /**
     * 更新机械特效（改为Sprite颜色变化）
     */
    private updateMechanicalEffect(): void {
        // 重绘基础外观
        this.drawBasicVisuals();

        // 添加扫描线特效 - 改为颜色闪烁
        const time = Date.now() / 1000;
        const flickerIntensity = Math.sin(time * 4) * 0.3 + 0.7;

        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(
                Math.floor(140 * flickerIntensity),
                Math.floor(140 * flickerIntensity),
                Math.floor(140 * flickerIntensity)
            );
        }

        console.log("机械军团长更新扫描特效");
    }

    /**
     * 召唤机械单位
     */
    private summonMechUnits(): void {
        if (this.spawnedCount >= this.summonCount) return;

        const gameManager = GameManager.instance;
        if (!gameManager) {
            console.error("GameManager不存在，无法召唤");
            return;
        }

        console.log(`机械军团长召唤机械老鼠！已召唤数量：${this.spawnedCount}/${this.summonCount}`);

        // 在周围位置召唤机械老鼠
        const angle = Math.random() * 2 * Math.PI;
        const distance = 80;
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
            return;
        }

        this.spawnedCount++;

        // 召唤特效
        this.showSummonEffect();
    }

    /**
     * 显示召唤特效
     */
    private showSummonEffect(): void {
        // 机械召唤特效 - 改为Sprite颜色变化
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(100, 200, 255); // 蓝色召唤光环色
        }
        console.log("机械军团长展示召唤特效");

        // 1.5秒后恢复正常外观
        tween(this.node)
            .delay(1.5)
            .call(() => {
                if (this.node && this.node.isValid) {
                    const sprite = this.node.getComponent(Sprite);
                    if (sprite) {
                        sprite.color = new Color(140, 140, 140); // 恢复银灰色
                    }
                }
            })
            .start();
    }

    /**
     * 执行自我修复
     */
    private performSelfRepair(): void {
        if (this.currentHealth >= this.maxHealth) return;

        const healAmount = Math.min(this.healRate, this.maxHealth - this.currentHealth);
        this.currentHealth += healAmount;

        console.log(`机械军团长自我修复：回复${healAmount}点生命值，当前：${this.currentHealth}/${this.maxHealth}`);

        // 修复特效
        this.showRepairEffect();
    }

    /**
     * 显示修复特效
     */
    private showRepairEffect(): void {
        // 修复特效 - 改为Sprite颜色变化
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(100, 255, 100); // 绿色修复光芒

            // 短暂闪烁后恢复
            tween(this.node)
                .delay(0.5)
                .call(() => {
                    if (this.node && this.node.isValid && sprite) {
                        sprite.color = new Color(140, 140, 140); // 恢复银灰色
                    }
                })
                .start();
        }
        console.log("机械军团长展示修复特效");
    }

    /**
     * 机械军团长受伤效果
     */
    protected onTakeDamage(_damage: number): void {
        console.log("机械军团长装甲受损，启动应急修复程序！");

        // 应急修复特效 - 改为Sprite颜色变化
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 200, 0); // 警告黄色

            // 短暂闪烁后恢复
            tween(this.node)
                .delay(0.3)
                .call(() => {
                    if (this.node && this.node.isValid && sprite) {
                        sprite.color = new Color(140, 140, 140); // 恢复银灰色
                    }
                })
                .start();
        }
    }

    /**
     * 获取老鼠标签配置
     */

    /**
     * 机械军团长特殊死亡效果
     */
    protected onDie(): void {
        console.log("机械军团长系统失控，发生爆炸！");

        // 机械爆炸特效 - 改为Sprite颜色变化
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 100, 50); // 爆炸橙色
        }

        // 调用父类死亡处理
        super.onDie();
    }

    /**
     * 对象池重用时的额外初始化
     * 重置机械军团长的特殊属性
     */
    protected onReuse(): void {
        // 重新初始化特殊属性
        const config = this.getConfig();
        this.summonCount = config.summonCount || 6;
        this.summonType = config.summonType || EnemyType.MECH_MOUSE;
        this.healRate = config.healRate || 20;

        console.log(`[MechCommander] 🔄 重用时重置特殊属性: 召唤=${this.summonCount}, 类型=${this.summonType}, 修复=${this.healRate}`);
    }
}
