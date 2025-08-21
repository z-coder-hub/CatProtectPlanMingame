import { _decorator, Component, Node, Vec3, Graphics, Color, Animation, EventTouch, Label, tween, Tween } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';
import { GridDeploymentSystem } from '../../systems/GridDeploymentSystem';
import { GameManager } from '../../managers/GameManager';
import { EffectHelper } from '../../utils/EffectHelper';
import { DrawingHelper } from '../../utils/DrawingHelper';
import { SimpleObjectPool } from '../../utils/SimpleObjectPool';

const { ccclass, property } = _decorator;

@ccclass('SiameseMage')
export class SiameseMage extends BaseHero {
    
    @property({ tooltip: "技能冷却时间", override: true })
    public skillCooldown: number = 8;
    
    @property({ tooltip: "AOE伤害倍率" })
    public aoeDamage: number = 1.5;
    
    @property({ tooltip: "AOE攻击范围" })
    public aoeRange: number = 80;
    
    // 私有属性
    private _skillTimer: number = 0;
    private _graphics: Graphics | null = null;
    private _animation: Animation | null = null;
    private _nameLabel: Label | null = null;
    private _isPlayingAttackAnimation: boolean = false;
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.SIAMESE_MAGE;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.SIAMESE_MAGE];
        
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.moveSpeed = config.moveSpeed;
        this.bulletSpeed = config.bulletSpeed || 350;
        this.skillCooldown = config.skillCooldown || 8;
        this.cost = config.cost;
        this.aoeDamage = config.aoeDamage || 1.5;
        this.aoeRange = config.aoeRange || 80;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        this.initializeVisuals();
        this.initializeAnimation();
        this.setupClickEvents();
    }
    
    protected start(): void {
        super.start();
        
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.registerHero(this.node);
        }
    }
    
    
    private initializeVisuals(): void {
        this._graphics = this.node.addComponent(Graphics);
        
        this.drawSiameseMageAppearance();
        this.createNameLabel();
    }
    
    private drawSiameseMageAppearance(): void {
        if (!this._graphics) return;
        DrawingHelper.drawHeroAppearance(this._graphics, 'siamese');
    }
    
    private createNameLabel(): void {
        this._nameLabel = DrawingHelper.createLabel(this.node, {
            text: "暹罗猫",
            fontSize: 12,
            color: new Color(255, 255, 255),
            position: { x: 0, y: 30, z: 0 },
            size: { width: 60, height: 20 }
        });
    }
    
    private initializeAnimation(): void {
        this._animation = this.node.getComponent(Animation);
        if (this._animation) {
            if (this._animation.getState('siamese_mage_idle')) {
                this._animation.play('siamese_mage_idle');
            }
        }
    }
    
    protected update(dt: number): void {
        super.update(dt);
        
        if (this._skillTimer > 0) {
            this._skillTimer -= dt;
        }
    }
    
    protected onIdleState(dt: number): void {
        if (!this.isAlive) return;
        
        const battleManager = BattleManager.instance;
        if (battleManager) {
            const nearestEnemy = battleManager.findNearestEnemy(this.node.position, this.attackRange);
            if (nearestEnemy) {
                this.currentTarget = nearestEnemy;
                this.unitState = 2;
            }
        }
    }
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;
        
        this.castMagicMissile(target);
        this.playAttackAnimation();
    }
    
    // 实现BaseHero的抽象方法
    protected performAttack(target: Node): void {
        this.onAttack(target);
    }
    
    private castMagicMissile(target: Node): void {
        // 暹罗猫使用瞬发魔法攻击
        const targetUnit = target.getComponent(BaseMouse);
        if (targetUnit) {
            targetUnit.takeDamage(this.attackDamage);
            this.createMagicHitEffect(target.position);
        }
    }
    
    private createMagicHitEffect(position: Vec3): void {
        if (this.node.parent) {
            EffectHelper.createMagicHitEffect(position, this.node.parent);
        }
    }
    
    private playAttackAnimation(): void {
        if (this._isPlayingAttackAnimation || !this.node) {
            return;
        }
        
        this._isPlayingAttackAnimation = true;
        const originalScale = Vec3.clone(this.node.scale);
        
        // 魔法施放动画 - 旋转效果
        tween(this.node)
            .to(0.1, { 
                scale: new Vec3(originalScale.x * 1.1, originalScale.y * 1.1, originalScale.z),
                eulerAngles: new Vec3(0, 0, 15)
            })
            .to(0.1, { 
                scale: originalScale,
                eulerAngles: new Vec3(0, 0, 0)
            })
            .call(() => {
                this._isPlayingAttackAnimation = false;
            })
            .start();
    }
    
    // 元素爆炸技能
    public useSkill(): boolean {
        if (this._skillTimer > 0 || !this.isAlive) {
            return false;
        }
        
        const battleManager = BattleManager.instance;
        if (!battleManager) return false;
        
        // 寻找范围内的敌人群体
        const enemies = battleManager.getEnemiesInRange(this.node.position, this.attackRange);
        if (enemies.length === 0) return false;
        
        // 选择敌人最密集的位置作为爆炸中心
        let bestTarget: Node | null = null;
        let maxEnemiesInArea = 0;
        
        for (const enemy of enemies) {
            const enemiesInArea = battleManager.getEnemiesInRange(enemy.position, this.aoeRange);
            if (enemiesInArea.length > maxEnemiesInArea) {
                maxEnemiesInArea = enemiesInArea.length;
                bestTarget = enemy;
            }
        }
        
        if (bestTarget && maxEnemiesInArea > 0) {
            this.castElementalExplosion(bestTarget.position);
            this._skillTimer = this.skillCooldown;
            console.log(`暹罗猫使用元素爆炸！影响 ${maxEnemiesInArea} 个敌人`);
            return true;
        }
        
        return false;
    }
    
    private castElementalExplosion(centerPosition: Vec3): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        // 对爆炸范围内的所有敌人造成伤害
        const affectedEnemies = battleManager.getEnemiesInRange(centerPosition, this.aoeRange);
        const explosionDamage = this.attackDamage * this.aoeDamage;
        
        for (const enemy of affectedEnemies) {
            const enemyUnit = enemy.getComponent(BaseMouse);
            if (enemyUnit) {
                enemyUnit.takeDamage(explosionDamage);
            }
        }
        
        // 创建爆炸特效
        this.createExplosionEffect(centerPosition);
        this.createSkillEffect();
    }
    
    private createExplosionEffect(position: Vec3): void {
        if (this.node.parent) {
            EffectHelper.createExplosionEffect(position, this.node.parent, this.aoeRange);
        }
    }
    
    private createSkillEffect(): void {
        if (this.node.parent) {
            EffectHelper.createSkillEffect(this.node.position, this.node.parent);
        }
    }
    
    public getSkillCooldownRemaining(): number {
        return Math.max(0, this._skillTimer);
    }
    
    public isSkillReady(): boolean {
        return this._skillTimer <= 0 && this.isAlive;
    }
    
    protected onDie(): void {
        console.log("暹罗猫法师阵亡");
        
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.unregisterHero(this.node);
        }
        
        const gridSystem = GridDeploymentSystem.instance;
        if (gridSystem) {
            gridSystem.clearHeroFromGrid(this.node);
        }
        
        const gameManager = GameManager.instance;
        if (gameManager) {
            gameManager.removeDeployedHero(this.node);
        }
        
        if (this._graphics) {
            this._graphics.fillColor = new Color(128, 128, 128);
            this.drawSiameseMageAppearance();
        }
        
        if (this._animation) {
            this._animation.stop();
        }
    }
    
    private setupClickEvents(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onHeroClick, this);
    }
    
    private onHeroClick(event: EventTouch): void {
        if (!this.isAlive) return;
        
        event.propagationStopped = true;
        
        if (this.isSkillReady()) {
            const skillUsed = this.useSkill();
            if (skillUsed) {
                console.log("暹罗猫释放元素爆炸技能！");
                this.createClickFeedback();
            } else {
                console.log("暹罗猫技能释放失败");
            }
        } else {
            console.log(`暹罗猫技能冷却中，剩余时间: ${this.getSkillCooldownRemaining().toFixed(1)}秒`);
            this.createCooldownFeedback();
        }
    }
    
    private createClickFeedback(): void {
        if (this.node.parent) {
            const feedbackPos = Vec3.add(new Vec3(), this.node.position, new Vec3(0, 40, 0));
            EffectHelper.createClickFeedback(feedbackPos, this.node.parent);
        }
    }
    
    private createCooldownFeedback(): void {
        if (this.node.parent) {
            const feedbackPos = Vec3.add(new Vec3(), this.node.position, new Vec3(0, 40, 0));
            EffectHelper.createCooldownFeedback(feedbackPos, this.node.parent);
        }
    }
}