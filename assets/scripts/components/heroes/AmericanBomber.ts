import { _decorator, Color, Graphics, Node, Vec3 } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass } = _decorator;

@ccclass('AmericanBomber')
export class AmericanBomber extends BaseHero {
    
    public readonly heroType: HeroType = HeroType.AMERICAN_BOMBER;
    private _graphics: Graphics | null = null;
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
        
        // 每5秒扔一颗炸弹
        this._bombTimer += dt;
        if (this._bombTimer >= 5.0) {
            this._bombTimer = 0;
            this.throwBomb();
        }
    }
    
    
    private initializeVisuals(): void {
        // 父类已创建Graphics组件，直接获取引用
        this._graphics = this.node.getComponent(Graphics);
        this.drawAmericanBomberAppearance();
    }
    
    private drawAmericanBomberAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 绘制美国短毛猫身体（红白蓝三色方形）
        // 红色底部
        this._graphics.fillColor = new Color(220, 20, 60); // 深红色
        this._graphics.rect(-20, -20, 40, 13);
        this._graphics.fill();
        
        // 白色中部
        this._graphics.fillColor = new Color(255, 255, 255);
        this._graphics.rect(-20, -7, 40, 14);
        this._graphics.fill();
        
        // 蓝色顶部
        this._graphics.fillColor = new Color(0, 0, 139); // 深蓝色
        this._graphics.rect(-20, 7, 40, 13);
        this._graphics.fill();
        
        // 边框
        this._graphics.strokeColor = new Color(0, 0, 0);
        this._graphics.lineWidth = 2;
        this._graphics.rect(-20, -20, 40, 40);
        this._graphics.stroke();
        
        // 炸弹标识（黑色圆形）
        this._graphics.fillColor = new Color(0, 0, 0);
        this._graphics.circle(12, -12, 6);
        this._graphics.fill();
        
        // 引线
        this._graphics.strokeColor = new Color(255, 255, 0);
        this._graphics.lineWidth = 2;
        this._graphics.moveTo(18, -12);
        this._graphics.lineTo(22, -16);
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
    
    private throwBomb(): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        // 找到敌人最密集的区域
        const allEnemies = battleManager.getAllEnemies();
        if (allEnemies.length === 0) return;
        
        // 简化：选择一个随机敌人位置作为爆炸中心
        const randomIndex = Math.floor(Math.random() * allEnemies.length);
        const targetEnemy = allEnemies[randomIndex];
        if (!targetEnemy || !targetEnemy.isValid) return;
        
        const bombTarget = Vec3.clone(targetEnemy.position);
        
        // 创建炸弹投掷效果
        this.createBombProjectile(bombTarget);
    }
    
    private createBombProjectile(targetPosition: Vec3): void {
        const bombNode = new Node("Bomb");
        bombNode.parent = this.node.parent;
        bombNode.setPosition(this.node.position);
        
        const bombGraphics = bombNode.addComponent(Graphics);
        bombGraphics.fillColor = new Color(0, 0, 0);
        bombGraphics.circle(0, 0, 5);
        bombGraphics.fill();
        
        // 炸弹飞行轨迹（抛物线）
        const startPos = Vec3.clone(this.node.position);
        const endPos = targetPosition;
        const duration = 1.5; // 1.5秒飞行时间
        let progress = 0;
        
        const flyBomb = () => {
            progress += 0.016 / duration; // 假设60FPS
            
            if (progress >= 1.0) {
                // 爆炸
                this.explodeBomb(endPos);
                bombNode.destroy();
                return;
            }
            
            // 抛物线轨迹
            const x = startPos.x + (endPos.x - startPos.x) * progress;
            const y = startPos.y + (endPos.y - startPos.y) * progress + Math.sin(progress * Math.PI) * 50;
            const z = startPos.z + (endPos.z - startPos.z) * progress;
            
            bombNode.setPosition(x, y, z);
            
            requestAnimationFrame(flyBomb);
        };
        
        flyBomb();
    }
    
    private explodeBomb(position: Vec3): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        // AOE爆炸伤害
        const explosionRadius = 100;
        const enemies = battleManager.getEnemiesInRange(position, explosionRadius);
        
        for (const enemy of enemies) {
            const enemyUnit = enemy.getComponent(BaseMouse);
            if (enemyUnit && enemyUnit.isAlive) {
                const distance = Vec3.distance(enemy.position, position);
                const damageMultiplier = Math.max(0.3, 1 - distance / explosionRadius);
                const damage = this.attackDamage * 2 * damageMultiplier; // 炸弹伤害是普攻的2倍
                enemyUnit.takeDamage(damage);
            }
        }
        
        this.createExplosionEffect(position);
    }
    
    private createAttackEffect(): void {
        const effectNode = new Node("AttackEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(220, 20, 60, 200);
        effectGraphics.lineWidth = 3;
        effectGraphics.rect(-25, -25, 50, 50);
        effectGraphics.stroke();
        
        setTimeout(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 400);
    }
    
    private createExplosionEffect(position: Vec3): void {
        const explosionNode = new Node("Explosion");
        explosionNode.parent = this.node.parent;
        explosionNode.setPosition(position);
        
        const explosionGraphics = explosionNode.addComponent(Graphics);
        explosionGraphics.fillColor = new Color(255, 140, 0, 200); // 橙色爆炸
        explosionGraphics.circle(0, 0, 100);
        explosionGraphics.fill();
        
        // 爆炸动画
        let scale = 0.3;
        let opacity = 200;
        const explodeEffect = () => {
            scale += 0.3;
            opacity -= 25;
            
            if (explosionGraphics && explosionNode.isValid && opacity > 0) {
                explosionGraphics.clear();
                explosionGraphics.fillColor = new Color(255, 140, 0, opacity);
                explosionGraphics.circle(0, 0, 100 * scale);
                explosionGraphics.fill();
                
                // 内部白色闪光
                if (opacity > 100) {
                    explosionGraphics.fillColor = new Color(255, 255, 255, opacity * 0.7);
                    explosionGraphics.circle(0, 0, 50 * scale);
                    explosionGraphics.fill();
                }
                
                requestAnimationFrame(explodeEffect);
            } else {
                explosionNode.destroy();
            }
        };
        explodeEffect();
    }
}