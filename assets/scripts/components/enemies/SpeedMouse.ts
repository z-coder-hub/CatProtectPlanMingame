import { _decorator, Component, Node, Vec3, Graphics, Color, Label, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyState } from '../../types/GameTypes';
import { ENEMY_CONFIGS } from '../../types/GameConstants';
import { GameManager } from '../../managers/GameManager';
import { BattleManager } from '../../managers/BattleManager';
import { EffectHelper } from '../../utils/EffectHelper';
import { DrawingHelper } from '../../utils/DrawingHelper';

const { ccclass, property } = _decorator;

@ccclass('SpeedMouse')
export class SpeedMouse extends BaseMouse {
    
    @property({ tooltip: "金币奖励", override: true })
    public goldReward: number = 5;
    
    // 私有属性
    private _graphics: Graphics | null = null;
    private _nameLabel: Label | null = null;
    private _gameManager: GameManager | null = null;
    private _movementTimer: number = 0;
    private _currentDirection: Vec3 = new Vec3(0, -1, 0);
    private _zigzagFrequency: number = 3.0; // 更快的摆动频率
    private _isMovingTowardsCastle: boolean = true;
    private _speedTrail: Node[] = []; // 残影效果
    
    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.SPEED_MOUSE;
    
    // 实现BaseMouse的抽象方法
    protected initializeMouseStats(): void {
        this.initializeSpeedMouseStats();
    }
    
    // 实现BaseMouse的抽象方法
    protected initializeMouseVisuals(): void {
        this.initializeVisuals();
        this.createSpeedTrail();
    }
    
    // 痾速老鼠不再有攻击能力，移除 performAttack 方法
    
    protected onLoad(): void {
        super.onLoad();
        this._gameManager = GameManager.instance;
    }
    
    protected start(): void {
        super.start();
        
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.RegisterEnemy(this.node);
        }
    }
    
    private initializeSpeedMouseStats(): void {
        const config = ENEMY_CONFIGS[EnemyType.SPEED_MOUSE];
        
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        // 移除攻击相关属性，痾速老鼠不攻击
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
    }
    
    private initializeVisuals(): void {
        this._graphics = this.node.addComponent(Graphics);
        
        this.drawSpeedMouseAppearance();
        this.createHealthBar();
    }
    
    private drawSpeedMouseAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 疾速老鼠 - 流线型外观
        this._graphics.fillColor = new Color(200, 200, 50); // 亮黄色，表示速度
        this._graphics.circle(0, 0, 12); // 较小的身体
        this._graphics.fill();
        
        // 动感边框
        this._graphics.strokeColor = new Color(255, 255, 100);
        this._graphics.lineWidth = 2;
        this._graphics.circle(0, 0, 12);
        this._graphics.stroke();
        
        // 尖锐的耳朵
        this._graphics.fillColor = new Color(180, 180, 40);
        this._graphics.moveTo(-8, 8);
        this._graphics.lineTo(-12, 18);
        this._graphics.lineTo(-4, 15);
        this._graphics.close();
        this._graphics.fill();
        
        this._graphics.moveTo(8, 8);
        this._graphics.lineTo(12, 18);
        this._graphics.lineTo(4, 15);
        this._graphics.close();
        this._graphics.fill();
        
        // 机警的眼睛
        this._graphics.fillColor = new Color(255, 255, 255);
        this._graphics.circle(-4, 4, 2);
        this._graphics.fill();
        this._graphics.circle(4, 4, 2);
        this._graphics.fill();
        
        this._graphics.fillColor = new Color(0, 0, 0);
        this._graphics.circle(-4, 4, 1);
        this._graphics.fill();
        this._graphics.circle(4, 4, 1);
        this._graphics.fill();
        
        // 长尾巴 - 表示速度感
        this._graphics.strokeColor = new Color(200, 200, 50);
        this._graphics.lineWidth = 3;
        this._graphics.moveTo(10, -5);
        this._graphics.lineTo(25, -15);
        this._graphics.lineTo(30, -10);
        this._graphics.stroke();
    }
    
    // 重写标签配置 - 使用统一大字体
    protected getMouseLabelConfig() {
        const baseConfig = super.getMouseLabelConfig();
        return {
            ...baseConfig,
            text: "疾速",
            color: new Color(255, 255, 100), // 亮黄色
        };
    }
    
    private createHealthBar(): void {
        DrawingHelper.createHealthBar(this.node, {
            width: 30,
            height: 4,
            position: { x: 0, y: 18, z: 0 },
            backgroundColor: new Color(100, 100, 100),
            foregroundColor: new Color(255, 255, 100)
        });
    }
    
    private createSpeedTrail(): void {
        // 创建残影效果节点
        for (let i = 0; i < 3; i++) {
            const trailNode = new Node(`SpeedTrail_${i}`);
            const trailGraphics = trailNode.addComponent(Graphics);
            
            trailGraphics.fillColor = new Color(200, 200, 50, 100 - i * 30); // 逐渐透明
            trailGraphics.circle(0, 0, 12 - i * 2);
            trailGraphics.fill();
            
            if (this.node.parent) {
                this.node.parent.addChild(trailNode);
                this._speedTrail.push(trailNode);
            }
        }
    }
    
    protected update(dt: number): void {
        super.update(dt);
        
        if (this.enemyState === EnemyState.MOVING) { // MOVING状态
            this.updateMovement(dt);
            this.updateSpeedTrail();
        }
    }
    
    private updateMovement(dt: number): void {
        if (!this._isMovingTowardsCastle) return;
        
        this._movementTimer += dt;
        
        // 快速且不规律的移动
        const xDirection = Math.sin(this._movementTimer * this._zigzagFrequency) * 0.8;
        const randomOffset = (Math.random() - 0.5) * 0.3; // 随机偏移
        this._currentDirection.set(xDirection + randomOffset, -1, 0);
        this._currentDirection.normalize();
        
        // 应用移动
        const movement = Vec3.multiplyScalar(new Vec3(), this._currentDirection, this.moveSpeed * dt);
        const newPosition = Vec3.add(new Vec3(), this.node.position, movement);
        this.node.setPosition(newPosition);
        
        // 检查是否到达城堡
        this.checkCastleCollision();
    }
    
    private updateSpeedTrail(): void {
        // 更新残影位置
        for (let i = this._speedTrail.length - 1; i > 0; i--) {
            if (this._speedTrail[i] && this._speedTrail[i - 1]) {
                this._speedTrail[i].setPosition(this._speedTrail[i - 1].position);
            }
        }
        
        // 第一个残影跟随主体
        if (this._speedTrail[0]) {
            this._speedTrail[0].setPosition(Vec3.add(new Vec3(), this.node.position, new Vec3(5, 5, 0)));
        }
    }
    
    private checkCastleCollision(): void {
        if (!this._gameManager || !this._gameManager.castleNode) return;
        
        const currentPos = this.node.position;
        const castlePos = this._gameManager.castleNode.position;
        
        if (currentPos.y <= castlePos.y + 50) {
            this.reachCastle();
        }
    }
    
    // 移除攻击城堡方法，使用父类的 reachCastle 方法
    
    // 移除攻击特效方法
    
    // 重写受伤方法，疾速老鼠受伤时会加速
    public takeDamage(damage: number): void {
        super.takeDamage(damage);
        
        // 受伤时短暂加速
        this.temporarySpeedBoost();
        
        // 受伤闪烁效果
        this.createHurtEffect();
    }
    
    private temporarySpeedBoost(): void {
        const originalSpeed = this.moveSpeed;
        this.moveSpeed *= 1.3;
        
        console.log("疾速老鼠受伤后加速！");
        
        // 1秒后恢复正常速度，使用Tween系统替代scheduleOnce
        tween(this.node)
            .delay(1)
            .call(() => {
                this.moveSpeed = originalSpeed;
            })
            .start();
        
        // 加速视觉效果
        if (this._graphics) {
            this._graphics.fillColor = new Color(255, 255, 150); // 更亮的颜色
            this.drawSpeedMouseAppearance();
            
            tween(this.node)
                .delay(1)
                .call(() => {
                    if (this._graphics && this.node.isValid) {
                        this._graphics.fillColor = new Color(200, 200, 50);
                        this.drawSpeedMouseAppearance();
                    }
                })
                .start();
        }
    }
    
    private createHurtEffect(): void {
        if (this.node.parent) {
            EffectHelper.createEnemyHurtEffect(this.node.position, this.node.parent);
        }
        
        // 快速闪烁效果
        if (this._graphics) {
            const originalColor = this._graphics.fillColor;
            this._graphics.fillColor = new Color(255, 100, 100);
            this.drawSpeedMouseAppearance();
            
            tween(this.node)
                .delay(0.1)
                .call(() => {
                    if (this._graphics && this.node.isValid) {
                        this._graphics.fillColor = originalColor;
                        this.drawSpeedMouseAppearance();
                    }
                })
                .start();
        }
    }
    
    protected onDie(): void {
        console.log("疾速老鼠被击败");
        
        // 给予金币奖励
        if (this._gameManager) {
            this._gameManager.AddGold(this.goldReward);
            console.log(`获得 ${this.goldReward} 金币奖励`);
        }
        
        // 从战斗管理器注销
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.UnregisterEnemy(this.node);
        }
        
        // 清理残影
        this.cleanupSpeedTrail();
        
        // 创建死亡特效
        this.createDeathEffect();
        
        // 销毁节点，清理尸体
        this.node.destroy();
    }
    
    private cleanupSpeedTrail(): void {
        for (const trail of this._speedTrail) {
            if (trail && trail.isValid) {
                trail.destroy();
            }
        }
        this._speedTrail = [];
    }
    
    private createDeathEffect(): void {
        if (this.node.parent) {
            EffectHelper.createEnemyDeathEffect(this.node.position, this.node.parent);
        }
        
        // 创建速度爆发效果
        if (this.node.parent) {
            EffectHelper.createSpeedBurstEffect(this.node.position, this.node.parent);
        }
        
        // 变灰色表示死亡
        if (this._graphics) {
            this._graphics.fillColor = new Color(80, 80, 80);
            this.drawSpeedMouseAppearance();
        }
    }
    
    // 开始移动
    public startMoving(): void {
        this.enemyState = EnemyState.MOVING; // MOVING状态
        this._isMovingTowardsCastle = true;
        console.log("疾速老鼠开始快速移动");
        
        // 启动时的加速效果
        this.createStartEffect();
    }
    
    private createStartEffect(): void {
        if (this.node.parent) {
            EffectHelper.createSpeedStartEffect(this.node.position, this.node.parent);
        }
    }
    
    // 获取敌人类型
    public getEnemyType(): EnemyType {
        return this.enemyType;
    }
    
    protected onDestroy(): void {
        this.cleanupSpeedTrail();
    }
}