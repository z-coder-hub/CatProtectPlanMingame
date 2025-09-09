import { _decorator, Component, Node, Vec3, Color, Animation, tween, Tween } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType, HeroState } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';
import { GridDeploymentSystem } from '../../systems/GridDeploymentSystem';
import { GameManager } from '../../managers/GameManager';
import { EffectHelper } from '../../utils/EffectHelper';
import { SimpleObjectPool } from '../../utils/SimpleObjectPool';

const { ccclass, property } = _decorator;

@ccclass('OrangeCat')
export class OrangeCat extends BaseHero {
    
    @property({ tooltip: "子弹速度", override: true })
    public bulletSpeed: number = 300;
    
    @property({ tooltip: "技能冷却时间", override: true })
    public skillCooldown: number = 5;
    
    // 私有属性
    private _activeBullets: Set<Node> | null = new Set(); // 跟踪活跃的子弹
    private _isPlayingAttackAnimation: boolean = false; // 防止攻击动画重叠
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.ORANGE_CAT;
    
    // 移除onLoad重写，使用基类的统一实现
    
    // 继承父类start()方法，无需重写
    
    // 移除重复的外观初始化代码，使用基类统一实现
    
    // 初始化动画
    private initializeAnimation(): void {
        this._animation = this.node.getComponent(Animation);
        if (this._animation) {
            // 播放idle动画（如果存在）
            if (this._animation.getState('orange_cat_idle')) {
                this._animation.play('orange_cat_idle');
            }
        }
    }
    
    protected update(dt: number): void {
        super.update(dt);
        
        // 更新技能冷却
        if (this._skillTimer > 0) {
            this._skillTimer -= dt;
        }
    }
    
    // 目标分配由 BattleManager 统一处理
    
    // 重写攻击方法
    protected onAttack(target: Node): void {
        if (!target) return;
        
        // 创建子弹攻击目标
        this.shootBullet(target);
        
        // 播放攻击动画（如果有）
        this.playAttackAnimation();
    }
    
    // 发射子弹
    private shootBullet(target: Node): void {
        // 计算子弹方向
        const direction = Vec3.subtract(new Vec3(), target.position, this.node.position);
        direction.normalize();
        
        // 从对象池获取子弹节点
        const bulletNode = SimpleObjectPool.getBulletNode();
        bulletNode.parent = this.node.parent;
        bulletNode.setPosition(this.node.position);
        
        // 跟踪子弹
        if (this._activeBullets) {
            this._activeBullets.add(bulletNode);
        }
        
        // 让子弹直线飞行
        this.launchBulletInDirection(bulletNode, direction);
    }
    
    // 让子弹朝指定方向直线飞行
    private launchBulletInDirection(bulletNode: Node, direction: Vec3): void {
        // 游戏边界定义（根据实际游戏区域调整）
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
        this.startBulletCollisionDetection(bulletNode, direction);
        
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
    private startBulletCollisionDetection(bulletNode: Node, _direction: Vec3): void {
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
                const activeEnemies = gameManager.activeEnemies;
                
                for (const enemy of activeEnemies) {
                    if (!enemy || !enemy.isValid) continue;
                    
                    // 检查敌人是否有BaseMouse组件
                    const enemyComponent = enemy.getComponent(BaseMouse);
                    if (!enemyComponent || !enemyComponent.isAlive) continue;
                    
                    const distance = Vec3.distance(bulletNode.position, enemy.position);
                    
                    if (distance <= hitRadius) {
                        // 击中敌人
                        this.unschedule(collisionCheckFunction);
                        Tween.stopAllByTarget(bulletNode);
                        this.onBulletHitEnemy(bulletNode, enemy);
                        return;
                    }
                }
            } else {
                // 只在GameManager不存在时记录错误
                console.error(`[OrangeCat] GameManager实例不存在或activeEnemies为空`);
            }
        };
        
        // 启动碰撞检测调度，使用特定的调度键
        this.schedule(collisionCheckFunction, collisionCheckInterval);
        
        // 将调度函数与子弹关联，便于后续清理
        (bulletNode as any)._collisionCheckFunction = collisionCheckFunction;
    }
    
    // 子弹击中敌人
    private onBulletHitEnemy(bulletNode: Node, enemy: Node): void {
        // 对敌人造成伤害
        const enemyUnit = enemy.getComponent(BaseMouse);
        if (enemyUnit) {
            enemyUnit.takeDamage(this.attackDamage);
        } else {
            console.error(`[OrangeCat] 击中目标缺少BaseMouse组件: ${enemy.name}`);
        }
        
        // 创建击中特效
        this.createHitEffect(bulletNode.position);
        
        // 安全销毁子弹
        this.safeDestroyBullet(bulletNode);
    }
    
    // 创建击中特效
    private createHitEffect(position: Vec3): void {
        if (this.node.parent) {
            EffectHelper.createHitEffect(position, this.node.parent);
        }
    }
    
    
    // 安全销毁子弹（用于异步回调中）
    private safeDestroyBullet(bulletNode: Node): void {
        if (bulletNode && bulletNode.isValid) {
            // 停止所有与此子弹相关的tween动画
            Tween.stopAllByTarget(bulletNode);
            
            // 取消该子弹特定的碰撞检测调度
            const collisionCheckFunction = (bulletNode as any)._collisionCheckFunction;
            if (collisionCheckFunction) {
                this.unschedule(collisionCheckFunction);
                delete (bulletNode as any)._collisionCheckFunction;
            }
            
            // 只有在对象仍然有效时才尝试从集合中移除
            if (this && this._activeBullets) {
                this._activeBullets.delete(bulletNode);
            }
            // 回收到对象池而不是直接销毁
            SimpleObjectPool.recycleBulletNode(bulletNode);
        }
    }
    
    // 播放攻击动画
    private playAttackAnimation(): void {
        // 如果正在播放攻击动画，跳过避免重叠
        if (this._isPlayingAttackAnimation || !this.node) {
            return;
        }
        
        this._isPlayingAttackAnimation = true;
        const originalScale = Vec3.clone(this.node.scale);
        
        // 使用Tween系统制作更流畅的攻击动画
        tween(this.node)
            .to(0.05, { scale: new Vec3(originalScale.x * 1.15, originalScale.y * 1.15, originalScale.z) }) // 快速放大
            .to(0.05, { scale: originalScale }) // 快速恢复
            .call(() => {
                this._isPlayingAttackAnimation = false; // 动画完成，重置标志
            })
            .start();
    }
    
    // 重写基类技能使用
    protected onUseSkill(): void {
        // 寻找目标
        if (this.currentTarget) {
            const targetUnit = this.currentTarget.getComponent(BaseMouse);
            if (targetUnit) {
                const skillDamage = this.attackDamage * 3; // 300%伤害
                targetUnit.takeDamage(skillDamage);
                
                // 创建技能特效
                this.createSkillEffect();
            }
        }
    }
    
    // 创建技能特效
    private createSkillEffect(): void {
        if (this.node.parent) {
            EffectHelper.createSkillEffect(this.node.position, this.node.parent);
        }
    }
    
    // 移除重复方法，使用基类的canUseSkill
    
    // 英雄不会死亡，移除死亡相关方法
    
    // 重写基类的英雄点击处理
    protected onHeroClickHandler(): void {
        // 尝试释放技能
        if (this.canUseSkill) {
            this.useSkill();
            this.createClickFeedback();
        } else {
            this.createCooldownFeedback();
        }
    }
    
    // 创建点击反馈特效
    private createClickFeedback(): void {
        if (this.node.parent) {
            const feedbackPos = Vec3.add(new Vec3(), this.node.position, new Vec3(0, 40, 0));
            EffectHelper.createClickFeedback(feedbackPos, this.node.parent);
        }
    }
    
    // 创建冷却反馈特效
    private createCooldownFeedback(): void {
        if (this.node.parent) {
            const feedbackPos = Vec3.add(new Vec3(), this.node.position, new Vec3(0, 40, 0));
            EffectHelper.createCooldownFeedback(feedbackPos, this.node.parent);
        }
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroStats(): void {
        const config = HERO_CONFIGS[HeroType.ORANGE_CAT];
        
        this.unitName = config.name;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.bulletSpeed = config.bulletSpeed || 300;
        this.skillCooldown = config.skillCooldown || 5;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        // 初始化动画
        this.initializeAnimation();
    }
    
    // 实现BaseHero的抽象方法 - 英雄标签配置
    protected getHeroLabelConfig() {
        return {
            text: this.unitName || "橘猫射手",
            fontSize: 18,
            color: Color.WHITE,
            yOffset: 35,
            size: { width: 100, height: 24 }
        };
    }
    
    // 实现BaseHero的抽象方法 - 直接实现攻击逻辑，无需额外包装
    
    // 组件销毁时清理资源
    protected onDestroy(): void {
        // 清理所有活跃的子弹
        if (this._activeBullets) {
            this._activeBullets.forEach(bullet => {
                if (bullet && bullet.isValid) {
                    // 停止tween动画并回收到对象池
                    Tween.stopAllByTarget(bullet);
                    SimpleObjectPool.recycleBulletNode(bullet);
                }
            });
            this._activeBullets.clear();
            this._activeBullets = null;
        }
    }
}