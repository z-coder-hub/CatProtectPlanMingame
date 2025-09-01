import { _decorator, Color, Graphics, Node } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType, HeroState } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass } = _decorator;

@ccclass('BengalHunter')
export class BengalHunter extends BaseHero {
    
    public readonly heroType: HeroType = HeroType.BENGAL_HUNTER;
    private _graphics: Graphics | null = null;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.BENGAL_HUNTER];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 350;
        this.skillCooldown = config.skillCooldown || 6;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        // 父类已创建Graphics组件，直接获取引用
        this._graphics = this.node.getComponent(Graphics);
        this.drawBengalHunterAppearance();
    }
    
    // 继承父类start()方法，无需重写
    
    private drawBengalHunterAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 绘制孟加拉猫身体（金黄色圆形）
        this._graphics.fillColor = new Color(255, 215, 0); // 金色
        this._graphics.circle(0, 0, 18);
        this._graphics.fill();
        
        // 绘制花纹（深色条纹）
        this._graphics.strokeColor = new Color(139, 69, 19);
        this._graphics.lineWidth = 2;
        this._graphics.moveTo(-12, -8);
        this._graphics.lineTo(12, -8);
        this._graphics.moveTo(-12, 0);
        this._graphics.lineTo(12, 0);
        this._graphics.moveTo(-12, 8);
        this._graphics.lineTo(12, 8);
        this._graphics.stroke();
        
        // 双弓标识
        this._graphics.strokeColor = new Color(139, 69, 19);
        this._graphics.lineWidth = 3;
        this._graphics.moveTo(-8, -15);
        this._graphics.lineTo(8, -15);
        this._graphics.moveTo(-8, 15);
        this._graphics.lineTo(8, 15);
        this._graphics.stroke();
    }
    
    protected onIdleState(dt: number): void {
        if (!this.isAlive) return;
        
        const battleManager = BattleManager.instance;
        if (battleManager) {
            const nearestEnemy = battleManager.findNearestEnemy(this.node.position, this.attackRange);
            if (nearestEnemy) {
                this.currentTarget = nearestEnemy;
                this.heroState = HeroState.ATTACKING;
            }
        }
    }
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;
        
        // 连发攻击 - 快速造成多次伤害
        const targetUnit = target.getComponent(BaseMouse);
        if (targetUnit && targetUnit.isAlive) {
            const rapidDamage = this.attackDamage * 0.4; // 每发40%伤害
            
            // 连续3发
            targetUnit.takeDamage(rapidDamage);
            
            this.scheduleOnce(() => {
                if (targetUnit && targetUnit.isAlive) {
                    targetUnit.takeDamage(rapidDamage);
                }
            }, 0.1);
            
            this.scheduleOnce(() => {
                if (targetUnit && targetUnit.isAlive) {
                    targetUnit.takeDamage(rapidDamage);
                }
            }, 0.2);
        }
        
        this.createAttackEffect();
    }
    
    private createAttackEffect(): void {
        const effectNode = new Node("AttackEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(255, 215, 0, 200);
        effectGraphics.lineWidth = 3;
        effectGraphics.circle(0, 0, 25);
        effectGraphics.stroke();
        
        this.scheduleOnce(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 0.3);
    }
    
    // 重写标签配置，使用"孟加拉猫"名称
    protected getHeroLabelConfig() {
        const baseConfig = super.getHeroLabelConfig();
        return {
            ...baseConfig,
            text: "孟加拉猫",
            size: { width: 80, height: 24 }
        };
    }
    
    // 已移除多余的performAttack包装方法，直接使用onAttack实现
}