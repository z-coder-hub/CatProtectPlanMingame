import { _decorator, Component, Node, Vec3 } from 'cc';
import { BaseHero } from '../components/heroes/BaseHero';
import { BaseMouse } from '../components/enemies/BaseMouse';
import { GameManager } from './GameManager';
import { GridPosition, HeroType, HeroCategory } from '../types/GameTypes';
import { GridDeploymentSystem } from '../systems/GridDeploymentSystem';

// 通用单位类型
type GameUnit = BaseHero | BaseMouse;

const { ccclass, property } = _decorator;

// 战斗目标类型
export interface BattleTarget {
    node: Node;
    unit: BaseHero | BaseMouse;
    priority: number;
}

@ccclass('BattleManager')
export class BattleManager extends Component {
    
    @property({ tooltip: "战斗更新间隔(秒)" })
    public battleUpdateInterval: number = 0.2;
    
    @property({ tooltip: "目标搜索范围" })
    public targetSearchRange: number = 500;
    
    @property({ tooltip: "是否启用网格定位" })
    public enableGridPositioning: boolean = true;
    
    // 私有属性
    private _updateTimer: number = 0;
    private _gameManager: GameManager | null = null;
    
    // 注册的英雄和敌人列表（参考老项目）
    private _registeredHeroes: Node[] = [];
    private _registeredEnemies: Node[] = [];
    
    // 组件引用缓存
    private _gridSystemCache: GridDeploymentSystem | null = null;
    
    // 单例实例
    private static _instance: BattleManager | null = null;
    
    public static get instance(): BattleManager | null {
        return BattleManager._instance;
    }
    
    protected onLoad(): void {
        // 设置单例
        if (BattleManager._instance) {
            console.warn("BattleManager实例已存在，销毁重复实例");
            this.node.destroy();
            return;
        }
        
        BattleManager._instance = this;
        console.log("BattleManager初始化完成");
    }
    
    protected start(): void {
        // 获取GameManager引用
        this._gameManager = GameManager.instance;
        if (!this._gameManager) {
            console.error("未找到GameManager实例");
        }
    }
    
    protected onDestroy(): void {
        if (BattleManager._instance === this) {
            BattleManager._instance = null;
        }
    }
    
    protected update(dt: number): void {
        this._updateTimer += dt;
        
        // 定期更新战斗逻辑
        if (this._updateTimer >= this.battleUpdateInterval) {
            this.updateBattle(this._updateTimer);
            this._updateTimer = 0;
        }
    }
    
    // 更新战斗逻辑
    private updateBattle(dt: number): void {
        if (!this._gameManager) return;
        
        // 获取英雄和敌人列表
        const heroes = this._gameManager.deployedHeroes;
        const enemies = this._gameManager.activeEnemies;
        
        if (heroes.length === 0 || enemies.length === 0) return;
        
        // 为每个英雄分配攻击目标
        for (const heroNode of heroes) {
            this.updateHeroBattle(heroNode, enemies);
        }
        
        // 处理敌人AI行为
        for (const enemyNode of enemies) {
            this.updateEnemyBattle(enemyNode, heroes);
        }
    }
    
    // 更新英雄战斗
    private updateHeroBattle(heroNode: Node, enemies: Node[]): void {
        if (!heroNode || !heroNode.isValid) return;
        
        const heroUnit = heroNode.getComponent(BaseHero);
        if (!heroUnit || !heroUnit.isAlive) return;
        
        // 如果英雄有当前目标且目标仍然有效
        if (heroUnit.currentTarget && heroUnit.currentTarget.isValid) {
            const targetUnit = heroUnit.currentTarget.getComponent(BaseMouse);
            
            // 检查目标是否还活着且在范围内
            const targetInRange = heroUnit.IsTargetInRange(heroUnit.currentTarget);
            
            if (targetUnit && targetUnit.isAlive && targetInRange) {
                // 攻击当前目标
                if (heroUnit.canAttack) {
                    this.performAttack(heroUnit, targetUnit);
                }
                return;
            } else {
                // 清除无效目标
                heroUnit.currentTarget = null;
            }
        }
        
        // 寻找新目标
        const target = this.findBestTarget(heroNode, enemies);
        if (target) {
            heroUnit.currentTarget = target.node;
            const targetInRange = heroUnit.IsTargetInRange(target.node);
            
            if (heroUnit.canAttack && targetInRange) {
                this.performAttack(heroUnit, target.unit);
            }
        }
    }
    
    // 更新敌人战斗
    private updateEnemyBattle(enemyNode: Node, heroes: Node[]): void {
        if (!enemyNode || !enemyNode.isValid) return;
        
        const enemyUnit = enemyNode.getComponent(BaseMouse);
        if (!enemyUnit || !enemyUnit.isAlive) return;
        
        // 塔防游戏逻辑：敌人只移动向城堡，不攻击英雄
        // 移动逻辑已经在BaseMouse的update方法中处理
        // 这里可以添加额外的AI逻辑，如路径寻找等
    }
    
    // 执行攻击 - 塔防游戏中只有英雄攻击敌人
    private performAttack(attacker: BaseHero, target: BaseMouse): void {
        if (!attacker || !target || !attacker.isAlive || !target.isAlive) return;
        
        // 调用BaseHero的attackTarget方法，让英雄执行具体的攻击逻辑
        // 这样橘猫等射击英雄可以发射子弹，而不是直接造成伤害
        attacker.AttackTarget(target.node);
        
        // 如果目标死亡，给予奖励
        if (!target.isAlive) {
            this.handleUnitDestroyed(target);
        }
    }
    
    // 寻找最佳攻击目标
    private findBestTarget(attackerNode: Node, targetNodes: Node[]): BattleTarget | null {
        const attackerUnit = attackerNode.getComponent(BaseHero);
        if (!attackerUnit) return null;
        
        const validTargets: BattleTarget[] = [];
        
        for (const targetNode of targetNodes) {
            if (!targetNode || !targetNode.isValid) continue;
            
            const targetUnit = targetNode.getComponent(BaseMouse);
            if (!targetUnit || !targetUnit.isAlive) continue;
            
            // 检查目标是否在攻击范围内
            const inRange = attackerUnit.IsTargetInRange(targetNode);
            
            if (inRange) {
                const distance = attackerUnit.GetDistanceToTarget(targetNode);
                const priority = this.calculateTargetPriority(targetUnit, distance);
                
                validTargets.push({
                    node: targetNode,
                    unit: targetUnit,
                    priority: priority
                });
            }
        }
        
        // 按优先级排序，返回最高优先级的目标
        if (validTargets.length > 0) {
            validTargets.sort((a, b) => b.priority - a.priority);
            return validTargets[0];
        }
        
        return null;
    }
    
    // 计算目标优先级
    private calculateTargetPriority(target: BaseMouse, distance: number): number {
        let priority = 100;
        
        // 距离越近优先级越高
        priority -= distance * 0.1;
        
        // 血量越少优先级越高（便于补刀）
        const healthPercent = target.currentHealth / target.maxHealth;
        priority += (1 - healthPercent) * 20;
        
        return priority;
    }
    
    // 寻找范围内的单位
    private findUnitsInRange(centerNode: Node, targetNodes: Node[], range: number): BattleTarget[] {
        const targets: BattleTarget[] = [];
        
        for (const targetNode of targetNodes) {
            if (!targetNode || !targetNode.isValid) continue;
            
            const targetUnit = targetNode.getComponent(BaseMouse);
            if (!targetUnit || !targetUnit.isAlive) continue;
            
            const distance = Vec3.distance(centerNode.position, targetNode.position);
            if (distance <= range) {
                targets.push({
                    node: targetNode,
                    unit: targetUnit,
                    priority: distance
                });
            }
        }
        
        return targets;
    }
    
    // 寻找最近的目标
    private findNearestTarget(centerNode: Node, targets: BattleTarget[]): BattleTarget | null {
        if (targets.length === 0) return null;
        
        let nearestTarget = targets[0];
        let nearestDistance = Vec3.distance(centerNode.position, nearestTarget.node.position);
        
        for (let i = 1; i < targets.length; i++) {
            const distance = Vec3.distance(centerNode.position, targets[i].node.position);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestTarget = targets[i];
            }
        }
        
        return nearestTarget;
    }
    
    
    
    // 处理单位被摧毁
    private handleUnitDestroyed(unit: BaseHero | BaseMouse): void {
        if (!this._gameManager) return;
        
        // 如果是敌人被摧毁，给予金币奖励
        const enemyTypes = ['BasicMouse']; // 后续扩展
        const componentName = unit.constructor.name;
        
        if (enemyTypes.includes(componentName)) {
            // 获取敌人配置中的奖励金币
            const goldReward = 3; // 暂时硬编码，后续从配置读取
            this._gameManager.AddGold(goldReward);
            
            // 从活跃敌人列表移除
            this._gameManager.RemoveActiveEnemy(unit.node);
        } else {
            // 如果是英雄被摧毁
            this._gameManager.RemoveDeployedHero(unit.node);
        }
    }
    
    // 获取战斗统计信息
    public GetBattleStats(): {
        activeHeroes: number;
        activeEnemies: number;
        averageHeroHealth: number;
        averageEnemyHealth: number;
    } {
        if (!this._gameManager) {
            return { activeHeroes: 0, activeEnemies: 0, averageHeroHealth: 0, averageEnemyHealth: 0 };
        }
        
        const heroes = this._gameManager.deployedHeroes;
        const enemies = this._gameManager.activeEnemies;
        
        const avgHeroHealth = this.calculateAverageHealth(heroes);
        const avgEnemyHealth = this.calculateAverageHealth(enemies);
        
        return {
            activeHeroes: heroes.length,
            activeEnemies: enemies.length,
            averageHeroHealth: avgHeroHealth,
            averageEnemyHealth: avgEnemyHealth
        };
    }
    
    // 计算平均生命值
    private calculateAverageHealth(nodes: Node[]): number {
        if (nodes.length === 0) return 0;
        
        let totalHealth = 0;
        let validUnits = 0;
        
        for (const node of nodes) {
            const unit = node.getComponent(BaseMouse);
            if (unit && unit.isAlive) {
                totalHealth += (unit.currentHealth / unit.maxHealth) * 100;
                validUnits++;
            }
        }
        
        return validUnits > 0 ? totalHealth / validUnits : 0;
    }
    
    // 注册系统方法（参考老项目）
    public RegisterHero(heroNode: Node): void {
        if (!this._registeredHeroes.includes(heroNode)) {
            this._registeredHeroes.push(heroNode);
            
            // 如果启用网格定位，记录网格坐标
            if (this.enableGridPositioning) {
                const gridSystem = this.getGridSystem();
                if (gridSystem) {
                    const gridPos = gridSystem.FindHeroPosition(heroNode);
                    if (gridPos) {
                        // 为英雄节点添加网格位置信息
                        (heroNode as any).gridRow = gridPos.row;
                        (heroNode as any).gridCol = gridPos.col;
                    }
                }
            }
            
            console.log(`[BattleManager] 英雄注册: ${heroNode.name}, 网格坐标: (${(heroNode as any).gridRow}, ${(heroNode as any).gridCol})`);
        }
    }
    
    public UnregisterHero(heroNode: Node): void {
        const index = this._registeredHeroes.indexOf(heroNode);
        if (index >= 0) {
            this._registeredHeroes.splice(index, 1);
            
            // 清除网格位置信息
            if (this.enableGridPositioning) {
                delete (heroNode as any).gridRow;
                delete (heroNode as any).gridCol;
            }
            
            console.log(`[BattleManager] 英雄取消注册: ${heroNode.name}`);
        }
    }
    
    public RegisterEnemy(enemyNode: Node): void {
        if (!this._registeredEnemies.includes(enemyNode)) {
            this._registeredEnemies.push(enemyNode);
            console.log(`[BattleManager] 敌人注册: ${enemyNode.name}, 当前敌人数: ${this._registeredEnemies.length}`);
        }
    }
    
    public UnregisterEnemy(enemyNode: Node): void {
        const index = this._registeredEnemies.indexOf(enemyNode);
        if (index >= 0) {
            this._registeredEnemies.splice(index, 1);
            console.log(`[BattleManager] 敌人取消注册: ${enemyNode.name}, 剩余敌人数: ${this._registeredEnemies.length}`);
            
            // 检查是否所有敌人都被消灭
            if (this._registeredEnemies.length === 0) {
                this.onAllEnemiesDefeated();
            }
        }
    }
    
    // 所有敌人被消灭
    private onAllEnemiesDefeated(): void {
        console.log("[BattleManager] 所有敌人已被消灭！");
        
        if (this._gameManager) {
            this._gameManager.OnWaveComplete();
        }
    }
    
    // 查找最近的敌人（参考老项目）
    public FindNearestEnemy(fromPosition: Vec3, maxRange: number = Number.MAX_VALUE): Node | null {
        let nearestEnemy: Node | null = null;
        let minDistance = maxRange;
        
        for (const enemy of this._registeredEnemies) {
            if (!enemy || !enemy.isValid) continue;
            
            const enemyUnit = enemy.getComponent(BaseMouse);
            if (!enemyUnit || !enemyUnit.isAlive) continue;
            
            const distance = Vec3.distance(fromPosition, enemy.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        }
        
        return nearestEnemy;
    }
    
    // 移除了远程英雄的特殊处理逻辑，现在所有英雄都使用统一的攻击范围检查
    
    // 查找指定网格位置的英雄
    public FindHeroAtGridPosition(gridPos: GridPosition): Node | null {
        if (!this.enableGridPositioning) return null;
        
        for (const hero of this._registeredHeroes) {
            const heroGridRow = (hero as any).gridRow;
            const heroGridCol = (hero as any).gridCol;
            
            if (heroGridRow === gridPos.row && heroGridCol === gridPos.col) {
                return hero;
            }
        }
        
        return null;
    }
    
    // 获取注册的英雄和敌人列表
    public get registeredHeroes(): Node[] { return [...this._registeredHeroes]; }
    public get registeredEnemies(): Node[] { return [...this._registeredEnemies]; }
    
    // 获取所有活跃敌人（为新英雄技能系统提供支持）
    public GetAllEnemies(): Node[] {
        return this._registeredEnemies.filter(enemy => {
            if (!enemy || !enemy.isValid) return false;
            const enemyUnit = enemy.getComponent(BaseMouse);
            return enemyUnit && enemyUnit.isAlive;
        });
    }
    
    // 获取指定范围内的敌人（为AOE技能提供支持）
    public GetEnemiesInRange(centerPosition: Vec3, range: number): Node[] {
        return this._registeredEnemies.filter(enemy => {
            if (!enemy || !enemy.isValid) return false;
            const enemyUnit = enemy.getComponent(BaseMouse);
            if (!enemyUnit || !enemyUnit.isAlive) return false;
            
            const distance = Vec3.distance(centerPosition, enemy.position);
            return distance <= range;
        });
    }
    
    // 获取指定范围内的英雄（为辅助技能提供支持）
    public GetHeroesInRange(centerPosition: Vec3, range: number): Node[] {
        return this._registeredHeroes.filter(hero => {
            if (!hero || !hero.isValid) return false;
            const heroUnit = hero.getComponent(BaseHero);
            if (!heroUnit || !heroUnit.isAlive) return false;
            
            const distance = Vec3.distance(centerPosition, hero.position);
            return distance <= range;
        });
    }
    
    // 为英雄应用临时增益效果
    public ApplyHeroBuff(hero: Node, buffType: 'attackSpeed' | 'attackRange', value: number, duration: number): void {
        const heroUnit = hero.getComponent(BaseHero);
        if (!heroUnit) return;
        
        // 保存原始值
        const originalValue = buffType === 'attackSpeed' ? heroUnit.attackSpeed : heroUnit.attackRange;
        
        // 应用增益
        if (buffType === 'attackSpeed') {
            heroUnit.attackSpeed *= value;
        } else {
            heroUnit.attackRange += value;
        }
        
        console.log(`为 ${heroUnit.unitName} 应用 ${buffType} 增益: ${value}, 持续时间: ${duration}秒`);
        
        // 使用Cocos Creator调度器恢复原值
        this.scheduleOnce(() => {
            if (hero && hero.isValid && heroUnit && heroUnit.isAlive) {
                if (buffType === 'attackSpeed') {
                    heroUnit.attackSpeed = originalValue;
                } else {
                    heroUnit.attackRange = originalValue;
                }
                console.log(`${heroUnit.unitName} 的 ${buffType} 增益效果结束`);
            }
        }, duration);
    }
    
    // 为链式攻击寻找下一个目标
    public FindChainTargets(startPosition: Vec3, excludeTarget: Node, maxTargets: number, maxRange: number): Node[] {
        const targets: Node[] = [];
        const availableEnemies = this._registeredEnemies.filter(enemy => {
            if (!enemy || !enemy.isValid || enemy === excludeTarget) return false;
            const enemyUnit = enemy.getComponent(BaseMouse);
            if (!enemyUnit || !enemyUnit.isAlive) return false;
            
            const distance = Vec3.distance(startPosition, enemy.position);
            return distance <= maxRange;
        });
        
        // 按距离排序，选择最近的几个目标
        availableEnemies.sort((a, b) => {
            const distA = Vec3.distance(startPosition, a.position);
            const distB = Vec3.distance(startPosition, b.position);
            return distA - distB;
        });
        
        // 取前maxTargets个目标
        for (let i = 0; i < Math.min(maxTargets, availableEnemies.length); i++) {
            targets.push(availableEnemies[i]);
        }
        
        return targets;
    }
    
    // 对多个目标造成伤害（用于AOE攻击）
    public DamageMultipleTargets(targets: Node[], damage: number, sourcePosition?: Vec3): void {
        for (const target of targets) {
            if (!target || !target.isValid) continue;
            
            const targetUnit = target.getComponent(BaseMouse);
            if (targetUnit && targetUnit.isAlive) {
                targetUnit.takeDamage(damage);
                
                // 创建击中效果
                if (sourcePosition && this.node.parent) {
                    // 这里可以添加特效，暂时省略
                }
            }
        }
    }
    
    // 获取网格系统引用
    private getGridSystem(): GridDeploymentSystem | null {
        if (this._gridSystemCache && this._gridSystemCache.isValid) {
            return this._gridSystemCache;
        }
        
        this._gridSystemCache = this.node.parent?.getComponentInChildren(GridDeploymentSystem) || null;
        return this._gridSystemCache;
    }
}