import { _decorator, Color, Graphics, Node, Vec3, tween } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType, HeroState } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';
import { EffectHelper } from '../../utils/EffectHelper';

const { ccclass } = _decorator;

@ccclass('AmericanBomber')
export class AmericanBomber extends BaseHero {
    
    public readonly heroType: HeroType = HeroType.AMERICAN_BOMBER;
    private _bombTimer: number = 0;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.AMERICAN_BOMBER];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 350;
        this.skillCooldown = config.skillCooldown || 5;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        this.initializeVisuals();
    }
    
    // 继承父类start()方法，无需重写
    
    protected update(dt: number): void {
        super.update(dt);
        
        // 近战爆破手不需要定时炸弹，只在攻击时使用爆炸弹
    }
    
    
    private initializeVisuals(): void {
        // 使用基类BaseHero的_graphics属性
        // this._graphics由BaseHero管理
        this.drawAmericanBomberAppearance();
    }
    
    private drawAmericanBomberAppearance(): void {
        const graphics = this.getGraphics();
        if (!graphics) return;
        
        graphics.clear();
        
        // 绘制美国短毛猫爆破手身体（红白蓝三色，更紧凑的近战造型）
        // 红色底部
        graphics.fillColor = new Color(220, 20, 60); // 深红色
        graphics.rect(-16, -16, 32, 11);
        graphics.fill();
        
        // 白色中部
        graphics.fillColor = new Color(255, 255, 255);
        graphics.rect(-16, -5, 32, 10);
        graphics.fill();
        
        // 蓝色顶部
        graphics.fillColor = new Color(0, 0, 139); // 深蓝色
        graphics.rect(-16, 5, 32, 11);
        graphics.fill();
        
        // 边框
        graphics.strokeColor = new Color(0, 0, 0);
        graphics.lineWidth = 2;
        graphics.rect(-16, -16, 32, 32);
        graphics.stroke();
        
        // 爆破手护目镜（黄色）
        graphics.fillColor = new Color(255, 215, 0);
        graphics.circle(0, -8, 5);
        graphics.fill();
        
        // 护目镜反光
        graphics.fillColor = new Color(255, 255, 255);
        graphics.circle(-2, -10, 2);
        graphics.fill();
        
        // 手雷（左右各一个，绿色）
        graphics.fillColor = new Color(34, 139, 34);
        graphics.circle(-12, 8, 4);
        graphics.circle(12, 8, 4);
        graphics.fill();
        
        // 手雷引线
        graphics.strokeColor = new Color(255, 255, 0);
        graphics.lineWidth = 1;
        graphics.moveTo(-12, 4);
        graphics.lineTo(-12, 0);
        graphics.moveTo(12, 4);
        graphics.lineTo(12, 0);
        graphics.stroke();
        
        // 爆炸范围指示圆（半透明橙色）
        graphics.strokeColor = new Color(255, 69, 0, 100);
        graphics.lineWidth = 1;
        const range = this.attackRange * 0.4; // 显示攻击范围的40%
        graphics.circle(0, 0, range);
        graphics.stroke();
    }
    
    // 目标分配由 BattleManager 统一处理
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;
        
        // 近战爆炸弹攻击 - 发射近程爆炸弹
        this.fireExplosiveBomb(target);
        this.createAttackEffect();
    }
    
    // 近战爆炸弹攻击 - 直接向目标发射爆炸弹
    private fireExplosiveBomb(target: Node): void {
        if (!target || !target.isValid) return;
        
        const explosiveBomb = new Node("ExplosiveBomb");
        explosiveBomb.parent = this.node.parent;
        explosiveBomb.setPosition(this.node.position);
        
        const graphics = explosiveBomb.addComponent(Graphics);
        graphics.fillColor = new Color(34, 139, 34, 200); // 绿色炸弹
        graphics.strokeColor = new Color(255, 69, 0, 255); // 橙色边框
        graphics.lineWidth = 2;
        graphics.circle(0, 0, 4);
        graphics.fill();
        graphics.stroke();
        
        // 引线效果
        graphics.strokeColor = new Color(255, 255, 0, 255);
        graphics.lineWidth = 1;
        graphics.moveTo(0, -4);
        graphics.lineTo(0, -8);
        graphics.stroke();
        
        // 计算飞行轨迹（近战短程）
        const startPos = this.node.position.clone();
        const targetPos = target.position.clone();
        const distance = Vec3.distance(startPos, targetPos);
        const duration = distance / (this.bulletSpeed || 250); // 稍慢的爆炸弹速度
        
        // 爆炸弹飞行动画（简单直线）
        tween(explosiveBomb)
            .to(duration, { position: targetPos })
            .call(() => {
                // 接触引爆 - 大范围AOE爆炸
                this.detonateExplosiveBomb(targetPos);
                
                if (explosiveBomb && explosiveBomb.isValid) {
                    explosiveBomb.destroy();
                }
            })
            .start();
    }
    
    private detonateExplosiveBomb(position: Vec3): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        const config = HERO_CONFIGS[HeroType.AMERICAN_BOMBER];
        const explosionRadius = config.aoeRange || 120;
        const aoeDamageMultiplier = config.aoeDamage || 2.5;
        
        // 获取爆炸范围内的所有敌人
        const enemies = battleManager.GetEnemiesInRange(position, explosionRadius);
        
        for (const enemy of enemies) {
            const enemyUnit = enemy.getComponent(BaseMouse);
            if (enemyUnit && enemyUnit.isAlive) {
                const distance = Vec3.distance(enemy.position, position);
                const damageMultiplier = Math.max(0.4, 1 - distance / explosionRadius);
                const damage = this.attackDamage * aoeDamageMultiplier * damageMultiplier;
                enemyUnit.takeDamage(damage);
            }
        }
        
        this.createMegaExplosionEffect(position);
    }
    
    private createMegaExplosionEffect(position: Vec3): void {
        const explosionNode = new Node("MegaExplosion");
        explosionNode.parent = this.node.parent;
        explosionNode.setPosition(position);
        
        const graphics = explosionNode.addComponent(Graphics);
        const config = HERO_CONFIGS[HeroType.AMERICAN_BOMBER];
        const explosionRadius = config.aoeRange || 120;
        
        // 多层爆炸效果
        const colors = [
            new Color(255, 69, 0, 255),    // 橙红色内核
            new Color(255, 140, 0, 200),   // 橙色中层  
            new Color(255, 215, 0, 150),   // 金色外层
            new Color(255, 255, 255, 100)  // 白色冲击波
        ];
        
        for (let i = 0; i < colors.length; i++) {
            const radius = (explosionRadius * 0.3) + (i * 15);
            graphics.fillColor = colors[i];
            graphics.circle(0, 0, radius);
            graphics.fill();
        }
        
        // 爆炸扩散动画
        tween({ scale: 0.5, opacity: 255 })
            .to(0.6, { scale: 2.0, opacity: 0 }, {
                onUpdate: (target: any, ratio: number) => {
                    if (!graphics || !explosionNode.isValid) return;
                    
                    const currentScale = 0.5 + (target.scale - 0.5) * ratio;
                    const currentOpacity = 255 - (255 * ratio);
                    
                    explosionNode.setScale(currentScale, currentScale, 1);
                    
                    // 重新绘制带透明度的爆炸
                    if (currentOpacity > 0) {
                        graphics.clear();
                        for (let i = 0; i < colors.length; i++) {
                            const radius = (explosionRadius * 0.3) + (i * 15);
                            const color = colors[i];
                            graphics.fillColor = new Color(color.r, color.g, color.b, currentOpacity * (color.a / 255));
                            graphics.circle(0, 0, radius);
                            graphics.fill();
                        }
                    }
                },
                onComplete: () => {
                    if (explosionNode && explosionNode.isValid) {
                        explosionNode.destroy();
                    }
                }
            })
            .start();
    }
    
    private createAttackEffect(): void {
        const effectNode = new Node("AttackEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        
        // 近战爆破手的发射效果 - 火花四溅
        const sparkColors = [
            new Color(255, 69, 0, 255),   // 橙红色
            new Color(255, 140, 0, 200),  // 橙色
            new Color(255, 215, 0, 150)   // 金色
        ];
        
        // 绘制火花效果
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const length = 15 + Math.random() * 10;
            const x = length * Math.cos(angle);
            const y = length * Math.sin(angle);
            
            effectGraphics.strokeColor = sparkColors[i % 3];
            effectGraphics.lineWidth = 2;
            effectGraphics.moveTo(0, 0);
            effectGraphics.lineTo(x, y);
            effectGraphics.stroke();
        }
        
        // 中心发光效果
        effectGraphics.fillColor = new Color(255, 255, 255, 200);
        effectGraphics.circle(0, 0, 8);
        effectGraphics.fill();
        
        this.scheduleOnce(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 0.3);
    }
    
    // 重写标签配置，使用完整英雄名称
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "美国短毛猫爆破手",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 160, height: 24 }  // 增加宽度以容纳完整名称
        };
    }
}