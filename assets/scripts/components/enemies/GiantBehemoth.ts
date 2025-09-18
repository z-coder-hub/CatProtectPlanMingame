import { _decorator, Color, Graphics, tween, Vec3 } from 'cc';
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

        // 巨兽霸主体型更大
        this.node.scale = new Vec3(1.8, 1.8, 1);
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

        console.log(`巨兽霸主移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }

    /**
     * 初始化巨兽霸主外观
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
        // 巨兽霸主 - 深棕红色巨兽
        graphics.fillColor = new Color(120, 80, 50);
        graphics.roundRect(-30, -25, 60, 50, 8);
        graphics.fill();
        graphics.strokeColor = new Color(80, 50, 30);
        graphics.lineWidth = 4;
        graphics.stroke();
        // 巨兽头部
        graphics.fillColor = new Color(100, 65, 40);
        graphics.circle(0, -35, 20);
        graphics.fill();
        // 红色眼睛
        graphics.fillColor = new Color(200, 50, 50);
        graphics.circle(-8, -35, 4);
        graphics.fill();
        graphics.circle(8, -35, 4);
        graphics.fill();
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
        const graphics = this.getGraphicsComponent();
        if (!graphics) return;

        // 添加威慑光环
        graphics.strokeColor = new Color(255, 180, 80, 200);
        graphics.lineWidth = 5;
        graphics.circle(0, 0, this.intimidationRange);
        graphics.stroke();

        // 威慑波纹效果
        graphics.strokeColor = new Color(200, 120, 60, 150);
        graphics.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
            const radius = 30 + (i * 15);
            graphics.circle(0, 0, radius);
            graphics.stroke();
        }
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
        const graphics = this.getGraphicsComponent();
        if (!graphics) return;

        // 在目标位置显示威慑特效
        const relativePos = targetPos.subtract(this.node.position);
        graphics.fillColor = new Color(255, 200, 100, 150);
        graphics.circle(relativePos.x, relativePos.y, 12);
        graphics.fill();

        // 威慑波纹
        graphics.strokeColor = new Color(255, 180, 80, 100);
        graphics.lineWidth = 2;
        graphics.circle(relativePos.x, relativePos.y, 20);
        graphics.stroke();
    }

    /**
     * 显示威慑爆发特效
     */
    private showIntimidationExplosion(): void {
        const graphics = this.getGraphicsComponent();
        if (!graphics) return;

        // 重绘基础外观
        graphics.clear();
        this.initializeMouseVisuals();

        // 添加威慑爆发特效
        graphics.strokeColor = new Color(255, 180, 80, 255);
        graphics.lineWidth = 6;
        graphics.circle(0, 0, this.intimidationRange);
        graphics.stroke();

        // 威慑冲击波
        for (let i = 0; i < 4; i++) {
            graphics.strokeColor = new Color(255, 200, 120, 180 - (i * 40));
            graphics.lineWidth = 4;
            graphics.circle(0, 0, this.intimidationRange + (i * 25));
            graphics.stroke();
        }

        // 威慑光线
        graphics.strokeColor = new Color(255, 220, 100, 200);
        graphics.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI) / 6;
            const startX = Math.cos(angle) * 40;
            const startY = Math.sin(angle) * 40;
            const endX = Math.cos(angle) * (this.intimidationRange + 20);
            const endY = Math.sin(angle) * (this.intimidationRange + 20);
            graphics.moveTo(startX, startY);
            graphics.lineTo(endX, endY);
            graphics.stroke();
        }

        // 2秒后恢复正常外观
        tween(this.node)
            .delay(2.0)
            .call(() => {
                if (this.node && this.node.isValid) {
                    const graphics = this.getGraphicsComponent();
                    if (graphics) {
                        graphics.clear();
                        this.initializeMouseVisuals();
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

        // 愤怒威慑特效
        const graphics = this.getGraphicsComponent();
        if (graphics) {
            // 添加愤怒威慑光环
            graphics.strokeColor = new Color(255, 120, 60, 200);
            graphics.lineWidth = 4;
            graphics.circle(0, 0, 40);
            graphics.stroke();
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

        // 倒塌特效
        const graphics = this.getGraphicsComponent();
        if (graphics) {
            graphics.clear();

            // 显示倒塌的巨兽
            graphics.fillColor = new Color(120, 80, 50, 200);
            graphics.ellipse(0, 0, 80, 40); // 横向椭圆表示倒下
            graphics.fill();

            // 烟尘效果
            graphics.fillColor = new Color(150, 150, 150, 100);
            for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 60 + 30;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                const size = Math.random() * 8 + 4;
                graphics.circle(x, y, size);
                graphics.fill();
            }
        }

        // 调用父类死亡处理
        super.onDie();
    }
}
