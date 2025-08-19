import { _decorator, Component, Node, Vec3, Graphics, Color, Label, UITransform } from 'cc';
import { BaseUnit } from '../base/BaseUnit';
import { EnemyType } from '../../types/GameTypes';
import { ENEMY_CONFIGS, GAME_CONSTANTS } from '../../types/GameConstants';
import { GameManager } from '../../managers/GameManager';
import { BattleManager } from '../../managers/BattleManager';
import { DrawingHelper } from '../../utils/DrawingHelper';
import { EffectHelper } from '../../utils/EffectHelper';

const { ccclass, property } = _decorator;

@ccclass('FastMouse')
export class FastMouse extends BaseUnit {
    
    @property({ tooltip: "金币奖励" })
    public goldReward: number = 4;
    
    // 私有属性
    private _graphics: Graphics | null = null;
    private _gameManager: GameManager | null = null;
    private _nameLabel: Label | null = null;
    private _healthBarContainer: Node | null = null;
    private _healthBarForeground: Graphics | null = null;
    
    // 移动行为相关属性
    private _movementTimer: number = 0;
    private _currentDirection: Vec3 = new Vec3(0, -1, 0); // 当前移动方向
    private _baseDirection: Vec3 = new Vec3(0, -1, 0);    // 基础向下方向
    private _zigzagAmplitude: number = 0;                 // 蜿蜒幅度
    private _zigzagFrequency: number = 0;                 // 蜿蜒频率
    private _pauseTimer: number = 0;                      // 停顿计时器
    private _isPaused: boolean = false;                   // 是否处于停顿状态
    private _nextPauseTime: number = 0;                   // 下次停顿时间
    private _movementPattern: 'zigzag' | 'dash' = 'dash'; // 移动模式（快速老鼠偏爱冲刺）
    
    // 性能优化相关
    private _movementUpdateInterval: number = 0.08;      // 快速老鼠更新更频繁(12.5fps)
    private _lastMovementUpdate: number = 0;              // 上次移动更新时间
    
    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.FAST_MOUSE;
    
    protected onLoad(): void {
        // 先调用父类初始化
        super.onLoad();
        
        // 设置快速老鼠属性
        this.initializeFastMouseStats();
        
        // 初始化外观
        this.initializeVisuals();
        
        // 初始化血条
        this.initializeHealthBar();
    }
    
    protected start(): void {
        super.start();
        
        // 获取GameManager引用
        this._gameManager = GameManager.instance;
        
        // 注册到BattleManager
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.registerEnemy(this.node);
        }
    }
    
    // 初始化快速老鼠属性
    private initializeFastMouseStats(): void {
        const config = ENEMY_CONFIGS[EnemyType.FAST_MOUSE];
        
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
        
        // 初始化随机移动行为参数
        this.initializeMovementBehavior();
    }
    
    // 初始化移动行为
    private initializeMovementBehavior(): void {
        // 快速老鼠偏爱直冲或快速之字形
        const patterns: ('zigzag' | 'dash')[] = ['zigzag', 'dash', 'dash']; // 2/3概率冲刺
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        // 设置更激进的移动参数
        this._zigzagAmplitude = 15 + Math.random() * 20; // 15-35像素的大幅摆动
        this._zigzagFrequency = 1.5 + Math.random() * 2;   // 1.5-3.5的高频率
        
        // 减少停顿频率（快速老鼠很少停顿）
        this._nextPauseTime = 15 + Math.random() * 20; // 15-35秒后第一次停顿
        
        console.log(`快速老鼠移动模式: ${this._movementPattern}, 摆动幅度: ${this._zigzagAmplitude.toFixed(1)}`);
    }
    
    // 初始化外观
    private initializeVisuals(): void {
        // 添加Graphics组件绘制外观
        this._graphics = this.node.addComponent(Graphics);
        
        this.drawFastMouseAppearance();
        
        // 创建名称标签
        this.createNameLabel();
    }
    
    // 初始化血条
    private initializeHealthBar(): void {
        const healthBarData = DrawingHelper.createHealthBar(this.node, {
            width: 25,              // 稍小的血条
            height: 3,              // 更薄的血条
            position: { x: 0, y: 20, z: 0 }, // 在快速老鼠上方
            backgroundColor: new Color(60, 60, 60), // 深灰色背景
            foregroundColor: new Color(255, 165, 0), // 橙色前景（区别于基础老鼠）
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
    
    // 创建名称标签
    private createNameLabel(): void {
        this._nameLabel = DrawingHelper.createLabel(this.node, {
            text: "快鼠",
            fontSize: 14,
            color: new Color(50, 205, 50), // 绿色文字
            position: { x: 0, y: 0, z: 0 },
            size: { width: 35, height: 18 }
        });
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
    
    // 朝城堡移动 - 快速老鼠移动行为
    private moveTowardsCastle(dt: number): void {
        if (!this._gameManager) return;
        
        const currentPos = this.node.position;
        const castleY = GAME_CONSTANTS.CASTLE_POSITION.y;
        
        // 检查是否到达城堡Y位置
        if (currentPos.y <= castleY + 50) {
            this.attackCastle();
            return;
        }
        
        // 更新移动计时器
        this._movementTimer += dt;
        
        // 处理随机停顿（快速老鼠停顿更少）
        if (this.handleRandomPause(dt)) {
            return;
        }
        
        // 根据移动模式计算移动方向
        this.updateMovementDirection();
        
        // 执行移动（快速老鼠移动速度更快）
        const moveDistance = this.moveSpeed * dt;
        const moveVector = Vec3.multiplyScalar(new Vec3(), this._currentDirection, moveDistance);
        const newPos = Vec3.add(new Vec3(), currentPos, moveVector);
        
        // 限制X坐标不要移动到屏幕外
        const maxX = 300;
        newPos.x = Math.max(-maxX, Math.min(maxX, newPos.x));
        
        this.node.setPosition(newPos);
    }
    
    // 处理随机停顿（快速老鼠很少停顿）
    private handleRandomPause(dt: number): boolean {
        if (this._isPaused) {
            this._pauseTimer -= dt;
            if (this._pauseTimer <= 0) {
                this._isPaused = false;
                // 设置下次停顿时间（更长间隔）
                this._nextPauseTime = this._movementTimer + 20 + Math.random() * 25; // 20-45秒后再次停顿
            }
            return true;
        }
        
        // 检查是否该停顿了
        if (this._movementTimer >= this._nextPauseTime) {
            this._isPaused = true;
            this._pauseTimer = 0.05 + Math.random() * 0.1; // 停顿0.05-0.15秒（极短）
            return true;
        }
        
        return false;
    }
    
    // 更新移动方向
    private updateMovementDirection(): void {
        switch (this._movementPattern) {
            case 'zigzag':
                this.updateZigzagMovement();
                break;
            case 'dash':
                this.updateDashMovement();
                break;
        }
    }
    
    // 快速之字形移动
    private updateZigzagMovement(): void {
        const xDirection = Math.sin(this._movementTimer * this._zigzagFrequency) * 0.4; // 更大的横向分量
        
        // 设置方向向量并归一化，确保匀速移动
        this._currentDirection.set(xDirection, -1, 0);
        this._currentDirection.normalize();
    }
    
    // 快速冲刺移动
    private updateDashMovement(): void {
        const dashCycle = this._movementTimer % 2; // 2秒一个周期（更短）
        if (dashCycle < 1.8) {
            // 直线冲刺 - 直接向下
            this._currentDirection.set(0, -1, 0);
        } else {
            // 短暂调整方向
            const xOffset = (Math.random() - 0.5) * 0.6; // 随机横向调整
            this._currentDirection.set(xOffset, -1, 0);
        }
        this._currentDirection.normalize();
    }
    
    // 攻击城堡
    private attackCastle(): void {
        if (!this._gameManager) return;
        
        // 对城堡造成伤害
        this._gameManager.castleTakeDamage(this.attackDamage);
        
        // 创建攻击特效
        this.createAttackEffect();
        
        // 移除自己
        this._gameManager.removeActiveEnemy(this.node);
        this.die();
        
        console.log(`快速老鼠攻击城堡，造成 ${this.attackDamage} 点伤害`);
    }
    
    // 创建攻击特效
    private createAttackEffect(): void {
        if (this.node.parent) {
            EffectHelper.createAttackEffect(this.node.position, this.node.parent);
        }
    }
    
    // 重写受伤方法，添加受伤反馈
    protected onTakeDamage(damage: number): void {
        console.log(`快速老鼠受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);
        
        // 更新血条显示
        this.updateHealthBarDisplay();
        
        // 受伤闪烁效果
        this.playHurtEffect();
    }
    
    // 更新血条显示
    private updateHealthBarDisplay(): void {
        if (this._healthBarForeground && this._healthBarContainer) {
            const healthPercent = this.currentHealth / this.maxHealth;
            DrawingHelper.updateHealthBar(this._healthBarForeground, healthPercent, 25, 3);
            
            // 血条始终显示，只有死亡时才隐藏
            this._healthBarContainer.active = healthPercent > 0;
        }
    }
    
    // 播放受伤效果
    private playHurtEffect(): void {
        if (!this._graphics) return;
        
        // 使用DrawingHelper绘制受伤效果，但用红色高亮
        this._graphics.clear();
        this._graphics.fillColor = new Color(255, 100, 100); // 红色受伤效果
        this._graphics.circle(0, 0, 12);
        this._graphics.fill();
        
        // 200ms后恢复原色
        this.scheduleOnce(() => {
            if (this._graphics && this.node.isValid) {
                this.drawFastMouseAppearance();
            }
        }, 0.2);
    }
    
    // 重写死亡方法
    protected onDie(): void {
        console.log(`快速老鼠死亡，奖励 ${this.goldReward} 金币`);
        
        // 从BattleManager注销
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.unregisterEnemy(this.node);
        }
        
        // 给予金币奖励
        if (this._gameManager) {
            this._gameManager.addGold(this.goldReward);
            this._gameManager.removeActiveEnemy(this.node);
        }
        
        // 创建死亡特效
        this.createDeathEffect();
        
        // 隐藏血条
        if (this._healthBarContainer) {
            this._healthBarContainer.active = false;
        }
        
        // 改变外观表示死亡
        if (this._graphics) {
            this._graphics.clear();
            this._graphics.fillColor = new Color(64, 64, 64); // 变暗
            this._graphics.circle(0, 0, 12);
            this._graphics.fill();
        }
    }
    
    // 创建死亡特效
    private createDeathEffect(): void {
        if (this.node.parent) {
            EffectHelper.createDeathEffect(this.node.position, this.node.parent);
        }
    }
    
    // 重写待机状态
    protected onIdleState(dt: number): void {
        // 快速老鼠在待机状态下总是移动向城堡
        // moveTowardsCastle已在update中调用
    }
    
    // 重写攻击状态
    protected onAttackState(dt: number): void {
        if (!this.currentTarget || !this.currentTarget.isValid) {
            this.unitState = 0; // 回到待机状态
            return;
        }
        
        const targetUnit = this.currentTarget.getComponent(BaseUnit);
        if (!targetUnit || !targetUnit.isAlive) {
            this.currentTarget = null;
            this.unitState = 0;
            return;
        }
        
        // 检查目标是否在攻击范围内
        if (this.isTargetInRange(this.currentTarget) && this.canAttack) {
            this.performAttackOnTarget(targetUnit);
        } else {
            // 目标不在范围内，回到待机状态（继续移动向城堡）
            this.currentTarget = null;
            this.unitState = 0;
        }
    }
    
    // 对目标执行攻击
    private performAttackOnTarget(target: BaseUnit): void {
        target.takeDamage(this.attackDamage);
        this.attackTarget(target.node);
        
        console.log(`快速老鼠攻击英雄，造成 ${this.attackDamage} 点伤害`);
    }
}