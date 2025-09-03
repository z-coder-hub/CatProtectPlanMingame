import { _decorator, Color, Graphics, Node, Vec3 } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType, HeroState } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass } = _decorator;

@ccclass('NorwegianIce')
export class NorwegianIce extends BaseHero {
    
    public readonly heroType: HeroType = HeroType.NORWEGIAN_ICE;
    private _graphics: Graphics | null = null;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.NORWEGIAN_ICE];
        
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
        this.drawNorwegianIceAppearance();
    }
    
    // 继承父类start()方法，无需重写
    
    private drawNorwegianIceAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 绘制挪威森林猫身体（冰蓝色菱形）
        this._graphics.fillColor = new Color(173, 216, 230); // 浅蓝色
        this._graphics.moveTo(0, -20);
        this._graphics.lineTo(15, 0);
        this._graphics.lineTo(0, 20);
        this._graphics.lineTo(-15, 0);
        this._graphics.close();
        this._graphics.fill();
        
        // 冰霜边框
        this._graphics.strokeColor = new Color(70, 130, 180);
        this._graphics.lineWidth = 2;
        this._graphics.moveTo(0, -20);
        this._graphics.lineTo(15, 0);
        this._graphics.lineTo(0, 20);
        this._graphics.lineTo(-15, 0);
        this._graphics.close();
        this._graphics.stroke();
        
        // 雪花标识
        this._graphics.strokeColor = new Color(255, 255, 255);
        this._graphics.lineWidth = 2;
        this._graphics.moveTo(0, -10);
        this._graphics.lineTo(0, 10);
        this._graphics.moveTo(-8, 0);
        this._graphics.lineTo(8, 0);
        this._graphics.moveTo(-6, -6);
        this._graphics.lineTo(6, 6);
        this._graphics.moveTo(-6, 6);
        this._graphics.lineTo(6, -6);
        this._graphics.stroke();
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
        
        // 冰霜AOE攻击
        const battleManager = BattleManager.instance;
        if (battleManager) {
            const enemies = battleManager.GetEnemiesInRange(target.position, 80);
            
            for (const enemy of enemies) {
                const enemyUnit = enemy.getComponent(BaseMouse);
                if (enemyUnit && enemyUnit.isAlive) {
                    enemyUnit.takeDamage(this.attackDamage);
                    
                    // 减速效果（降低移动速度）
                    const originalSpeed = enemyUnit.moveSpeed;
                    enemyUnit.moveSpeed *= 0.5;
                    
                    // 3秒后恢复速度
                    this.scheduleOnce(() => {
                        if (enemyUnit && enemyUnit.isAlive) {
                            enemyUnit.moveSpeed = originalSpeed;
                        }
                    }, 3.0);
                }
            }
        }
        
        this.createIceEffect(target.position);
    }
    
    // 已移除多余的performAttack包装方法，直接使用onAttack实现
    
    private createIceEffect(position: Vec3): void {
        const effectNode = new Node("IceEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.fillColor = new Color(173, 216, 230, 150);
        effectGraphics.circle(0, 0, 80);
        effectGraphics.fill();
        
        // 效果动画
        let opacity = 150;
        const fadeEffect = () => {
            opacity -= 10;
            
            if (effectGraphics && effectNode.isValid && opacity > 0) {
                effectGraphics.clear();
                effectGraphics.fillColor = new Color(173, 216, 230, opacity);
                effectGraphics.circle(0, 0, 80);
                effectGraphics.fill();
                
                requestAnimationFrame(fadeEffect);
            } else {
                effectNode.destroy();
            }
        };
        fadeEffect();
    }
    
    // 重写标签配置，使用"挪威猫"名称
    protected getHeroLabelConfig() {
        const baseConfig = super.getHeroLabelConfig();
        return {
            ...baseConfig,
            text: "挪威猫",
            size: { width: 70, height: 24 }
        };
    }
}