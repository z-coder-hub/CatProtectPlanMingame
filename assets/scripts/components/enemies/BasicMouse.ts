import { _decorator, Color, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';
import { DrawingHelper } from '../../utils/DrawingHelper';
import { EffectHelper } from '../../utils/EffectHelper';

const { ccclass } = _decorator;

@ccclass('BasicMouse')
export class BasicMouse extends BaseMouse {
    
    // 私有属性（基类已提供 _graphics 和移动系统）
    
    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.BASIC_MOUSE;
    
    // 实现BaseMouse的抽象方法 - 基础老鼠配置
    protected GetConfig(): EnemyConfig {
        return {
            type: EnemyType.BASIC_MOUSE,
            name: "基础老鼠",
            category: EnemyCategory.BASIC,
            health: 25,
            maxHealth: 25,
            moveSpeed: 120,
            goldReward: 3
        };
    }
    
    // 实现抽象方法：初始化老鼠外观
    protected initializeMouseVisuals(): void {
        // 初始化外观
        this.initializeVisuals();
    }
    
    // 重写基类移动行为初始化，使用基础老鼠的参数
    protected initializeMovementBehavior(): void {
        // 基础老鼠的移动参数配置
        const patterns: ('zigzag' | 'curves' | 'spiral')[] = ['zigzag', 'curves', 'spiral'];
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];

        // 设置蜿蜒参数
        this._zigzagAmplitude = 20 + Math.random() * 30; // 20-50像素的摆动幅度
        this._segmentCount = 4 + Math.floor(Math.random() * 4); // 4-7段移动

        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }
    
    // 初始化外观
    private initializeVisuals(): void {
        // 获取Graphics组件绘制外观
        this._graphics = this.getGraphicsComponent();
        
        this.drawMouseAppearance();
    }
    
    
    // 绘制老鼠外观
    private drawMouseAppearance(): void {
        if (!this._graphics) return;
        DrawingHelper.drawEnemyAppearance(this._graphics, 'basicMouse', 1.2);
    }
    
    // 实现BaseMouse的抽象方法 - 老鼠标签配置
    protected getMouseLabelConfig() {
        return {
            text: "鼠",
            fontSize: 22,
            color: new Color(255, 255, 255),
            yOffset: 35,
            size: { width: 60, height: 28 }
        };
    }

    // 实现BaseMouse的抽象方法 - 血条配置
    protected getHealthBarConfig() {
        return {
            width: 30,
            height: 4,
            yOffset: 25,
            backgroundColor: new Color(60, 60, 60),
            foregroundColor: new Color(0, 255, 0),
            borderColor: new Color(255, 255, 255),
            borderWidth: 1
        };
    }
    
    protected update(dt: number): void {
        super.update(dt);
        // 基类Tween系统自动处理移动，无需额外处理
    }
    
    // 基类已实现完整的Tween移动系统，无需重复实现
    
    // 重写城堡到达特效方法
    protected createCastleReachEffect(): void {
        if (this.node.parent) {
            EffectHelper.createAttackEffect(this.node.position, this.node.parent);
        }
    }
    
    // 重写受伤方法，添加受伤反馈
    protected onTakeDamage(damage: number): void {
        console.log(`基础老鼠受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);

        // 受伤闪烁效果
        this.playHurtEffect();
    }
    
    
    // 播放受伤效果
    private playHurtEffect(): void {
        if (!this._graphics) return;
        
        // 使用DrawingHelper绘制受伤效果
        DrawingHelper.drawHurtEffect(this._graphics, 'basicMouse', 1.2);
        
        // 200ms后恢复原色
        tween(this.node)
            .delay(0.2)
            .call(() => {
                if (this._graphics && this.node.isValid) {
                    this.drawMouseAppearance();
                }
            })
            .start();
    }
    
    // 重写死亡特效方法
    protected createDeathEffect(): void {
        if (this.node.parent) {
            EffectHelper.createDeathEffect(this.node.position, this.node.parent);
        }

        // 改变外观表示死亡
        if (this._graphics) {
            this._graphics.clear();
            this._graphics.fillColor = new Color(64, 64, 64); // 变暗
            DrawingHelper.drawEnemyAppearance(this._graphics, 'basicMouse', 1.2);
        }
    }
    
    // 实现抽象方法：执行攻击
    // 老鼠不再有攻击能力，移除 performAttack 方法
    // 基础老鼠只会朝城堡移动
    
}