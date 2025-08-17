import { _decorator, Component, Node, Vec3, Graphics, Color, Animation, EventTouch, Label, UITransform } from 'cc';
import { BaseUnit } from '../base/BaseUnit';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';

const { ccclass, property } = _decorator;

@ccclass('OrangeCat')
export class OrangeCat extends BaseUnit {
    
    @property({ tooltip: "子弹速度" })
    public bulletSpeed: number = 300;
    
    @property({ tooltip: "技能冷却时间" })
    public skillCooldown: number = 5;
    
    // 私有属性
    private _skillTimer: number = 0;
    private _graphics: Graphics | null = null;
    private _animation: Animation | null = null;
    private _nameLabel: Label | null = null;
    private _activeBullets: Set<Node> = new Set(); // 跟踪活跃的子弹
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.ORANGE_CAT;
    
    protected onLoad(): void {
        // 先调用父类初始化
        super.onLoad();
        
        // 设置橘猫属性
        this.initializeOrangeCatStats();
        
        // 初始化外观
        this.initializeVisuals();
        
        // 初始化动画
        this.initializeAnimation();
        
        // 添加点击事件监听器
        this.setupClickEvents();
    }
    
    protected start(): void {
        super.start();
        
        // 注册到BattleManager
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.registerHero(this.node);
        }
    }
    
    // 初始化橘猫属性
    private initializeOrangeCatStats(): void {
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
    }
    
    // 初始化外观
    private initializeVisuals(): void {
        // 添加Graphics组件绘制外观
        this._graphics = this.node.getComponent(Graphics);
        if (!this._graphics) {
            this._graphics = this.node.addComponent(Graphics);
        }
        
        this.drawOrangeCatAppearance();
        
        // 创建名称标签
        this.createNameLabel();
    }
    
    // 绘制橘猫外观
    private drawOrangeCatAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 绘制橘猫身体（橘色圆形）
        this._graphics.fillColor = new Color(255, 165, 0); // 橘色
        this._graphics.circle(0, 0, 20);
        this._graphics.fill();
        
        // 绘制轮廓
        this._graphics.strokeColor = new Color(255, 140, 0);
        this._graphics.lineWidth = 2;
        this._graphics.circle(0, 0, 20);
        this._graphics.stroke();
        
        // 绘制弓箭标识（表示射手）
        this._graphics.strokeColor = new Color(139, 69, 19); // 棕色
        this._graphics.lineWidth = 3;
        this._graphics.moveTo(-10, 0);
        this._graphics.lineTo(10, 0);
        this._graphics.stroke();
        
        // 绘制箭头
        this._graphics.moveTo(7, -3);
        this._graphics.lineTo(10, 0);
        this._graphics.lineTo(7, 3);
        this._graphics.stroke();
    }
    
    // 创建名称标签
    private createNameLabel(): void {
        // 创建标签节点
        const labelNode = new Node("NameLabel");
        labelNode.parent = this.node;
        
        // 设置标签位置（在橘猫上方）
        labelNode.setPosition(0, 30, 0);
        
        // 添加UITransform组件
        const uiTransform = labelNode.addComponent(UITransform);
        uiTransform.setContentSize(50, 20);
        
        // 添加Label组件
        this._nameLabel = labelNode.addComponent(Label);
        this._nameLabel.string = "橘猫";
        this._nameLabel.fontSize = 12;
        this._nameLabel.color = new Color(255, 255, 255); // 白色文字
        this._nameLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this._nameLabel.verticalAlign = Label.VerticalAlign.CENTER;
    }
    
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
        
        // 创建子弹节点
        const bulletNode = new Node("Bullet");
        bulletNode.parent = this.node.parent;
        bulletNode.setPosition(this.node.position);
        
        // 添加子弹图形
        const bulletGraphics = bulletNode.addComponent(Graphics);
        bulletGraphics.fillColor = new Color(255, 255, 0); // 黄色子弹
        bulletGraphics.circle(0, 0, 3);
        bulletGraphics.fill();
        
        // 跟踪子弹
        this._activeBullets.add(bulletNode);
        
        // 移动子弹
        this.moveBulletToTarget(bulletNode, target, direction);
    }
    
    // 移动子弹到目标
    private moveBulletToTarget(bulletNode: Node, target: Node, direction: Vec3): void {
        const startPosition = Vec3.clone(this.node.position); // 保存英雄的初始位置
        const maxRange = this.attackRange + 100;
        
        const updateBullet = (dt: number) => {
            // 检查子弹和英雄节点是否仍然有效
            if (!bulletNode || !bulletNode.isValid || !this.node || !this.node.isValid) {
                if (bulletNode && bulletNode.isValid) {
                    this.destroyBullet(bulletNode);
                }
                return;
            }
            
            // 移动子弹
            const moveDistance = this.bulletSpeed * dt;
            const moveVector = Vec3.multiplyScalar(new Vec3(), direction, moveDistance);
            const newPos = Vec3.add(new Vec3(), bulletNode.position, moveVector);
            bulletNode.setPosition(newPos);
            
            // 检查是否击中目标
            if (target && target.isValid) {
                const distance = Vec3.distance(newPos, target.position);
                if (distance <= 25) { // 击中判定
                    this.onBulletHitTarget(bulletNode, target);
                    return;
                }
            } else {
                // 目标已经不存在，销毁子弹
                this.destroyBullet(bulletNode);
                return;
            }
            
            // 检查子弹是否超出范围（使用保存的起始位置）
            const travelDistance = Vec3.distance(newPos, startPosition);
            if (travelDistance > maxRange) {
                this.destroyBullet(bulletNode);
                return;
            }
            
            // 继续移动
            requestAnimationFrame(() => updateBullet(0.016)); // 假设60FPS
        };
        
        updateBullet(0.016);
    }
    
    // 子弹击中目标
    private onBulletHitTarget(bulletNode: Node, target: Node): void {
        // 对目标造成伤害
        const targetUnit = target.getComponent(BaseUnit);
        if (targetUnit) {
            targetUnit.takeDamage(this.attackDamage);
        }
        
        // 创建击中特效
        this.createHitEffect(target.position);
        
        // 销毁子弹
        this.destroyBullet(bulletNode);
    }
    
    // 创建击中特效
    private createHitEffect(position: Vec3): void {
        const effectNode = new Node("HitEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.fillColor = new Color(255, 255, 0, 150);
        effectGraphics.circle(0, 0, 15);
        effectGraphics.fill();
        
        // 特效淡出并销毁
        setTimeout(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 200);
    }
    
    // 销毁子弹
    private destroyBullet(bulletNode: Node): void {
        if (bulletNode && bulletNode.isValid) {
            // 从跟踪集合中移除
            this._activeBullets.delete(bulletNode);
            bulletNode.destroy();
        }
    }
    
    // 播放攻击动画
    private playAttackAnimation(): void {
        // 简单的攻击反馈 - 缩放效果
        if (this.node) {
            const originalScale = this.node.scale;
            this.node.setScale(originalScale.x * 1.2, originalScale.y * 1.2);
            
            setTimeout(() => {
                if (this.node && this.node.isValid) {
                    this.node.setScale(originalScale);
                }
            }, 100);
        }
    }
    
    // 精准射击技能
    public useSkill(): boolean {
        if (this._skillTimer > 0 || !this.isAlive) {
            return false;
        }
        
        // 寻找最强的敌人
        const battleManager = BattleManager.instance;
        if (!battleManager) return false;
        
        const enemies = battleManager.getBattleStats();
        // 暂时简化，直接对当前目标造成额外伤害
        if (this.currentTarget) {
            const targetUnit = this.currentTarget.getComponent(BaseUnit);
            if (targetUnit) {
                const skillDamage = this.attackDamage * 3; // 300%伤害
                targetUnit.takeDamage(skillDamage);
                
                // 创建技能特效
                this.createSkillEffect();
                
                // 设置技能冷却
                this._skillTimer = this.skillCooldown;
                
                console.log(`橘猫使用精准射击！造成 ${skillDamage} 点伤害`);
                return true;
            }
        }
        
        return false;
    }
    
    // 创建技能特效
    private createSkillEffect(): void {
        const effectNode = new Node("SkillEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(255, 215, 0); // 金色
        effectGraphics.lineWidth = 3;
        effectGraphics.circle(0, 0, 30);
        effectGraphics.stroke();
        
        // 特效扩散并销毁
        let radius = 30;
        const expandEffect = () => {
            radius += 5;
            if (effectGraphics && effectNode.isValid) {
                effectGraphics.clear();
                effectGraphics.strokeColor = new Color(255, 215, 0, 255 - radius * 3);
                effectGraphics.lineWidth = 3;
                effectGraphics.circle(0, 0, radius);
                effectGraphics.stroke();
                
                if (radius < 80) {
                    requestAnimationFrame(expandEffect);
                } else {
                    effectNode.destroy();
                }
            }
        };
        expandEffect();
    }
    
    // 获取技能冷却剩余时间
    public getSkillCooldownRemaining(): number {
        return Math.max(0, this._skillTimer);
    }
    
    // 检查技能是否可用
    public isSkillReady(): boolean {
        return this._skillTimer <= 0 && this.isAlive;
    }
    
    // 重写死亡方法，添加橘猫特有的死亡效果
    protected onDie(): void {
        console.log("橘猫射手阵亡");
        
        // 清理所有活跃的子弹
        this._activeBullets.forEach(bullet => {
            if (bullet && bullet.isValid) {
                bullet.destroy();
            }
        });
        this._activeBullets.clear();
        
        // 从BattleManager注销
        const battleManager = BattleManager.instance;
        if (battleManager) {
            battleManager.unregisterHero(this.node);
        }
        
        // 创建死亡特效
        if (this._graphics) {
            this._graphics.fillColor = new Color(128, 128, 128); // 变灰
            this.drawOrangeCatAppearance();
        }
        
        // 停止动画
        if (this._animation) {
            this._animation.stop();
        }
    }
    
    // 设置点击事件
    private setupClickEvents(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onHeroClick, this);
    }
    
    // 英雄点击事件处理
    private onHeroClick(event: EventTouch): void {
        if (!this.isAlive) return;
        
        // 阻止事件传播，避免触发网格点击
        event.propagationStopped = true;
        
        // 尝试释放技能
        if (this.isSkillReady()) {
            const skillUsed = this.useSkill();
            if (skillUsed) {
                console.log("橘猫释放精准射击技能！");
                this.createClickFeedback();
            } else {
                console.log("橘猫技能释放失败");
            }
        } else {
            console.log(`橘猫技能冷却中，剩余时间: ${this.getSkillCooldownRemaining().toFixed(1)}秒`);
            this.createCooldownFeedback();
        }
    }
    
    // 创建点击反馈特效
    private createClickFeedback(): void {
        const effectNode = new Node("ClickFeedback");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(Vec3.add(new Vec3(), this.node.position, new Vec3(0, 40, 0)));
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.fillColor = new Color(255, 215, 0, 200); // 金色
        effectGraphics.circle(0, 0, 15);
        effectGraphics.fill();
        
        // 特效动画
        let scale = 1;
        let opacity = 200;
        const animateEffect = () => {
            scale += 0.1;
            opacity -= 15;
            
            if (effectGraphics && effectNode.isValid && opacity > 0) {
                effectGraphics.clear();
                effectGraphics.fillColor = new Color(255, 215, 0, opacity);
                effectGraphics.circle(0, 0, 15 * scale);
                effectGraphics.fill();
                
                requestAnimationFrame(animateEffect);
            } else {
                effectNode.destroy();
            }
        };
        animateEffect();
    }
    
    // 创建冷却反馈特效
    private createCooldownFeedback(): void {
        const effectNode = new Node("CooldownFeedback");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(Vec3.add(new Vec3(), this.node.position, new Vec3(0, 40, 0)));
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.fillColor = new Color(128, 128, 128, 150); // 灰色
        effectGraphics.circle(0, 0, 12);
        effectGraphics.fill();
        
        // 简单淡出
        setTimeout(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 300);
    }
    
    // 组件销毁时清理资源
    protected onDestroy(): void {
        // 清理所有活跃的子弹
        this._activeBullets.forEach(bullet => {
            if (bullet && bullet.isValid) {
                bullet.destroy();
            }
        });
        this._activeBullets.clear();
    }
}