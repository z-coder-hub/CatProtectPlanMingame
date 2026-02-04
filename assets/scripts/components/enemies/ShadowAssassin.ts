import { _decorator, Color, Sprite, tween, UIOpacity } from 'cc';
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
    protected getEnemyImagePath(): string {
        return "images/enemies/ShadowAssassin";
    }

    /**
     * 通过Sprite颜色和透明度实现潜行效果
     * @param isStealthed 是否潜行状态
     */
    private updateStealthAppearance(isStealthed: boolean): void {
        const sprite = this.node.getComponent(Sprite);
        const uiOpacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);

        if (isStealthed) {
            // 潜行时半透明紫色
            if (sprite) {
                sprite.color = new Color(80, 40, 120, 255);
            }
            uiOpacity.opacity = 120; // 半透明
        } else {
            // 显现时深灰色
            if (sprite) {
                sprite.color = new Color(50, 50, 50, 255);
            }
            uiOpacity.opacity = 255; // 完全不透明
        }
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
                this.updateStealthAppearance(this.isStealthed);
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
            this.updateStealthAppearance(false);
        }
    }
    
    /**
     * 潜影刺客特殊死亡效果
     */
    protected onDie(): void {
        console.log("潜影刺客消失在阴影中...");

        // 阴影消散特效 - 通过渐隐实现
        const uiOpacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        const sprite = this.node.getComponent(Sprite);

        // 渐变为深紫色并渐隐
        if (sprite) {
            sprite.color = new Color(40, 20, 60, 255);
        }

        // 渐隐消散效果
        tween(uiOpacity)
            .to(0.8, { opacity: 0 })
            .call(() => {
                if (this.node && this.node.isValid) {
                    super.onDie();
                }
            })
            .start();
    }

    /**
     * 对象池重用时的额外初始化
     * 重置潜影刺客的特殊状态和属性
     */
    protected onReuse(): void {
        // 重新初始化潜行相关属性
        const config = this.getConfig();
        this.stealthChance = config.stealthChance || 0.6;
        this.damageReduction = config.damageReduction || 0.3;

        // 重置状态
        this.isStealthed = false;
        this.stealthTimer = 0;

        // 重置外观到正常状态
        this.updateStealthAppearance(false);

        console.log(`[ShadowAssassin] 🔄 重用时重置潜行属性: 潜行几率=${this.stealthChance}, 减伤=${this.damageReduction}`);
    }

    /**
     * 实现标签配置
     */
}