import { _decorator, Component, Node, Vec3, Graphics, Color, Animation, EventTouch, Label, tween, Tween } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { ProjectileSystem } from '../../projectiles/ProjectileSystem';
import { EffectHelper } from '../../utils/EffectHelper';
import { SimpleObjectPool } from '../../utils/SimpleObjectPool';
import { GameManager } from '../../managers/GameManager';

const { ccclass, property } = _decorator;

@ccclass('PersianSniper')
export class PersianSniper extends BaseHero {
    
    @property({ tooltip: "子弹速度", override: true })
    public bulletSpeed: number = 500;
    
    
    @property({ tooltip: "暴击几率" })
    public critChance: number = 0.3;
    
    @property({ tooltip: "暴击倍率" })
    public critMultiplier: number = 2.5;
    
    // 私有属性
    private _isPlayingAttackAnimation: boolean = false;
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.PERSIAN_SNIPER;
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.PERSIAN_SNIPER];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 500;
        this.cost = config.cost;
        this.critChance = config.critChance || 0.3;
        this.critMultiplier = config.critMultiplier || 2.5;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        this.initializeAnimation();
    }
    
    private initializeAnimation(): void {
        const animation = this.node.getComponent(Animation);
        if (animation) {
            if (animation.getState('persian_sniper_idle')) {
                animation.play('persian_sniper_idle');
            }
        }
    }
    
    // 使用基类的update方法
    
    // 目标分配由 BattleManager 统一处理
    
    protected onAttack(target: Node): void {
        if (!target) return;
        
        // 使用投射物系统发射带暴击的物理子弹
        ProjectileSystem.CreatePhysicalBullet(this, target.position, this.critChance, this.critMultiplier);
        this.playAttackAnimation();
    }
    
    // 已移除多余的performAttack包装方法，直接使用onAttack实现
    
    private shootBullet(target: Node): void {
        const direction = Vec3.subtract(new Vec3(), target.position, this.node.position);
        direction.normalize();
        
        const bulletNode = SimpleObjectPool.getBulletNode();
        bulletNode.parent = this.node.parent;
        bulletNode.setPosition(this.node.position);
        
        // 让子弹直线飞行
        this.launchBulletInDirection(bulletNode, direction);
    }
    
    // 让子弹朝指定方向直线飞行
    private launchBulletInDirection(bulletNode: Node, direction: Vec3): void {
        // 游戏边界定义
        const gameBounds = {
            minX: -600,
            maxX: 600,
            minY: -400,
            maxY: 400
        };
        
        // 计算子弹飞行的最大距离（直到飞出边界）
        const maxTravelDistance = this.calculateMaxTravelDistance(bulletNode.position, direction, gameBounds);
        
        // 计算最终位置
        const finalPosition = Vec3.add(
            new Vec3(), 
            bulletNode.position, 
            Vec3.multiplyScalar(new Vec3(), direction, maxTravelDistance)
        );
        
        // 计算飞行时间
        const travelTime = maxTravelDistance / this.bulletSpeed;
        
        // 开始子弹飞行动画
        const bulletTween = tween(bulletNode)
            .to(travelTime, { position: finalPosition })
            .call(() => {
                // 飞出边界，销毁子弹
                this.safeDestroyBullet(bulletNode);
            });
        
        // 启动碰撞检测
        this.startBulletCollisionDetection(bulletNode);
        
        bulletTween.start();
    }
    
    // 计算子弹能飞行的最大距离（直到飞出边界）
    private calculateMaxTravelDistance(startPos: Vec3, direction: Vec3, bounds: any): number {
        let maxDistance = 2000; // 默认最大距离
        
        // 计算与各个边界的交点，取最近的
        if (direction.x > 0) {
            const distToRightBound = (bounds.maxX - startPos.x) / direction.x;
            maxDistance = Math.min(maxDistance, distToRightBound);
        } else if (direction.x < 0) {
            const distToLeftBound = (bounds.minX - startPos.x) / direction.x;
            maxDistance = Math.min(maxDistance, distToLeftBound);
        }
        
        if (direction.y > 0) {
            const distToTopBound = (bounds.maxY - startPos.y) / direction.y;
            maxDistance = Math.min(maxDistance, distToTopBound);
        } else if (direction.y < 0) {
            const distToBottomBound = (bounds.minY - startPos.y) / direction.y;
            maxDistance = Math.min(maxDistance, distToBottomBound);
        }
        
        return Math.max(maxDistance, 100); // 确保至少飞行100像素
    }
    
    // 启动子弹碰撞检测
    private startBulletCollisionDetection(bulletNode: Node): void {
        const collisionCheckInterval = 0.02; // 50fps检测频率
        const hitRadius = 25; // 碰撞检测半径
        
        const collisionCheckFunction = () => {
            if (!bulletNode || !bulletNode.isValid) {
                this.unschedule(collisionCheckFunction);
                return;
            }
            
            // 获取所有敌人并检测碰撞
            const gameManager = GameManager.instance;
            if (gameManager && gameManager.activeEnemies) {
                for (const enemy of gameManager.activeEnemies) {
                    if (!enemy || !enemy.isValid) continue;
                    
                    const distance = Vec3.distance(bulletNode.position, enemy.position);
                    if (distance <= hitRadius) {
                        // 击中敌人
                        this.unschedule(collisionCheckFunction);
                        Tween.stopAllByTarget(bulletNode);
                        this.onBulletHitEnemy(bulletNode, enemy);
                        return;
                    }
                }
            }
        };
        
        // 启动碰撞检测调度
        this.schedule(collisionCheckFunction, collisionCheckInterval);
    }
    
    private onBulletHitEnemy(bulletNode: Node, enemy: Node): void {
        const enemyUnit = enemy.getComponent(BaseMouse);
        if (enemyUnit) {
            let damage = this.attackDamage;
            
            // 暴击判定
            if (Math.random() < this.critChance) {
                damage *= this.critMultiplier;
                this.createCriticalHitEffect(bulletNode.position);
                console.log(`波斯猫暴击！造成 ${damage} 点伤害`);
            }
            
            enemyUnit.takeDamage(damage);
        }
        
        this.createHitEffect(bulletNode.position);
        this.safeDestroyBullet(bulletNode);
    }
    
    private createHitEffect(position: Vec3): void {
        if (this.node.parent) {
            EffectHelper.createHitEffect(position, this.node.parent);
        }
    }
    
    private createCriticalHitEffect(position: Vec3): void {
        if (this.node.parent) {
            EffectHelper.createCriticalHitEffect(position, this.node.parent);
        }
    }
    
    private safeDestroyBullet(bulletNode: Node): void {
        if (bulletNode && bulletNode.isValid) {
            Tween.stopAllByTarget(bulletNode);
            
            // 取消该子弹的所有调度任务
            this.unscheduleAllCallbacks();
            
            SimpleObjectPool.recycleBulletNode(bulletNode);
        }
    }
    
    private playAttackAnimation(): void {
        if (this._isPlayingAttackAnimation || !this.node) {
            return;
        }
        
        this._isPlayingAttackAnimation = true;
        const originalScale = Vec3.clone(this.node.scale);
        
        tween(this.node)
            .to(0.08, { scale: new Vec3(originalScale.x * 1.2, originalScale.y * 1.2, originalScale.z) })
            .to(0.08, { scale: originalScale })
            .call(() => {
                this._isPlayingAttackAnimation = false;
            })
            .start();
    }
    
    
    
    // 重写基类的英雄点击处理方法
    protected onHeroClickHandler(): void {
        console.log(`${this.unitName} 被点击`);
    }
    
    // 重写标签配置，使用完整英雄名称
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "波斯猫狙击手",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 120, height: 24 }  // 增加宽度以容纳完整名称
        };
    }
    
    protected onDestroy(): void {
        // 清理由基类处理
    }
}