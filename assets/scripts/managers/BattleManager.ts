import { _decorator, Component, Node, Vec3 } from 'cc';
import { BaseMouse } from '../components/enemies/BaseMouse';
import { BaseHero } from '../components/heroes/BaseHero';
import { GridDeploymentSystem } from '../systems/GridDeploymentSystem';
import { GridPosition } from '../types/GameTypes';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

@ccclass('BattleManager')
export class BattleManager extends Component {

    @property({ tooltip: "统计更新间隔(秒)" })
    public UpdateInterval: number = 0.2;

    @property({ tooltip: "是否启用网格定位" })
    public enableGridPositioning: boolean = true;

    // 私有属性
    private _updateTimer: number = 0;
    private _gameManager: GameManager | null = null;

    // 注册的英雄和敌人列表
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

        // 定期更新数据统计
        if (this._updateTimer >= this.UpdateInterval) {
            this.updateStatistics();
            this._updateTimer = 0;
        }
    }

    // 更新数据统计 - 处理数据同步和统计
    private updateStatistics(): void {
        if (!this._gameManager) return;

        // 清理无效的注册单位
        this.cleanupInvalidUnits();

        // 更新战斗统计数据
        this.updateBattleStatistics();
    }

    // 清理无效单位
    private cleanupInvalidUnits(): void {
        // 清理无效的注册英雄
        this._registeredHeroes = this._registeredHeroes.filter(hero =>
            hero && hero.isValid
        );

        // 清理无效的注册敌人
        this._registeredEnemies = this._registeredEnemies.filter(enemy =>
            enemy && enemy.isValid
        );
    }

    // 更新战斗统计数据
    private updateBattleStatistics(): void {
        // 这里可以添加统计数据更新逻辑
        // 比如总伤害、击杀数等统计
    }

    // === 目标分配系统 - 供英雄使用 ===

    /**
     * 为英雄分配最佳攻击目标
     * @param heroNode 英雄节点
     * @param attackRange 攻击范围
     * @returns 分配的目标节点，如果没有合适目标则返回null
     */
    public assignTargetForHero(heroNode: Node, attackRange: number): Node | null {
        if (!heroNode || !heroNode.isValid) return null;

        // 优先选择最近的敌人
        const nearestEnemy = this.findNearestEnemy(heroNode.position, attackRange);

        if (nearestEnemy) {
            // 可以在这里添加更复杂的目标分配策略
            // 比如考虑威胁等级、生命值、类型等因素
            return nearestEnemy;
        }

        return null;
    }

    /**
     * 验证目标是否仍然有效
     * @param target 目标节点
     * @param heroPosition 英雄位置
     * @param attackRange 攻击范围
     * @returns 是否为有效目标
     */
    public isValidTarget(target: Node | null, heroPosition: Vec3, attackRange: number): boolean {
        if (!target || !target.isValid) return false;

        // 检查目标是否存活
        const targetUnit = target.getComponent(BaseMouse);
        if (!targetUnit || !targetUnit.isAlive) return false;

        // 检查目标是否在攻击范围内
        const distance = Vec3.distance(heroPosition, target.position);
        return distance <= attackRange;
    }

    // === 数据查询方法 - 供英雄和敌人使用 ===

    /**
     * 获取指定位置周围的敌人列表
     * @param position 中心位置
     * @param range 搜索范围
     * @returns 敌人节点数组
     */
    public findEnemiesInRange(position: Vec3, range: number): Node[] {
        // 直接使用本地注册的敌人列表
        const enemies = this._registeredEnemies;
        const enemiesInRange: Node[] = [];

        for (const enemyNode of enemies) {
            if (!enemyNode || !enemyNode.isValid) continue;

            const distance = Vec3.distance(position, enemyNode.position);
            if (distance <= range) {
                const enemyUnit = enemyNode.getComponent(BaseMouse);
                if (enemyUnit && enemyUnit.isAlive) {
                    enemiesInRange.push(enemyNode);
                }
            }
        }

        return enemiesInRange;
    }

    /**
     * 获取最近的敌人
     * @param position 搜索起点
     * @param maxRange 最大搜索范围，不指定则全局搜索
     * @returns 最近的敌人节点，如果没有则返回null
     */
    public findNearestEnemy(position: Vec3, maxRange?: number): Node | null {
        // 直接使用本地注册的敌人列表
        const enemies = this._registeredEnemies;
        let nearestEnemy: Node | null = null;
        let nearestDistance = maxRange || Number.MAX_VALUE;

        for (const enemyNode of enemies) {
            if (!enemyNode || !enemyNode.isValid) continue;

            const enemyUnit = enemyNode.getComponent(BaseMouse);
            if (!enemyUnit || !enemyUnit.isAlive) continue;

            const distance = Vec3.distance(position, enemyNode.position);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemyNode;
            }
        }

        return nearestEnemy;
    }

    /**
     * 获取所有活跃的敌人列表
     */
    public getAllActiveEnemies(): Node[] {
        return this._registeredEnemies.filter(enemy => {
            if (!enemy || !enemy.isValid) return false;
            const enemyUnit = enemy.getComponent(BaseMouse);
            return enemyUnit && enemyUnit.isAlive;
        });
    }

    /**
     * 获取所有部署的英雄列表
     */
    public getAllDeployedHeroes(): Node[] {
        return this._registeredHeroes.filter(hero => {
            if (!hero || !hero.isValid) return false;
            const heroUnit = hero.getComponent(BaseHero);
            return heroUnit && heroUnit.isAlive;
        });
    }



    // === 数据统计方法 ===

    /**
     * 获取战斗统计信息
     */
    public GetBattleStats(): {
        activeHeroes: number;
        activeEnemies: number;
        averageEnemyHealth: number;
    } {
        // 直接使用本地注册的数据
        const heroes = this._registeredHeroes;
        const enemies = this._registeredEnemies;

        const avgEnemyHealth = this.calculateAverageEnemyHealth(enemies);

        return {
            activeHeroes: heroes.length,
            activeEnemies: enemies.length,
            averageEnemyHealth: avgEnemyHealth
        };
    }

    /**
     * 计算敌人的平均生命值百分比
     */
    private calculateAverageEnemyHealth(enemyNodes: Node[]): number {
        if (enemyNodes.length === 0) return 0;

        let totalHealthPercent = 0;
        let validEnemies = 0;

        for (const node of enemyNodes) {
            const enemy = node.getComponent(BaseMouse);
            if (enemy && enemy.isAlive) {
                const healthPercent = (enemy.currentHealth / enemy.maxHealth) * 100;
                totalHealthPercent += healthPercent;
                validEnemies++;
            }
        }

        return validEnemies > 0 ? totalHealthPercent / validEnemies : 0;
    }

    // 注册系统方法（参考老项目）
    public RegisterHero(heroNode: Node): void {
        if (this._registeredHeroes.indexOf(heroNode) === -1) {
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
        if (this._registeredEnemies.indexOf(enemyNode) === -1) {
            this._registeredEnemies.push(enemyNode);
            console.log(`[BattleManager] 敌人注册: ${enemyNode.name}, 当前敌人数: ${this._registeredEnemies.length}`);
        }
    }

    public UnregisterEnemy(enemyNode: Node): void {
        const index = this._registeredEnemies.indexOf(enemyNode);
        if (index >= 0) {
            this._registeredEnemies.splice(index, 1);
            console.log(`[BattleManager] 敌人取消注册: ${enemyNode.name}, 剩余敌人数: ${this._registeredEnemies.length}`);
        }
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


    // === 击杀奖励系统 ===

    /**
     * 处理敌人被击杀，给予全局奖励
     * @param killedEnemy 被击杀敌人组件
     */
    public HandleEnemyKilled(killedEnemy: BaseMouse): void {
        if (!this._gameManager || !killedEnemy) return;

        // 从敌人配置中获取击杀奖励，如果没有配置则使用默认值
        const goldReward = this.getKillReward(killedEnemy);

        // 给予金币奖励
        if (this._gameManager) {
            this._gameManager.AddGold(goldReward);
        }

        // 从注册列表中移除敌人（会自动处理其他清理）
        this.UnregisterEnemy(killedEnemy.node);

        console.log(`${killedEnemy.unitName} 被击杀，获得 ${goldReward} 金币`);
    }

    /**
     * 获取击杀敌人的奖励金币
     * @param enemy 被击杀的敌人
     * @returns 奖励金币数量
     */
    private getKillReward(enemy: BaseMouse): number {
        // 这里可以根据敌人类型、难度等因素计算奖励
        // 暂时使用固定值，后续可以从敌人配置中获取
        const baseReward = 5;

        // 可以根据敌人最大生命值调整奖励
        const healthBonus = Math.floor(enemy.maxHealth / 50);

        return baseReward + healthBonus;
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
