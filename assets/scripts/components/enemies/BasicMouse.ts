import { _decorator, Node, Vec3, Graphics, Color } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType } from '../../types/GameTypes';
import { ENEMY_CONFIGS } from '../../types/GameConstants';
import { DrawingHelper } from '../../utils/DrawingHelper';
import { EffectHelper } from '../../utils/EffectHelper';

const { ccclass } = _decorator;

@ccclass('BasicMouse')
export class BasicMouse extends BaseMouse {
    
    // 私有属性
    private _graphics: Graphics | null = null;
    private _healthBarContainer: Node | null = null;
    private _healthBarForeground: Graphics | null = null;
    
    // 移动行为相关属性
    private _movementTimer: number = 0;
    private _currentDirection: Vec3 = new Vec3(0, -1, 0); // 当前移动方向
    private _zigzagAmplitude: number = 0;                 // 蜿蜒幅度
    private _zigzagFrequency: number = 0;                 // 蜿蜒频率
    private _movementPattern: 'zigzag' | 'curves' = 'zigzag'; // 移动模式
    
    // 性能优化相关
    private _movementUpdateInterval: number = 0.1;       // 移动更新间隔(10fps)
    private _lastMovementUpdate: number = 0;              // 上次移动更新时间
    
    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.BASIC_MOUSE;
    
    // 实现抽象方法：初始化老鼠属性
    protected initializeMouseStats(): void {
        const config = ENEMY_CONFIGS[EnemyType.BASIC_MOUSE];
        
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
        
        // 初始化随机移动行为参数
        this.initializeMovementBehavior();
    }
    
    // 实现抽象方法：初始化老鼠外观
    protected initializeMouseVisuals(): void {
        // 初始化外观
        this.initializeVisuals();
        
        // 初始化血条
        this.initializeHealthBar();
    }
    
    // 初始化移动行为
    private initializeMovementBehavior(): void {
        // 随机选择移动模式（移除冲刺模式）
        const patterns: ('zigzag' | 'curves')[] = ['zigzag', 'curves'];
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        // 设置蜿蜒参数（减小幅度，提高流畅度）
        this._zigzagAmplitude = 10 + Math.random() * 15; // 10-25像素的摆动幅度（减小）
        this._zigzagFrequency = 0.5 + Math.random() * 1;   // 0.5-1.5的频率（减小）
        
        console.log(`老鼠移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}`);
    }
    
    // 初始化外观
    private initializeVisuals(): void {
        // 添加Graphics组件绘制外观
        this._graphics = this.node.addComponent(Graphics);
        
        this.drawMouseAppearance();
    }
    
    // 初始化血条
    private initializeHealthBar(): void {
        const healthBarData = DrawingHelper.createHealthBar(this.node, {
            width: 30,
            height: 4,
            position: { x: 0, y: 25, z: 0 }, // 在老鼠上方
            backgroundColor: new Color(60, 60, 60), // 深灰色背景
            foregroundColor: new Color(0, 255, 0), // 绿色前景
            borderColor: new Color(255, 255, 255), // 白色边框
            borderWidth: 1
        });
        
        this._healthBarContainer = healthBarData.container;
        this._healthBarForeground = healthBarData.foreground;
        
        // 血条始终显示
        this._healthBarContainer.active = true;
        
        // 初始化血条显示
        this.updateHealthBarDisplay();
    }
    
    // 绘制老鼠外观
    private drawMouseAppearance(): void {
        if (!this._graphics) return;
        DrawingHelper.drawEnemyAppearance(this._graphics, 'basicMouse', 1.2);
    }
    
    // 重写标签配置 - 使用统一大字体
    protected getMouseLabelConfig() {
        const baseConfig = super.getMouseLabelConfig();
        return {
            ...baseConfig,
            text: "鼠",
            color: new Color(255, 255, 255), // 白色文字
        };
    }
    
    protected update(dt: number): void {
        super.update(dt);
        
        // 性能优化：减少移动更新频率
        this._lastMovementUpdate += dt;
        if (this._lastMovementUpdate >= this._movementUpdateInterval) {
            const movementDt = this._lastMovementUpdate;
            this._lastMovementUpdate = 0;
            
            // 如果没有在战斗中，朝城堡移动
            if (this.unitState === 0 && this.isAlive) { // 待机状态
                this.moveTowardsCastle(movementDt);
            }
        }
    }
    
    // 重写朝城堡移动 - 基础老鼠的蜿蜒移动行为
    protected moveTowardsCastle(dt: number): void {
        if (!this._gameManager || !this._gameManager.castleNode) return;
        
        const currentPos = this.node.position;
        const castlePos = this._gameManager.castleNode.position;
        
        // 检查是否到达城堡Y位置（城堡是横跨整个屏幕的）
        if (currentPos.y <= castlePos.y + 50) {
            this.reachCastle();
            return;
        }
        
        // 更新移动计时器
        this._movementTimer += dt;
        
        // 根据移动模式计算移动方向
        this.updateMovementDirection();
        
        // 执行移动
        const moveDistance = this.moveSpeed * dt;
        const moveVector = Vec3.multiplyScalar(new Vec3(), this._currentDirection, moveDistance);
        const newPos = Vec3.add(new Vec3(), currentPos, moveVector);
        
        // 限制X坐标不要移动到屏幕外
        const maxX = 300; // 屏幕边界限制
        newPos.x = Math.max(-maxX, Math.min(maxX, newPos.x));
        
        this.node.setPosition(newPos);
    }
    
    
    // 更新移动方向
    private updateMovementDirection(): void {
        switch (this._movementPattern) {
            case 'zigzag':
                this.updateZigzagMovement();
                break;
            case 'curves':
                this.updateCurvedMovement();
                break;
        }
    }
    
    // 蜿蜒移动（Z字形）- 保持匀速
    private updateZigzagMovement(): void {
        const xDirection = Math.sin(this._movementTimer * this._zigzagFrequency) * 0.3; // 横向分量
        
        // 设置方向向量并归一化，确保匀速移动
        this._currentDirection.set(xDirection, -1, 0);
        this._currentDirection.normalize();
    }
    
    // 曲线移动（S形）- 保持匀速
    private updateCurvedMovement(): void {
        const curveOffset = Math.sin(this._movementTimer * this._zigzagFrequency * 0.8) * 0.4; // 更明显的曲线
        
        // 设置方向向量并归一化，确保匀速移动
        this._currentDirection.set(curveOffset, -1, 0);
        this._currentDirection.normalize();
    }
    
    
    // 重写城堡攻击特效方法
    protected createCastleAttackEffect(): void {
        if (this.node.parent) {
            EffectHelper.createAttackEffect(this.node.position, this.node.parent);
        }
    }
    
    // 重写受伤方法，添加受伤反馈
    protected onTakeDamage(damage: number): void {
        console.log(`基础老鼠受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);
        
        // 更新血条显示
        this.updateHealthBarDisplay();
        
        // 受伤闪烁效果
        this.playHurtEffect();
    }
    
    // 更新血条显示
    private updateHealthBarDisplay(): void {
        if (this._healthBarForeground && this._healthBarContainer) {
            const healthPercent = this.currentHealth / this.maxHealth;
            DrawingHelper.updateHealthBar(this._healthBarForeground, healthPercent, 30, 4);
            
            // 血条始终显示，只有死亡时才隐藏
            this._healthBarContainer.active = healthPercent > 0;
        }
    }
    
    // 播放受伤效果
    private playHurtEffect(): void {
        if (!this._graphics) return;
        
        // 使用DrawingHelper绘制受伤效果
        DrawingHelper.drawHurtEffect(this._graphics, 'basicMouse', 1.2);
        
        // 200ms后恢复原色
        this.scheduleOnce(() => {
            if (this._graphics && this.node.isValid) {
                this.drawMouseAppearance();
            }
        }, 0.2);
    }
    
    // 重写死亡特效方法
    protected createDeathEffect(): void {
        if (this.node.parent) {
            EffectHelper.createDeathEffect(this.node.position, this.node.parent);
        }
        
        // 隐藏血条
        if (this._healthBarContainer) {
            this._healthBarContainer.active = false;
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