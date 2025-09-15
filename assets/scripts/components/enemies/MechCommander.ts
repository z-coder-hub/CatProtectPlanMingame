import { _decorator, Color, Graphics, tween, Vec3 } from 'cc';
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
 * - 外观渲染系统：统一的Graphics组件管理和绘制
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
 *     this._graphics = this.getGraphicsComponent();
 *     this.drawAppearance();
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
 *     this._graphics = this.getGraphicsComponent();
 *     this.drawAppearance();
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

        console.log(`机械军团长移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }

    /**
     * 初始化机械军团长外观
     */
    protected initializeMouseVisuals(): void {
        const graphics = this.getGraphicsComponent();

        // 机械色彩 - 银灰色机械风
        graphics.fillColor = new Color(140, 140, 140, 255);   // 银灰色主体
        graphics.strokeColor = new Color(100, 100, 100, 255); // 深灰色边框
        graphics.lineWidth = 3;

        // 机械身体 - 六角形指挥官形状
        graphics.moveTo(0, -20);
        graphics.lineTo(15, -10);
        graphics.lineTo(15, 10);
        graphics.lineTo(0, 20);
        graphics.lineTo(-15, 10);
        graphics.lineTo(-15, -10);
        graphics.close();
        graphics.fill();
        graphics.stroke();

        // 指挥头盔
        graphics.fillColor = new Color(120, 120, 150, 255);   // 蓝灰色头盔
        graphics.rect(-12, -25, 24, 15);
        graphics.fill();
        graphics.stroke();

        // 机械眼睛 - 红色扫描器
        graphics.fillColor = new Color(255, 50, 50, 255);
        graphics.rect(-8, -22, 6, 3);
        graphics.fill();
        graphics.rect(2, -22, 6, 3);
        graphics.fill();

        // 天线/通讯设备
        graphics.strokeColor = new Color(200, 200, 200, 255);
        graphics.lineWidth = 2;
        graphics.moveTo(-5, -25);
        graphics.lineTo(-5, -35);
        graphics.stroke();
        graphics.moveTo(5, -25);
        graphics.lineTo(5, -35);
        graphics.stroke();

        // 天线顶部
        graphics.fillColor = new Color(255, 100, 100, 255);
        graphics.circle(-5, -35, 2);
        graphics.fill();
        graphics.circle(5, -35, 2);
        graphics.fill();

        // 机械臂/武器系统
        graphics.fillColor = new Color(110, 110, 110, 255);
        graphics.rect(-25, -8, 12, 6);
        graphics.fill();
        graphics.stroke();
        graphics.rect(13, -8, 12, 6);
        graphics.fill();
        graphics.stroke();

        // 履带/移动系统
        graphics.fillColor = new Color(80, 80, 80, 255);
        graphics.rect(-18, 15, 36, 10);
        graphics.fill();
        graphics.stroke();

        // 履带齿轮
        for (let i = 0; i < 6; i++) {
            const x = -15 + (i * 6);
            graphics.fillColor = new Color(60, 60, 60, 255);
            graphics.circle(x, 20, 2);
            graphics.fill();
        }

        // 机械装饰线条
        this.drawMechanicalDetails(graphics);
    }

    /**
     * 绘制基础机械外观（不重新获取Graphics组件）
     */
    private drawBasicVisuals(graphics: Graphics): void {
        // 机械色彩 - 银灰色机械风
        graphics.fillColor = new Color(140, 140, 140, 255);   // 银灰色主体
        graphics.strokeColor = new Color(100, 100, 100, 255); // 深灰色边框
        graphics.lineWidth = 3;

        // 机械身体 - 六角形指挥官形状
        graphics.moveTo(0, -20);
        graphics.lineTo(15, -10);
        graphics.lineTo(15, 10);
        graphics.lineTo(0, 20);
        graphics.lineTo(-15, 10);
        graphics.lineTo(-15, -10);
        graphics.close();
        graphics.fill();
        graphics.stroke();

        // 指挥头盔
        graphics.fillColor = new Color(120, 120, 150, 255);   // 蓝灰色头盔
        graphics.rect(-12, -25, 24, 15);
        graphics.fill();
        graphics.stroke();

        // 机械眼睛 - 红色扫描器
        graphics.fillColor = new Color(255, 50, 50, 255);
        graphics.rect(-8, -22, 6, 3);
        graphics.fill();
        graphics.rect(2, -22, 6, 3);
        graphics.fill();

        // 天线/通讯设备
        graphics.strokeColor = new Color(200, 200, 200, 255);
        graphics.lineWidth = 2;
        graphics.moveTo(-5, -25);
        graphics.lineTo(-5, -35);
        graphics.stroke();
        graphics.moveTo(5, -25);
        graphics.lineTo(5, -35);
        graphics.stroke();

        // 天线顶部
        graphics.fillColor = new Color(255, 100, 100, 255);
        graphics.circle(-5, -35, 2);
        graphics.fill();
        graphics.circle(5, -35, 2);
        graphics.fill();

        // 履带/移动系统
        graphics.fillColor = new Color(80, 80, 80, 255);
        graphics.rect(-18, 15, 36, 10);
        graphics.fill();
        graphics.stroke();

        // 履带齿轮
        for (let i = 0; i < 6; i++) {
            const x = -15 + (i * 6);
            graphics.fillColor = new Color(60, 60, 60, 255);
            graphics.circle(x, 20, 2);
            graphics.fill();
        }
    }

    /**
     * 绘制机械细节
     */
    private drawMechanicalDetails(graphics: Graphics): void {
        graphics.strokeColor = new Color(180, 180, 180, 255);
        graphics.lineWidth = 1;

        // 机械纹路
        graphics.moveTo(-12, -5);
        graphics.lineTo(12, -5);
        graphics.stroke();
        graphics.moveTo(-12, 0);
        graphics.lineTo(12, 0);
        graphics.stroke();
        graphics.moveTo(-12, 5);
        graphics.lineTo(12, 5);
        graphics.stroke();

        // 机械接缝
        graphics.moveTo(-15, -10);
        graphics.lineTo(-15, 10);
        graphics.stroke();
        graphics.moveTo(15, -10);
        graphics.lineTo(15, 10);
        graphics.stroke();
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
     * 更新机械特效（减少Graphics组件重复访问）
     */
    private updateMechanicalEffect(): void {
        if (!this._graphics) {
            this._graphics = this.getGraphicsComponent();
        }
        if (!this._graphics) return;

        // 重绘基础外观
        this._graphics.clear();
        this.drawBasicVisuals(this._graphics);

        // 添加扫描线特效
        const time = Date.now() / 1000;
        this._graphics.strokeColor = new Color(100, 255, 100, 150);
        this._graphics.lineWidth = 2;

        const scanY = -15 + (Math.sin(time * 4) + 1) * 15;
        this._graphics.moveTo(-15, scanY);
        this._graphics.lineTo(15, scanY);
        this._graphics.stroke();

        // 数据传输特效
        this._graphics.fillColor = new Color(100, 200, 255, 100);
        for (let i = 0; i < 3; i++) {
            const y = -8 + (i * 8) + Math.sin(time * 2 + i) * 2;
            this._graphics.rect(-2, y, 4, 2);
            this._graphics.fill();
        }
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
        const graphics = this.getGraphicsComponent();
        if (!graphics) return;

        // 机械召唤光环
        graphics.strokeColor = new Color(100, 200, 255, 200);
        graphics.lineWidth = 3;
        graphics.circle(0, 0, 40);
        graphics.stroke();

        // 数据流特效
        graphics.fillColor = new Color(150, 200, 255, 150);
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const x = Math.cos(angle) * 30;
            const y = Math.sin(angle) * 30;
            graphics.rect(x - 1, y - 1, 2, 2);
            graphics.fill();
        }

        // 1.5秒后恢复正常外观
        tween(this.node)
            .delay(1.5)
            .call(() => {
                const graphics = this.getGraphicsComponent();
                if (graphics) {
                    graphics.clear();
                    this.initializeMouseVisuals();
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
        const graphics = this.getGraphicsComponent();
        if (!graphics) return;

        // 修复光芒
        graphics.strokeColor = new Color(100, 255, 100, 200);
        graphics.lineWidth = 2;
        graphics.circle(0, 0, 25);
        graphics.stroke();

        // 修复粒子
        graphics.fillColor = new Color(150, 255, 150, 150);
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * 15;
            const y = Math.sin(angle) * 15;
            graphics.circle(x, y, 2);
            graphics.fill();
        }
    }

    /**
     * 机械军团长受伤效果
     */
    protected onTakeDamage(_damage: number): void {
        console.log("机械军团长装甲受损，启动应急修复程序！");

        // 应急修复特效
        const graphics = this.getGraphicsComponent();
        if (graphics) {
            // 添加警告特效
            graphics.strokeColor = new Color(255, 200, 0, 255);
            graphics.lineWidth = 3;
            graphics.circle(0, 0, 35);
            graphics.stroke();

            // 火花特效
            graphics.fillColor = new Color(255, 150, 50, 200);
            for (let i = 0; i < 8; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 20 + 15;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                graphics.circle(x, y, 1);
                graphics.fill();
            }
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

        // 机械爆炸特效
        const graphics = this.getGraphicsComponent();
        if (graphics) {
            graphics.clear();

            // 爆炸中心
            graphics.fillColor = new Color(255, 100, 50, 255);
            graphics.circle(0, 0, 20);
            graphics.fill();

            // 爆炸碎片
            graphics.fillColor = new Color(140, 140, 140, 200);
            for (let i = 0; i < 15; i++) {
                const angle = (i * Math.PI * 2) / 15;
                const distance = 25 + (i * 3);
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                graphics.rect(x - 2, y - 2, 4, 4);
                graphics.fill();
            }

            // 电弧残留
            graphics.strokeColor = new Color(100, 150, 255, 150);
            graphics.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                const angle = Math.random() * Math.PI * 2;
                const startX = Math.cos(angle) * 15;
                const startY = Math.sin(angle) * 15;
                const endX = Math.cos(angle) * 35;
                const endY = Math.sin(angle) * 35;
                graphics.moveTo(startX, startY);
                graphics.lineTo(endX, endY);
                graphics.stroke();
            }
        }

        // 调用父类死亡处理
        super.onDie();
    }
}
