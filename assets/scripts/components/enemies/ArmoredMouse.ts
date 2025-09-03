import { _decorator, Component, Node, Vec3, Graphics, Color, Label, UITransform } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyState } from '../../types/GameTypes';
import { ENEMY_CONFIGS } from '../../types/GameConstants';
import { GameManager } from '../../managers/GameManager';
import { BattleManager } from '../../managers/BattleManager';
import { DrawingHelper } from '../../utils/DrawingHelper';
import { EffectHelper } from '../../utils/EffectHelper';

const { ccclass, property } = _decorator;

@ccclass('ArmoredMouse')
export class ArmoredMouse extends BaseMouse {
    
    @property({ tooltip: "金币奖励", override: true })
    public goldReward: number = 6;
    
    @property({ tooltip: "护甲值（减伤）" })
    public armor: number = 3;
    
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
    private _pauseTimer: number = 0;                      // 停顿计时器
    private _isPaused: boolean = false;                   // 是否处于停顿状态
    private _nextPauseTime: number = 0;                   // 下次停顿时间
    private _movementPattern: 'steady' | 'defensive' = 'steady'; // 装甲老鼠移动稳重
    
    // 性能优化相关
    private _movementUpdateInterval: number = 0.15;      // 装甲老鼠更新较慢(6.7fps)
    private _lastMovementUpdate: number = 0;              // 上次移动更新时间
    
    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.ARMORED_MOUSE;
    
    // 实现BaseMouse的抽象方法
    protected initializeMouseStats(): void {
        this.initializeArmoredMouseStats();
    }
    
    // 实现BaseMouse的抽象方法
    protected initializeMouseVisuals(): void {
        this.initializeVisuals();
        this.initializeHealthBar();
    }
    
    // 装甲老鼠不再有攻击能力，移除 performAttack 方法
    
    protected onLoad(): void {
        // 先调用父类初始化
        super.onLoad();
    }
    
    protected start(): void {
        super.start();
        
        // 获取GameManager引用
        this._gameManager = GameManager.instance;
        
        // 注册到BattleManager
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.RegisterEnemy(this.node);
        }
    }
    
    // 初始化装甲老鼠属性
    private initializeArmoredMouseStats(): void {
        const config = ENEMY_CONFIGS[EnemyType.ARMORED_MOUSE];
        
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        // 移除攻击相关属性，装甲老鼠不攻击
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
        
        // 初始化移动行为参数
        this.initializeMovementBehavior();
    }
    
    // 初始化移动行为
    private initializeMovementBehavior(): void {
        // 装甲老鼠移动稳重，很少变化方向
        const patterns: ('steady' | 'defensive')[] = ['steady', 'defensive'];
        this._movementPattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        // 装甲老鼠停顿更频繁（展示坚固防御）
        this._nextPauseTime = 3 + Math.random() * 5; // 3-8秒后第一次停顿
        
        console.log(`装甲老鼠移动模式: ${this._movementPattern}`);
    }
    
    // 初始化外观
    private initializeVisuals(): void {
        // 添加Graphics组件绘制外观
        this._graphics = this.node.addComponent(Graphics);
        
        this.drawArmoredMouseAppearance();
    }
    
    // 初始化血条
    private initializeHealthBar(): void {
        const healthBarData = DrawingHelper.createHealthBar(this.node, {
            width: 35,              // 更宽的血条
            height: 5,              // 更厚的血条
            position: { x: 0, y: 30, z: 0 }, // 在装甲老鼠上方
            backgroundColor: new Color(60, 60, 60), // 深灰色背景
            foregroundColor: new Color(255, 0, 0), // 红色前景（表示危险）
            borderColor: new Color(255, 215, 0), // 金色边框（表示装甲）
            borderWidth: 2
        });
        
        this._healthBarContainer = healthBarData.container;
        this._healthBarForeground = healthBarData.foreground;
        
        // 血条始终显示
        this._healthBarContainer.active = true;
        
        // 初始化血条显示
        this.updateHealthBarDisplay();
    }
    
    // 绘制装甲老鼠外观
    private drawArmoredMouseAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 绘制装甲老鼠身体和边框（一条路径）
        this._graphics.rect(-18, -18, 36, 36);
        
        // 填充身体（深灰色，表示金属）
        this._graphics.fillColor = new Color(105, 105, 105); // 深灰色
        this._graphics.fill();
        
        // 描边装甲边框（金色）
        this._graphics.strokeColor = new Color(255, 215, 0); // 金色
        this._graphics.lineWidth = 3;
        this._graphics.stroke();
        
        // 绘制装甲细节（装甲板）
        this._graphics.strokeColor = new Color(192, 192, 192); // 银色细节
        this._graphics.lineWidth = 2;
        // 水平装甲线
        this._graphics.moveTo(-15, -8);
        this._graphics.lineTo(15, -8);
        this._graphics.moveTo(-15, 0);
        this._graphics.lineTo(15, 0);
        this._graphics.moveTo(-15, 8);
        this._graphics.lineTo(15, 8);
        // 垂直装甲线
        this._graphics.moveTo(-8, -15);
        this._graphics.lineTo(-8, 15);
        this._graphics.moveTo(0, -15);
        this._graphics.lineTo(0, 15);
        this._graphics.moveTo(8, -15);
        this._graphics.lineTo(8, 15);
        this._graphics.stroke();
        
        // 绘制盾牌标识
        this._graphics.fillColor = new Color(255, 215, 0); // 金色盾牌
        this._graphics.moveTo(0, -15);
        this._graphics.lineTo(-8, -8);
        this._graphics.lineTo(-8, 8);
        this._graphics.lineTo(0, 15);
        this._graphics.lineTo(8, 8);
        this._graphics.lineTo(8, -8);
        this._graphics.close();
        this._graphics.fill();
        
        // 盾牌轮廓
        this._graphics.strokeColor = new Color(184, 134, 11); // 深金色
        this._graphics.lineWidth = 2;
        this._graphics.moveTo(0, -15);
        this._graphics.lineTo(-8, -8);
        this._graphics.lineTo(-8, 8);
        this._graphics.lineTo(0, 15);
        this._graphics.lineTo(8, 8);
        this._graphics.lineTo(8, -8);
        this._graphics.close();
        this._graphics.stroke();
        
        // 绘制眼睛（蓝色，表示冷静）
        this._graphics.fillColor = new Color(0, 0, 255); // 蓝色眼睛
        this._graphics.circle(-6, -6, 2);
        this._graphics.fill();
        this._graphics.circle(6, -6, 2);
        this._graphics.fill();
    }
    
    // 重写标签配置 - 使用统一大字体
    protected getMouseLabelConfig() {
        const baseConfig = super.getMouseLabelConfig();
        return {
            ...baseConfig,
            text: "甲鼠",
            color: new Color(255, 215, 0), // 金色文字
            yOffset: 45, // 装甲老鼠更高，需要更大的偏移
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
            if (this.enemyState === EnemyState.IDLE && this.isAlive) { // 待机状态
                this.moveTowardsCastle(movementDt);
            }
        }
    }
    
    // 朝城堡移动 - 装甲老鼠稳重移动
    private moveTowardsCastle(dt: number): void {
        if (!this._gameManager || !this._gameManager.castleNode) return;
        
        const currentPos = this.node.position;
        const castlePos = this._gameManager.castleNode.position;
        
        // 检查是否到达城堡Y位置
        if (currentPos.y <= castlePos.y + 50) {
            this.reachCastle();
            return;
        }
        
        // 更新移动计时器
        this._movementTimer += dt;
        
        // 处理随机停顿（装甲老鼠会停下来观察）
        if (this.handleRandomPause(dt)) {
            return;
        }
        
        // 根据移动模式计算移动方向
        this.updateMovementDirection();
        
        // 执行移动（装甲老鼠移动较慢但稳定）
        const moveDistance = this.moveSpeed * dt;
        const moveVector = Vec3.multiplyScalar(new Vec3(), this._currentDirection, moveDistance);
        const newPos = Vec3.add(new Vec3(), currentPos, moveVector);
        
        // 限制X坐标不要移动到屏幕外
        const maxX = 300;
        newPos.x = Math.max(-maxX, Math.min(maxX, newPos.x));
        
        this.node.setPosition(newPos);
    }
    
    // 处理随机停顿（装甲老鼠停顿较频繁）
    private handleRandomPause(dt: number): boolean {
        if (this._isPaused) {
            this._pauseTimer -= dt;
            if (this._pauseTimer <= 0) {
                this._isPaused = false;
                // 设置下次停顿时间
                this._nextPauseTime = this._movementTimer + 5 + Math.random() * 8; // 5-13秒后再次停顿
            }
            return true;
        }
        
        // 检查是否该停顿了
        if (this._movementTimer >= this._nextPauseTime) {
            this._isPaused = true;
            this._pauseTimer = 0.5 + Math.random() * 1.0; // 停顿0.5-1.5秒（较长）
            return true;
        }
        
        return false;
    }
    
    // 更新移动方向
    private updateMovementDirection(): void {
        switch (this._movementPattern) {
            case 'steady':
                this.updateSteadyMovement();
                break;
            case 'defensive':
                this.updateDefensiveMovement();
                break;
        }
    }
    
    // 稳重移动
    private updateSteadyMovement(): void {
        // 装甲老鼠直线向下移动，偶尔轻微调整
        const xDirection = Math.sin(this._movementTimer * 0.2) * 0.1; // 非常轻微的摆动
        
        this._currentDirection.set(xDirection, -1, 0);
        this._currentDirection.normalize();
    }
    
    // 防御移动
    private updateDefensiveMovement(): void {
        // 完全直线向下，无任何摆动
        this._currentDirection.set(0, -1, 0);
        this._currentDirection.normalize();
    }
    
    // 重写受伤方法，添加护甲减伤机制
    public takeDamage(damage: number): void {
        if (!this.isAlive) return;
        
        // 护甲减伤计算
        const actualDamage = Math.max(1, damage - this.armor); // 至少造成1点伤害
        const blockedDamage = damage - actualDamage;
        
        // 调用父类方法但传入减伤后的伤害
        this.currentHealth = Math.max(0, this.currentHealth - actualDamage);
        this.updateHealthBarDisplay();
        
        // 触发受伤回调
        this.onTakeDamage(actualDamage);
        
        // 显示护甲阻挡效果
        if (blockedDamage > 0) {
            this.showArmorBlockEffect(blockedDamage);
        }
        
        console.log(`装甲老鼠受到 ${damage} 点伤害，护甲阻挡 ${blockedDamage} 点，实际受到 ${actualDamage} 点伤害`);
        
        // 检查死亡
        if (this.currentHealth <= 0) {
            this.die();
        }
    }
    
    // 显示护甲阻挡效果
    private showArmorBlockEffect(blockedDamage: number): void {
        const effectNode = new Node("ArmorBlockEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(Vec3.add(new Vec3(), this.node.position, new Vec3(0, 20, 0)));
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.fillColor = new Color(255, 215, 0, 200); // 金色护甲效果
        effectGraphics.circle(0, 0, 15);
        effectGraphics.fill();
        
        // 护甲闪光效果
        let scale = 1;
        let opacity = 200;
        const armorEffect = () => {
            scale += 0.1;
            opacity -= 20;
            
            if (effectGraphics && effectNode.isValid && opacity > 0) {
                effectGraphics.clear();
                effectGraphics.fillColor = new Color(255, 215, 0, opacity);
                effectGraphics.circle(0, 0, 15 * scale);
                effectGraphics.fill();
                
                requestAnimationFrame(armorEffect);
            } else {
                effectNode.destroy();
            }
        };
        armorEffect();
    }
    
    // 攻击城堡
    // 移除攻击城堡方法，使用父类的 reachCastle 方法
    
    // 移除攻击特效方法
    
    // 重写受伤方法，添加受伤反馈
    protected onTakeDamage(damage: number): void {
        console.log(`装甲老鼠实际受到 ${damage} 点伤害，剩余血量: ${this.currentHealth}`);
        
        // 更新血条显示
        this.updateHealthBarDisplay();
        
        // 受伤闪烁效果
        this.playHurtEffect();
    }
    
    // 更新血条显示
    private updateHealthBarDisplay(): void {
        if (this._healthBarForeground && this._healthBarContainer) {
            const healthPercent = this.currentHealth / this.maxHealth;
            DrawingHelper.updateHealthBar(this._healthBarForeground, healthPercent, 35, 5);
            
            // 血条始终显示，只有死亡时才隐藏
            this._healthBarContainer.active = healthPercent > 0;
        }
    }
    
    // 播放受伤效果
    private playHurtEffect(): void {
        if (!this._graphics) return;
        
        // 装甲受伤效果 - 金色闪光
        this._graphics.clear();
        this._graphics.fillColor = new Color(255, 215, 100); // 亮金色受伤效果
        this._graphics.rect(-18, -18, 36, 36);
        this._graphics.fill();
        
        // 300ms后恢复原色
        this.scheduleOnce(() => {
            if (this._graphics && this.node.isValid) {
                this.drawArmoredMouseAppearance();
            }
        }, 0.3);
    }
    
    // 重写死亡方法
    protected onDie(): void {
        console.log(`装甲老鼠死亡，奖励 ${this.goldReward} 金币`);
        
        // 从BattleManager注销
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.UnregisterEnemy(this.node);
        }
        
        // 给予金币奖励
        if (this._gameManager) {
            this._gameManager.AddGold(this.goldReward);
            this._gameManager.RemoveActiveEnemy(this.node);
        }
        
        // 创建死亡特效
        this.createDeathEffect();
        
        // 隐藏血条
        if (this._healthBarContainer) {
            this._healthBarContainer.active = false;
        }
        
        // 销毁节点，清理尸体
        this.node.destroy();
    }
    
    // 创建死亡特效
    private createDeathEffect(): void {
        if (this.node.parent) {
            EffectHelper.createDeathEffect(this.node.position, this.node.parent);
            
            // 额外的装甲破碎特效
            this.createArmorBreakEffect();
        }
    }
    
    // 创建装甲破碎特效
    private createArmorBreakEffect(): void {
        const effectNode = new Node("ArmorBreakEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        
        // 创建多个破碎片段
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * 20;
            const y = Math.sin(angle) * 20;
            
            effectGraphics.fillColor = new Color(255, 215, 0, 150); // 半透明金色
            effectGraphics.rect(x - 3, y - 3, 6, 6);
            effectGraphics.fill();
        }
        
        // 破碎效果消失
        this.scheduleOnce(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 0.5);
    }
    
    // 重写待机状态
    protected onIdleState(dt: number): void {
        // 装甲老鼠在待机状态下总是移动向城堡
        this.moveTowardsCastle(dt);
    }
    
    // 移除攻击英雄方法，装甲老鼠不再攻击
}