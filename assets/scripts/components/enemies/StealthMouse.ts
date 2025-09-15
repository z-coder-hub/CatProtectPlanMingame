import { _decorator, Color, tween, Vec3, UIOpacity } from 'cc';
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
    
    // 私有属性（基类已提供 _graphics）
    
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
            name: "潜行老鼠",
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
    
    protected initializeMouseVisuals(): void {
        // 创建潜行老鼠外观 - 紫色半透明外观
        this._graphics = this.getGraphicsComponent();
        
        // 绘制潜行老鼠身体（较小且敏捷的外观）
        this.drawStealthMouseAppearance(false);
        
        console.log(`${this.unitName}外观创建完成`);
    }
    
    /**
     * 绘制潜行老鼠外观
     * @param isStealthed 是否处于潜行状态
     */
    private drawStealthMouseAppearance(isStealthed: boolean): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 根据潜行状态调整透明度和颜色
        const alpha = isStealthed ? 128 : 255;  // 潜行时半透明
        const bodyColor = isStealthed ? 
            new Color(150, 100, 200, alpha) :    // 潜行时偏紫色
            new Color(100, 100, 150, alpha);     // 正常时深蓝色
        
        // 绘制敏捷的身体（椭圆形，更流线型）
        this._graphics.fillColor = bodyColor;
        this._graphics.strokeColor = new Color(80, 80, 120, alpha);
        this._graphics.lineWidth = 2;
        
        // 主体 - 流线型椭圆
        this._graphics.ellipse(-14, -6, 28, 12);
        this._graphics.fill();
        this._graphics.stroke();
        
        // 头部
        this._graphics.fillColor = new Color(120, 120, 170, alpha);
        this._graphics.ellipse(-8, 2, 16, 10);
        this._graphics.fill();
        
        // 眼睛 - 敏锐的眼神
        const eyeColor = isStealthed ? 
            new Color(200, 150, 255, alpha) :    // 潜行时发光的紫色眼睛
            new Color(255, 255, 100, alpha);     // 正常时黄色眼睛
        
        this._graphics.fillColor = eyeColor;
        this._graphics.circle(-4, 5, 3);
        this._graphics.fill();
        this._graphics.circle(4, 5, 3);
        this._graphics.fill();
        
        // 耳朵 - 尖锐警觉
        this._graphics.fillColor = bodyColor;
        this._graphics.moveTo(-10, 8);
        this._graphics.lineTo(-6, 12);
        this._graphics.lineTo(-2, 8);
        this._graphics.close();
        this._graphics.fill();
        
        this._graphics.moveTo(2, 8);
        this._graphics.lineTo(6, 12);
        this._graphics.lineTo(10, 8);
        this._graphics.close();
        this._graphics.fill();
        
        // 尾巴 - 细长敏捷
        this._graphics.strokeColor = bodyColor;
        this._graphics.lineWidth = 3;
        this._graphics.moveTo(12, -2);
        this._graphics.quadraticCurveTo(18, -8, 24, -4);
        this._graphics.stroke();
        
        // 潜行特效 - 在潜行状态时添加光环
        if (isStealthed) {
            this._graphics.strokeColor = new Color(200, 150, 255, 100);
            this._graphics.lineWidth = 1;
            this._graphics.circle(0, 0, 20);
            this._graphics.stroke();
            this._graphics.circle(0, 0, 24);
            this._graphics.stroke();
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
        
        // 重新绘制外观
        if (this._graphics) {
            this.drawStealthMouseAppearance(this._isStealthed);
        }
        
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
            return;
        }
        
        // 没有闪避，正常受伤
        this.currentHealth = Math.max(0, this.currentHealth - damage);
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