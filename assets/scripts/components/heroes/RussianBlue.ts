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
        // 使用基类BaseHero的_graphics属性
        // this._graphics由BaseHero管理
        
        this.drawRussianBlueAppearance();
    }
    
    private drawRussianBlueAppearance(): void {
        const graphics = this.getGraphics();
        if (!graphics) return;
        
        graphics.clear();
        
        // 绘制俄罗斯蓝猫刺客身体（深蓝色星形）
        graphics.fillColor = new Color(25, 25, 112); // 午夜蓝色
        // 八角星形，更锋利的造型
        const points = 8;
        const outerRadius = 18;
        const innerRadius = 8;
        
        graphics.moveTo(outerRadius, 0);
        for (let i = 0; i < points; i++) {
            const outerAngle = (i * 2 * Math.PI) / points;
            const innerAngle = ((i + 0.5) * 2 * Math.PI) / points;
            
            const outerX = outerRadius * Math.cos(outerAngle);
            const outerY = outerRadius * Math.sin(outerAngle);
            const innerX = innerRadius * Math.cos(innerAngle);
            const innerY = innerRadius * Math.sin(innerAngle);
            
            graphics.lineTo(outerX, outerY);
            graphics.lineTo(innerX, innerY);
        }
        graphics.close();
        graphics.fill();
        
        // 刺客面具（黑色）
        graphics.fillColor = new Color(0, 0, 0);
        graphics.rect(-8, -12, 16, 6);
        graphics.fill();
        
        // 暗影刃（紫色双刃）
        graphics.strokeColor = new Color(75, 0, 130);
        graphics.lineWidth = 3;
        // 左刃
        graphics.moveTo(-20, -3);
        graphics.lineTo(-12, 0);
        graphics.lineTo(-20, 3);
        // 右刃
        graphics.moveTo(20, -3);
        graphics.lineTo(12, 0);
        graphics.lineTo(20, 3);
        graphics.stroke();
        
        // 暗影气场（半透明紫色）
        graphics.strokeColor = new Color(75, 0, 130, 100);
        graphics.lineWidth = 1;
        graphics.circle(0, 0, 30);
        graphics.stroke();
    }
    
    // 目标分配由 BattleManager 统一处理
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;
        
        // 近战暗影刃攻击 - 发射短程暗影投射物
        this.performShadowBladeAttack(target);
        this.createAttackEffect();
    }
    
    // 已移除多余的performAttack包装方法，直接使用onAttack实现
    
    private performShadowBladeAttack(target: Node): void {
        // 发射暗影刃投射物
        this.fireShadowBlade(target);
    }
    
    private fireShadowBlade(target: Node): void {
        if (!target || !target.isValid) return;
        
        const shadowBlade = new Node("ShadowBlade");
        shadowBlade.parent = this.node.parent;
        shadowBlade.setPosition(this.node.position);
        
        const graphics = shadowBlade.addComponent(Graphics);
        graphics.fillColor = new Color(75, 0, 130, 200); // 暗紫色
        graphics.strokeColor = new Color(138, 43, 226, 255); // 蓝紫色边框
        graphics.lineWidth = 2;
        
        // 绘制暗影刃形状
        graphics.moveTo(0, -2);
        graphics.lineTo(15, -4);
        graphics.lineTo(20, 0);
        graphics.lineTo(15, 4);
        graphics.lineTo(0, 2);
        graphics.closePath();
        graphics.fill();
        graphics.stroke();
        
        // 计算飞行轨迹
        const startPos = this.node.position.clone();
        const targetPos = target.position.clone();
        const distance = Vec3.distance(startPos, targetPos);
        const duration = distance / (this.bulletSpeed || 350);
        
        // 暗影刃飞行动画
        tween(shadowBlade)
            .to(duration, { position: targetPos })
            .call(() => {
                // 穿透攻击逻辑 - 在目标位置寻找线性穿透的敌人
                this.performPenetratingDamage(startPos, targetPos);
                
                if (shadowBlade && shadowBlade.isValid) {
                    shadowBlade.destroy();
                }
            })
            .start();
    }
    
    private performPenetratingDamage(startPos: Vec3, endPos: Vec3): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        const direction = Vec3.subtract(new Vec3(), endPos, startPos);
        direction.normalize();
        
        const allEnemies = battleManager.GetAllEnemies();
        const hitTargets: Node[] = [];
        
        // 找到直线上的所有敌人（近战范围内）
        for (const enemy of allEnemies) {
            if (!enemy || !enemy.isValid) continue;
            
            const toEnemy = Vec3.subtract(new Vec3(), enemy.position, startPos);
            const distance = toEnemy.length();
            
            if (distance <= this.attackRange) {
                toEnemy.normalize();
                const dot = Vec3.dot(direction, toEnemy);
                
                // 如果敌人在攻击方向上（近战范围，容忍较小角度差）
                if (dot > 0.9) {
                    hitTargets.push(enemy);
                }
            }
        }
        
        // 按距离排序，近的先命中
        hitTargets.sort((a, b) => {
            const distA = Vec3.distance(startPos, a.position);
            const distB = Vec3.distance(startPos, b.position);
            return distA - distB;
        });
        
        const config = HERO_CONFIGS[HeroType.RUSSIAN_BLUE];
        const maxTargets = config.penetration || 2;
        
        // 攻击每个目标，穿透伤害递减
        for (let i = 0; i < hitTargets.length && i < maxTargets; i++) {
            const enemy = hitTargets[i];
            const enemyUnit = enemy.getComponent(BaseMouse);
            if (enemyUnit && enemyUnit.isAlive) {
                // 暴击判断
                const isCritical = Math.random() < (config.critChance || 0.3);
                const critMultiplier = config.critMultiplier || 2.0;
                
                const damageMultiplier = Math.max(0.5, 1 - i * 0.25); // 每穿透一个目标伤害减少25%
                let damage = this.attackDamage * damageMultiplier;
                
                if (isCritical) {
                    damage *= critMultiplier;
                }
                
                enemyUnit.takeDamage(damage);
                this.createShadowHitEffect(enemy.position, i, isCritical);
            }
        }
    }
    
    private createAttackEffect(): void {
        const effectNode = new Node("AttackEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(75, 0, 130, 200); // 暗紫色
        effectGraphics.lineWidth = 3;
        
        // 暗影波纹效果
        for (let i = 0; i < 3; i++) {
            const radius = 20 + i * 8;
            effectGraphics.circle(0, 0, radius);
        }
        effectGraphics.stroke();
        
        this.scheduleOnce(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 0.4);
    }
    
    private createShadowHitEffect(position: Vec3, index: number, isCritical: boolean): void {
        const effectNode = new Node(`ShadowHitEffect_${index}`);
        effectNode.parent = this.node.parent;
        effectNode.setPosition(position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        const alpha = Math.max(100, 255 - index * 50); // 穿透效果递减
        
        if (isCritical) {
            // 暴击效果 - 金色爆炸
            effectGraphics.fillColor = new Color(255, 215, 0, alpha);
            effectGraphics.strokeColor = new Color(255, 140, 0, alpha);
            effectGraphics.lineWidth = 3;
            
            // 暴击星形爆炸
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8;
                const x = 12 * Math.cos(angle);
                const y = 12 * Math.sin(angle);
                effectGraphics.moveTo(0, 0);
                effectGraphics.lineTo(x, y);
            }
            effectGraphics.stroke();
            
            effectGraphics.circle(0, 0, 8);
            effectGraphics.fill();
        } else {
            // 普通命中效果 - 暗影爆炸
            effectGraphics.fillColor = new Color(75, 0, 130, alpha);
            effectGraphics.circle(0, 0, 12);
            effectGraphics.fill();
        }
        
        // 命中动画效果
        const initialScale = 1;
        const finalScale = isCritical ? 1.8 : 1.3;
        const initialOpacity = alpha;
        
        tween({ scale: initialScale, opacity: initialOpacity })
            .to(0.4, { scale: finalScale, opacity: 0 }, {
                onUpdate: (target: any, ratio: number) => {
                    if (!effectGraphics || !effectNode.isValid) return;
                    
                    const currentScale = initialScale + (target.scale - initialScale) * ratio;
                    const currentOpacity = initialOpacity - (initialOpacity * ratio);
                    
                    if (currentOpacity > 0) {
                        effectNode.setScale(currentScale, currentScale, 1);
                        if (isCritical) {
                            effectGraphics.fillColor = new Color(255, 215, 0, Math.max(0, currentOpacity));
                            effectGraphics.strokeColor = new Color(255, 140, 0, Math.max(0, currentOpacity));
                        } else {
                            effectGraphics.fillColor = new Color(75, 0, 130, Math.max(0, currentOpacity));
                        }
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
    
    // 重写标签配置，使用完整英雄名称
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "俄罗斯蓝猫刺客",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 140, height: 24 }  // 增加宽度以容纳完整名称
        };
    }
}