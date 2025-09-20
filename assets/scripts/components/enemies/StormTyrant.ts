import { _decorator, Component, Color, Sprite, tween, Vec3 } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';
import { GameManager } from '../../managers/GameManager';
import { EnemyFactory } from '../../systems/EnemyFactory';

const { ccclass, property } = _decorator;

/**
 * 疾风暴君 - 极速移动召唤BOSS
 * 特点：极高移动速度，可以召唤疾速小兵，风暴特效
 */
@ccclass('StormTyrant')
export class StormTyrant extends BaseMouse {

    /** 敌人类型 */
    public readonly enemyType: EnemyType = EnemyType.STORM_TYRANT;

    /** 召唤数量 */
    private summonCount: number = 3;
    
    /** 召唤类型 */
    private summonType: EnemyType = EnemyType.SPEED_MOUSE;
    
    /** 召唤冷却时间 */
    private summonCooldown: number = 0;
    
    /** 风暴特效计时器 */
    private stormEffectTimer: number = 0;
    
    // 实现BaseMouse的抽象方法 - 疾风暴君配置
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.STORM_TYRANT,
            name: "疾风暴君",
            category: EnemyCategory.BOSS,
            health: 250,
            maxHealth: 250,
            moveSpeed: 140,
            goldReward: 90,
            summonCount: 3,
            summonType: EnemyType.SPEED_MOUSE
        };
    }

    protected onLoad(): void {
        super.onLoad();

        // 特殊属性配置
        const config = this.getConfig();
        this.summonCount = (config as any).summonCount || 3;
        this.summonType = (config as any).summonType || EnemyType.SPEED_MOUSE;

        console.log(`初始化${this.unitName}: 血量${this.maxHealth}, 移速${this.moveSpeed}, 奖励${this.goldReward}金币`);
    }

    /**
     * 初始化疾风暴君移动行为 - 大幅旋风式移动
     * 特点：使用spiral和curves模式，大摆动幅度，体现疾风特性
     */
    protected initializeMovementBehavior(): void {
        // 疾风暴君的移动模式 - 螺旋和曲线混合
        const patterns: ('spiral' | 'curves')[] = ['spiral', 'curves'];
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];

        // 大幅度的旋风式摆动 - 体现疾风暴君的狂野移动
        this._zigzagAmplitude = 60 + Math.random() * 40; // 60-100像素的大幅摆动
        this._segmentCount = 8 + Math.floor(Math.random() * 4); // 8-11段移动，增加旋风效果


        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }
    
    /**
     * 初始化疾风暴君外观
     */
    // 实现抽象方法：获取敌人图片路径
    protected getEnemyImagePath(): string {
        return "images/enemies/StormTyrant";
    }

    // 实现抽象方法：绘制Graphics外观（没有图片资源，使用Graphics绘制）
    
    /**
     * 更新风暴特效和召唤逻辑
     */
    protected update(dt: number): void {
        super.update(dt);
        
        // 更新风暴特效
        this.stormEffectTimer += dt;
        if (this.stormEffectTimer >= 0.5) {
            this.stormEffectTimer = 0;
            this.updateStormEffect();
        }
        
        // 召唤冷却
        this.summonCooldown -= dt;
        if (this.summonCooldown <= 0) {
            this.summonSpeedMinions();
            this.summonCooldown = 8.0; // 8秒召唤一次
        }
    }
    
    /**
     * 通过Sprite颜色变化实现风暴特效
     */
    private updateStormEffect(): void {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) return;

        // 动态风暴颜色效果
        const time = Date.now() / 1000;
        const intensity = (Math.sin(time * 3) + 1) / 2; // 0-1之间变化
        const blue = Math.floor(150 + intensity * 105); // 150-255之间变化
        const green = Math.floor(220 + intensity * 35); // 220-255之间变化

        sprite.color = new Color(100, green, blue, 255);
    }
    
    /**
     * 召唤疾速小兵
     */
    private summonSpeedMinions(): void {
        const gameManager = GameManager.instance;
        if (!gameManager) {
            console.error("GameManager不存在，无法召唤");
            return;
        }
        
        console.log(`疾风暴君召唤${this.summonCount}只疾速老鼠！`);
        
        // 在周围位置召唤疾速老鼠
        for (let i = 0; i < this.summonCount; i++) {
            const angle = (i * 2 * Math.PI) / this.summonCount;
            const distance = 60;
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
        
        // 召唤特效
        this.showSummonEffect();
    }
    
    /**
     * 通过Sprite颜色闪烁实现召唤特效
     */
    private showSummonEffect(): void {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) return;

        // 召唤时变为亮绿色
        const originalColor = sprite.color.clone();
        sprite.color = new Color(200, 255, 200, 255);

        // 1秒后恢复正常颜色
        tween(this.node)
            .delay(1.0)
            .call(() => {
                if (this.node && this.node.isValid && sprite) {
                    sprite.color = originalColor;
                }
            })
            .start();
    }
    
    /**
     * 疾风暴君受伤效果
     */
    protected onTakeDamage(damage: number): void {
        console.log("疾风暴君在风暴中闪避攻击！");
        
        // 风暴闪避特效 - 短暂变白色
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            const originalColor = sprite.color.clone();
            sprite.color = new Color(255, 255, 255, 255);

            // 0.2秒后恢复
            tween(this.node)
                .delay(0.2)
                .call(() => {
                    if (this.node && this.node.isValid && sprite) {
                        sprite.color = originalColor;
                    }
                })
                .start();
        }
    }
    
    /**
     * 疾风暴君特殊死亡效果
     */
    /**
     * 获取老鼠标签配置
     */
    
    protected onDie(): void {
        console.log("疾风暴君化作狂风消散...");
        
        // 风暴消散特效 - 渐变蓝色并渐隐
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(120, 190, 230, 255);

            // 渐隐消散
            tween(sprite)
                .to(0.8, { color: new Color(120, 190, 230, 0) })
                .start();
        }
        
        // 调用父类死亡处理
        super.onDie();
    }
}