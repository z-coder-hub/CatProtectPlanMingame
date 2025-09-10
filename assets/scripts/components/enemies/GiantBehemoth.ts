import { _decorator, Component, Color, Graphics, Vec3 } from 'cc';
import { BaseMouse } from './BaseMouse';
import { EnemyType, EnemyCategory } from '../../types/GameTypes';
import { ENEMY_CONFIGS } from '../../types/GameConstants';
import { GameManager } from '../../managers/GameManager';

const { ccclass, property } = _decorator;

/**
 * 巨兽霸主 - 超大血量践踏BOSS
 * 特点：超高血量，践踏范围攻击，巨大体型，缓慢但威严
 */
@ccclass('GiantBehemoth')
export class GiantBehemoth extends BaseMouse {

    /** 践踏攻击范围 */
    private aoeAttackRange: number = 80;
    
    /** 践踏伤害 */
    private trampleDamage: number = 50;
    
    /** 践踏冷却时间 */
    private trampleCooldown: number = 0;
    
    /** 是否正在践踏攻击 */
    private isTrampling: boolean = false;
    
    /**
     * 初始化巨兽霸主属性
     */
    protected initializeMouseStats(): void {
        const config = ENEMY_CONFIGS[EnemyType.GIANT_BEHEMOTH];
        this.mouseType = EnemyType.GIANT_BEHEMOTH;
        this.mouseCategory = EnemyCategory.BOSS;
        this.mouseName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.moveSpeed = config.moveSpeed;
        this.goldReward = config.goldReward;
        this.aoeAttackRange = (config as any).aoeAttackRange || 80;
        
        // 巨兽霸主体型更大
        this.node.scale = new Vec3(1.8, 1.8, 1);
    }
    
    /**
     * 初始化巨兽霸主外观
     */
    protected initializeMouseVisuals(): void {
        const graphics = this.node.addComponent(Graphics);
        
        // 巨兽色彩 - 深棕红色
        graphics.fillColor = new Color(120, 80, 50, 255);     // 深棕色身体
        graphics.strokeColor = new Color(80, 50, 30, 255);    // 深褐色边框
        graphics.lineWidth = 4;
        
        // 巨大的身体 - 矩形主体
        graphics.roundRect(-30, -25, 60, 50, 8);
        graphics.fill();
        graphics.stroke();
        
        // 巨兽头部
        graphics.fillColor = new Color(100, 65, 40, 255);
        graphics.circle(0, -35, 20);
        graphics.fill();
        graphics.stroke();
        
        // 威严的眼睛
        graphics.fillColor = new Color(200, 50, 50, 255);     // 红色眼睛
        graphics.circle(-8, -35, 4);
        graphics.fill();
        graphics.circle(8, -35, 4);
        graphics.fill();
        
        // 巨兽角
        graphics.fillColor = new Color(150, 120, 90, 255);    // 米色角
        graphics.moveTo(-6, -45);
        graphics.lineTo(-12, -55);
        graphics.lineTo(0, -52);
        graphics.close();
        graphics.fill();
        graphics.moveTo(6, -45);
        graphics.lineTo(12, -55);
        graphics.lineTo(0, -52);
        graphics.close();
        graphics.fill();
        
        // 厚重的腿部
        graphics.fillColor = new Color(90, 55, 35, 255);      // 深色腿部
        graphics.rect(-25, 25, 15, 20);
        graphics.fill();
        graphics.rect(-5, 25, 15, 20);
        graphics.fill();
        graphics.rect(10, 25, 15, 20);
        graphics.fill();
        
        // 背部装甲刺
        graphics.fillColor = new Color(70, 45, 25, 255);
        for (let i = 0; i < 5; i++) {
            const x = -20 + (i * 10);
            graphics.moveTo(x, -25);
            graphics.lineTo(x - 3, -35);
            graphics.lineTo(x + 3, -35);
            graphics.close();
            graphics.fill();
        }
    }
    
    /**
     * 更新践踏攻击逻辑
     */
    protected update(dt: number): void {
        super.update(dt);
        
        // 践踏攻击冷却
        this.trampleCooldown -= dt;
        if (this.trampleCooldown <= 0 && !this.isTrampling) {
            this.performTrampleAttack();
            this.trampleCooldown = 5.0; // 5秒践踏一次
        }
    }
    
    /**
     * 执行践踏攻击
     */
    private performTrampleAttack(): void {
        if (this.isTrampling) return;
        
        this.isTrampling = true;
        console.log(`巨兽霸主发动践踏攻击！范围：${this.aoeAttackRange}`);
        
        // 践踏前摇特效
        this.showTrampleChargeEffect();
        
        // 1秒后执行实际践踏
        this.scheduleOnce(() => {
            this.executeTrample();
            this.isTrampling = false;
        }, 1.0);
    }
    
    /**
     * 显示践踏蓄力特效
     */
    private showTrampleChargeEffect(): void {
        const graphics = this.node.getComponent(Graphics);
        if (!graphics) return;
        
        // 添加蓄力光环
        graphics.strokeColor = new Color(255, 200, 100, 200);
        graphics.lineWidth = 5;
        graphics.circle(0, 0, this.aoeAttackRange);
        graphics.stroke();
        
        // 地面震动效果
        graphics.strokeColor = new Color(150, 100, 50, 150);
        graphics.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
            const radius = 30 + (i * 15);
            graphics.circle(0, 0, radius);
            graphics.stroke();
        }
    }
    
    /**
     * 执行践踏伤害
     */
    private executeTrample(): void {
        const gameManager = GameManager.instance;
        if (!gameManager) return;
        
        // 对范围内的所有英雄造成伤害
        const myPosition = this.node.position;
        gameManager.heroList.forEach(hero => {
            if (!hero.node) return;
            
            const distance = Vec3.distance(myPosition, hero.node.position);
            if (distance <= this.aoeAttackRange) {
                // 由于英雄没有生命值，这里只是显示效果
                console.log(`英雄${hero.heroName}受到巨兽霸主的践踏冲击！`);
                this.showTrampleHitEffect(hero.node.position);
            }
        });
        
        // 践踏爆炸特效
        this.showTrampleExplosion();
    }
    
    /**
     * 显示践踏命中特效
     */
    private showTrampleHitEffect(targetPos: Vec3): void {
        const graphics = this.node.getComponent(Graphics);
        if (!graphics) return;
        
        // 在目标位置显示冲击特效
        const relativePos = targetPos.subtract(this.node.position);
        graphics.fillColor = new Color(255, 150, 50, 200);
        graphics.circle(relativePos.x, relativePos.y, 15);
        graphics.fill();
    }
    
    /**
     * 显示践踏爆炸特效
     */
    private showTrampleExplosion(): void {
        const graphics = this.node.getComponent(Graphics);
        if (!graphics) return;
        
        // 重绘基础外观
        graphics.clear();
        this.initializeMouseVisuals();
        
        // 添加爆炸特效
        graphics.strokeColor = new Color(255, 100, 50, 255);
        graphics.lineWidth = 6;
        graphics.circle(0, 0, this.aoeAttackRange);
        graphics.stroke();
        
        // 冲击波
        for (let i = 0; i < 4; i++) {
            graphics.strokeColor = new Color(200, 150, 100, 150 - (i * 30));
            graphics.lineWidth = 4;
            graphics.circle(0, 0, this.aoeAttackRange + (i * 20));
            graphics.stroke();
        }
        
        // 地面裂痕
        graphics.strokeColor = new Color(100, 60, 30, 200);
        graphics.lineWidth = 4;
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const startX = Math.cos(angle) * 35;
            const startY = Math.sin(angle) * 35;
            const endX = Math.cos(angle) * 90;
            const endY = Math.sin(angle) * 90;
            graphics.moveTo(startX, startY);
            graphics.lineTo(endX, endY);
            graphics.stroke();
        }
        
        // 2秒后恢复正常外观
        this.scheduleOnce(() => {
            graphics.clear();
            this.initializeMouseVisuals();
        }, 2.0);
    }
    
    /**
     * 巨兽霸主受伤效果
     */
    protected onTakeDamage(damage: number): void {
        console.log("巨兽霸主发出愤怒的咆哮！");
        
        // 愤怒特效
        const graphics = this.node.getComponent(Graphics);
        if (graphics) {
            // 添加愤怒光环
            graphics.strokeColor = new Color(255, 50, 50, 200);
            graphics.lineWidth = 4;
            graphics.circle(0, 0, 40);
            graphics.stroke();
        }
    }
    
    /**
     * 巨兽霸主特殊死亡效果
     */
    protected onDie(): void {
        console.log("巨兽霸主轰然倒下，大地震颤！");
        
        // 倒塌特效
        const graphics = this.node.getComponent(Graphics);
        if (graphics) {
            graphics.clear();
            
            // 显示倒塌的巨兽
            graphics.fillColor = new Color(120, 80, 50, 200);
            graphics.ellipse(0, 0, 80, 40); // 横向椭圆表示倒下
            graphics.fill();
            
            // 烟尘效果
            graphics.fillColor = new Color(150, 150, 150, 100);
            for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 60 + 30;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                const size = Math.random() * 8 + 4;
                graphics.circle(x, y, size);
                graphics.fill();
            }
        }
        
        // 延迟销毁，展示倒塌效果
        this.scheduleOnce(() => {
            this.node.destroy();
        }, 2.0);
    }
}