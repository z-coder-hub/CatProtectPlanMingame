import { _decorator, Color, Graphics, Node } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';

const { ccclass } = _decorator;

@ccclass('BengalHunter')
export class BengalHunter extends BaseHero {
    
    public readonly heroType: HeroType = HeroType.BENGAL_HUNTER;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.BENGAL_HUNTER];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 350;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        // 父类已创建Graphics组件，直接使用
        // _graphics由基类管理
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
    
    // 目标分配由 BattleManager 统一处理
    
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive || !target.isValid) return;
        
        // 使用投射物系统发射快速物理子弹（模拟连发效果）
        ProjectileSystem.CreatePhysicalBullet(this, target.position);
        
        // 短延迟后发射第二发和第三发子弹
        this.scheduleOnce(() => {
            if (target && target.isValid) {
                ProjectileSystem.CreatePhysicalBullet(this, target.position);
            }
        }, 0.1);
        
        this.scheduleOnce(() => {
            if (target && target.isValid) {
                ProjectileSystem.CreatePhysicalBullet(this, target.position);
            }
        }, 0.2);
        
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
    
    // 重写标签配置，使用完整英雄名称
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "孟加拉猫猎手",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 120, height: 24 }  // 增加宽度以容纳完整名称
        };
    }
    
    // 已移除多余的performAttack包装方法，直接使用onAttack实现
}