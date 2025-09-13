import { _decorator, Component, Node, Vec3, Graphics, Color, Label, tween } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyState } from '../../types/GameTypes';
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
    
    // 巨型老鼠不再有攻击能力，移除 performAttack 方法
    
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
    
    private initializeGiantMouseStats(): void {
        const config = ENEMY_CONFIGS[EnemyType.GIANT_MOUSE];
        
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        // 移除攻击相关属性，巨型老鼠不攻击
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
    }
    
    private initializeVisuals(): void {
        this._graphics = this.getGraphicsComponent();

        this.drawGiantMouseAppearance();
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
    
    // 重写标签配置 - 使用统一大字体
    protected getMouseLabelConfig() {
        return {
            text: "巨鼠",
            fontSize: 22,
            color: new Color(255, 100, 100), // 红色文字
            yOffset: 50, // 巨型老鼠更高，需要更大的偏移
            size: { width: 60, height: 28 }
        };
    }

    // 实现BaseMouse的抽象方法 - 血条配置
    protected getHealthBarConfig() {
        return {
            width: 50,
            height: 6,
            yOffset: 32,
            backgroundColor: new Color(100, 100, 100),
            foregroundColor: new Color(255, 100, 100),
            borderColor: new Color(255, 255, 255),
            borderWidth: 1
        };
    }
    
    
    protected update(dt: number): void {
        super.update(dt);
        
        if (this.enemyState === EnemyState.MOVING) { // MOVING状态
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
            this.reachCastle();
        }
    }
    
    // 移除攻击城堡方法，使用父类的 reachCastle 方法
    
    // 移除攻击特效方法
    
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
        // 移除攻击力提升，巨型老鼠不再攻击
        
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
            this._gameManager.AddGold(this.goldReward);
            console.log(`获得 ${this.goldReward} 金币奖励`);
        }
        
        // 从战斗管理器注销
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.UnregisterEnemy(this.node);
        }
        
        // 创建死亡特效
        this.createDeathEffect();
        
        // 巨型老鼠死亡时有几率掉落额外金币
        if (Math.random() < 0.3) {
            this.dropBonusGold();
        }
        
        // 销毁节点，清理尸体
        this.node.destroy();
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
            this._gameManager.AddGold(bonusGold);
            console.log(`巨型老鼠掉落额外金币: ${bonusGold}`);
            
            // 创建金币掉落特效
            if (this.node.parent) {
                EffectHelper.createGoldDropEffect(this.node.position, this.node.parent);
            }
        }
    }
    
    // 开始移动
    public startMoving(): void {
        this.enemyState = EnemyState.MOVING; // MOVING状态
        this._isMovingTowardsCastle = true;
        console.log("巨型老鼠开始朝城堡移动");
    }
    
    // 获取敌人类型
    public getEnemyType(): EnemyType {
        return this.enemyType;
    }
}