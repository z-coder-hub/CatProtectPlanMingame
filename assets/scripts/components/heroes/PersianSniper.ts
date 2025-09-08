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
    private _activeBullets: Set<Node> | null = new Set();
    private _isPlayingAttackAnimation: boolean = false;
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.PERSIAN_SNIPER;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.PERSIAN_SNIPER];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 500;
        this.skillCooldown = config.skillCooldown || 8;
        this.cost = config.cost;
        this.critChance = config.critChance || 0.3;
        this.critMultiplier = config.critMultiplier || 2.5;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        this.initializeAnimation();
    }
    
    private initializeAnimation(): void {
        const animation = this.node.getComponent(Animation);
        if (animation) {
            if (animation.getState('persian_sniper_idle')) {
                animation.play('persian_sniper_idle');
            }
        }
    }
    
    // 使用基类的update方法
    
    // 目标分配由 BattleManager 统一处理
    
    protected onAttack(target: Node): void {
        if (!target) return;
        
        this.shootBullet(target);
        this.playAttackAnimation();
    }
    
    // 已移除多余的performAttack包装方法，直接使用onAttack实现
    
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
        const maxRange = this.attackRange; // 使用配置的攻击范围
        
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
    
    // 重写基类的技能使用方法
    protected onUseSkill(): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        // 寻找血量最高的敌人
        const enemies = battleManager.GetEnemiesInRange(this.node.position, this.attackRange);
        if (enemies.length === 0) return;
        
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
                
                console.log(`波斯猫使用穿甲射击！造成 ${skillDamage} 点伤害`);
            }
        }
    }
    
    private createSkillEffect(): void {
        if (this.node.parent) {
            EffectHelper.createSkillEffect(this.node.position, this.node.parent);
        }
    }
    
    // 重写基类的英雄点击处理方法
    protected onHeroClickHandler(): void {
        if (this.canUseSkill) {
            this.useSkill();
            console.log("波斯猫释放穿甲射击技能！");
        } else {
            console.log(`波斯猫技能冷却中，剩余时间: ${this._skillTimer.toFixed(1)}秒`);
        }
    }
    
    // 重写标签配置，使用完整英雄名称
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "波斯猫狙击手",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 120, height: 24 }  // 增加宽度以容纳完整名称
        };
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