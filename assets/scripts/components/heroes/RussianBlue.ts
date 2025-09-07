import { _decorator, Color, Graphics, Node, Vec3, tween } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType, HeroState } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass } = _decorator;

@ccclass('RussianBlue')
export class RussianBlue extends BaseHero {
    
    public readonly heroType: HeroType = HeroType.RUSSIAN_BLUE;
    private _graphics: Graphics | null = null;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.RUSSIAN_BLUE];
        
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
        this.initializeVisuals();
    }
    
    // 继承父类start()方法，无需重写
    
    
    private initializeVisuals(): void {
        // 父类已创建Graphics组件，直接获取引用
        this._graphics = this.node.getComponent(Graphics);
        
        this.drawRussianBlueAppearance();
    }
    
    private drawRussianBlueAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 绘制俄罗斯蓝猫身体（蓝灰色星形）
        this._graphics.fillColor = new Color(106, 90, 205); // 板岩蓝色
        // 八角星形
        const points = 8;
        const outerRadius = 18;
        const innerRadius = 10;
        
        this._graphics.moveTo(outerRadius, 0);
        for (let i = 0; i < points; i++) {
            const outerAngle = (i * 2 * Math.PI) / points;
            const innerAngle = ((i + 0.5) * 2 * Math.PI) / points;
            
            const outerX = outerRadius * Math.cos(outerAngle);
            const outerY = outerRadius * Math.sin(outerAngle);
            const innerX = innerRadius * Math.cos(innerAngle);
            const innerY = innerRadius * Math.sin(innerAngle);
            
            this._graphics.lineTo(outerX, outerY);
            this._graphics.lineTo(innerX, innerY);
        }
        this._graphics.close();
        this._graphics.fill();
        
        // 精英标识（银色）
        this._graphics.strokeColor = new Color(192, 192, 192);
        this._graphics.lineWidth = 2;
        this._graphics.circle(0, 0, 5);
        this._graphics.stroke();
        
        // 穿透箭头
        this._graphics.strokeColor = new Color(255, 255, 255);
        this._graphics.lineWidth = 3;
        this._graphics.moveTo(-15, 0);
        this._graphics.lineTo(15, 0);
        this._graphics.moveTo(10, -5);
        this._graphics.lineTo(15, 0);
        this._graphics.lineTo(10, 5);
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
        
        // 穿透攻击 - 攻击直线上的所有敌人
        this.performPenetratingAttack(target);
        this.createAttackEffect();
    }
    
    // 已移除多余的performAttack包装方法，直接使用onAttack实现
    
    private performPenetratingAttack(target: Node): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        const direction = Vec3.subtract(new Vec3(), target.position, this.node.position);
        direction.normalize();
        
        const allEnemies = battleManager.GetAllEnemies();
        const hitTargets: Node[] = [];
        
        // 找到直线上的所有敌人
        for (const enemy of allEnemies) {
            if (!enemy || !enemy.isValid) continue;
            
            const toEnemy = Vec3.subtract(new Vec3(), enemy.position, this.node.position);
            const distance = toEnemy.length();
            
            if (distance <= this.attackRange) {
                toEnemy.normalize();
                const dot = Vec3.dot(direction, toEnemy);
                
                // 如果敌人在攻击方向上（容忍一些角度差）
                if (dot > 0.8) {
                    hitTargets.push(enemy);
                }
            }
        }
        
        // 按距离排序，近的先命中
        hitTargets.sort((a, b) => {
            const distA = Vec3.distance(this.node.position, a.position);
            const distB = Vec3.distance(this.node.position, b.position);
            return distA - distB;
        });
        
        // 攻击每个目标，穿透伤害递减
        for (let i = 0; i < hitTargets.length && i < 3; i++) { // 最多穿透3个目标
            const enemy = hitTargets[i];
            const enemyUnit = enemy.getComponent(BaseMouse);
            if (enemyUnit && enemyUnit.isAlive) {
                const damageMultiplier = Math.max(0.3, 1 - i * 0.2); // 每穿透一个目标伤害减少20%
                const damage = this.attackDamage * damageMultiplier;
                enemyUnit.takeDamage(damage);
                
                this.createPenetrationEffect(enemy.position, i);
            }
        }
    }
    
    private createAttackEffect(): void {
        const effectNode = new Node("AttackEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(106, 90, 205, 200);
        effectGraphics.lineWidth = 3;
        effectGraphics.circle(0, 0, 25);
        effectGraphics.stroke();
        
        this.scheduleOnce(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 0.4);
    }
    
    private createPenetrationEffect(position: Vec3, index: number): void {
        const effectNode = new Node(`PenetrationEffect_${index}`);
        effectNode.parent = this.node.parent;
        effectNode.setPosition(position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        const alpha = Math.max(50, 200 - index * 50); // 穿透效果递减
        effectGraphics.fillColor = new Color(255, 255, 255, alpha);
        effectGraphics.circle(0, 0, 15);
        effectGraphics.fill();
        
        // 闪光效果 - 使用tween系统
        const initialScale = 1;
        const initialOpacity = alpha;
        const animationDuration = (initialOpacity / 25) * 0.016; // 根据原始逻辑计算时间
        
        // 使用tween创建闪光动画
        tween({ scale: initialScale, opacity: initialOpacity })
            .to(animationDuration, { scale: initialScale + 0.2 * (initialOpacity / 25), opacity: 0 }, {
                onUpdate: (target: any, ratio: number) => {
                    if (!effectGraphics || !effectNode.isValid) return;
                    
                    const currentScale = initialScale + (target.scale - initialScale) * ratio;
                    const currentOpacity = initialOpacity - (initialOpacity * ratio);
                    
                    if (currentOpacity > 0) {
                        effectGraphics.clear();
                        effectGraphics.fillColor = new Color(255, 255, 255, Math.max(0, currentOpacity));
                        effectGraphics.circle(0, 0, 15 * currentScale);
                        effectGraphics.fill();
                    }
                },
                onComplete: () => {
                    if (effectNode && effectNode.isValid) {
                        effectNode.destroy();
                    }
                }
            })
            .start();
    }
    
    // 重写标签配置，使用"俄蓝猫"名称
    protected getHeroLabelConfig() {
        const baseConfig = super.getHeroLabelConfig();
        return {
            ...baseConfig,
            text: "俄蓝猫",
            size: { width: 70, height: 24 }
        };
    }
}