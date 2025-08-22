import { _decorator, Component, Node, Vec3, Color, Animation, tween, Tween } from 'cc';
import { BaseHero } from './BaseHero';
import { BaseMouse } from '../enemies/BaseMouse';
import { HeroType } from '../../types/GameTypes';
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
    
    protected start(): void {
        super.start();
        
        // 注册到BattleManager
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.registerHero(this.node);
        }
    }
    
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
    
    // 重写待机状态，自动搜索和攻击敌人
    protected onIdleState(dt: number): void {
        if (!this.isAlive) return;
        
        // 寻找最近的敌人
        const battleManager = BattleManager.instance;
        if (battleManager) {
            const nearestEnemy = battleManager.findNearestEnemy(this.node.position, this.attackRange);
            if (nearestEnemy) {
                this.currentTarget = nearestEnemy;
                this.unitState = 2; // 攻击状态
            }
        }
    }
    
    // 重写攻击方法
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;
        
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
        
        // 移动子弹
        this.moveBulletToTarget(bulletNode, target, direction);
    }
    
    // 移动子弹到目标
    private moveBulletToTarget(bulletNode: Node, target: Node, direction: Vec3): void {
        const startPosition = Vec3.clone(this.node.position);
        const maxRange = this.attackRange + 300; // 增加子弹飞行距离
        
        // 计算目标位置：目标当前位置 + 预测移动
        let targetPosition = Vec3.clone(target.position);
        
        // 如果目标在移动，进行简单的预测
        const targetUnit = target.getComponent(BaseMouse);
        if (targetUnit && targetUnit.moveSpeed > 0) {
            const timeToReach = Vec3.distance(startPosition, targetPosition) / this.bulletSpeed;
            const predictedOffset = Vec3.multiplyScalar(new Vec3(), direction, targetUnit.moveSpeed * timeToReach * 0.5);
            targetPosition = Vec3.add(targetPosition, targetPosition, predictedOffset);
        }
        
        // 确保目标位置不超出射程
        const directionToTarget = Vec3.subtract(new Vec3(), targetPosition, startPosition);
        const distanceToTarget = directionToTarget.length();
        if (distanceToTarget > maxRange) {
            directionToTarget.normalize();
            targetPosition = Vec3.add(new Vec3(), startPosition, Vec3.multiplyScalar(new Vec3(), directionToTarget, maxRange));
        }
        
        // 计算移动时间
        const distance = Vec3.distance(startPosition, targetPosition);
        const duration = distance / this.bulletSpeed;
        
        // 存储tween引用以便可能的清理
        const bulletTween = tween(bulletNode)
            .to(duration, { position: targetPosition })
            .call(() => {
                // 检查是否击中目标
                if (target && target.isValid) {
                    const finalDistance = Vec3.distance(bulletNode.position, target.position);
                    if (finalDistance <= 35) { // 稍微放宽击中判定
                        this.onBulletHitTarget(bulletNode, target);
                        return;
                    }
                }
                
                // 未击中或目标已消失，安全销毁子弹
                this.safeDestroyBullet(bulletNode);
            });
        
        // 添加中途检查，如果目标消失则提前结束
        let checkCount = 0;
        const maxChecks = Math.floor(duration * 10); // 每0.1秒检查一次
        
        const addPeriodicCheck = () => {
            if (checkCount >= maxChecks) return;
            
            bulletTween.delay(0.1).call(() => {
                // 检查目标是否仍然存在
                if (!target || !target.isValid) {
                    // 目标消失，停止tween并清理子弹
                    Tween.stopAllByTarget(bulletNode);
                    this.safeDestroyBullet(bulletNode);
                    return;
                }
                
                // 检查是否提前击中（对于移动目标）
                const currentDistance = Vec3.distance(bulletNode.position, target.position);
                if (currentDistance <= 25) {
                    Tween.stopAllByTarget(bulletNode);
                    this.onBulletHitTarget(bulletNode, target);
                    return;
                }
                
                checkCount++;
                if (checkCount < maxChecks) {
                    addPeriodicCheck();
                }
            });
        };
        
        addPeriodicCheck();
        bulletTween.start();
    }
    
    // 子弹击中目标
    private onBulletHitTarget(bulletNode: Node, target: Node): void {
        // 对目标造成伤害
        const targetUnit = target.getComponent(BaseMouse);
        if (targetUnit) {
            targetUnit.takeDamage(this.attackDamage);
        }
        
        // 创建击中特效
        this.createHitEffect(target.position);
        
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
                
                console.log(`橘猫使用精准射击！造成 ${skillDamage} 点伤害`);
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
    
    // 重写死亡方法，添加橘猫特有的死亡效果
    protected onDie(): void {
        console.log("橘猫射手阵亡");
        
        // 清理所有活跃的子弹
        if (this._activeBullets) {
            this._activeBullets.forEach(bullet => {
                if (bullet && bullet.isValid) {
                    bullet.destroy();
                }
            });
            this._activeBullets.clear();
            // 将引用设为null，防止异步回调访问
            this._activeBullets = null;
        }
        
        // 从BattleManager注销
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.unregisterHero(this.node);
        }
        
        // 从网格系统中清理位置
        const gridSystem = GridDeploymentSystem.instance;
        if (gridSystem) {
            gridSystem.clearHeroFromGrid(this.node);
        }
        
        // 从GameManager的英雄列表中移除
        const gameManager = GameManager.instance;
        if (gameManager) {
            gameManager.removeDeployedHero(this.node);
        }
        
        // 创建死亡特效
        if (this._graphics) {
            this._graphics.fillColor = new Color(128, 128, 128); // 变灰
            this.drawHeroAppearance(); // 使用基类方法
        }
        
        // 停止动画
        if (this._animation) {
            this._animation.stop();
        }
    }
    
    // 重写基类的英雄点击处理
    protected onHeroClickHandler(): void {
        // 尝试释放技能
        if (this.canUseSkill) {
            this.useSkill();
            console.log("橘猫释放精准射击技能！");
            this.createClickFeedback();
        } else {
            console.log(`橘猫技能冷却中，剩余时间: ${this._skillTimer.toFixed(1)}秒`);
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
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.moveSpeed = config.moveSpeed;
        this.bulletSpeed = config.bulletSpeed || 300;
        this.skillCooldown = config.skillCooldown || 5;
        this.cost = config.cost;
    }
    
    // 实现BaseHero的抽象方法
    protected initializeHeroVisuals(): void {
        // 初始化动画
        this.initializeAnimation();
    }
    
    // 重写标签配置，使用"橘猫"名称
    protected getHeroLabelConfig() {
        const baseConfig = super.getHeroLabelConfig();
        return {
            ...baseConfig,
            text: "橘猫",
            size: { width: 60, height: 24 }
        };
    }
    
    // 实现BaseHero的抽象方法
    protected performAttack(target: Node): void {
        this.onAttack(target);
    }
    
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