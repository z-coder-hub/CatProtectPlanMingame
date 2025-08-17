import { _decorator, Component, Node, Vec3, Graphics, Color, Animation, tween, EventTouch, Label, UITransform } from 'cc';
import { BaseUnit } from '../base/BaseUnit';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';
import { GridDeploymentSystem } from '../../systems/GridDeploymentSystem';
import { GameManager } from '../../managers/GameManager';

const { ccclass, property } = _decorator;

@ccclass('MaineCat')
export class MaineCat extends BaseUnit {
    
    @property({ tooltip: "冲锋速度" })
    public chargeSpeed: number = 200;
    
    @property({ tooltip: "技能冷却时间" })
    public skillCooldown: number = 10;
    
    @property({ tooltip: "是否正在冲锋" })
    public isCharging: boolean = false;
    
    // 私有属性
    private _skillTimer: number = 0;
    private _graphics: Graphics | null = null;
    private _animation: Animation | null = null;
    private _originalPosition: Vec3 = new Vec3();
    private _nameLabel: Label | null = null;
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.MAINE_CAT;
    
    protected onLoad(): void {
        // 先调用父类初始化
        super.onLoad();
        
        // 设置缅因猫属性
        this.initializeMaineCatStats();
        
        // 初始化外观
        this.initializeVisuals();
        
        // 初始化动画
        this.initializeAnimation();
        
        // 记录初始位置
        this._originalPosition = Vec3.clone(this.node.position);
        
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
    
    // 初始化缅因猫属性
    private initializeMaineCatStats(): void {
        const config = HERO_CONFIGS[HeroType.MAINE_CAT];
        
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.moveSpeed = config.moveSpeed;
        this.skillCooldown = config.skillCooldown || 10;
    }
    
    // 初始化外观
    private initializeVisuals(): void {
        // 添加Graphics组件绘制外观
        this._graphics = this.node.getComponent(Graphics);
        if (!this._graphics) {
            this._graphics = this.node.addComponent(Graphics);
        }
        
        this.drawMaineCatAppearance();
        
        // 创建名称标签
        this.createNameLabel();
    }
    
    // 绘制缅因猫战士外观
    private drawMaineCatAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 绘制战士身体（深红色，更大）
        this._graphics.fillColor = new Color(139, 0, 0); // 深红色
        this._graphics.rect(-25, -25, 50, 50);
        this._graphics.fill();
        
        // 绘制盔甲效果（金色边框）
        this._graphics.strokeColor = new Color(255, 215, 0); // 金色
        this._graphics.lineWidth = 3;
        this._graphics.rect(-25, -25, 50, 50);
        this._graphics.stroke();
        
        // 绘制剑（银色）
        this._graphics.strokeColor = new Color(192, 192, 192); // 银色
        this._graphics.lineWidth = 4;
        this._graphics.moveTo(25, -10);
        this._graphics.lineTo(40, -10);
        this._graphics.stroke();
        
        // 剑柄
        this._graphics.strokeColor = new Color(139, 69, 19); // 棕色
        this._graphics.lineWidth = 6;
        this._graphics.moveTo(40, -10);
        this._graphics.lineTo(45, -10);
        this._graphics.stroke();
        
        // 护盾
        this._graphics.fillColor = new Color(192, 192, 192); // 银色
        this._graphics.moveTo(-25, -5);
        this._graphics.lineTo(-35, 0);
        this._graphics.lineTo(-25, 5);
        this._graphics.close();
        this._graphics.fill();
    }
    
    // 创建名称标签
    private createNameLabel(): void {
        // 创建标签节点
        const labelNode = new Node("NameLabel");
        labelNode.parent = this.node;
        
        // 设置标签位置（在缅因猫上方）
        labelNode.setPosition(0, 40, 0);
        
        // 添加UITransform组件
        const uiTransform = labelNode.addComponent(UITransform);
        uiTransform.setContentSize(60, 20);
        
        // 添加Label组件
        this._nameLabel = labelNode.addComponent(Label);
        this._nameLabel.string = "缅因猫";
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
            if (this._animation.getState('maine_cat_idle')) {
                this._animation.play('maine_cat_idle');
            }
        }
    }
    
    protected update(dt: number): void {
        // 如果正在冲锋，不执行父类的update逻辑
        if (this.isCharging) return;
        
        super.update(dt);
        
        // 更新技能冷却
        if (this._skillTimer > 0) {
            this._skillTimer -= dt;
        }
    }
    
    // 重写待机状态，自动搜索和攻击敌人
    protected onIdleState(dt: number): void {
        if (!this.isAlive || this.isCharging) return;
        
        // 寻找最近的敌人
        const battleManager = BattleManager.instance;
        if (battleManager) {
            const nearestEnemy = battleManager.findNearestEnemy(this.node.position, this.attackRange);
            if (nearestEnemy) {
                this.currentTarget = nearestEnemy;
                this.unitState = 2; // 攻击状态
                console.log("缅因猫发现目标，准备冲锋");
            }
        }
    }
    
    // 重写攻击方法 - 冲锋攻击
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive || this.isCharging) return;
        
        // 播放准备攻击动作
        this.playPrepareAction();
        
        // 短暂延迟后开始冲锋
        setTimeout(() => {
            if (target && target.isValid && this.isAlive) {
                this.chargeAttack(target);
            }
        }, 300);
    }
    
    // 播放准备攻击动作
    private playPrepareAction(): void {
        if (!this.node) return;
        
        // 战士准备冲锋时的蓄力效果
        const originalScale = Vec3.clone(this.node.scale);
        
        tween(this.node)
            .to(0.2, { scale: new Vec3(originalScale.x * 0.8, originalScale.y * 0.8, originalScale.z) })
            .to(0.1, { scale: new Vec3(originalScale.x * 1.1, originalScale.y * 1.1, originalScale.z) })
            .start();
        
        // 创建蓄力光环
        this.createChargeAura();
        
        // 播放冲锋音效
        this.playChargeSound();
    }
    
    // 创建蓄力光环
    private createChargeAura(): void {
        const auraNode = new Node("ChargeAura");
        auraNode.parent = this.node.parent;
        auraNode.setPosition(this.node.position);
        
        const auraGraphics = auraNode.addComponent(Graphics);
        auraGraphics.strokeColor = new Color(255, 0, 0, 200);
        auraGraphics.lineWidth = 4;
        auraGraphics.circle(0, 0, 30);
        auraGraphics.stroke();
        
        // 蓄力光环效果
        let scale = 1;
        let opacity = 200;
        const expandAura = () => {
            scale += 0.1;
            opacity -= 15;
            
            if (auraGraphics && auraNode.isValid && opacity > 0) {
                auraGraphics.clear();
                auraGraphics.strokeColor = new Color(255, 0, 0, opacity);
                auraGraphics.lineWidth = 4;
                auraGraphics.circle(0, 0, 30 * scale);
                auraGraphics.stroke();
                
                requestAnimationFrame(expandAura);
            } else {
                auraNode.destroy();
            }
        };
        expandAura();
    }
    
    // 播放冲锋音效
    private playChargeSound(): void {
        // 由于项目当前没有音频资源，这里用console模拟音效
        console.log("⚔️ 缅因猫冲锋音效: 吼~");
    }
    
    // 冲锋攻击
    private chargeAttack(target: Node): void {
        if (!target || !target.isValid || this.isCharging) return;
        
        this.isCharging = true;
        const targetPosition = Vec3.clone(target.position);
        
        // 计算冲锋距离和时间
        const distance = Vec3.distance(this.node.position, targetPosition);
        const chargeTime = distance / this.chargeSpeed;
        
        console.log(`缅因猫开始冲锋攻击，距离: ${distance.toFixed(2)}, 时间: ${chargeTime.toFixed(2)}秒`);
        
        // 冲锋动画
        tween(this.node)
            .to(chargeTime, { position: targetPosition })
            .call(() => {
                this.onChargeHit(target);
                // 返回原位置
                tween(this.node)
                    .to(0.5, { position: this._originalPosition })
                    .call(() => {
                        this.isCharging = false;
                        this.unitState = 0; // 返回待机状态
                        console.log("缅因猫冲锋完成，返回原位");
                    })
                    .start();
            })
            .start();
    }
    
    // 冲锋命中处理
    private onChargeHit(target: Node): void {
        if (!target || !target.isValid) return;
        
        const targetBaseUnit = target.getComponent(BaseUnit);
        if (targetBaseUnit && targetBaseUnit.isAlive) {
            // 冲锋攻击造成额外伤害
            const chargeDamage = Math.floor(this.attackDamage * 1.5);
            targetBaseUnit.takeDamage(chargeDamage);
            console.log(`缅因猫冲锋命中！造成 ${chargeDamage} 点伤害`);
        }
        
        // 显示冲击效果
        this.showChargeEffect(target.position);
    }
    
    // 显示冲击效果
    private showChargeEffect(position: Vec3): void {
        const effectNode = new Node("ChargeEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.fillColor = new Color(255, 0, 0, 150); // 半透明红色
        effectGraphics.circle(0, 0, 30);
        effectGraphics.fill();
        
        // 冲击效果动画
        let scale = 1;
        let opacity = 150;
        const impactEffect = () => {
            scale += 0.15;
            opacity -= 15;
            
            if (effectGraphics && effectNode.isValid && opacity > 0) {
                effectGraphics.clear();
                effectGraphics.fillColor = new Color(255, 0, 0, opacity);
                effectGraphics.circle(0, 0, 30 * scale);
                effectGraphics.fill();
                
                requestAnimationFrame(impactEffect);
            } else {
                effectNode.destroy();
            }
        };
        impactEffect();
    }
    
    // 炮击轰炸技能
    public useSkill(): boolean {
        if (this._skillTimer > 0 || !this.isAlive || this.isCharging) {
            return false;
        }
        
        const battleManager = BattleManager.instance;
        if (!battleManager) return false;
        
        // 找到敌人最密集的区域
        const allEnemies = battleManager.getAllEnemies();
        if (allEnemies.length === 0) return false;
        
        // 简化版本：对所有敌人造成大范围轰炸伤害
        let hitCount = 0;
        const skillDamage = this.attackDamage * 2.5; // 250%伤害
        
        for (const enemy of allEnemies) {
            if (!enemy || !enemy.isValid) continue;
            
            const enemyUnit = enemy.getComponent(BaseUnit);
            if (enemyUnit && enemyUnit.isAlive) {
                enemyUnit.takeDamage(skillDamage);
                hitCount++;
                
                // 在每个敌人位置创建爆炸特效
                this.createBombardmentEffect(enemy.position);
            }
        }
        
        if (hitCount > 0) {
            // 创建技能释放特效
            this.createSkillCastEffect();
            
            // 设置技能冷却
            this._skillTimer = this.skillCooldown;
            
            console.log(`缅因猫使用炮击轰炸！命中 ${hitCount} 个敌人，每个造成 ${skillDamage} 点伤害`);
            return true;
        }
        
        return false;
    }
    
    // 创建技能释放特效
    private createSkillCastEffect(): void {
        const effectNode = new Node("SkillCastEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(255, 140, 0); // 橙色
        effectGraphics.lineWidth = 6;
        effectGraphics.circle(0, 0, 60);
        effectGraphics.stroke();
        
        // 技能释放特效
        let radius = 60;
        let opacity = 255;
        const castEffect = () => {
            radius += 15;
            opacity -= 12;
            
            if (effectGraphics && effectNode.isValid && opacity > 0) {
                effectGraphics.clear();
                effectGraphics.strokeColor = new Color(255, 140, 0, opacity);
                effectGraphics.lineWidth = 6;
                effectGraphics.circle(0, 0, radius);
                effectGraphics.stroke();
                
                requestAnimationFrame(castEffect);
            } else {
                effectNode.destroy();
            }
        };
        castEffect();
    }
    
    // 创建轰炸爆炸特效
    private createBombardmentEffect(position: Vec3): void {
        const effectNode = new Node("BombardmentEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.fillColor = new Color(255, 140, 0, 200); // 橙色爆炸
        effectGraphics.circle(0, 0, 40);
        effectGraphics.fill();
        
        // 爆炸效果
        let scale = 0.5;
        let opacity = 200;
        const explodeEffect = () => {
            scale += 0.2;
            opacity -= 20;
            
            if (effectGraphics && effectNode.isValid && opacity > 0) {
                effectGraphics.clear();
                effectGraphics.fillColor = new Color(255, 140, 0, opacity);
                effectGraphics.circle(0, 0, 40 * scale);
                effectGraphics.fill();
                
                requestAnimationFrame(explodeEffect);
            } else {
                effectNode.destroy();
            }
        };
        explodeEffect();
    }
    
    // 更新原始位置（当英雄被移动到新位置时调用）
    public updateOriginalPosition(newPosition: Vec3): void {
        this._originalPosition = Vec3.clone(newPosition);
    }
    
    // 获取技能冷却剩余时间
    public getSkillCooldownRemaining(): number {
        return Math.max(0, this._skillTimer);
    }
    
    // 检查技能是否可用
    public isSkillReady(): boolean {
        return this._skillTimer <= 0 && this.isAlive && !this.isCharging;
    }
    
    // 重写死亡方法，添加缅因猫特有的死亡效果
    protected onDie(): void {
        console.log("缅因猫战士阵亡");
        
        // 停止冲锋状态
        this.isCharging = false;
        
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
            this.drawMaineCatAppearance();
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
        if (!this.isAlive || this.isCharging) return;
        
        // 阻止事件传播，避免触发网格点击
        event.propagationStopped = true;
        
        // 尝试释放技能
        if (this.isSkillReady()) {
            const skillUsed = this.useSkill();
            if (skillUsed) {
                console.log("缅因猫释放炮击轰炸技能！");
                this.createClickFeedback();
            } else {
                console.log("缅因猫技能释放失败");
            }
        } else {
            console.log(`缅因猫技能冷却中，剩余时间: ${this.getSkillCooldownRemaining().toFixed(1)}秒`);
            this.createCooldownFeedback();
        }
    }
    
    // 创建点击反馈特效
    private createClickFeedback(): void {
        const effectNode = new Node("ClickFeedback");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(Vec3.add(new Vec3(), this.node.position, new Vec3(0, 40, 0)));
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.fillColor = new Color(255, 140, 0, 200); // 橙色
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
                effectGraphics.fillColor = new Color(255, 140, 0, opacity);
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
}