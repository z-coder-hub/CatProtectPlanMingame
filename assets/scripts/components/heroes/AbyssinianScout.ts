import { _decorator, Color, Graphics, Node } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType, HeroState } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass } = _decorator;

@ccclass('AbyssinianScout')
export class AbyssinianScout extends BaseHero {
    
    public readonly heroType: HeroType = HeroType.ABYSSINIAN_SCOUT;
    private _graphics: Graphics | null = null;
    private _scoutTimer: number = 0;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.ABYSSINIAN_SCOUT];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 350;
        this.skillCooldown = config.skillCooldown || 4;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        // 父类已创建Graphics组件，直接获取引用
        this._graphics = this.node.getComponent(Graphics);
        this.drawAbyssinianScoutAppearance();
    }
    
    // 继承父类start()方法，无需重写
    
    protected update(dt: number): void {
        super.update(dt);
        
        // 每4秒提供一次侦察buff
        this._scoutTimer += dt;
        if (this._scoutTimer >= 4.0) {
            this._scoutTimer = 0;
            this.provideScoutBuff();
        }
    }
    
    private drawAbyssinianScoutAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 绘制阿比西尼亚猫身体（棕色六边形）
        this._graphics.fillColor = new Color(160, 82, 45); // 棕色
        // 六边形
        const sides = 6;
        const radius = 16;
        this._graphics.moveTo(radius, 0);
        for (let i = 1; i <= sides; i++) {
            const angle = (i * 2 * Math.PI) / sides;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            this._graphics.lineTo(x, y);
        }
        this._graphics.fill();
        
        // 侦察镜标识（黄色）
        this._graphics.fillColor = new Color(255, 255, 0);
        this._graphics.circle(8, -8, 6);
        this._graphics.fill();
        
        // 侦察范围指示
        this._graphics.strokeColor = new Color(255, 255, 0, 80);
        this._graphics.lineWidth = 1;
        this._graphics.circle(0, 0, 100);
        this._graphics.stroke();
        
        // 望远镜
        this._graphics.strokeColor = new Color(128, 128, 128);
        this._graphics.lineWidth = 2;
        this._graphics.moveTo(12, -12);
        this._graphics.lineTo(18, -18);
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
        
        const targetUnit = target.getComponent(BaseMouse);
        if (targetUnit && targetUnit.isAlive) {
            targetUnit.takeDamage(this.attackDamage);
        }
        
        this.createAttackEffect();
    }
    
    // 已移除多余的performAttack包装方法，直接使用onAttack实现
    
    private provideScoutBuff(): void {
        const battleManager = BattleManager.instance;
        if (battleManager) {
            const nearbyAllies = battleManager.getHeroesInRange(this.node.position, 100);
            
            for (const ally of nearbyAllies) {
                const allyUnit = ally.getComponent(BaseHero);
                if (allyUnit && allyUnit.isAlive) {
                    // 临时扩展攻击范围
                    const originalRange = allyUnit.attackRange;
                    allyUnit.attackRange *= 1.4; // 增加40%攻击范围
                    
                    // 6秒后恢复
                    this.scheduleOnce(() => {
                        if (allyUnit && allyUnit.isAlive) {
                            allyUnit.attackRange = originalRange;
                        }
                    }, 6.0);
                }
            }
        }
        
        this.createScoutEffect();
    }
    
    private createAttackEffect(): void {
        const effectNode = new Node("AttackEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(160, 82, 45, 200);
        effectGraphics.lineWidth = 2;
        effectGraphics.circle(0, 0, 22);
        effectGraphics.stroke();
        
        this.scheduleOnce(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 0.3);
    }
    
    private createScoutEffect(): void {
        const scoutNode = new Node("ScoutEffect");
        scoutNode.parent = this.node.parent;
        scoutNode.setPosition(this.node.position);
        
        const scoutGraphics = scoutNode.addComponent(Graphics);
        scoutGraphics.strokeColor = new Color(255, 255, 0, 150);
        scoutGraphics.lineWidth = 2;
        scoutGraphics.circle(0, 0, 100);
        scoutGraphics.stroke();
        
        // 雷达扫描效果
        let angle = 0;
        const scanEffect = () => {
            angle += 10;
            
            if (scoutGraphics && scoutNode.isValid && angle < 360) {
                scoutGraphics.clear();
                scoutGraphics.strokeColor = new Color(255, 255, 0, 150);
                scoutGraphics.lineWidth = 2;
                scoutGraphics.circle(0, 0, 100);
                scoutGraphics.stroke();
                
                // 扫描线
                const rad = (angle * Math.PI) / 180;
                const x = 100 * Math.cos(rad);
                const y = 100 * Math.sin(rad);
                scoutGraphics.strokeColor = new Color(255, 255, 0, 255);
                scoutGraphics.lineWidth = 3;
                scoutGraphics.moveTo(0, 0);
                scoutGraphics.lineTo(x, y);
                scoutGraphics.stroke();
                
                requestAnimationFrame(scanEffect);
            } else {
                scoutNode.destroy();
            }
        };
        scanEffect();
    }
    
    // 重写标签配置，使用"阿比猫"名称
    protected getHeroLabelConfig() {
        const baseConfig = super.getHeroLabelConfig();
        return {
            ...baseConfig,
            text: "阿比猫",
            size: { width: 70, height: 24 }
        };
    }
}