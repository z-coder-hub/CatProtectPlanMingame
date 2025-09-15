import { _decorator, Component } from 'cc';
import {
    LevelConfig, LevelCompletionStatus, LevelCompletionRecord,
    HeroUnlockStatus, HeroUnlockRecord, UnlockCondition, UnlockConditionType,
    HeroType, RewardType
} from '../types/GameTypes';
import { LEVEL_CONFIGS } from '../types/LevelConfigs';

const { ccclass } = _decorator;

/**
 * 关卡管理器
 * 负责关卡解锁、进度管理、英雄解锁、特殊机制处理等
 */
@ccclass('LevelManager')
export class LevelManager extends Component {

    // ====================== 单例模式 ======================
    private static _instance: LevelManager | null = null;

    public static get instance(): LevelManager | null {
        return LevelManager._instance;
    }

    // ====================== 核心数据 ======================
    
    // 关卡完成记录
    private _levelRecords: Record<string, LevelCompletionRecord> = {};
    
    // 英雄解锁记录
    private _heroRecords: Record<HeroType, HeroUnlockRecord> = {} as Record<HeroType, HeroUnlockRecord>;
    
    // 当前游戏进度（到达的最高关卡索引）
    private _maxReachedLevelIndex: number = 0; // 最高到达的关卡索引
    
    // 用于减少日志频率的计数器
    private _lastUnlockedCount: number | undefined;

    // ====================== 生命周期 ======================

    protected onLoad(): void {
        // 设置单例
        if (LevelManager._instance) {
            console.warn("LevelManager实例已存在，销毁重复实例");
            this.node.destroy();
            return;
        }
        
        LevelManager._instance = this;
        this.initializeDefaultData();
        console.log("LevelManager初始化完成");
    }

    protected onDestroy(): void {
        if (LevelManager._instance === this) {
            LevelManager._instance = null;
        }
    }

    // ====================== 初始化方法 ======================

    /**
     * 初始化默认数据
     */
    private initializeDefaultData(): void {
        // 初始化英雄解锁状态
        this.initializeHeroUnlockStatus();
        
        // 初始化关卡记录
        this.initializeLevelRecords();
        
        console.log("关卡管理器默认数据初始化完成");
    }

    /**
     * 初始化英雄解锁状态
     */
    private initializeHeroUnlockStatus(): void {
        // 默认解锁的英雄
        const defaultUnlockedHeroes: HeroType[] = [
            HeroType.ORANGE_CAT // 橘猫射手默认解锁
        ];

        // 初始化所有英雄为锁定状态
        const heroTypeValues = Object.keys(HeroType).map(key => (HeroType as any)[key]);
        heroTypeValues.forEach(heroTypeValue => {
            this._heroRecords[heroTypeValue as HeroType] = {
                heroType: heroTypeValue as HeroType,
                status: defaultUnlockedHeroes.indexOf(heroTypeValue as HeroType) !== -1
                    ? HeroUnlockStatus.UNLOCKED
                    : HeroUnlockStatus.LOCKED,
                unlockDate: defaultUnlockedHeroes.indexOf(heroTypeValue as HeroType) !== -1 ? new Date() : undefined,
                level: 1,
                experience: 0,
                totalUsageCount: 0,
                totalKillCount: 0
            };
        });

        console.log(`英雄解锁状态初始化完成，默认解锁: ${defaultUnlockedHeroes.length} 个英雄`);
        
        // 输出初始状态
        this.debugHeroUnlockStatus("初始化完成");
    }

    /**
     * 调试用：输出英雄解锁状态
     */
    private debugHeroUnlockStatus(context: string): void {
        console.log(`🔍 [${context}] 英雄解锁状态详情:`);
        const heroRecordEntries = Object.keys(this._heroRecords).map(key => [key, this._heroRecords[key as HeroType]]);
        heroRecordEntries.forEach(([type, record]: [string, HeroUnlockRecord]) => {
            const status = record.status === HeroUnlockStatus.UNLOCKED ? '✅' : '🔒';
            console.log(`  ${status} ${type}: ${record.status}`);
        });
    }

    /**
     * 初始化关卡记录
     */
    private initializeLevelRecords(): void {
        const allLevels = LEVEL_CONFIGS.getAllLevels();

        allLevels.forEach(level => {
            this._levelRecords[level.id] = {
                levelId: level.id,
                status: this.calculateLevelStatus(level),
                completionCount: 0,
                starsEarned: 0
            };
        });

        console.log(`关卡记录初始化完成，总关卡数: ${allLevels.length}`);
    }

    /**
     * 计算关卡解锁状态
     */
    private calculateLevelStatus(level: LevelConfig): LevelCompletionStatus {
        // 第一个关卡默认解锁（5关系统中第一关ID为"1"）
        if (level.id === "1") {
            return LevelCompletionStatus.AVAILABLE;
        }

        // 检查解锁条件
        const canUnlock = this.CheckUnlockConditions(level.unlockConditions);
        return canUnlock ? LevelCompletionStatus.AVAILABLE : LevelCompletionStatus.LOCKED;
    }

    // ====================== 关卡状态查询 ======================

    /**
     * 获取关卡完成状态
     */
    public GetLevelStatus(levelId: string): LevelCompletionStatus {
        const record = this._levelRecords[levelId];
        return record ? record.status : LevelCompletionStatus.LOCKED;
    }

    /**
     * 获取关卡完成记录
     */
    public GetLevelRecord(levelId: string): LevelCompletionRecord | null {
        return this._levelRecords[levelId] || null;
    }

    /**
     * 获取当前最高到达的关卡索引
     */
    public GetMaxReachedLevelIndex(): number {
        return this._maxReachedLevelIndex;
    }

    /**
     * 更新最高到达的关卡索引
     */
    public UpdateMaxReachedLevel(levelIndex: number): void {
        if (levelIndex > this._maxReachedLevelIndex) {
            this._maxReachedLevelIndex = levelIndex;
            console.log(`更新最高到达关卡索引: ${levelIndex}`);
        }
    }

    /**
     * 获取游戏总体进度
     */
    public GetGameProgress(): {
        completedLevels: number;
        totalLevels: number;
        currentLevelIndex: number;
        progressPercent: number;
    } {
        const allLevels = LEVEL_CONFIGS.getAllLevels();
        const completedLevels = allLevels.filter(level => {
            const status = this.GetLevelStatus(level.id);
            return status === LevelCompletionStatus.COMPLETED || 
                   status === LevelCompletionStatus.PERFECT;
        }).length;

        return {
            completedLevels,
            totalLevels: allLevels.length,
            currentLevelIndex: this._maxReachedLevelIndex,
            progressPercent: allLevels.length > 0 ? (completedLevels / allLevels.length) * 100 : 0
        };
    }

    // ====================== 关卡完成处理 ======================

    /**
     * 记录关卡完成
     */
    public RecordLevelCompletion(
        levelId: string, 
        isVictory: boolean, 
        completionTime: number,
        score?: number
    ): void {
        const record = this._levelRecords[levelId];
        if (!record) {
            console.error(`未找到关卡记录: ${levelId}`);
            return;
        }

        if (isVictory) {
            // 更新完成状态
            if (record.status === LevelCompletionStatus.AVAILABLE) {
                record.status = LevelCompletionStatus.COMPLETED;
                record.firstCompletionDate = new Date();
            }

            // 更新统计信息
            record.completionCount++;
            record.lastPlayedDate = new Date();
            
            // 更新最佳时间
            if (!record.bestTime || completionTime < record.bestTime) {
                record.bestTime = completionTime;
            }
            
            // 更新最高分
            if (score && (!record.highScore || score > record.highScore)) {
                record.highScore = score;
            }

            // 检查完美完成条件
            this.checkPerfectCompletion(levelId, completionTime, score);
            
            // 更新最高到达关卡索引
            const allLevels = LEVEL_CONFIGS.getAllLevels();
            const levelIndex = allLevels.findIndex(level => level.id === levelId);
            if (levelIndex >= 0) {
                this.UpdateMaxReachedLevel(levelIndex);
            }
            
            // 处理解锁
            this.processLevelCompletionUnlocks(levelId);

            console.log(`关卡完成记录已更新: ${levelId}, 完成次数: ${record.completionCount}`);
        } else {
            // 失败也记录最后游玩日期
            record.lastPlayedDate = new Date();
        }
    }

    /**
     * 检查完美完成条件
     */
    private checkPerfectCompletion(levelId: string, completionTime: number, _score?: number): void {
        const record = this._levelRecords[levelId];
        const levelConfig = LEVEL_CONFIGS.getLevelById(levelId);
        
        if (!record || !levelConfig) return;

        // 简单的完美完成判定（可以根据需要扩展）
        const isPerfect = completionTime <= (levelConfig.estimatedDuration * 60 * 0.8); // 在预期时间80%内完成
        
        if (isPerfect && record.status !== LevelCompletionStatus.PERFECT) {
            record.status = LevelCompletionStatus.PERFECT;
            record.starsEarned = Math.max(record.starsEarned, 3);
            console.log(`完美完成关卡: ${levelId}`);
        }
    }

    /**
     * 处理关卡完成解锁
     */
    private processLevelCompletionUnlocks(levelId: string): void {
        // 解锁英雄
        this.unlockHeroesForLevel(levelId);
        
        // 解锁新关卡
        this.unlockNewLevels();
    }

    // ====================== 解锁条件检查 ======================

    /**
     * 检查解锁条件
     */
    public CheckUnlockConditions(conditions: UnlockCondition[]): boolean {
        if (!conditions || conditions.length === 0) {
            return true;
        }

        return conditions.every(condition => {
            switch (condition.type) {
                case UnlockConditionType.COMPLETE_LEVEL:
                    const levelStatus = this.GetLevelStatus(condition.targetId);
                    return levelStatus === LevelCompletionStatus.COMPLETED || 
                           levelStatus === LevelCompletionStatus.PERFECT;
                
                case UnlockConditionType.COMPLETE_WORLD:
                    // 线性游戏模式下不支持世界解锁条件
                    console.warn("线性模式不支持世界解锁条件");
                    return false;
                
                case UnlockConditionType.HERO_UNLOCK:
                    return this.IsHeroUnlocked(condition.targetId as HeroType);
                
                case UnlockConditionType.ACHIEVEMENT:
                    // TODO: 集成成就系统
                    console.log(`成就解锁条件检查: ${condition.targetId}`);
                    return false;
                
                default:
                    console.warn(`未知的解锁条件类型: ${condition.type}`);
                    return false;
            }
        });
    }


    /**
     * 解锁新关卡
     */
    private unlockNewLevels(): void {
        const allLevels = LEVEL_CONFIGS.getAllLevels();
        
        allLevels.forEach(level => {
            const currentStatus = this.GetLevelStatus(level.id);
            if (currentStatus === LevelCompletionStatus.LOCKED) {
                const canUnlock = this.CheckUnlockConditions(level.unlockConditions);
                if (canUnlock) {
                    this._levelRecords[level.id].status = LevelCompletionStatus.AVAILABLE;
                    console.log(`解锁新关卡: ${level.name} (${level.id})`);
                }
            }
        });
    }


    // ====================== 英雄解锁系统 ======================

    /**
     * 检查英雄是否已解锁
     */
    public IsHeroUnlocked(heroType: HeroType): boolean {
        const record = this._heroRecords[heroType];
        return record ? record.status !== HeroUnlockStatus.LOCKED : false;
    }

    /**
     * 获取英雄解锁记录
     */
    public GetHeroRecord(heroType: HeroType): HeroUnlockRecord | null {
        return this._heroRecords[heroType] || null;
    }

    /**
     * 获取已解锁的英雄列表
     */
    public GetUnlockedHeroes(): HeroType[] {
        const heroRecordValues = Object.keys(this._heroRecords).map(key => this._heroRecords[key as HeroType]);
        const unlockedHeroes = heroRecordValues
            .filter(record => record.status !== HeroUnlockStatus.LOCKED)
            .map(record => record.heroType);
        
        // 只在英雄数量变化时输出详细日志
        const currentCount = unlockedHeroes.length;
        if (!this._lastUnlockedCount || this._lastUnlockedCount !== currentCount) {
            console.log(`📊 已解锁英雄更新: ${currentCount} 个英雄`, unlockedHeroes);
            this._lastUnlockedCount = currentCount;
        }
        
        return unlockedHeroes;
    }

    /**
     * 解锁英雄
     */
    public UnlockHero(heroType: HeroType): boolean {
        console.log(`🔓 UnlockHero被调用: ${heroType} (type: ${typeof heroType})`);
        console.log(`📋 当前英雄记录keys:`, Object.keys(this._heroRecords));
        
        const record = this._heroRecords[heroType];
        if (!record) {
            console.error(`❌ 未找到英雄记录: ${heroType}`);
            console.error(`📋 可用的记录:`, Object.keys(this._heroRecords));
            return false;
        }

        console.log(`📊 英雄记录状态: ${record.status} (${HeroUnlockStatus.LOCKED} = LOCKED, ${HeroUnlockStatus.UNLOCKED} = UNLOCKED)`);
        if (record.status === HeroUnlockStatus.LOCKED) {
            record.status = HeroUnlockStatus.UNLOCKED;
            record.unlockDate = new Date();
            console.log(`✅ 英雄成功解锁: ${heroType}`);
            
            // 验证解锁后的状态
            console.log(`🔍 验证解锁状态: ${this._heroRecords[heroType].status}`);
            
            // 输出解锁后的完整状态
            this.debugHeroUnlockStatus(`解锁${heroType}后`);
            return true;
        } else {
            console.log(`ℹ️ 英雄已经解锁: ${heroType} (状态: ${record.status})`);
            return true; // 修复：如果英雄已经解锁，应该返回true表示成功状态
        }
    }

    /**
     * 为特定关卡解锁英雄
     */
    private unlockHeroesForLevel(levelId: string): void {
        const levelConfig = LEVEL_CONFIGS.getLevelById(levelId);
        if (!levelConfig) return;

        levelConfig.rewards.forEach(reward => {
            if (reward.type === RewardType.HERO_UNLOCK) {
                const heroType = reward.value as HeroType;
                this.UnlockHero(heroType);
            }
        });
    }


    // ====================== 数据保存和加载 ======================

    /**
     * 获取保存数据
     */
    public GetSaveData(): {
        levelRecords: Record<string, LevelCompletionRecord>;
        heroRecords: Record<HeroType, HeroUnlockRecord>;
        maxReachedLevelIndex: number;
    } {
        return {
            levelRecords: { ...this._levelRecords },
            heroRecords: { ...this._heroRecords },
            maxReachedLevelIndex: this._maxReachedLevelIndex
        };
    }

    /**
     * 加载保存数据
     */
    public LoadSaveData(saveData: {
        levelRecords: Record<string, LevelCompletionRecord>;
        heroRecords: Record<HeroType, HeroUnlockRecord>;
        maxReachedLevelIndex: number;
    }): void {
        this._levelRecords = { ...saveData.levelRecords };
        this._heroRecords = { ...saveData.heroRecords };
        this._maxReachedLevelIndex = saveData.maxReachedLevelIndex || 0;
        
        console.log("关卡管理器数据加载完成");
    }

    // ====================== 调试和工具方法 ======================


    /**
     * 获取调试信息
     */
    public GetDebugInfo(): {
        totalLevels: number;
        unlockedLevels: number;
        completedLevels: number;
        unlockedWorlds: number;
        unlockedHeroes: number;
    } {
        const allLevels = LEVEL_CONFIGS.getAllLevels();
        const unlockedLevels = allLevels.filter(level => {
            const status = this.GetLevelStatus(level.id);
            return status !== LevelCompletionStatus.LOCKED;
        }).length;
        
        const completedLevels = allLevels.filter(level => {
            const status = this.GetLevelStatus(level.id);
            return status === LevelCompletionStatus.COMPLETED || 
                   status === LevelCompletionStatus.PERFECT;
        }).length;

        const unlockedHeroes = this.GetUnlockedHeroes().length;

        return {
            totalLevels: allLevels.length,
            unlockedLevels,
            completedLevels,
            unlockedWorlds: 0, // 线性模式下不使用世界概念
            unlockedHeroes
        };
    }
}