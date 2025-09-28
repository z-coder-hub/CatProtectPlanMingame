import { _decorator, Color, Sprite, tween, Vec3, UIOpacity } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';

const { ccclass, property } = _decorator;

/**
 * 潜行老鼠 - 闪避型敌人，30%几率闪避攻击
 * 特点：血量30，移速65，30%闪避几率，奖励7金币
 */
@ccclass('StealthMouse')
export class StealthMouse extends BaseMouse {
    
    public readonly enemyType: EnemyType = EnemyType.STEALTH_MOUSE;
    
    // 私有属性
    
    @property({ tooltip: "闪避几率(0-1)" })
    public dodgeChance: number = 0.3;
    
    // 潜行状态（用于视觉效果）
    private _isStealthed: boolean = false;
    private _stealthTimer: number = 0;
    private _stealthCooldown: number = 3; // 3秒切换一次潜行状态
    
    // 实现BaseMouse的抽象方法 - 潜行老鼠配置
    protected getConfig(): EnemyConfig {
        return {
            type: EnemyType.STEALTH_MOUSE,
            name: "幻影鼠",
            category: EnemyCategory.SPECIAL,
            health: 30,
            maxHealth: 30,
            moveSpeed: 130,
            goldReward: 10,
            stealthChance: 0.2
        };
    }

    protected onLoad(): void {
        super.onLoad();

        // 初始化特殊属性：闪避几率
        const config = this.getConfig();
        this.dodgeChance = (config as any).stealthChance || 0.3;

        console.log(`初始化${this.unitName}: 血量${this.maxHealth}, 移速${this.moveSpeed}, 闪避${this.dodgeChance * 100}%, 奖励${this.goldReward}金币`);
    }
    
    // 实现抽象方法：获取敌人图片路径
    protected getEnemyImagePath(): string {
        return "images/enemies/StealthMouse";
    }

    /**
     * 通过Sprite颜色变化实现潜行效果
     * @param isStealthed 是否处于潜行状态
     */
    private updateStealthAppearance(isStealthed: boolean): void {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) return;

        // 根据潜行状态调整Sprite颜色
        if (isStealthed) {
            // 潜行时偏紫色半透明
            sprite.color = new Color(150, 100, 200, 160);
        } else {
            // 正常时深蓝色
            sprite.color = new Color(100, 100, 150, 255);
        }
    }
    
    /**
     * 重写update方法，添加潜行状态切换
     */
    protected update(dt: number): void {
        super.update(dt);
        
        if (!this.isAlive) return;
        
        // 潜行状态切换逻辑
        this._stealthTimer += dt;
        if (this._stealthTimer >= this._stealthCooldown) {
            this.toggleStealthState();
            this._stealthTimer = 0;
        }
    }
    
    /**
     * 切换潜行状态
     */
    private toggleStealthState(): void {
        this._isStealthed = !this._isStealthed;
        
        // 更新潜行外观
        this.updateStealthAppearance(this._isStealthed);
        
        // 调整节点透明度
        const uiOpacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        uiOpacity.opacity = this._isStealthed ? 160 : 255;
        
        console.log(`${this.unitName}${this._isStealthed ? '进入' : '退出'}潜行状态`);
    }
    
    /**
     * 重写受到伤害方法，应用闪避机制
     */
    public takeDamage(damage: number): void {
        if (!this.isAlive) return;

        // 闪避判定
        const dodgeRoll = Math.random();
        if (dodgeRoll < this.dodgeChance) {
            console.log(`${this.unitName}闪避了攻击！(${(dodgeRoll * 100).toFixed(1)}% < ${(this.dodgeChance * 100).toFixed(1)}%)`);
            this.createDodgeEffect();
            return; // 闪避成功，不受伤，血条无需更新
        }

        // 没有闪避，正常受伤
        this.currentHealth = Math.max(0, this.currentHealth - damage);

        // 更新血条显示
        this.updateMouseHealthBarDisplay();

        this.onTakeDamage(damage);

        if (this.currentHealth <= 0) {
            this.die();
        }
    }
    
    /**
     * 创建闪避特效
     */
    private createDodgeEffect(): void {
        // 闪避特效 - 快速左右移动
        const originalPos = this.node.position.clone();
        const dodgeDistance = 15;
        
        // 左闪
        this.node.setPosition(originalPos.x - dodgeDistance, originalPos.y, originalPos.z);
        
        tween(this)
            .delay(0.05)
            .call(() => {
                if (this.node && this.node.isValid) {
                    // 右闪
                    this.node.setPosition(originalPos.x + dodgeDistance, originalPos.y, originalPos.z);
                }
            })
            .delay(0.05)
            .call(() => {
                if (this.node && this.node.isValid) {
                    // 回到原位
                    this.node.setPosition(originalPos);
                }
            })
            .start();
    }

    /**
     * 对象池重用时的额外初始化
     * 重置幻影鼠的潜行状态和计时器
     */
    protected onReuse(): void {
        // 重置潜行状态
        this._isStealthed = false;
        this._stealthTimer = 0;
        this._stealthCooldown = 3; // 重置为默认值

        // 重置外观到正常状态
        this.updateStealthAppearance(false);

        console.log(`[StealthMouse] 🔄 重用时重置潜行系统: 潜行状态=false, 计时器=0, 冷却=${this._stealthCooldown}秒`);
    }

    /**
     * 获取潜行老鼠标签配置
     */
    
    // 重写基类移动行为初始化，使用潜行老鼠特殊参数
    protected initializeMovementBehavior(): void {
        // 潜行老鼠的移动参数配置：主要stealth_sway，也可zigzag
        const patterns: ('zigzag' | 'stealth_sway')[] = ['stealth_sway', 'stealth_sway', 'zigzag']; // 2:1比例
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)] as any;

        // 设置潜行移动参数
        this._zigzagAmplitude = 12 + Math.random() * 13; // 12-25像素
        this._segmentCount = 4 + Math.floor(Math.random() * 4); // 4-7段移动


        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }

    /**
     * 重写路径点生成，添加潜行摇摆效果
     */
    protected generatePathPoints(startPos: Vec3, castlePos: Vec3, totalDistance: number): Vec3[] {
        // 先调用基类方法获得基础路径点
        const basePoints = super.generatePathPoints(startPos, castlePos, totalDistance);

        // 如果是潜行摇摆模式，添加特殊效果
        if (this._movementPattern === 'stealth_sway') {
            for (let i = 1; i < basePoints.length; i++) {
                const point = basePoints[i];
                // 添加潜行状态的额外摇摆
                const swayAmplitude = this._isStealthed ? 8 : 4;
                const swayOffset = Math.sin(i * 1.5) * swayAmplitude;
                point.x += swayOffset;

                // 限制X坐标不要移动到屏幕外
                const maxX = 300;
                point.x = Math.max(-maxX, Math.min(maxX, point.x));
            }
        }

        return basePoints;
    }
    
    /**
     * 重写创建死亡特效 - 潜行单位的特殊消失效果
     */
    protected createDeathEffect(): void {
        // 潜行单位死亡 - 逐渐透明消失
        const fadeOutDuration = 0.5;
        const uiOpacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        const originalOpacity = uiOpacity.opacity;
        
        // 渐隐消失效果
        const fadeSteps = 10;
        const fadeInterval = fadeOutDuration / fadeSteps;
        
        let currentTween = tween(this);
        
        for (let i = 1; i <= fadeSteps; i++) {
            currentTween = currentTween
                .delay(fadeInterval)
                .call(() => {
                    if (this.node && this.node.isValid && uiOpacity) {
                        const newOpacity = originalOpacity * (1 - i / fadeSteps);
                        uiOpacity.opacity = newOpacity;
                    }
                });
        }
        
        currentTween.start();
        
        console.log(`${this.unitName}潜行消失...`);
    }
}