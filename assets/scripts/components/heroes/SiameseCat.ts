import { _decorator, Component, Node, Vec3, Graphics, Color, Animation, EventTouch, Label, UITransform } from 'cc';
import { BaseUnit } from '../base/BaseUnit';
import { HeroType } from '../../types/GameTypes';
import { HERO_CONFIGS } from '../../types/GameConstants';
import { BattleManager } from '../../managers/BattleManager';
import { GridDeploymentSystem } from '../../systems/GridDeploymentSystem';
import { GameManager } from '../../managers/GameManager';

const { ccclass, property } = _decorator;

@ccclass('SiameseCat')
export class SiameseCat extends BaseUnit {
    
    @property({ tooltip: "魔法弹速度" })
    public magicBoltSpeed: number = 400;
    
    @property({ tooltip: "法术攻击范围（群攻半径）" })
    public spellRange: number = 150;
    
    @property({ tooltip: "技能冷却时间" })
    public skillCooldown: number = 8;
    
    // 私有属性
    private _skillTimer: number = 0;
    private _graphics: Graphics | null = null;
    private _animation: Animation | null = null;
    private _nameLabel: Label | null = null;
    private _activeBolts: Set<Node> = new Set(); // 跟踪活跃的魔法弹
    
    // 英雄类型
    public readonly heroType: HeroType = HeroType.SIAMESE_CAT;
    
    protected onLoad(): void {
        // 先调用父类初始化
        super.onLoad();
        
        // 设置暹罗猫属性
        this.initializeSiameseCatStats();
        
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
    
    // 初始化暹罗猫属性
    private initializeSiameseCatStats(): void {
        const config = HERO_CONFIGS[HeroType.SIAMESE_CAT];
        
        this.unitName = config.name;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.health;
        this.attackDamage = config.attackDamage;
        this.attackRange = config.attackRange;
        this.attackSpeed = config.attackSpeed;
        this.moveSpeed = config.moveSpeed;
        this.skillCooldown = config.skillCooldown || 8;
    }
    
    // 初始化外观
    private initializeVisuals(): void {
        // 添加Graphics组件绘制外观
        this._graphics = this.node.getComponent(Graphics);
        if (!this._graphics) {
            this._graphics = this.node.addComponent(Graphics);
        }
        
        this.drawSiameseCatAppearance();
        
        // 创建名称标签
        this.createNameLabel();
    }
    
    // 绘制暹罗猫法师外观
    private drawSiameseCatAppearance(): void {
        if (!this._graphics) return;
        
        this._graphics.clear();
        
        // 绘制法师身体（深蓝色方形）
        this._graphics.fillColor = new Color(0, 0, 255); // 深蓝色
        this._graphics.rect(-20, -20, 40, 40);
        this._graphics.fill();
        
        // 绘制轮廓
        this._graphics.strokeColor = new Color(0, 0, 200);
        this._graphics.lineWidth = 2;
        this._graphics.rect(-20, -20, 40, 40);
        this._graphics.stroke();
        
        // 绘制法师帽子（紫色三角形）
        this._graphics.fillColor = new Color(128, 0, 128); // 紫色
        this._graphics.moveTo(0, 20);
        this._graphics.lineTo(-15, -10);
        this._graphics.lineTo(15, -10);
        this._graphics.close();
        this._graphics.fill();
        
        // 绘制法杖标识
        this._graphics.strokeColor = new Color(139, 69, 19); // 棕色法杖
        this._graphics.lineWidth = 3;
        this._graphics.moveTo(15, -15);
        this._graphics.lineTo(25, -25);
        this._graphics.stroke();
        
        // 法杖顶端宝石
        this._graphics.fillColor = new Color(255, 0, 255); // 紫色宝石
        this._graphics.circle(25, -25, 4);
        this._graphics.fill();
    }
    
    // 创建名称标签
    private createNameLabel(): void {
        // 创建标签节点
        const labelNode = new Node("NameLabel");
        labelNode.parent = this.node;
        
        // 设置标签位置（在暹罗猫上方）
        labelNode.setPosition(0, 35, 0);
        
        // 添加UITransform组件
        const uiTransform = labelNode.addComponent(UITransform);
        uiTransform.setContentSize(60, 20);
        
        // 添加Label组件
        this._nameLabel = labelNode.addComponent(Label);
        this._nameLabel.string = "暹罗猫";
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
            if (this._animation.getState('siamese_cat_idle')) {
                this._animation.play('siamese_cat_idle');
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
    
    // 重写攻击方法 - 魔法弹攻击
    protected onAttack(target: Node): void {
        if (!target || !this.isAlive) return;
        
        // 播放施法动作
        this.playCastAction();
        
        // 创建魔法弹攻击目标
        this.castMagicBolt(target);
    }
    
    // 播放施法动作
    private playCastAction(): void {
        if (!this.node) return;
        
        // 创建法师施法时的旋转效果
        const originalAngle = this.node.angle;
        
        // 施法动作 - 左右摇摆
        setTimeout(() => {
            if (this.node && this.node.isValid) {
                this.node.angle = originalAngle - 15;
            }
        }, 0);
        
        setTimeout(() => {
            if (this.node && this.node.isValid) {
                this.node.angle = originalAngle + 15;
            }
        }, 100);
        
        setTimeout(() => {
            if (this.node && this.node.isValid) {
                this.node.angle = originalAngle;
            }
        }, 200);
        
        // 创建施法光环效果
        this.createCastEffect();
    }
    
    // 创建施法光环效果
    private createCastEffect(): void {
        const effectNode = new Node("CastEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(this.node.position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.strokeColor = new Color(100, 100, 255, 150);
        effectGraphics.lineWidth = 3;
        effectGraphics.circle(0, 0, 40);
        effectGraphics.stroke();
        
        // 光环扩散效果
        let scale = 1;
        let opacity = 150;
        const expandEffect = () => {
            scale += 0.05;
            opacity -= 5;
            
            if (effectGraphics && effectNode.isValid && opacity > 0) {
                effectGraphics.clear();
                effectGraphics.strokeColor = new Color(100, 100, 255, opacity);
                effectGraphics.lineWidth = 3;
                effectGraphics.circle(0, 0, 40 * scale);
                effectGraphics.stroke();
                
                requestAnimationFrame(expandEffect);
            } else {
                effectNode.destroy();
            }
        };
        expandEffect();
    }
    
    // 发射魔法弹
    private castMagicBolt(target: Node): void {
        // 创建魔法弹节点
        const boltNode = new Node("MagicBolt");
        boltNode.parent = this.node.parent;
        boltNode.setPosition(this.node.position);
        
        // 添加魔法弹图形
        const boltGraphics = boltNode.addComponent(Graphics);
        boltGraphics.fillColor = new Color(0, 100, 255); // 亮蓝色
        boltGraphics.circle(0, 0, 8);
        boltGraphics.fill();
        
        // 添加发光效果
        boltGraphics.strokeColor = new Color(200, 200, 255);
        boltGraphics.lineWidth = 2;
        boltGraphics.circle(0, 0, 8);
        boltGraphics.stroke();
        
        // 跟踪魔法弹
        this._activeBolts.add(boltNode);
        
        // 移动魔法弹到目标
        this.moveMagicBoltToTarget(boltNode, target);
    }
    
    // 移动魔法弹到目标
    private moveMagicBoltToTarget(boltNode: Node, target: Node): void {
        const targetPosition = Vec3.clone(target.position);
        const direction = Vec3.subtract(new Vec3(), targetPosition, boltNode.position);
        direction.normalize();
        const startPosition = Vec3.clone(this.node.position); // 保存英雄的初始位置
        const maxRange = this.attackRange + 100;
        
        const updateBolt = (dt: number) => {
            // 检查魔法弹和英雄节点是否仍然有效
            if (!boltNode || !boltNode.isValid || !this.node || !this.node.isValid) {
                if (boltNode && boltNode.isValid) {
                    this.destroyMagicBolt(boltNode);
                }
                return;
            }
            
            // 移动魔法弹
            const moveDistance = this.magicBoltSpeed * dt;
            const moveVector = Vec3.multiplyScalar(new Vec3(), direction, moveDistance);
            const newPos = Vec3.add(new Vec3(), boltNode.position, moveVector);
            boltNode.setPosition(newPos);
            
            // 检查是否击中目标位置
            const distance = Vec3.distance(newPos, targetPosition);
            if (distance <= 25) { // 击中判定
                this.onMagicBoltHit(boltNode, targetPosition);
                return;
            }
            
            // 检查魔法弹是否超出范围（使用保存的起始位置）
            const travelDistance = Vec3.distance(newPos, startPosition);
            if (travelDistance > maxRange) {
                this.destroyMagicBolt(boltNode);
                return;
            }
            
            // 继续移动
            requestAnimationFrame(() => updateBolt(0.016)); // 假设60FPS
        };
        
        updateBolt(0.016);
    }
    
    // 魔法弹命中处理（群攻效果）
    private onMagicBoltHit(boltNode: Node, hitPosition: Vec3): void {
        // 获取战斗管理器
        const battleManager = BattleManager.instance;
        if (!battleManager) {
            this.destroyMagicBolt(boltNode);
            return;
        }
        
        // 获取所有敌人并检查范围内的目标
        const allEnemies = battleManager.getAllEnemies();
        for (const enemy of allEnemies) {
            if (!enemy || !enemy.isValid) continue;
            
            // 计算距离
            const distance = Vec3.distance(enemy.position, hitPosition);
            if (distance <= this.spellRange) {
                const enemyUnit = enemy.getComponent(BaseUnit);
                if (enemyUnit && enemyUnit.isAlive) {
                    enemyUnit.takeDamage(this.attackDamage);
                }
            }
        }
        
        // 显示爆炸效果
        this.showSpellExplosion(hitPosition);
        
        // 销毁魔法弹
        this.destroyMagicBolt(boltNode);
        
        console.log("暹罗猫魔法弹命中，群体攻击！");
    }
    
    // 显示法术爆炸效果
    private showSpellExplosion(position: Vec3): void {
        const explosionNode = new Node("SpellExplosion");
        explosionNode.parent = this.node.parent;
        explosionNode.setPosition(position);
        
        const explosionGraphics = explosionNode.addComponent(Graphics);
        explosionGraphics.fillColor = new Color(100, 100, 255, 100); // 半透明蓝色
        explosionGraphics.circle(0, 0, this.spellRange);
        explosionGraphics.fill();
        
        // 爆炸效果动画
        let scale = 0.5;
        let opacity = 100;
        const explodeEffect = () => {
            scale += 0.1;
            opacity -= 8;
            
            if (explosionGraphics && explosionNode.isValid && opacity > 0) {
                explosionGraphics.clear();
                explosionGraphics.fillColor = new Color(100, 100, 255, opacity);
                explosionGraphics.circle(0, 0, this.spellRange * scale);
                explosionGraphics.fill();
                
                requestAnimationFrame(explodeEffect);
            } else {
                explosionNode.destroy();
            }
        };
        explodeEffect();
    }
    
    // 销毁魔法弹
    private destroyMagicBolt(boltNode: Node): void {
        if (boltNode && boltNode.isValid) {
            // 从跟踪集合中移除
            this._activeBolts.delete(boltNode);
            boltNode.destroy();
        }
    }
    
    // 魔法风暴技能
    public useSkill(): boolean {
        if (this._skillTimer > 0 || !this.isAlive) {
            return false;
        }
        
        const battleManager = BattleManager.instance;
        if (!battleManager) return false;
        
        // 对屏幕上所有敌人造成范围伤害
        const allEnemies = battleManager.getAllEnemies();
        let hitCount = 0;
        
        for (const enemy of allEnemies) {
            if (!enemy || !enemy.isValid) continue;
            
            const enemyUnit = enemy.getComponent(BaseUnit);
            if (enemyUnit && enemyUnit.isAlive) {
                const skillDamage = this.attackDamage * 2; // 200%伤害
                enemyUnit.takeDamage(skillDamage);
                hitCount++;
                
                // 在每个敌人位置创建特效
                this.createSkillHitEffect(enemy.position);
            }
        }
        
        if (hitCount > 0) {
            // 创建技能释放特效
            this.createSkillCastEffect();
            
            // 设置技能冷却
            this._skillTimer = this.skillCooldown;
            
            console.log(`暹罗猫使用魔法风暴！命中 ${hitCount} 个敌人`);
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
        effectGraphics.strokeColor = new Color(128, 0, 128); // 紫色
        effectGraphics.lineWidth = 5;
        effectGraphics.circle(0, 0, 50);
        effectGraphics.stroke();
        
        // 特效扩散
        let radius = 50;
        let opacity = 255;
        const expandEffect = () => {
            radius += 10;
            opacity -= 10;
            
            if (effectGraphics && effectNode.isValid && opacity > 0) {
                effectGraphics.clear();
                effectGraphics.strokeColor = new Color(128, 0, 128, opacity);
                effectGraphics.lineWidth = 5;
                effectGraphics.circle(0, 0, radius);
                effectGraphics.stroke();
                
                requestAnimationFrame(expandEffect);
            } else {
                effectNode.destroy();
            }
        };
        expandEffect();
    }
    
    // 创建技能命中特效
    private createSkillHitEffect(position: Vec3): void {
        const effectNode = new Node("SkillHitEffect");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(position);
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.fillColor = new Color(255, 0, 255, 200); // 紫色闪电
        effectGraphics.circle(0, 0, 20);
        effectGraphics.fill();
        
        // 闪电效果
        setTimeout(() => {
            if (effectNode && effectNode.isValid) {
                effectNode.destroy();
            }
        }, 150);
    }
    
    // 获取技能冷却剩余时间
    public getSkillCooldownRemaining(): number {
        return Math.max(0, this._skillTimer);
    }
    
    // 检查技能是否可用
    public isSkillReady(): boolean {
        return this._skillTimer <= 0 && this.isAlive;
    }
    
    // 重写死亡方法，添加暹罗猫特有的死亡效果
    protected onDie(): void {
        console.log("暹罗猫法师阵亡");
        
        // 清理所有活跃的魔法弹
        this._activeBolts.forEach(bolt => {
            if (bolt && bolt.isValid) {
                bolt.destroy();
            }
        });
        this._activeBolts.clear();
        
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
            this.drawSiameseCatAppearance();
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
                console.log("暹罗猫释放魔法风暴技能！");
                this.createClickFeedback();
            } else {
                console.log("暹罗猫技能释放失败");
            }
        } else {
            console.log(`暹罗猫技能冷却中，剩余时间: ${this.getSkillCooldownRemaining().toFixed(1)}秒`);
            this.createCooldownFeedback();
        }
    }
    
    // 创建点击反馈特效
    private createClickFeedback(): void {
        const effectNode = new Node("ClickFeedback");
        effectNode.parent = this.node.parent;
        effectNode.setPosition(Vec3.add(new Vec3(), this.node.position, new Vec3(0, 40, 0)));
        
        const effectGraphics = effectNode.addComponent(Graphics);
        effectGraphics.fillColor = new Color(128, 0, 128, 200); // 紫色
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
                effectGraphics.fillColor = new Color(128, 0, 128, opacity);
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
        // 清理所有活跃的魔法弹
        this._activeBolts.forEach(bolt => {
            if (bolt && bolt.isValid) {
                bolt.destroy();
            }
        });
        this._activeBolts.clear();
    }
}