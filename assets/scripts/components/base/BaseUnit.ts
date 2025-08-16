import { _decorator, Component, Node, Vec3, tween, TweenSystem } from 'cc';
import { UnitStats, UnitType } from '../../types/GameTypes';

const { ccclass, property } = _decorator;

// 单位状态枚举
export enum UnitState {
    IDLE = 0,      // 待机
    MOVING = 1,    // 移动中
    ATTACKING = 2, // 攻击中
    DEAD = 3       // 死亡
}

@ccclass('BaseUnit')
export class BaseUnit extends Component {
    
    @property({ tooltip: "单位名称" })
    public unitName: string = "基础单位";
    
    @property({ tooltip: "最大生命值" })
    public maxHealth: number = 100;
    
    @property({ tooltip: "攻击力" })
    public attackDamage: number = 20;
    
    @property({ tooltip: "攻击范围" })
    public attackRange: number = 150;
    
    @property({ tooltip: "攻击速度(次/秒)" })
    public attackSpeed: number = 1.0;
    
    @property({ tooltip: "移动速度(像素/秒)" })
    public moveSpeed: number = 100;
    
    // 当前状态
    public currentHealth: number = 100;
    public unitState: UnitState = UnitState.IDLE;
    public currentTarget: Node | null = null;
    
    // 私有属性
    private _attackTimer: number = 0;
    private _healthBarNode: Node | null = null;
    
    // 获取单位属性接口
    public get stats(): UnitStats {
        return {
            name: this.unitName,
            health: this.currentHealth,
            maxHealth: this.maxHealth,
            attackDamage: this.attackDamage,
            attackRange: this.attackRange,
            attackSpeed: this.attackSpeed,
            moveSpeed: this.moveSpeed
        };
    }
    
    // 检查是否存活
    public get isAlive(): boolean {
        return this.unitState !== UnitState.DEAD && this.currentHealth > 0;
    }
    
    // 检查是否可以攻击
    public get canAttack(): boolean {
        return this.isAlive && this._attackTimer <= 0;
    }
    
    protected onLoad(): void {
        // 初始化生命值
        this.currentHealth = this.maxHealth;
        
        // 查找血条节点（可选）
        this._healthBarNode = this.node.getChildByName("HealthBar");
        
        // 更新血条显示
        this.updateHealthBar();
    }
    
    protected start(): void {
        this.unitState = UnitState.IDLE;
    }
    
    protected update(dt: number): void {
        // 更新攻击计时器
        if (this._attackTimer > 0) {
            this._attackTimer -= dt;
        }
        
        // 根据状态执行逻辑
        this.updateByState(dt);
    }
    
    // 状态机更新
    protected updateByState(dt: number): void {
        switch (this.unitState) {
            case UnitState.IDLE:
                this.onIdleState(dt);
                break;
            case UnitState.MOVING:
                this.onMoveState(dt);
                break;
            case UnitState.ATTACKING:
                this.onAttackState(dt);
                break;
            case UnitState.DEAD:
                this.onDeathState(dt);
                break;
        }
    }
    
    // 状态处理方法 - 子类可重写
    protected onIdleState(dt: number): void {
        // 默认空实现，子类重写
    }
    
    protected onMoveState(dt: number): void {
        // 默认空实现，子类重写
    }
    
    protected onAttackState(dt: number): void {
        // 默认空实现，子类重写
    }
    
    protected onDeathState(dt: number): void {
        // 默认空实现，子类重写
    }
    
    // 移动到指定位置
    public moveTo(targetPos: Vec3, callback?: () => void): void {
        if (!this.isAlive) return;
        
        this.unitState = UnitState.MOVING;
        
        // 计算移动时间
        const distance = Vec3.distance(targetPos, this.node.position);
        const moveTime = distance / this.moveSpeed;
        
        // 使用tween移动
        tween(this.node)
            .to(moveTime, { position: targetPos })
            .call(() => {
                if (this.isAlive) {
                    this.unitState = UnitState.IDLE;
                }
                callback?.();
            })
            .start();
    }
    
    // 受到伤害
    public takeDamage(damage: number): void {
        if (!this.isAlive) return;
        
        this.currentHealth = Math.max(0, this.currentHealth - damage);
        this.updateHealthBar();
        
        // 触发受伤回调
        this.onTakeDamage(damage);
        
        // 检查死亡
        if (this.currentHealth <= 0) {
            this.die();
        }
    }
    
    // 受伤回调 - 子类可重写
    protected onTakeDamage(damage: number): void {
        // 默认空实现，子类可重写添加受伤效果
    }
    
    // 死亡处理
    public die(): void {
        if (this.unitState === UnitState.DEAD) return;
        
        this.unitState = UnitState.DEAD;
        
        // 停止所有缓动动画
        TweenSystem.instance.ActionManager.removeAllActionsFromTarget(this.node);
        
        // 触发死亡回调
        this.onDie();
        
        // 延迟销毁节点
        this.scheduleOnce(() => {
            if (this.node && this.node.isValid) {
                this.node.destroy();
            }
        }, 1.0);
    }
    
    // 死亡回调 - 子类可重写
    protected onDie(): void {
        // 默认空实现，子类可重写添加死亡效果
    }
    
    // 攻击目标
    public attackTarget(target: Node): void {
        if (!this.canAttack || !target) return;
        
        this.currentTarget = target;
        this.unitState = UnitState.ATTACKING;
        this._attackTimer = 1.0 / this.attackSpeed;
        
        // 触发攻击回调
        this.onAttack(target);
    }
    
    // 攻击回调 - 子类重写
    protected onAttack(target: Node): void {
        // 默认空实现，子类重写具体攻击逻辑
    }
    
    // 更新血条显示
    private updateHealthBar(): void {
        if (!this._healthBarNode) return;
        
        const healthPercent = this.currentHealth / this.maxHealth;
        
        // 查找血条填充部分
        const fillNode = this._healthBarNode.getChildByName("Fill");
        if (fillNode) {
            // 使用UITransform组件调整宽度
            const uiTransform = fillNode.getComponent('UITransform');
            if (uiTransform) {
                const maxWidth = this._healthBarNode.getComponent('UITransform')?.width || 100;
                uiTransform.width = maxWidth * healthPercent;
            }
        }
        
        // 血量未满时显示血条
        this._healthBarNode.active = (healthPercent < 1.0 && healthPercent > 0);
    }
    
    // 计算到目标的距离
    public getDistanceToTarget(target: Node): number {
        if (!target || !target.isValid) {
            return Infinity;
        }
        return Vec3.distance(this.node.position, target.position);
    }
    
    // 检查目标是否在攻击范围内
    public isTargetInRange(target: Node): boolean {
        return this.getDistanceToTarget(target) <= this.attackRange;
    }
    
    // 寻找范围内的敌人
    public findEnemiesInRange(enemyNodes: Node[]): Node[] {
        return enemyNodes.filter(enemy => 
            enemy && enemy.isValid && this.isTargetInRange(enemy)
        );
    }
    
    // 寻找最近的敌人
    public findNearestEnemy(enemyNodes: Node[]): Node | null {
        let nearestEnemy: Node | null = null;
        let nearestDistance = Infinity;
        
        for (const enemy of enemyNodes) {
            if (!enemy || !enemy.isValid) continue;
            
            const distance = this.getDistanceToTarget(enemy);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }
        
        return nearestEnemy;
    }
}