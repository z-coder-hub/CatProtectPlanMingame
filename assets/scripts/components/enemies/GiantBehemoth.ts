import { _decorator, Color, Sprite, tween, Vec3 } from 'cc';
import { BattleManager } from '../../managers/BattleManager';
import { EnemyCategory, EnemyConfig, EnemyType } from '../../types/GameTypes';
import { BaseHero } from '../heroes/BaseHero';
import { BaseMouse } from './BaseMouse';

const { ccclass } = _decorator;

/**
 * 巨兽霸主 - 超大血量践踏BOSS
 * 特点：超高血量，践踏范围攻击，巨大体型，缓慢但威严
 */
@ccclass('GiantBehemoth')
export class GiantBehemoth extends BaseMouse {

    /** 敌人类型 */
    public readonly enemyType: EnemyType = EnemyType.GIANT_BEHEMOTH;

    /** 威慑特效范围 */
    private intimidationRange: number = 80;

    /** 威慑特效冷却时间 */
    private intimidationCooldown: number = 0;

    /** 是否正在展示威慑 */
    private isIntimidating: boolean = false;

    /**
     * 获取巨兽霸主配置
     */
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.GIANT_BEHEMOTH,
            name: "巨兽霸主",
            category: EnemyCategory.BOSS,
            health: 500,
            maxHealth: 500,
            moveSpeed: 40,
            goldReward: 120,
            aoeAttackRange: 80
        };
    }

    protected onLoad(): void {
        super.onLoad();

        // 威慑特效范围
        const config = this.getConfig();
        this.intimidationRange = config.aoeAttackRange || 80;
    }


    /**
     * 初始化巨兽霸主移动行为 - 威严稳重移动
     * 特点：使用straight模式，极小摆动，体现巨兽的威严和稳重
     */
    protected initializeMovementBehavior(): void {
        // 巨兽霸主的移动模式 - 直线为主，体现威严
        this._movementPattern = 'straight';

        // 极小的摆动幅度 - 体现巨兽的稳重和不可阻挡
        this._zigzagAmplitude = 3 + Math.random() * 5; // 3-8像素的微小摆动
        this._segmentCount = 3 + Math.floor(Math.random() * 2); // 3-4段移动，保持简洁威严


        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }

    /**
     * 初始化巨兽霸主外观
     */
    // 实现抽象方法：获取敌人图片路径
    protected getEnemyImagePath(): string {
        return "images/enemies/GiantBehemoth";
    }

    // 实现抽象方法：绘制Graphics外观（没有图片资源，使用Graphics绘制）
    protected drawEnemyGraphics(graphics: any): void {
        // 巨兽霸主已迁移到Sprite颜色系统
        // 使用深棕红色代表巨兽的威严
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(120, 80, 50); // 深棕红色巨兽
        }
    }

    /**
     * 更新威慑特效逻辑
     */
    protected update(dt: number): void {
        super.update(dt);

        // 威慑特效冷却
        this.intimidationCooldown -= dt;
        if (this.intimidationCooldown <= 0 && !this.isIntimidating) {
            this.performIntimidationEffect();
            this.intimidationCooldown = 8.0; // 8秒展示一次威慑
        }
    }

    /**
     * 执行威慑特效展示
     */
    private performIntimidationEffect(): void {
        if (this.isIntimidating) return;

        this.isIntimidating = true;
        console.log(`巨兽霸主展示威慑气场！范围：${this.intimidationRange}`);

        // 威慑前摇特效
        this.showIntimidationChargeEffect();

        // 1.5秒后展示威慑爆发
        tween(this.node)
            .delay(1.5)
            .call(() => {
                this.showIntimidationBurst();
                this.isIntimidating = false;
            })
            .start();
    }

    /**
     * 显示威慑蓄力特效
     */
    private showIntimidationChargeEffect(): void {
        // 威慑蓄力特效 - 改为Sprite颜色变化
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 180, 80); // 威慑光环色
        }
        console.log(`巨兽霸主展示威慑蓄力特效，范围：${this.intimidationRange}`);
    }

    /**
     * 展示威慑爆发特效
     */
    private showIntimidationBurst(): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;

        // 检测范围内的英雄，展示威慑效果（不造成伤害）
        const myPosition = this.node.position;
        const deployedHeroes = battleManager.getAllDeployedHeroes();
        if (!deployedHeroes || deployedHeroes.length === 0) return;

        deployedHeroes.forEach(heroNode => {
            if (!heroNode || !heroNode.isValid) return;

            const distance = Vec3.distance(myPosition, heroNode.position);
            if (distance <= this.intimidationRange) {
                // 获取英雄组件
                const heroComponent = heroNode.getComponent(BaseHero);
                if (heroComponent) {
                    // 纯视觉威慑效果，不造成伤害
                    console.log(`英雄${heroComponent.unitName}感受到巨兽霸主的威慑气场！`);
                    this.showIntimidationHitEffect(heroNode.position);
                }
            }
        });

        // 威慑爆发特效
        this.showIntimidationExplosion();
    }

    /**
     * 显示威慑命中特效
     */
    private showIntimidationHitEffect(targetPos: Vec3): void {
        // 威慑命中特效 - 改为日志输出
        const relativePos = targetPos.subtract(this.node.position);
        console.log(`巨兽霸主在位置(${relativePos.x.toFixed(1)}, ${relativePos.y.toFixed(1)})显示威慑命中特效`);
    }

    /**
     * 显示威慑爆发特效
     */
    private showIntimidationExplosion(): void {
        // 威慑爆发特效 - 改为Sprite颜色变化
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 180, 80); // 威慑爆发色
        }
        console.log(`巨兽霸主展示威慑爆发特效，范围：${this.intimidationRange}`);

        // 2秒后恢复正常外观
        tween(this.node)
            .delay(2.0)
            .call(() => {
                if (this.node && this.node.isValid) {
                    const sprite = this.node.getComponent(Sprite);
                    if (sprite) {
                        sprite.color = new Color(120, 80, 50); // 恢复深棕红色
                    }
                }
            })
            .start();
    }

    /**
     * 巨兽霸主受伤效果
     */
    protected onTakeDamage(_damage: number): void {
        console.log("巨兽霸主发出威慑的咆哮！");

        // 简化的受伤效果
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 120, 60);

            tween(this.node)
                .delay(0.3)
                .call(() => {
                    if (sprite && this.node.isValid) {
                        sprite.color = Color.WHITE;
                    }
                })
                .start();
        }
    }

    /**
     * 巨兽霸主特殊死亡效果
     */
    /**
     * 获取老鼠标签配置
     */

    protected onDie(): void {
        console.log("巨兽霸主轰然倒下，大地震颤！");

        // 简化的死亡效果
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(120, 80, 50, 200);
        }

        // 调用父类死亡处理
        super.onDie();
    }

    /**
     * 对象池重用时的额外初始化
     * 重置巨兽霸主的威慑范围
     */
    protected onReuse(): void {
        // 重新初始化威慑范围
        const config = this.getConfig();
        this.intimidationRange = config.aoeAttackRange || 80;

        console.log(`[GiantBehemoth] 🔄 重用时重置威慑范围: ${this.intimidationRange}`);
    }
}
