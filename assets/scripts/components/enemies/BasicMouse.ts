import { _decorator, Component, Node, Vec3, Graphics, Color } from 'cc';
import { BaseUnit } from '../base/BaseUnit';
import { EnemyType } from '../../types/GameTypes';
import { ENEMY_CONFIGS, GAME_CONSTANTS } from '../../types/GameConstants';
import { GameManager } from '../../managers/GameManager';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass, property } = _decorator;

@ccclass('BasicMouse')
export class BasicMouse extends BaseUnit {
    
    @property({ tooltip: "金币奖励" })
    public goldReward: number = 3;
    
    // 私有属性
    private _graphics: Graphics | null = null;
    private _gameManager: GameManager | null = null;
    
    // 敌人类型
    public readonly enemyType: EnemyType = EnemyType.BASIC_MOUSE;
    
    protected onLoad(): void {
        // 先调用父类初始化
        super.onLoad();
        
        // 设置基础老鼠属性
        this.initializeMouseStats();
        
        // 初始化外观
        this.initializeVisuals();
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
    
    // 初始化老鼠属性
    private initializeMouseStats(): void {
        const config = ENEMY_CONFIGS[EnemyType.BASIC_MOUSE];
        
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
    }
    
    // 初始化外观
    private initializeVisuals(): void {
        // 添加Graphics组件绘制外观
        this._graphics = this.node.getComponent(Graphics);
        if (!this._graphics) {
            this._graphics = this.node.addComponent(Graphics);
        }
        
        this.drawMouseAppearance();
    }
    
    // 绘制老鼠外观
    private drawMouseAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 绘制老鼠身体（灰色椭圆）
        this._graphics.fillColor = new Color(128, 128, 128); // 灰色
        this._graphics.ellipse(0, 0, 15, 10);
        this._graphics.fill();
        
        // 绘制轮廓
        this._graphics.strokeColor = new Color(64, 64, 64);
        this._graphics.lineWidth = 1;
        this._graphics.ellipse(0, 0, 15, 10);
        this._graphics.stroke();
        
        // 绘制耳朵
        this._graphics.fillColor = new Color(100, 100, 100);
        this._graphics.circle(-8, 8, 3);
        this._graphics.fill();
        this._graphics.circle(8, 8, 3);
        this._graphics.fill();
        
        // 绘制尾巴
        this._graphics.strokeColor = new Color(100, 100, 100);
        this._graphics.lineWidth = 2;
        this._graphics.moveTo(0, -10);
        this._graphics.lineTo(-5, -18);
        this._graphics.stroke();
    }
    
    protected update(dt: number): void {
        super.update(dt);
        
        // 如果没有在战斗中，朝城堡移动
        if (this.unitState === 0 && this.isAlive) { // 待机状态
            this.moveTowardsCastle(dt);
        }
    }
    
    // 朝城堡移动
    private moveTowardsCastle(dt: number): void {
        if (!this._gameManager || !this._gameManager.castleNode) return;
        
        const castlePos = this._gameManager.castleNode.position;
        const currentPos = this.node.position;
        
        // 计算方向向量
        const direction = Vec3.subtract(new Vec3(), castlePos, currentPos);
        const distance = direction.length();
        direction.normalize();
        
        // 检查是否到达城堡
        if (distance <= 50) {
            this.attackCastle();
            return;
        }
        
        // 移动向城堡
        const moveDistance = this.moveSpeed * dt;
        const moveVector = Vec3.multiplyScalar(new Vec3(), direction, moveDistance);
        const newPos = Vec3.add(new Vec3(), currentPos, moveVector);
        this.node.setPosition(newPos);
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
        
        console.log(`老鼠攻击城堡，造成 ${this.attackDamage} 点伤害`);
    }
    
    // 创建攻击特效
    private createAttackEffect(): void {
        const effectNode = new Node("AttackEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.fillColor = new Color(255, 0, 0, 150); // 红色攻击特效
        effectGraphics.circle(0, 0, 20);
        effectGraphics.fill();
        
        // 特效淡出并销毁
        setTimeout(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 300);
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
        
        // 临时变红表示受伤
        const originalColor = new Color(128, 128, 128);
        this._graphics.clear();
        this._graphics.fillColor = new Color(255, 100, 100); // 红色
        this._graphics.ellipse(0, 0, 15, 10);
        this._graphics.fill();
        
        // 200ms后恢复原色
        setTimeout(() => {
            if (this._graphics && this.node.isValid) {
                this._graphics.clear();
                this._graphics.fillColor = originalColor;
                this.drawMouseAppearance();
            }
        }, 200);
    }
    
    // 重写死亡方法
    protected onDie(): void {
        console.log(`基础老鼠死亡，奖励 ${this.goldReward} 金币`);
        
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
        
        // 改变外观表示死亡
        if (this._graphics) {
            this._graphics.clear();
            this._graphics.fillColor = new Color(64, 64, 64); // 变暗
            this._graphics.ellipse(0, 0, 15, 10);
            this._graphics.fill();
        }
    }
    
    // 创建死亡特效
    private createDeathEffect(): void {
        const effectNode = new Node("DeathEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        
        // 创建爆炸效果
        const particles = 8;
        for (let i = 0; i < particles; i++) {
            const angle = (i / particles) * Math.PI * 2;
            const x = Math.cos(angle) * 20;
            const y = Math.sin(angle) * 20;
            
            effectGraphics.fillColor = new Color(255, 255, 0, 200);
            effectGraphics.circle(x, y, 3);
            effectGraphics.fill();
        }
        
        // 特效持续时间后销毁
        setTimeout(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 500);
    }
    
    // 重写待机状态，老鼠总是朝城堡移动
    protected onIdleState(dt: number): void {
        // 老鼠在待机状态下总是移动向城堡
        // moveTowardsCastle已在update中调用
    }
    
    // 重写攻击状态，老鼠可以攻击英雄
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
        
        console.log(`老鼠攻击英雄，造成 ${this.attackDamage} 点伤害`);
    }
}