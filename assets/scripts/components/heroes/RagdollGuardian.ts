import { _decorator, Color, Graphics, Node } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType, HeroState } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass } = _decorator;

@ccclass('RagdollGuardian')
export class RagdollGuardian extends BaseHero {
    
    public readonly heroType: HeroType = HeroType.RAGDOLL_GUARDIAN;
    
    protected onLoad(): void {
        super.onLoad();
    }
    
    // 继承父类start()方法，无需重写
    
    // 实现BaseHero的拽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.RAGDOLL_GUARDIAN];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 200;
        this.skillCooldown = config.skillCooldown || 8;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        // 使用基类提供的安全方法，无需重复获取Graphics组件
        this.drawRagdollGuardianAppearance();
    }
    
    private drawRagdollGuardianAppearance(): void {
        const graphics = this.getGraphics();
        if (!graphics) return;
        
        graphics.clear();
        
        // 绘制布偶猫身体和边框（一条路径）
        graphics.rect(-20, -20, 40, 40);
        
        // 填充身体（粉色方形，中等大小）
        graphics.fillColor = new Color(255, 182, 193); // 粉色
        graphics.fill();
        
        // 描边银色盔甲边框
        graphics.strokeColor = new Color(192, 192, 192);
        graphics.lineWidth = 3;
        graphics.stroke();
        
        // 守护盾牌标识
        graphics.fillColor = new Color(192, 192, 192);
        graphics.moveTo(-18, -5);
        graphics.lineTo(-25, 0);
        graphics.lineTo(-18, 5);
        graphics.close();
        graphics.fill();
        
        // 十字标记
        graphics.strokeColor = new Color(255, 255, 255);
        graphics.lineWidth = 2;
        graphics.moveTo(0, -8);
        graphics.lineTo(0, 8);
        graphics.moveTo(-8, 0);
        graphics.lineTo(8, 0);
        graphics.stroke();
    }
    
    protected onIdleState(dt: number): void {
        if (!this.isAlive) return;
        
        const battleManager = BattleManager.instance;
        if (battleManager) {
            const nearestEnemy = battleManager.FindNearestEnemy(this.node.position, this.attackRange);
            if (nearestEnemy) {
                this.currentTarget = nearestEnemy;
                this.heroState = HeroState.ATTACKING;
            }
        }
    }
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;
        
        const targetUnit = target.getComponent(BaseMouse);
        if (targetUnit && targetUnit.isAlive) {
            targetUnit.takeDamage(this.attackDamage);
        }
        
        // 守护技能：为附近友军提供护盾
        this.activateGuardianAura();
        this.createAttackEffect();
    }
    
    private activateGuardianAura(): void {
        const battleManager = BattleManager.instance;
        if (battleManager) {
            const nearbyAllies = battleManager.GetHeroesInRange(this.node.position, 120);
            
            for (const ally of nearbyAllies) {
                const allyUnit = ally.getComponent(BaseHero);
                if (allyUnit && allyUnit.isAlive && ally !== this.node) {
                    // 临时增加防御力（减少受到的伤害）
                    this.applyGuardianBuff(allyUnit);
                }
            }
        }
        
        this.createGuardianAuraEffect();
    }
    
    private applyGuardianBuff(unit: BaseHero): void {
        // 布偶猫守护者提供防护，英雄单位无需生命值机制
        // 在此版本中，英雄不会受到伤害，因此不需要实现防御buff
        console.log(`布偶猫为${unit.unitName}提供守护buff`);
    }
    
    private createAttackEffect(): void {
        const effectNode = new Node("AttackEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(255, 182, 193, 200);
        effectGraphics.lineWidth = 3;
        effectGraphics.circle(0, 0, 30);
        effectGraphics.stroke();
        
        this.scheduleOnce(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 0.5);
    }
    
    private createGuardianAuraEffect(): void {
        const auraNode = new Node("GuardianAura");
        auraNode.parent = this.node.parent;
        auraNode.setPosition(this.node.position);
        
        const auraGraphics = auraNode.addComponent(Graphics);
        auraGraphics.strokeColor = new Color(255, 255, 255, 100);
        auraGraphics.lineWidth = 2;
        auraGraphics.circle(0, 0, 120);
        auraGraphics.stroke();
        
        this.scheduleOnce(() => {
            if (auraNode && auraNode.isValid) {
                auraNode.destroy();
            }
        }, 2.0);
    }
    
    // 重写标签配置，使用"布偶猫"名称
    protected getHeroLabelConfig() {
        const baseConfig = super.getHeroLabelConfig();
        return {
            ...baseConfig,
            text: "布偶猫",
            size: { width: 70, height: 24 }
        };
    }
    
    // 已移除多余的performAttack包装方法，直接使用onAttack实现
}