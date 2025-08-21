import { _decorator, Component, Node, Vec3, Graphics, Color, Label, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType } from '../../types/GameTypes';
import { ENEMY_CONFIGS } from '../../types/GameConstants';
import { GameManager } from '../../managers/GameManager';
import { BattleManager } from '../../managers/BattleManager';
import { EffectHelper } from '../../utils/EffectHelper';
import { DrawingHelper } from '../../utils/DrawingHelper';

const { ccclass, property } = _decorator;

@ccclass('GiantMouse')
export class GiantMouse extends BaseMouse {
    
    @property({ tooltip: "金币奖励", override: true })
    public goldReward: number = 8;
    
    // 私有属性
    private _graphics: Graphics | null = null;
    private _nameLabel: Label | null = null;
    private _gameManager: GameManager | null = null;
    private _movementTimer: number = 0;
    private _currentDirection: Vec3 = new Vec3(0, -1, 0);
    private _zigzagFrequency: number = 1.5;
    private _isMovingTowardsCastle: boolean = true;
    
    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.GIANT_MOUSE;
    
    // 实现BaseMouse的抽象方法
    protected initializeMouseStats(): void {
        this.initializeGiantMouseStats();
    }
    
    // 实现BaseMouse的抽象方法
    protected initializeMouseVisuals(): void {
        this.initializeVisuals();
    }
    
    // 实现BaseMouse的抽象方法
    protected performAttack(target: Node): void {
        // 巨型老鼠的攻击实现
        const targetUnit = target.getComponent(BaseMouse);
        if (targetUnit) {
            targetUnit.takeDamage(this.attackDamage);
            console.log(`巨型老鼠攻击目标，造成 ${this.attackDamage} 点伤害`);
        }
    }
    
    protected onLoad(): void {
        super.onLoad();
        this._gameManager = GameManager.instance;
    }
    
    protected start(): void {
        super.start();
        
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.registerEnemy(this.node);
        }
    }
    
    private initializeGiantMouseStats(): void {
        const config = ENEMY_CONFIGS[EnemyType.GIANT_MOUSE];
        
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
    }
    
    private initializeVisuals(): void {
        this._graphics = this.node.addComponent(Graphics);
        
        this.drawGiantMouseAppearance();
        this.createNameLabel();
        this.createHealthBar();
    }
    
    private drawGiantMouseAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 巨型老鼠 - 更大更威武的外观
        this._graphics.fillColor = new Color(100, 50, 25); // 深棕色
        this._graphics.circle(0, 0, 25); // 更大的身体
        this._graphics.fill();
        
        // 边框
        this._graphics.strokeColor = new Color(60, 30, 15);
        this._graphics.lineWidth = 2;
        this._graphics.circle(0, 0, 25);
        this._graphics.stroke();
        
        // 耳朵
        this._graphics.fillColor = new Color(80, 40, 20);
        this._graphics.circle(-15, 15, 8);
        this._graphics.fill();
        this._graphics.circle(15, 15, 8);
        this._graphics.fill();
        
        // 眼睛 - 凶恶的红眼
        this._graphics.fillColor = new Color(255, 0, 0);
        this._graphics.circle(-8, 8, 4);
        this._graphics.fill();
        this._graphics.circle(8, 8, 4);
        this._graphics.fill();
        
        // 獠牙
        this._graphics.fillColor = new Color(255, 255, 255);
        this._graphics.rect(-3, -8, 2, 8);
        this._graphics.fill();
        this._graphics.rect(1, -8, 2, 8);
        this._graphics.fill();
        
        // 尾巴
        this._graphics.strokeColor = new Color(100, 50, 25);
        this._graphics.lineWidth = 6;
        this._graphics.moveTo(20, -10);
        this._graphics.lineTo(35, -20);
        this._graphics.stroke();
    }
    
    private createNameLabel(): void {
        this._nameLabel = DrawingHelper.createLabel(this.node, {
            text: "巨型老鼠",
            fontSize: 10,
            color: new Color(255, 100, 100),
            position: { x: 0, y: 40, z: 0 },
            size: { width: 70, height: 15 }
        });
    }
    
    private createHealthBar(): void {
        DrawingHelper.createHealthBar(this.node, {
            width: 50,
            height: 6,
            position: { x: 0, y: 32, z: 0 },
            backgroundColor: new Color(100, 100, 100),
            foregroundColor: new Color(255, 100, 100)
        });
    }
    
    protected update(dt: number): void {
        super.update(dt);
        
        if (this.unitState === 1) { // MOVING状态
            this.updateMovement(dt);
        }
    }
    
    private updateMovement(dt: number): void {
        if (!this._isMovingTowardsCastle) return;
        
        this._movementTimer += dt;
        
        // 缓慢的蜿蜒移动（巨型老鼠比较笨重）
        const xDirection = Math.sin(this._movementTimer * this._zigzagFrequency) * 0.2;
        this._currentDirection.set(xDirection, -1, 0);
        this._currentDirection.normalize();
        
        // 应用移动
        const movement = Vec3.multiplyScalar(new Vec3(), this._currentDirection, this.moveSpeed * dt);
        const newPosition = Vec3.add(new Vec3(), this.node.position, movement);
        this.node.setPosition(newPosition);
        
        // 检查是否到达城堡
        this.checkCastleCollision();
    }
    
    private checkCastleCollision(): void {
        if (!this._gameManager || !this._gameManager.castleNode) return;
        
        const currentPos = this.node.position;
        const castlePos = this._gameManager.castleNode.position;
        
        if (currentPos.y <= castlePos.y + 50) {
            this.attackCastle();
        }
    }
    
    private attackCastle(): void {
        if (!this._gameManager) return;
        
        console.log("巨型老鼠攻击城堡！造成额外伤害！");
        
        // 巨型老鼠造成更高伤害
        this._gameManager.damageCastle(this.attackDamage);
        
        // 创建攻击特效
        this.createCastleAttackEffect();
        
        // 销毁自己
        this.die();
    }
    
    private createCastleAttackEffect(): void {
        if (this.node.parent) {
            EffectHelper.createCastleAttackEffect(this.node.position, this.node.parent);
        }
    }
    
    // 重写受伤方法，添加巨型老鼠的特殊反应
    public takeDamage(damage: number): void {
        super.takeDamage(damage);
        
        // 受伤时发出怒吼效果
        this.createRoarEffect();
        
        // 受伤时可能进入狂暴状态
        if (this.currentHealth < this.maxHealth * 0.3 && this.moveSpeed === ENEMY_CONFIGS[EnemyType.GIANT_MOUSE].moveSpeed) {
            this.enterBerserkMode();
        }
    }
    
    private createRoarEffect(): void {
        if (this.node.parent) {
            EffectHelper.createRoarEffect(this.node.position, this.node.parent);
        }
    }
    
    private enterBerserkMode(): void {
        console.log("巨型老鼠进入狂暴状态！");
        
        // 提升移动速度和攻击力
        this.moveSpeed *= 1.5;
        this.attackDamage *= 1.2;
        
        // 变红色表示狂暴
        if (this._graphics) {
            this._graphics.clear();
            this._graphics.fillColor = new Color(150, 50, 50); // 深红色
            this._graphics.circle(0, 0, 25);
            this._graphics.fill();
            
            // 重绘其他部分...
            this.drawBerserkAppearance();
        }
        
        this.createBerserkEffect();
    }
    
    private drawBerserkAppearance(): void {
        if (!this._graphics) return;
        
        // 狂暴状态的外观 - 更加凶恶
        this._graphics.strokeColor = new Color(200, 0, 0);
        this._graphics.lineWidth = 3;
        this._graphics.circle(0, 0, 25);
        this._graphics.stroke();
        
        // 发光的红眼
        this._graphics.fillColor = new Color(255, 50, 50);
        this._graphics.circle(-8, 8, 5);
        this._graphics.fill();
        this._graphics.circle(8, 8, 5);
        this._graphics.fill();
        
        // 更大的獠牙
        this._graphics.fillColor = new Color(255, 255, 255);
        this._graphics.rect(-4, -10, 3, 10);
        this._graphics.fill();
        this._graphics.rect(1, -10, 3, 10);
        this._graphics.fill();
    }
    
    private createBerserkEffect(): void {
        if (this.node.parent) {
            EffectHelper.createBerserkEffect(this.node.position, this.node.parent);
        }
    }
    
    protected onDie(): void {
        console.log("巨型老鼠被击败");
        
        // 给予金币奖励
        if (this._gameManager) {
            this._gameManager.addGold(this.goldReward);
            console.log(`获得 ${this.goldReward} 金币奖励`);
        }
        
        // 从战斗管理器注销
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.unregisterEnemy(this.node);
        }
        
        // 创建死亡特效
        this.createDeathEffect();
        
        // 巨型老鼠死亡时有几率掉落额外金币
        if (Math.random() < 0.3) {
            this.dropBonusGold();
        }
    }
    
    private createDeathEffect(): void {
        if (this.node.parent) {
            EffectHelper.createEnemyDeathEffect(this.node.position, this.node.parent);
        }
        
        // 变灰色表示死亡
        if (this._graphics) {
            this._graphics.fillColor = new Color(80, 80, 80);
            this.drawGiantMouseAppearance();
        }
    }
    
    private dropBonusGold(): void {
        if (this._gameManager) {
            const bonusGold = 2;
            this._gameManager.addGold(bonusGold);
            console.log(`巨型老鼠掉落额外金币: ${bonusGold}`);
            
            // 创建金币掉落特效
            if (this.node.parent) {
                EffectHelper.createGoldDropEffect(this.node.position, this.node.parent);
            }
        }
    }
    
    // 开始移动
    public startMoving(): void {
        this.unitState = 1; // MOVING状态
        this._isMovingTowardsCastle = true;
        console.log("巨型老鼠开始朝城堡移动");
    }
    
    // 获取敌人类型
    public getEnemyType(): EnemyType {
        return this.enemyType;
    }
}