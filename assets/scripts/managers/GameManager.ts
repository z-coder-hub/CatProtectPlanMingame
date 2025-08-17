import { _decorator, Component, Node, Vec3 } from 'cc';
import { GameState, GameEvents } from '../types/GameTypes';
import { GAME_CONFIG } from '../types/GameConstants';
import { BaseUnit } from '../components/base/BaseUnit';
import { BattleManager } from './BattleManager';
import { WaveManager } from './WaveManager';
import { GridDeploymentSystem } from '../systems/GridDeploymentSystem';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    
    @property({ tooltip: "城堡生命值" })
    public castleHealth: number = 100;
    
    @property({ tooltip: "当前金币数量" })
    public currentGold: number = 200;
    
    @property({ tooltip: "当前波次" })
    public currentWave: number = 1;
    
    @property({ tooltip: "城堡节点引用", type: Node })
    public castleNode: Node | null = null;
    
    // 游戏状态
    private _gameState: GameState = GameState.MENU;
    private _maxCastleHealth: number = 100;
    
    // 已部署的英雄列表
    private _deployedHeroes: Node[] = [];
    
    // 活跃的敌人列表
    private _activeEnemies: Node[] = [];
    
    // 事件回调
    private _eventCallbacks = new Map<keyof GameEvents, Function[]>();
    
    // 休息阶段相关（参考老项目）
    private _restTimer: number = 0;
    private _restDuration: number = 3.0;
    
    // 组件引用缓存（参考老项目）
    private _battleManagerCache: BattleManager | null = null;
    private _waveManagerCache: WaveManager | null = null;
    private _gridSystemCache: GridDeploymentSystem | null = null;
    
    // 获取游戏状态
    public get gameState(): GameState {
        return this._gameState;
    }
    
    // 获取城堡血量百分比
    public get castleHealthPercent(): number {
        return this.castleHealth / this._maxCastleHealth;
    }
    
    // 获取已部署英雄列表
    public get deployedHeroes(): Node[] {
        return [...this._deployedHeroes];
    }
    
    // 获取活跃敌人列表
    public get activeEnemies(): Node[] {
        return [...this._activeEnemies];
    }
    
    // 获取休息计时器
    public get restTimer(): number {
        return this._restTimer;
    }
    
    public get restDuration(): number {
        return this._restDuration;
    }
    
    // 单例实例
    private static _instance: GameManager | null = null;
    
    public static get instance(): GameManager | null {
        return GameManager._instance;
    }
    
    protected onLoad(): void {
        // 设置单例
        if (GameManager._instance) {
            console.warn("GameManager实例已存在，销毁重复实例");
            this.node.destroy();
            return;
        }
        
        GameManager._instance = this;
        
        // 初始化游戏配置
        this.initializeGameConfig();
        
        console.log("GameManager初始化完成");
    }
    
    protected start(): void {
        // 游戏开始时保持菜单状态，等待玩家操作
        console.log("游戏已加载，等待玩家开始");
    }
    
    protected update(dt: number): void {
        // 更新休息阶段计时器
        if (this._gameState === GameState.RESTING) {
            this.updateRestPhase(dt);
        }
    }
    
    protected onDestroy(): void {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
    }
    
    // 初始化游戏配置
    private initializeGameConfig(): void {
        this.currentGold = GAME_CONFIG.initialGold;
        this.castleHealth = GAME_CONFIG.castleHealth;
        this._maxCastleHealth = GAME_CONFIG.castleHealth;
        
        // 设置初始游戏状态为部署阶段，这样英雄面板会显示
        this._gameState = GameState.DEPLOYMENT;
        console.log("游戏状态设置为部署阶段");
    }
    
    // 开始游戏
    public startGame(): void {
        console.log("游戏开始！");
        this.setGameState(GameState.DEPLOYMENT);
    }
    
    // 开始战斗
    public startBattle(): void {
        if (this._gameState !== GameState.DEPLOYMENT) {
            console.warn("只能在部署状态开始战斗");
            return;
        }
        
        this.setGameState(GameState.BATTLE);
        console.log("战斗开始！");
        
        // 启动波次管理器
        const waveManager = this.getWaveManager();
        if (waveManager) {
            waveManager.startWave(this.currentWave);
        }
    }
    
    // 暂停游戏
    public pauseGame(): void {
        if (this._gameState === GameState.BATTLE) {
            this.setGameState(GameState.PAUSED);
            console.log("游戏暂停");
        }
    }
    
    // 恢复游戏
    public resumeGame(): void {
        if (this._gameState === GameState.PAUSED) {
            this.setGameState(GameState.BATTLE);
            console.log("游戏恢复");
        }
    }
    
    // 游戏结束
    public endGame(isVictory: boolean): void {
        const newState = isVictory ? GameState.VICTORY : GameState.GAME_OVER;
        this.setGameState(newState);
        
        if (isVictory) {
            console.log("游戏胜利！");
        } else {
            console.log("游戏失败！");
        }
    }
    
    // 重新开始游戏
    public restartGame(): void {
        // 重置游戏数据
        this.currentWave = 1;
        this.initializeGameConfig();
        
        // 清理已部署的英雄
        this.clearAllHeroes();
        
        // 清理敌人
        this.clearAllEnemies();
        
        // 重置游戏状态
        this.setGameState(GameState.MENU);
        
        console.log("游戏重新开始");
    }
    
    // 设置游戏状态
    private setGameState(newState: GameState): void {
        const oldState = this._gameState;
        this._gameState = newState;
        
        // 触发状态变化事件
        this.emitEvent('game-state-changed', { newState, oldState });
    }
    
    // 添加金币
    public addGold(amount: number): void {
        this.currentGold += amount;
        console.log(`获得金币: +${amount}, 当前金币: ${this.currentGold}`);
    }
    
    // 消费金币
    public spendGold(amount: number): boolean {
        if (this.currentGold >= amount) {
            this.currentGold -= amount;
            console.log(`消费金币: -${amount}, 当前金币: ${this.currentGold}`);
            return true;
        }
        
        console.log(`金币不足，需要: ${amount}, 当前: ${this.currentGold}`);
        return false;
    }
    
    // 城堡受伤
    public castleTakeDamage(damage: number): void {
        this.castleHealth = Math.max(0, this.castleHealth - damage);
        console.log(`城堡受到伤害: ${damage}, 剩余血量: ${this.castleHealth}`);
        
        // 检查游戏失败
        if (this.castleHealth <= 0) {
            this.endGame(false);
        }
    }
    
    // 波次完成（参考老项目）
    public onWaveComplete(): void {
        console.log(`第 ${this.currentWave} 波完成`);
        this.addGold(50); // 每波奖励50金币
        this.setGameState(GameState.RESTING);
        this._restTimer = this._restDuration;
        this.clearAllHeroes(); // 清空英雄重新部署
    }
    
    // 更新休息阶段
    private updateRestPhase(dt: number): void {
        this._restTimer -= dt;
        if (this._restTimer <= 0) {
            this.nextWave();
        }
    }
    
    // 进入下一波
    public nextWave(): void {
        // 通知WaveManager准备下一波
        const waveManager = this.getWaveManager();
        if (waveManager) {
            waveManager.prepareNextWave();
        }
        
        // 检查是否达到最大波次
        if (this.currentWave > GAME_CONFIG.waves.length) {
            this.endGame(true);
        } else {
            console.log(`进入第 ${this.currentWave} 波部署阶段`);
            this.setGameState(GameState.DEPLOYMENT);
        }
    }
    
    // 添加英雄到已部署列表
    public addDeployedHero(heroNode: Node): void {
        if (!this._deployedHeroes.includes(heroNode)) {
            this._deployedHeroes.push(heroNode);
            console.log(`英雄已部署，当前英雄数: ${this._deployedHeroes.length}`);
        }
    }
    
    // 移除已部署的英雄
    public removeDeployedHero(heroNode: Node): void {
        const index = this._deployedHeroes.indexOf(heroNode);
        if (index >= 0) {
            this._deployedHeroes.splice(index, 1);
            console.log(`英雄已移除，当前英雄数: ${this._deployedHeroes.length}`);
        }
    }
    
    // 清理所有英雄
    public clearAllHeroes(): void {
        for (const hero of this._deployedHeroes) {
            if (hero && hero.isValid) {
                hero.destroy();
            }
        }
        this._deployedHeroes = [];
        console.log("所有英雄已清理");
    }
    
    // 添加敌人到活跃列表
    public addActiveEnemy(enemyNode: Node): void {
        if (!this._activeEnemies.includes(enemyNode)) {
            this._activeEnemies.push(enemyNode);
        }
    }
    
    // 移除活跃敌人
    public removeActiveEnemy(enemyNode: Node): void {
        const index = this._activeEnemies.indexOf(enemyNode);
        if (index >= 0) {
            this._activeEnemies.splice(index, 1);
        }
    }
    
    // 清理所有敌人
    public clearAllEnemies(): void {
        for (const enemy of this._activeEnemies) {
            if (enemy && enemy.isValid) {
                enemy.destroy();
            }
        }
        this._activeEnemies = [];
        console.log("所有敌人已清理");
    }
    
    // 事件系统
    public addEventListener<K extends keyof GameEvents>(
        event: K, 
        callback: (data: GameEvents[K]) => void
    ): void {
        if (!this._eventCallbacks.has(event)) {
            this._eventCallbacks.set(event, []);
        }
        this._eventCallbacks.get(event)!.push(callback);
    }
    
    public removeEventListener<K extends keyof GameEvents>(
        event: K, 
        callback: (data: GameEvents[K]) => void
    ): void {
        const callbacks = this._eventCallbacks.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index >= 0) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    private emitEvent<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
        const callbacks = this._eventCallbacks.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件回调执行错误: ${event}`, error);
                }
            });
        }
    }
    
    // 获取游戏统计信息
    public getGameStats(): {
        wave: number;
        gold: number;
        castleHealth: number;
        castleHealthPercent: number;
        heroesCount: number;
        enemiesCount: number;
        gameState: GameState;
    } {
        return {
            wave: this.currentWave,
            gold: this.currentGold,
            castleHealth: this.castleHealth,
            castleHealthPercent: this.castleHealthPercent,
            heroesCount: this._deployedHeroes.length,
            enemiesCount: this._activeEnemies.length,
            gameState: this._gameState
        };
    }
    
    // 获取组件引用（参考老项目的缓存机制）
    public getBattleManager(): BattleManager | null {
        if (this._battleManagerCache && this._battleManagerCache.isValid) {
            return this._battleManagerCache;
        }
        
        // 从父节点查找
        this._battleManagerCache = this.node.parent?.getComponentInChildren(BattleManager) || null;
        return this._battleManagerCache;
    }
    
    public getWaveManager(): WaveManager | null {
        if (this._waveManagerCache && this._waveManagerCache.isValid) {
            return this._waveManagerCache;
        }
        
        this._waveManagerCache = this.node.parent?.getComponentInChildren(WaveManager) || null;
        return this._waveManagerCache;
    }
    
    public getGridSystem(): GridDeploymentSystem | null {
        if (this._gridSystemCache && this._gridSystemCache.isValid) {
            return this._gridSystemCache;
        }
        
        this._gridSystemCache = this.node.parent?.getComponentInChildren(GridDeploymentSystem) || null;
        return this._gridSystemCache;
    }
}