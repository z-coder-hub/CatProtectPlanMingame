import { _decorator, Graphics, Color, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyConfig, EnemyCategory } from '../../types/GameTypes';
import { GameManager } from '../../managers/GameManager';
import { BattleManager } from '../../managers/BattleManager';
import { DrawingHelper } from '../../utils/DrawingHelper';
import { EffectHelper } from '../../utils/EffectHelper';

const { ccclass, property } = _decorator;

@ccclass('FastMouse')
export class FastMouse extends BaseMouse {
    
    @property({ tooltip: "金币奖励", override: true })
    public goldReward: number = 4;
    
    // 私有属性（基类已提供 _graphics 和移动系统）
    
    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.FAST_MOUSE;

    // 实现BaseMouse的抽象方法 - 快速老鼠配置
    protected GetConfig(): EnemyConfig {
        return {
            type: EnemyType.FAST_MOUSE,
            name: "快速老鼠",
            category: EnemyCategory.FAST,
            health: 20,
            maxHealth: 20,
            moveSpeed: 160,
            goldReward: 5
        };
    }
    
    // 实现BaseMouse的抽象方法
    protected initializeMouseVisuals(): void {
        this.initializeVisuals();
        this.initializeMovementBehavior();
    }
    
    // 快速老鼠不再有攻击能力，移除 performAttack 方法
    
    protected onLoad(): void {
        // 先调用父类初始化
        super.onLoad();
    }
    
    protected start(): void {
        super.start();
        // 基类已经处理GameManager引用和BattleManager注册，无需重复
    }
    
    
    // 重写基类移动行为初始化，使用快速老鼠的参数
    protected initializeMovementBehavior(): void {
        // 快速老鼠的移动参数配置：偏爱dash和zigzag
        const patterns: ('zigzag' | 'dash')[] = ['zigzag', 'dash', 'dash']; // 2/3概率冲刺
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];

        // 设置更激进的移动参数
        this._zigzagAmplitude = 15 + Math.random() * 20; // 15-35像素的大幅摆动
        this._segmentCount = 3 + Math.floor(Math.random() * 4); // 3-6段移动（更少分段，更快）

        console.log(`${this.unitName}移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}, 分段数: ${this._segmentCount}`);
    }
    
    // 初始化外观
    private initializeVisuals(): void {
        // 获取Graphics组件绘制外观
        this._graphics = this.getGraphicsComponent();
        
        this.drawFastMouseAppearance();
    }
    
    
    // 绘制快速老鼠外观
    private drawFastMouseAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 绘制快速老鼠身体（亮绿色，表示速度）
        this._graphics.fillColor = new Color(50, 205, 50); // 亮绿色
        this._graphics.circle(0, 0, 12);
        this._graphics.fill();
        
        // 绘制轮廓
        this._graphics.strokeColor = new Color(34, 139, 34); // 深绿色轮廓
        this._graphics.lineWidth = 2;
        this._graphics.circle(0, 0, 12);
        this._graphics.stroke();
        
        // 绘制速度线条（表示快速移动）
        this._graphics.strokeColor = new Color(255, 255, 0); // 黄色速度线
        this._graphics.lineWidth = 2;
        // 左侧速度线
        this._graphics.moveTo(-8, -8);
        this._graphics.lineTo(-12, -12);
        this._graphics.moveTo(-8, 0);
        this._graphics.lineTo(-12, 0);
        this._graphics.moveTo(-8, 8);
        this._graphics.lineTo(-12, 12);
        // 右侧速度线
        this._graphics.moveTo(8, -8);
        this._graphics.lineTo(12, -12);
        this._graphics.moveTo(8, 0);
        this._graphics.lineTo(12, 0);
        this._graphics.moveTo(8, 8);
        this._graphics.lineTo(12, 12);
        this._graphics.stroke();
        
        // 绘制眼睛（红色，表示警觉）
        this._graphics.fillColor = new Color(255, 0, 0); // 红色眼睛
        this._graphics.circle(-4, -4, 2);
        this._graphics.fill();
        this._graphics.circle(4, -4, 2);
        this._graphics.fill();
    }
    
    // 重写标签配置 - 使用统一大字体
    protected getMouseLabelConfig() {
        return {
            text: "快鼠",
            fontSize: 22,
            color: new Color(50, 205, 50), // 绿色文字
            yOffset: 35,
            size: { width: 60, height: 28 }
        };
    }

    // 实现BaseMouse的抽象方法 - 血条配置
    protected getHealthBarConfig() {
        return {
            width: 25,
            height: 3,
            yOffset: 20,
            backgroundColor: new Color(60, 60, 60),
            foregroundColor: new Color(255, 165, 0), // 橙色前景（区别于基础老鼠）
            borderColor: new Color(255, 255, 255),
            borderWidth: 1
        };
    }
    
    protected update(dt: number): void {
        super.update(dt);
        // 基类Tween系统自动处理移动，无需额外处理
    }
    
    // 基类已实现完整的Tween移动系统，无需重复实现传统帧更新移动
    
    // 移除攻击城堡方法，使用父类的 reachCastle 方法
    
    // 移除攻击特效方法
    
    // 重写受伤方法，添加受伤反馈
    protected onTakeDamage(damage: number): void {
        console.log(`快速老鼠受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);

        // 受伤闪烁效果
        this.playHurtEffect();
    }
    
    
    // 播放受伤效果
    private playHurtEffect(): void {
        if (!this._graphics) return;
        
        // 使用DrawingHelper绘制受伤效果，但用红色高亮
        this._graphics.clear();
        this._graphics.fillColor = new Color(255, 100, 100); // 红色受伤效果
        this._graphics.circle(0, 0, 12);
        this._graphics.fill();
        
        // 200ms后恢复原色，使用Tween系统替代scheduleOnce
        tween(this.node)
            .delay(0.2)
            .call(() => {
                if (this._graphics && this.node.isValid) {
                    this.drawFastMouseAppearance();
                }
            })
            .start();
    }
    
    // 重写创建死亡特效方法，添加快速老鼠的特殊特效
    protected createDeathEffect(): void {
        if (this.node.parent) {
            EffectHelper.createDeathEffect(this.node.position, this.node.parent);
        }
    }
    
    // 基类已实现完整的移动管理，无需重写状态处理
    
    // 移除攻击英雄方法，快速老鼠不再攻击
}