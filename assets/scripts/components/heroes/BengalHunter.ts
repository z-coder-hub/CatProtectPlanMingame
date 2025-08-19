import { _decorator, Color, Graphics, Node } from 'cc';
import { BaseUnit } from '../base/BaseUnit';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass } = _decorator;

@ccclass('BengalHunter')
export class BengalHunter extends BaseUnit {
    
    public readonly heroType: HeroType = HeroType.BENGAL_HUNTER;
    private _graphics: Graphics | null = null;
    
    protected onLoad(): void {
        super.onLoad();
        this.initializeBengalHunterStats();
        this.initializeVisuals();
    }
    
    protected start(): void {
        super.start();
        
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.registerHero(this.node);
        }
    }
    
    private initializeBengalHunterStats(): void {
        const config = HERO_CONFIGS[HeroType.BENGAL_HUNTER];
        
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.moveSpeed = config.moveSpeed;
    }
    
    private initializeVisuals(): void {
        this._graphics = this.node.addComponent(Graphics);
        
        this.drawBengalHunterAppearance();
    }
    
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
                this.unitState = 2;
            }
        }
    }
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;
        
        // 连发攻击 - 快速造成多次伤害
        const targetUnit = target.getComponent(BaseUnit);
        if (targetUnit && targetUnit.isAlive) {
            const rapidDamage = this.attackDamage * 0.4; // 每发40%伤害
            
            // 连续3发
            targetUnit.takeDamage(rapidDamage);
            
            setTimeout(() => {
                if (targetUnit && targetUnit.isAlive) {
                    targetUnit.takeDamage(rapidDamage);
                }
            }, 100);
            
            setTimeout(() => {
                if (targetUnit && targetUnit.isAlive) {
                    targetUnit.takeDamage(rapidDamage);
                }
            }, 200);
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
        
        setTimeout(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 300);
    }
}