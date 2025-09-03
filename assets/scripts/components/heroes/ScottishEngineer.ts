import { _decorator, Color, Graphics, Node } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType, HeroState } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass } = _decorator;

@ccclass('ScottishEngineer')
export class ScottishEngineer extends BaseHero {
    
    public readonly heroType: HeroType = HeroType.SCOTTISH_ENGINEER;
    private _buffTimer: number = 0;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.SCOTTISH_ENGINEER];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 350;
        this.skillCooldown = config.skillCooldown || 3;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        // 使用基类提供的安全方法，无需重复获取Graphics组件
        this.drawScottishEngineerAppearance();
    }
    
    // 继承父类start()方法，无需重写
    
    protected update(dt: number): void {
        super.update(dt);
        
        // 每3秒提供一次攻速buff
        this._buffTimer += dt;
        if (this._buffTimer >= 3.0) {
            this._buffTimer = 0;
            this.provideBuff();
        }
    }
    
    private drawScottishEngineerAppearance(): void {
        const graphics = this.getGraphics();
        if (!graphics) return;
        
        graphics.clear();
        
        // 绘制苏格兰折耳猫身体（橙色圆形，较小）
        graphics.fillColor = new Color(255, 140, 0); // 橙色
        graphics.circle(0, 0, 16);
        graphics.fill();
        
        // 工程师帽子（黄色）
        graphics.fillColor = new Color(255, 255, 0);
        graphics.rect(-12, -20, 24, 8);
        graphics.fill();
        
        // 工具标识（灰色扳手）
        graphics.strokeColor = new Color(128, 128, 128);
        graphics.lineWidth = 3;
        graphics.moveTo(12, -8);
        graphics.lineTo(20, -8);
        graphics.moveTo(16, -12);
        graphics.lineTo(16, -4);
        graphics.stroke();
        
        // 支撑buff光环
        graphics.strokeColor = new Color(0, 255, 0, 100);
        graphics.lineWidth = 1;
        graphics.circle(0, 0, 80);
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
        
        this.createAttackEffect();
    }
    
    // 已移除多余的performAttack包装方法，直接使用onAttack实现
    
    private provideBuff(): void {
        const battleManager = BattleManager.instance;
        if (battleManager) {
            const nearbyAllies = battleManager.GetHeroesInRange(this.node.position, 80);
            
            for (const ally of nearbyAllies) {
                const allyUnit = ally.getComponent(BaseHero);
                if (allyUnit && allyUnit.isAlive) {
                    // 临时提升攻击速度
                    const originalAttackSpeed = allyUnit.attackSpeed;
                    allyUnit.attackSpeed *= 1.3; // 增加30%攻击速度
                    
                    // 5秒后恢复
                    this.scheduleOnce(() => {
                        if (allyUnit && allyUnit.isAlive) {
                            allyUnit.attackSpeed = originalAttackSpeed;
                        }
                    }, 5.0);
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
        
        this.scheduleOnce(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 0.3);
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
    
    // 重写标签配置，使用"苏格兰猫"名称
    protected getHeroLabelConfig() {
        const baseConfig = super.getHeroLabelConfig();
        return {
            ...baseConfig,
            text: "苏格兰猫",
            size: { width: 80, height: 24 }
        };
    }
}