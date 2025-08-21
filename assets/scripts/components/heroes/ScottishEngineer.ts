import { _decorator, Color, Graphics, Node } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass } = _decorator;

@ccclass('ScottishEngineer')
export class ScottishEngineer extends BaseHero {
    
    public readonly heroType: HeroType = HeroType.SCOTTISH_ENGINEER;
    private _graphics: Graphics | null = null;
    private _buffTimer: number = 0;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.SCOTTISH_ENGINEER];
        
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.moveSpeed = config.moveSpeed;
        this.bulletSpeed = config.bulletSpeed || 350;
        this.skillCooldown = config.skillCooldown || 3;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        this.initializeVisuals();
    }
    
    protected start(): void {
        super.start();
        
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.registerHero(this.node);
        }
    }
    
    protected update(dt: number): void {
        super.update(dt);
        
        // 每3秒提供一次攻速buff
        this._buffTimer += dt;
        if (this._buffTimer >= 3.0) {
            this._buffTimer = 0;
            this.provideBuff();
        }
    }
    
    
    private initializeVisuals(): void {
        this._graphics = this.node.addComponent(Graphics);
        
        this.drawScottishEngineerAppearance();
    }
    
    private drawScottishEngineerAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 绘制苏格兰折耳猫身体（橙色圆形，较小）
        this._graphics.fillColor = new Color(255, 140, 0); // 橙色
        this._graphics.circle(0, 0, 16);
        this._graphics.fill();
        
        // 工程师帽子（黄色）
        this._graphics.fillColor = new Color(255, 255, 0);
        this._graphics.rect(-12, -20, 24, 8);
        this._graphics.fill();
        
        // 工具标识（灰色扳手）
        this._graphics.strokeColor = new Color(128, 128, 128);
        this._graphics.lineWidth = 3;
        this._graphics.moveTo(12, -8);
        this._graphics.lineTo(20, -8);
        this._graphics.moveTo(16, -12);
        this._graphics.lineTo(16, -4);
        this._graphics.stroke();
        
        // 支撑buff光环
        this._graphics.strokeColor = new Color(0, 255, 0, 100);
        this._graphics.lineWidth = 1;
        this._graphics.circle(0, 0, 80);
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
        
        const targetUnit = target.getComponent(BaseMouse);
        if (targetUnit && targetUnit.isAlive) {
            targetUnit.takeDamage(this.attackDamage);
        }
        
        this.createAttackEffect();
    }
    
    // 实现BaseHero的抽象方法
    protected performAttack(target: Node): void {
        this.onAttack(target);
    }
    
    private provideBuff(): void {
        const battleManager = BattleManager.instance;
        if (battleManager) {
            const nearbyAllies = battleManager.getHeroesInRange(this.node.position, 80);
            
            for (const ally of nearbyAllies) {
                const allyUnit = ally.getComponent(BaseHero);
                if (allyUnit && allyUnit.isAlive) {
                    // 临时提升攻击速度
                    const originalAttackSpeed = allyUnit.attackSpeed;
                    allyUnit.attackSpeed *= 1.3; // 增加30%攻击速度
                    
                    // 5秒后恢复
                    setTimeout(() => {
                        if (allyUnit && allyUnit.isAlive) {
                            allyUnit.attackSpeed = originalAttackSpeed;
                        }
                    }, 5000);
                }
            }
        }
        
        this.createBuffEffect();
    }
    
    private createAttackEffect(): void {
        const effectNode = new Node("AttackEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(255, 140, 0, 200);
        effectGraphics.lineWidth = 2;
        effectGraphics.circle(0, 0, 20);
        effectGraphics.stroke();
        
        setTimeout(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 300);
    }
    
    private createBuffEffect(): void {
        const buffNode = new Node("BuffEffect");
        buffNode.parent = this.node.parent;
        buffNode.setPosition(this.node.position);
        
        const buffGraphics = buffNode.addComponent(Graphics);
        buffGraphics.strokeColor = new Color(0, 255, 0, 150);
        buffGraphics.lineWidth = 2;
        buffGraphics.circle(0, 0, 80);
        buffGraphics.stroke();
        
        // 扩散效果
        let radius = 80;
        let opacity = 150;
        const expandEffect = () => {
            radius += 5;
            opacity -= 15;
            
            if (buffGraphics && buffNode.isValid && opacity > 0) {
                buffGraphics.clear();
                buffGraphics.strokeColor = new Color(0, 255, 0, opacity);
                buffGraphics.lineWidth = 2;
                buffGraphics.circle(0, 0, radius);
                buffGraphics.stroke();
                
                requestAnimationFrame(expandEffect);
            } else {
                buffNode.destroy();
            }
        };
        expandEffect();
    }
}