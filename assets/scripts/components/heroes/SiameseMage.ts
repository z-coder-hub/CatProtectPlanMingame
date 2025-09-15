import { _decorator, Component, Node, Vec3, Graphics, Color, Animation, EventTouch, Label, tween, Tween } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType, HeroState } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';
import { EffectHelper } from '../../utils/EffectHelper';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass, property } = _decorator;

@ccclass('SiameseMage')
export class SiameseMage extends BaseHero {
    
    
    @property({ tooltip: "AOE伤害倍率" })
    public aoeDamage: number = 1.5;
    
    @property({ tooltip: "AOE攻击范围" })
    public aoeRange: number = 80;
    
    // 私有属性
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.SIAMESE_MAGE;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.SIAMESE_MAGE];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 350;
        this.cost = config.cost;
        this.aoeDamage = config.aoeDamage || 1.5;
        this.aoeRange = config.aoeRange || 80;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        this.initializeAnimation();
    }
    
    // 继承父类start()方法，无需重写
    
    // 重写标签配置，使用完整英雄名称
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "暹罗猫法师",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 110, height: 24 }  // 增加宽度以容纳完整名称
        };
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
    }
    
    // 目标分配由 BattleManager 统一处理
    
    protected onAttack(target: Node): void {
        if (!target) return;
        
        // 使用投射物系统发射带AOE效果的魔法弹
        ProjectileSystem.CreateMagicMissile(this, target.position, this.aoeDamage, this.aoeRange);
    }

    // 重写攻击动画类型 - 指定为魔法动画
    protected getAttackAnimationType(): 'ranged' | 'magic' | 'melee' {
        return 'magic';
    }

    // 已移除多余的performAttack包装方法，直接使用onAttack实现
    
    private castMagicMissile(target: Node): void {
        if (!target || !target.isValid) return;
        
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
    
    
    
    private castElementalExplosion(centerPosition: Vec3): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        // 对爆炸范围内的所有敌人造成伤害
        const affectedEnemies = battleManager.GetEnemiesInRange(centerPosition, this.aoeRange);
        const explosionDamage = this.attackDamage * this.aoeDamage;
        
        for (const enemy of affectedEnemies) {
            const enemyUnit = enemy.getComponent(BaseMouse);
            if (enemyUnit) {
                enemyUnit.takeDamage(explosionDamage);
            }
        }
        
        // 创建爆炸特效
        this.createExplosionEffect(centerPosition);
    }
    
    private createExplosionEffect(position: Vec3): void {
        if (this.node.parent) {
            EffectHelper.createExplosionEffect(position, this.node.parent, this.aoeRange);
        }
    }
    
    
    
    // 重写基类的点击处理方法
    protected onHeroClickHandler(): void {
        console.log(`${this.unitName} 被点击`);
    }
    
    private createClickFeedback(): void {
        if (this.node.parent) {
            const feedbackPos = Vec3.add(new Vec3(), this.node.position, new Vec3(0, 40, 0));
            EffectHelper.createClickFeedback(feedbackPos, this.node.parent);
        }
    }
    
}