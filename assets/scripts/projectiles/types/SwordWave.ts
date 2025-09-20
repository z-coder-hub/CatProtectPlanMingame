import { _decorator, Color, Vec3, Node, Graphics, tween } from 'cc';
import { BaseProjectile } from '../BaseProjectile';
import { BaseMouse } from '../../components/enemies/BaseMouse';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass, property } = _decorator;

/**
 * 剑气投射物
 * 用于：英国短毛猫骑士、布偶猫守护者
 * 特性：近程投射物，扇形攻击范围，银白色剑光效果
 */
@ccclass('SwordWave')
export class SwordWave extends BaseProjectile {
    
    @property({ tooltip: "冲锋伤害倍率" })
    public chargeMultiplier: number = 1.5;
    
    @property({ tooltip: "前方扇形攻击角度" })
    public attackAngle: number = 60; // 度数
    
    @property({ tooltip: "前方攻击范围" })
    public frontRange: number = 120;
    
    private isChargedAttack: boolean = false;
    
    /**
     * 获取剑气投射物配置
     */
    protected getProjectileConfig(): {
        maxRange?: number;
        hitRadius?: number;
        [key: string]: any;
    } {
        return {
            maxRange: 150,  // 剑气的飞行距离较短
            hitRadius: 56   // 更大的碰撞检测范围 - 放大1.6倍以匹配视觉尺寸
        };
    }
    
    /**
     * 初始化剑气的视觉外观
     * 锋利剑形设计，金属光泽反射，能量波纹环绕
     */
    protected initializeVisuals(): void {
        if (!this.graphics) return;

        this.graphics.clear();

        // === 绘制剑气能量场 === - 放大1.6倍

        // 外层能量光环（淡蓝色）
        this.graphics.fillColor = new Color(176, 196, 222, 80); // 淡钢蓝色
        // 手动绘制椭圆能量场
        this.graphics.moveTo(25.6, 0);
        for (let i = 0; i <= 16; i++) {
            const angle = (i * 22.5) * Math.PI / 180;
            const x = Math.cos(angle) * 25.6;
            const y = Math.sin(angle) * 19.2;
            if (i === 0) {
                this.graphics.moveTo(x, y);
            } else {
                this.graphics.lineTo(x, y);
            }
        }
        this.graphics.close();
        this.graphics.fill();

        // 中层剑气波动（银蓝色）
        this.graphics.fillColor = new Color(200, 200, 255, 120); // 银蓝色
        // 手动绘制中层椭圆
        this.graphics.moveTo(20.8, 0);
        for (let i = 0; i <= 16; i++) {
            const angle = (i * 22.5) * Math.PI / 180;
            const x = Math.cos(angle) * 20.8;
            const y = Math.sin(angle) * 15.2;
            if (i === 0) {
                this.graphics.moveTo(x, y);
            } else {
                this.graphics.lineTo(x, y);
            }
        }
        this.graphics.close();
        this.graphics.fill();

        // === 绘制主体剑形 ===

        // 剑气主体（深银色渐变）
        this.graphics.fillColor = new Color(192, 192, 192, 220); // 深银色
        // 绘制精细剑形（更锋利的轮廓）
        this.graphics.moveTo(0, -9);      // 上剑尖
        this.graphics.lineTo(14, -1);     // 右上刃
        this.graphics.lineTo(14, 1);      // 右下刃
        this.graphics.lineTo(0, 9);       // 下剑尖
        this.graphics.lineTo(-10, 2);     // 左下部
        this.graphics.lineTo(-10, -2);    // 左上部
        this.graphics.close();
        this.graphics.fill();

        // 剑身中脊（亮银色）
        this.graphics.fillColor = new Color(220, 220, 220, 240);
        this.graphics.moveTo(0, -7);
        this.graphics.lineTo(11, -0.5);
        this.graphics.lineTo(11, 0.5);
        this.graphics.lineTo(0, 7);
        this.graphics.lineTo(-7, 1);
        this.graphics.lineTo(-7, -1);
        this.graphics.close();
        this.graphics.fill();

        // 剑锋（纯白金属光）
        this.graphics.fillColor = new Color(255, 255, 255, 255);
        this.graphics.moveTo(0, -5);
        this.graphics.lineTo(9, -0.3);
        this.graphics.lineTo(9, 0.3);
        this.graphics.lineTo(0, 5);
        this.graphics.lineTo(-5, 0.5);
        this.graphics.lineTo(-5, -0.5);
        this.graphics.close();
        this.graphics.fill();

        // === 金属光泽效果 ===

        // 主要反光面（上半部分）
        this.graphics.fillColor = new Color(255, 255, 255, 180);
        this.graphics.moveTo(0, -7);
        this.graphics.lineTo(8, -2);
        this.graphics.lineTo(6, -1);
        this.graphics.lineTo(0, -3);
        this.graphics.lineTo(-4, -1.5);
        this.graphics.close();
        this.graphics.fill();

        // 次要反光条纹
        this.graphics.strokeColor = new Color(255, 255, 255, 150);
        this.graphics.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const offset = -6 + i * 3;
            this.graphics.moveTo(offset, -1.5);
            this.graphics.lineTo(offset + 4, 0);
            this.graphics.moveTo(offset, 1.5);
            this.graphics.lineTo(offset + 4, 0);
        }
        this.graphics.stroke();

        // === 剑气能量波纹 ===

        // 剑身能量脉动（金色）
        this.graphics.strokeColor = new Color(255, 215, 0, 200);
        this.graphics.lineWidth = 1.5;

        // 沿剑身的能量线
        this.graphics.moveTo(-8, -1.5);
        this.graphics.lineTo(12, -0.8);
        this.graphics.moveTo(-8, 1.5);
        this.graphics.lineTo(12, 0.8);
        this.graphics.stroke();

        // 环形能量波（围绕剑气）
        this.graphics.strokeColor = new Color(200, 200, 255, 150);
        this.graphics.lineWidth = 1.2;
        for (let i = 0; i < 3; i++) {
            const radiusX = 14 + i * 2;
            const radiusY = 10 + i * 1.5;
            // 手动绘制椭圆环形
            this.graphics.moveTo(radiusX, 0);
            for (let j = 0; j <= 16; j++) {
                const angle = (j * 22.5) * Math.PI / 180;
                const x = Math.cos(angle) * radiusX;
                const y = Math.sin(angle) * radiusY;
                if (j === 0) {
                    this.graphics.moveTo(x, y);
                } else {
                    this.graphics.lineTo(x, y);
                }
            }
            this.graphics.close();
        }
        this.graphics.stroke();

        // === 切割轨迹效果 ===

        // 剑气轨迹线（放射状）
        this.graphics.strokeColor = new Color(255, 255, 255, 120);
        this.graphics.lineWidth = 0.8;

        // 从剑尖发出的能量线
        for (let i = 0; i < 5; i++) {
            const angle = (-40 + i * 20) * Math.PI / 180;
            const startX = 12;
            const startY = 0;
            const endX = startX + Math.cos(angle) * 8;
            const endY = startY + Math.sin(angle) * 8;

            this.graphics.moveTo(startX, startY);
            this.graphics.lineTo(endX, endY);
        }
        this.graphics.stroke();

        // === 剑气边框和轮廓 ===

        // 主体轮廓（深钢色）
        this.graphics.strokeColor = new Color(105, 105, 105, 255);
        this.graphics.lineWidth = 2;
        this.graphics.moveTo(0, -9);
        this.graphics.lineTo(14, -1);
        this.graphics.lineTo(14, 1);
        this.graphics.lineTo(0, 9);
        this.graphics.lineTo(-10, 2);
        this.graphics.lineTo(-10, -2);
        this.graphics.close();
        this.graphics.stroke();

        // 剑锋边框（亮银色）
        this.graphics.strokeColor = new Color(220, 220, 220, 255);
        this.graphics.lineWidth = 1.5;
        this.graphics.moveTo(0, -5);
        this.graphics.lineTo(9, -0.3);
        this.graphics.lineTo(9, 0.3);
        this.graphics.lineTo(0, 5);
        this.graphics.lineTo(-5, 0.5);
        this.graphics.lineTo(-5, -0.5);
        this.graphics.close();
        this.graphics.stroke();

        // === 剑气锐利光效 ===

        // 剑尖闪光
        this.graphics.fillColor = new Color(255, 255, 255, 200);
        this.graphics.circle(12, 0, 1.5);
        this.graphics.fill();

        // 剑身光点
        this.graphics.fillColor = new Color(255, 255, 255, 150);
        this.graphics.circle(4, 0, 0.8);
        this.graphics.fill();
        this.graphics.circle(-2, 0, 0.6);
        this.graphics.fill();

        // 能量场边界
        this.graphics.strokeColor = new Color(176, 196, 222, 200);
        this.graphics.lineWidth = 1;
        // 手动绘制椭圆边界
        this.graphics.moveTo(16, 0);
        for (let i = 0; i <= 16; i++) {
            const angle = (i * 22.5) * Math.PI / 180;
            const x = Math.cos(angle) * 16;
            const y = Math.sin(angle) * 12;
            if (i === 0) {
                this.graphics.moveTo(x, y);
            } else {
                this.graphics.lineTo(x, y);
            }
        }
        this.graphics.close();
        this.graphics.stroke();
    }
    
    /**
     * 处理击中目标的逻辑
     * 剑气可以攻击前方扇形范围内的多个敌人
     */
    protected onHitTarget(target: BaseMouse): void {
        if (!target || !target.isAlive) return;
        
        // 计算伤害（考虑冲锋状态）
        let finalDamage = this.damage;
        if (this.isChargedAttack) {
            finalDamage *= this.chargeMultiplier;
            console.log(`[SwordWave] 冲锋剑气攻击！伤害: ${finalDamage}`);
        }
        
        // 对主目标造成伤害
        target.takeDamage(finalDamage);
        console.log(`[SwordWave] 击中目标 ${target.unitName}，造成 ${finalDamage} 伤害`);
        
        // 前方扇形范围攻击
        this.performFrontalAttack(this.node.position, finalDamage * 0.7); // 范围伤害70%
    }
    
    /**
     * 执行前方扇形攻击
     * 攻击剑气前方扇形范围内的所有敌人
     */
    private performFrontalAttack(centerPosition: Vec3, damage: number): void {
        const battleManager = BattleManager.instance;
        if (!battleManager) return;
        
        let hitCount = 0;
        
        for (const enemy of battleManager.getAllActiveEnemies()) {
            if (!enemy || !enemy.isValid) continue;
            
            const enemyComponent = enemy.getComponent(BaseMouse);
            if (!enemyComponent || !enemyComponent.isAlive) continue;
            
            // 计算距离和角度
            const distance = Vec3.distance(centerPosition, enemy.position);
            if (distance > this.frontRange) continue;
            
            // 计算角度是否在扇形范围内
            const directionToEnemy = Vec3.subtract(new Vec3(), enemy.position, centerPosition);
            const angle = Math.atan2(directionToEnemy.y, directionToEnemy.x) * 180 / Math.PI;
            const frontDirection = Math.atan2(this.direction.y, this.direction.x) * 180 / Math.PI;
            
            let angleDiff = Math.abs(angle - frontDirection);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;
            
            if (angleDiff <= this.attackAngle / 2) {
                // 在扇形范围内，造成伤害
                enemyComponent.takeDamage(damage);
                hitCount++;
                
                // 为每个被范围攻击的敌人创建特效
                this.createFrontalHitEffect(enemy.position);
            }
        }
        
        if (hitCount > 0) {
            console.log(`[SwordWave] 前方扇形攻击击中 ${hitCount} 个目标，每个造成 ${damage} 伤害`);
        }
    }
    
    /**
     * 创建击中特效
     * 剑气的银白色光芒爆炸效果
     */
    protected createHitEffect(position: Vec3): void {
        if (!this.node.parent) return;
        
        const effectNode = new Node("SwordWaveHitEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        
        // 主要爆炸效果（银白色十字光）
        effectGraphics.strokeColor = new Color(255, 255, 255, 255);
        effectGraphics.lineWidth = 4;
        // 十字剑光
        effectGraphics.moveTo(-25, 0);
        effectGraphics.lineTo(25, 0);
        effectGraphics.moveTo(0, -25);
        effectGraphics.lineTo(0, 25);
        effectGraphics.stroke();
        
        // 外层光晕
        effectGraphics.fillColor = new Color(220, 220, 255, 150);
        effectGraphics.circle(0, 0, 20);
        effectGraphics.fill();
        
        // 内层亮光
        effectGraphics.fillColor = new Color(255, 255, 255, 200);
        effectGraphics.circle(0, 0, 12);
        effectGraphics.fill();
        
        // 剑气特效持续0.3秒
        tween(effectNode)
            .delay(0.3)
            .call(() => {
                if (effectNode && effectNode.isValid) {
                    effectNode.destroy();
                }
            })
            .start();
    }
    
    /**
     * 创建前方范围攻击的小型特效
     */
    private createFrontalHitEffect(position: Vec3): void {
        if (!this.node.parent) return;
        
        const frontalEffectNode = new Node("FrontalHitEffect");
        frontalEffectNode.parent = this.node.parent;
        frontalEffectNode.setPosition(position);
        
        const frontalGraphics = frontalEffectNode.addComponent(Graphics);
        
        // 小型剑光特效
        frontalGraphics.strokeColor = new Color(255, 255, 255, 200);
        frontalGraphics.lineWidth = 2;
        frontalGraphics.moveTo(-10, 0);
        frontalGraphics.lineTo(10, 0);
        frontalGraphics.stroke();
        
        frontalGraphics.fillColor = new Color(220, 220, 255, 150);
        frontalGraphics.circle(0, 0, 8);
        frontalGraphics.fill();
        
        // 前方特效持续0.15秒
        tween(frontalEffectNode)
            .delay(0.15)
            .call(() => {
                if (frontalEffectNode && frontalEffectNode.isValid) {
                    frontalEffectNode.destroy();
                }
            })
            .start();
    }
    
    /**
     * 检查是否可以击中指定目标
     * 剑气可以击中所有敌人
     */
    protected canHitTarget(target: BaseMouse): boolean {
        return target && target.isAlive;
    }
    
    /**
     * 设置冲锋状态
     * 骑士类英雄在冲锋状态下发射剑气会有额外伤害
     */
    public setChargedAttack(isCharged: boolean, multiplier: number = 1.5): void {
        this.isChargedAttack = isCharged;
        this.chargeMultiplier = Math.max(1, multiplier);
    }
    
    /**
     * 设置前方攻击属性
     */
    public setFrontalProperties(angle: number, range: number): void {
        this.attackAngle = Math.max(30, Math.min(120, angle)); // 限制在30-120度之间
        this.frontRange = Math.max(50, range);
    }
    
    /**
     * 获取预期范围伤害
     */
    public get expectedFrontalDamage(): number {
        const baseDamage = this.damage * (this.isChargedAttack ? this.chargeMultiplier : 1);
        return baseDamage * 0.7; // 范围伤害是70%
    }
}