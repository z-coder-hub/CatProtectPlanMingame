import { _decorator, Node, Vec3, Graphics, Color, Animation, tween } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType, HeroState } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';
import { GridDeploymentSystem } from '../../systems/GridDeploymentSystem';
import { GameManager } from '../../managers/GameManager';
import { EffectHelper } from '../../utils/EffectHelper';
import { DrawingHelper } from '../../utils/DrawingHelper';

const { ccclass, property } = _decorator;

@ccclass('BritishKnight')
export class BritishKnight extends BaseHero {
    
    @property({ tooltip: "技能冷却时间", override: true })
    public skillCooldown: number = 12;
    
    // 私有属性
    // _graphics由BaseHero管理
    private _animation: Animation | null = null;
    private _isPlayingAttackAnimation: boolean = false;
    private _isCharged: boolean = false; // 冲锋状态
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.BRITISH_KNIGHT;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.BRITISH_KNIGHT];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 350;
        this.skillCooldown = config.skillCooldown || 12;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        this.initializeVisuals();
        this.initializeAnimation();
        // 移除setupClickEvents，使用BaseHero的统一系统
    }
    
    // 继承父类start()方法，无需重写
    
    
    private initializeVisuals(): void {
        // 使用基类BaseHero的_graphics属性
        // this._graphics由BaseHero管理
        
        this.drawBritishKnightAppearance();
        // 移除createNameLabel，使用BaseHero的统一标签系统
    }
    
    private drawBritishKnightAppearance(): void {
        if (!this._graphics) return;
        DrawingHelper.drawHeroAppearance(this._graphics, 'british');
    }
    
    // 重写标签配置，使用完整英雄名称
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "英国短毛猫骑士",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 140, height: 24 }  // 增加宽度以容纳完整名称
        };
    }
    
    private initializeAnimation(): void {
        this._animation = this.node.getComponent(Animation);
        if (this._animation) {
            if (this._animation.getState('british_knight_idle')) {
                this._animation.play('british_knight_idle');
            }
        }
    }
    
    // 使用BaseHero的统一update方法
    
    // 目标分配由 BattleManager 统一处理
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;
        
        this.meleeAttack(target);
        this.playAttackAnimation();
    }
    
    // 已移除多余的performAttack包装方法，直接使用onAttack实现
    
    private meleeAttack(target: Node): void {
        if (!target || !target.isValid) return;
        
        const targetUnit = target.getComponent(BaseMouse);
        if (targetUnit) {
            let damage = this.attackDamage;
            
            // 如果处于冲锋状态，造成额外伤害
            if (this._isCharged) {
                damage *= 1.5;
                this._isCharged = false;
                this.createChargeHitEffect(target.position);
                console.log(`英短骑士冲锋攻击！造成 ${damage} 点伤害`);
            }
            
            targetUnit.takeDamage(damage);
            this.createMeleeHitEffect(target.position);
        }
    }
    
    private createMeleeHitEffect(position: Vec3): void {
        if (this.node.parent) {
            EffectHelper.createMeleeHitEffect(position, this.node.parent);
        }
    }
    
    private createChargeHitEffect(position: Vec3): void {
        if (this.node.parent) {
            EffectHelper.createChargeHitEffect(position, this.node.parent);
        }
    }
    
    private playAttackAnimation(): void {
        if (this._isPlayingAttackAnimation || !this.node) {
            return;
        }
        
        this._isPlayingAttackAnimation = true;
        const originalScale = Vec3.clone(this.node.scale);
        const originalPosition = Vec3.clone(this.node.position);
        
        // 近战攻击动画 - 前冲攻击
        tween(this.node)
            .to(0.1, { 
                scale: new Vec3(originalScale.x * 1.2, originalScale.y * 1.2, originalScale.z),
                position: Vec3.add(new Vec3(), originalPosition, new Vec3(10, 0, 0))
            })
            .to(0.1, { 
                scale: originalScale,
                position: originalPosition
            })
            .call(() => {
                this._isPlayingAttackAnimation = false;
            })
            .start();
    }
    
    // 重写基类的技能使用方法
    protected onUseSkill(): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        // 寻找范围内的敌人
        const enemies = battleManager.GetEnemiesInRange(this.node.position, this.attackRange * 1.5);
        if (enemies.length === 0) return;
        
        // 激活冲锋状态
        this._isCharged = true;
        this.createChargeEffect();
        
        // 暂时提升攻击速度和移动速度
        const originalAttackSpeed = this.attackSpeed;
        this.attackSpeed *= 2;
        
        // 3秒后恢复正常
        this.scheduleOnce(() => {
            this.attackSpeed = originalAttackSpeed;
            console.log("英短骑士冲锋状态结束");
        }, 3);
        
        console.log("英短骑士激活重装冲锋！");
    }
    
    private createChargeEffect(): void {
        if (this.node.parent) {
            EffectHelper.createChargeEffect(this.node.position, this.node.parent);
        }
        
        // 冲锋视觉效果
        const originalColor = this._graphics?.fillColor || new Color(255, 255, 255);
        if (this._graphics) {
            this._graphics.fillColor = new Color(255, 200, 100); // 金色光芒
            this.drawBritishKnightAppearance();
            
            // 3秒后恢复原色
            this.scheduleOnce(() => {
                if (this._graphics) {
                    this._graphics.fillColor = originalColor;
                    this.drawBritishKnightAppearance();
                }
            }, 3);
        }
    }
    
    private createSkillEffect(): void {
        if (this.node.parent) {
            EffectHelper.createSkillEffect(this.node.position, this.node.parent);
        }
    }
    
    // 移除重复的技能冷却方法，使用BaseHero的canUseSkill
    
    
    
    // 重写BaseHero的点击处理方法
    protected onHeroClickHandler(): void {
        if (this.canUseSkill) {
            this.useSkill();
            console.log("英短骑士释放重装冲锋技能！");
            this.createClickFeedback();
        } else {
            console.log("英短骑士技能冷却中");
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