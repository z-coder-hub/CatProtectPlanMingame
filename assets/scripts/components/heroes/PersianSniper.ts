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

@ccclass('PersianSniper')
export class PersianSniper extends BaseHero {
    
    @property({ tooltip: "子弹速度", override: true })
    public bulletSpeed: number = 500;
    
    @property({ tooltip: "技能冷却时间", override: true })
    public skillCooldown: number = 8;
    
    @property({ tooltip: "暴击几率" })
    public critChance: number = 0.3;
    
    @property({ tooltip: "暴击倍率" })
    public critMultiplier: number = 2.5;
    
    // 私有属性
    private _skillTimer: number = 0;
    private _graphics: Graphics | null = null;
    private _animation: Animation | null = null;
    private _nameLabel: Label | null = null;
    private _activeBullets: Set<Node> | null = new Set();
    private _isPlayingAttackAnimation: boolean = false;
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.PERSIAN_SNIPER;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.PERSIAN_SNIPER];
        
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.moveSpeed = config.moveSpeed;
        this.bulletSpeed = config.bulletSpeed || 500;
        this.skillCooldown = config.skillCooldown || 8;
        this.cost = config.cost;
        this.critChance = config.critChance || 0.3;
        this.critMultiplier = config.critMultiplier || 2.5;
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
        
        this.drawPersianSniperAppearance();
        this.createNameLabel();
    }
    
    private drawPersianSniperAppearance(): void {
        if (!this._graphics) return;
        DrawingHelper.drawHeroAppearance(this._graphics, 'persian');
    }
    
    private createNameLabel(): void {
        this._nameLabel = DrawingHelper.createLabel(this.node, {
            text: "波斯猫",
            fontSize: 18,  // 放大字体
            color: new Color(255, 255, 255),
            position: { x: 0, y: 35, z: 0 },  // 提高位置适应更大字体
            size: { width: 70, height: 24 }   // 增大标签尺寸
        });
    }
    
    private initializeAnimation(): void {
        this._animation = this.node.getComponent(Animation);
        if (this._animation) {
            if (this._animation.getState('persian_sniper_idle')) {
                this._animation.play('persian_sniper_idle');
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
        
        this.shootBullet(target);
        this.playAttackAnimation();
    }
    
    // 实现BaseHero的抽象方法
    protected performAttack(target: Node): void {
        this.onAttack(target);
    }
    
    private shootBullet(target: Node): void {
        const direction = Vec3.subtract(new Vec3(), target.position, this.node.position);
        direction.normalize();
        
        const bulletNode = SimpleObjectPool.getBulletNode();
        bulletNode.parent = this.node.parent;
        bulletNode.setPosition(this.node.position);
        
        if (this._activeBullets) {
            this._activeBullets.add(bulletNode);
        }
        
        this.moveBulletToTarget(bulletNode, target, direction);
    }
    
    private moveBulletToTarget(bulletNode: Node, target: Node, direction: Vec3): void {
        const startPosition = Vec3.clone(this.node.position);
        const maxRange = this.attackRange + 400; // 狙击手射程更远
        
        let targetPosition = Vec3.clone(target.position);
        
        const targetUnit = target.getComponent(BaseMouse);
        if (targetUnit && targetUnit.moveSpeed > 0) {
            const timeToReach = Vec3.distance(startPosition, targetPosition) / this.bulletSpeed;
            const predictedOffset = Vec3.multiplyScalar(new Vec3(), direction, targetUnit.moveSpeed * timeToReach * 0.3);
            targetPosition = Vec3.add(targetPosition, targetPosition, predictedOffset);
        }
        
        const directionToTarget = Vec3.subtract(new Vec3(), targetPosition, startPosition);
        const distanceToTarget = directionToTarget.length();
        if (distanceToTarget > maxRange) {
            directionToTarget.normalize();
            targetPosition = Vec3.add(new Vec3(), startPosition, Vec3.multiplyScalar(new Vec3(), directionToTarget, maxRange));
        }
        
        const distance = Vec3.distance(startPosition, targetPosition);
        const duration = distance / this.bulletSpeed;
        
        const bulletTween = tween(bulletNode)
            .to(duration, { position: targetPosition })
            .call(() => {
                if (target && target.isValid) {
                    const finalDistance = Vec3.distance(bulletNode.position, target.position);
                    if (finalDistance <= 40) {
                        this.onBulletHitTarget(bulletNode, target);
                        return;
                    }
                }
                this.safeDestroyBullet(bulletNode);
            });
        
        let checkCount = 0;
        const maxChecks = Math.floor(duration * 10);
        
        const addPeriodicCheck = () => {
            if (checkCount >= maxChecks) return;
            
            bulletTween.delay(0.1).call(() => {
                if (!target || !target.isValid) {
                    Tween.stopAllByTarget(bulletNode);
                    this.safeDestroyBullet(bulletNode);
                    return;
                }
                
                const currentDistance = Vec3.distance(bulletNode.position, target.position);
                if (currentDistance <= 30) {
                    Tween.stopAllByTarget(bulletNode);
                    this.onBulletHitTarget(bulletNode, target);
                    return;
                }
                
                checkCount++;
                if (checkCount < maxChecks) {
                    addPeriodicCheck();
                }
            });
        };
        
        addPeriodicCheck();
        bulletTween.start();
    }
    
    private onBulletHitTarget(bulletNode: Node, target: Node): void {
        const targetUnit = target.getComponent(BaseMouse);
        if (targetUnit) {
            let damage = this.attackDamage;
            
            // 暴击判定
            if (Math.random() < this.critChance) {
                damage *= this.critMultiplier;
                this.createCriticalHitEffect(target.position);
                console.log(`波斯猫暴击！造成 ${damage} 点伤害`);
            }
            
            targetUnit.takeDamage(damage);
        }
        
        this.createHitEffect(target.position);
        this.safeDestroyBullet(bulletNode);
    }
    
    private createHitEffect(position: Vec3): void {
        if (this.node.parent) {
            EffectHelper.createHitEffect(position, this.node.parent);
        }
    }
    
    private createCriticalHitEffect(position: Vec3): void {
        if (this.node.parent) {
            EffectHelper.createCriticalHitEffect(position, this.node.parent);
        }
    }
    
    private safeDestroyBullet(bulletNode: Node): void {
        if (bulletNode && bulletNode.isValid) {
            Tween.stopAllByTarget(bulletNode);
            
            if (this && this._activeBullets) {
                this._activeBullets.delete(bulletNode);
            }
            SimpleObjectPool.recycleBulletNode(bulletNode);
        }
    }
    
    private playAttackAnimation(): void {
        if (this._isPlayingAttackAnimation || !this.node) {
            return;
        }
        
        this._isPlayingAttackAnimation = true;
        const originalScale = Vec3.clone(this.node.scale);
        
        tween(this.node)
            .to(0.08, { scale: new Vec3(originalScale.x * 1.2, originalScale.y * 1.2, originalScale.z) })
            .to(0.08, { scale: originalScale })
            .call(() => {
                this._isPlayingAttackAnimation = false;
            })
            .start();
    }
    
    // 穿甲射击技能
    public useSkill(): boolean {
        if (this._skillTimer > 0 || !this.isAlive) {
            return false;
        }
        
        const battleManager = BattleManager.instance;
        if (!battleManager) return false;
        
        // 寻找血量最高的敌人
        const enemies = battleManager.getEnemiesInRange(this.node.position, this.attackRange);
        if (enemies.length === 0) return false;
        
        let targetEnemy: Node | null = null;
        let maxHealth = 0;
        
        for (const enemy of enemies) {
            const enemyUnit = enemy.getComponent(BaseMouse);
            if (enemyUnit && enemyUnit.currentHealth > maxHealth) {
                maxHealth = enemyUnit.currentHealth;
                targetEnemy = enemy;
            }
        }
        
        if (targetEnemy) {
            const targetUnit = targetEnemy.getComponent(BaseMouse);
            if (targetUnit) {
                const skillDamage = this.attackDamage * this.critMultiplier * 1.5; // 超级暴击
                targetUnit.takeDamage(skillDamage);
                
                this.createSkillEffect();
                this._skillTimer = this.skillCooldown;
                
                console.log(`波斯猫使用穿甲射击！造成 ${skillDamage} 点伤害`);
                return true;
            }
        }
        
        return false;
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
        console.log("波斯猫狙击手阵亡");
        
        if (this._activeBullets) {
            this._activeBullets.forEach(bullet => {
                if (bullet && bullet.isValid) {
                    bullet.destroy();
                }
            });
            this._activeBullets.clear();
            this._activeBullets = null;
        }
        
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
            this.drawPersianSniperAppearance();
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
                console.log("波斯猫释放穿甲射击技能！");
                this.createClickFeedback();
            } else {
                console.log("波斯猫技能释放失败");
            }
        } else {
            console.log(`波斯猫技能冷却中，剩余时间: ${this.getSkillCooldownRemaining().toFixed(1)}秒`);
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
    
    protected onDestroy(): void {
        if (this._activeBullets) {
            this._activeBullets.forEach(bullet => {
                if (bullet && bullet.isValid) {
                    Tween.stopAllByTarget(bullet);
                    SimpleObjectPool.recycleBulletNode(bullet);
                }
            });
            this._activeBullets.clear();
            this._activeBullets = null;
        }
    }
}