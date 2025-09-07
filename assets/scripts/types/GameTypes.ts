import { Component } from 'cc';

// 游戏单位类型枚举
export enum UnitType {
    HERO = "hero",
    ENEMY = "enemy"
}

// 英雄状态枚举（英雄不会死亡）
export enum HeroState {
    IDLE = 0,      // 待机
    ATTACKING = 1  // 攻击中
}

// 敌人状态枚举（老鼠专注突破防线，无攻击能力）
export enum EnemyState {
    IDLE = 0,      // 待机
    MOVING = 1,    // 移动中
    DEAD = 2       // 死亡
}

// 英雄分类枚举
export enum HeroCategory {
    RANGED = "ranged",     // 远程
    MAGE = "mage",         // 法师
    MELEE = "melee",       // 近战
    SUPPORT = "support",   // 辅助
    SPECIAL = "special"    // 特殊
}

// 英雄类型枚举
export enum HeroType {
    // 远程英雄
    ORANGE_CAT = "OrangeCat",              // 橘猫射手
    PERSIAN_SNIPER = "PersianSniper",      // 波斯猫狙击手
    BENGAL_HUNTER = "BengalHunter",        // 孟加拉猫猎手

    // 法师英雄
    SIAMESE_MAGE = "SiameseMage",          // 暹罗猫法师
    MAINE_THUNDER = "MaineThunder",        // 缅因猫雷法
    NORWEGIAN_ICE = "NorwegianIce",        // 挪威森林猫冰法

    // 近战英雄
    BRITISH_KNIGHT = "BritishKnight",      // 英国短毛猫骑士
    RAGDOLL_GUARDIAN = "RagdollGuardian",  // 布偶猫守护者

    // 辅助英雄
    SCOTTISH_ENGINEER = "ScottishEngineer",     // 苏格兰折耳猫工程师
    ABYSSINIAN_SCOUT = "AbyssinianScout",       // 阿比西尼亚猫侦察兵

    // 特殊英雄
    RUSSIAN_BLUE = "RussianBlue",          // 俄罗斯蓝猫精英
    AMERICAN_BOMBER = "AmericanBomber"     // 美国短毛猫爆破兵
}

// 敌人分类枚举
export enum EnemyCategory {
    BASIC = "basic",       // 基础单位
    FAST = "fast",         // 快速单位
    ARMORED = "armored",   // 装甲单位
    SPECIAL = "special",   // 特殊单位
    BOSS = "boss"          // BOSS单位
}

// 敌人类型枚举
export enum EnemyType {
    // 基础单位
    BASIC_MOUSE = "BasicMouse",         // 基础老鼠
    GIANT_MOUSE = "GiantMouse",         // 巨型老鼠

    // 快速单位
    FAST_MOUSE = "FastMouse",           // 快速老鼠
    SPEED_MOUSE = "SpeedMouse",         // 疾速老鼠

    // 装甲单位
    ARMORED_MOUSE = "ArmoredMouse",     // 装甲老鼠
    TANK_MOUSE = "TankMouse",           // 坦克老鼠

    // 特殊单位
    STEALTH_MOUSE = "StealthMouse",     // 潜行老鼠

    // BOSS单位
    MOUSE_KING = "MouseKing",           // 老鼠王
    MECH_MOUSE = "MechMouse",           // 机械老鼠
    
    // 特殊BOSS单位（关卡专用）
    ICE_KING = "IceKing",               // 冰原霸主
    FLAME_DEMON = "FlameDemon",         // 炎魔
    VOLCANO_HEART = "VolcanoHeart"      // 火山之心
}

// 游戏状态枚举
export enum GameState {
    MENU = "menu",
    DEPLOYMENT = "deployment",     // 部署阶段
    BATTLE = "battle",            // 战斗阶段
    RESTING = "resting",          // 休息阶段
    PLAYING = "playing",
    VICTORY = "victory",
    GAME_OVER = "game_over"       // 游戏失败
}

// 部署模式枚举
export enum DeploymentMode {
    GRID = "grid"                  // 网格部署模式
}

// 英雄单位属性接口（英雄不移动）
export interface UnitStats {
    readonly name: string;         // 单位名称
    attackDamage: number;          // 攻击力
    attackRange: number;           // 攻击范围
    attackSpeed: number;           // 攻击速度(每秒攻击次数)
}

// 敌人专用的单位属性接口（包含生命值，无攻击能力）
export interface EnemyUnitStats {
    readonly name: string;         // 单位名称
    health: number;                // 生命值
    maxHealth: number;             // 最大生命值
    moveSpeed: number;             // 移动速度
}

// 英雄配置接口
export interface HeroConfig extends UnitStats {
    readonly type: HeroType;       // 英雄类型
    cost: number;                  // 部署费用
    category: HeroCategory;        // 英雄分类
    bulletSpeed?: number;          // 子弹速度(射手类英雄)
    skillCooldown?: number;        // 技能冷却时间
    aoeDamage?: number;            // AOE伤害倍率(法师英雄)
    aoeRange?: number;             // AOE攻击范围
    critChance?: number;           // 暴击几率(0-1)
    critMultiplier?: number;       // 暴击倍率
    slowEffect?: number;           // 减速效果(0-1)
    chainTargets?: number;         // 链式攻击目标数
    buffRange?: number;            // 增益光环范围
    attackSpeedBuff?: number;      // 攻击速度增益倍率
    attackRangeBuff?: number;      // 攻击范围增益值
    penetration?: number;          // 穿透攻击目标数
}

// 敌人配置接口
export interface EnemyConfig extends EnemyUnitStats {
    readonly type: EnemyType;      // 敌人类型
    category: EnemyCategory;       // 敌人分类
    goldReward: number;            // 击败奖励金币
    explosionDamage?: number;      // 爆炸伤害
    explosionRange?: number;       // 爆炸范围
    summonCount?: number;          // 召唤数量
    summonType?: EnemyType;        // 召唤单位类型
    stealthChance?: number;        // 潜行躲避几率(0-1)
    armorValue?: number;           // 护甲值(减少伤害)
}

// 位置相关接口
export interface GridPosition {
    row: number;                   // 网格行
    col: number;                   // 网格列
}

export interface WorldPosition {
    x: number;                     // 世界坐标X
    y: number;                     // 世界坐标Y
}

// 游戏事件接口
export interface GameEvents {
    'hero-deployed': { hero: Component; position: GridPosition };
    'enemy-spawned': { enemy: Component; position: WorldPosition };
    'unit-destroyed': { unit: Component; position: WorldPosition };
    'wave-completed': { wave: number };
    'game-state-changed': { newState: GameState; oldState: GameState };
}

// 波次配置接口
export interface WaveConfig {
    waveNumber: number;            // 波次编号
    enemies: Array<{               // 敌人配置列表
        type: EnemyType;
        count: number;
        spawnDelay: number;        // 生成延迟(秒)
    }>;
}

// 网格配置接口
export interface GridConfig {
    rows: number;                  // 行数
    cols: number;                  // 列数
}

// 游戏配置接口
export interface GameConfig {
    initialGold: number;           // 初始金币
    castleHealth: number;          // 城堡生命值
    restDuration: number;          // 波次间休息时长(秒)
    gridConfig: GridConfig;        // 网格配置
    heroConfigs: Record<HeroType, HeroConfig>;     // 英雄配置
    enemyConfigs: Record<EnemyType, EnemyConfig>;  // 敌人配置
    waves: WaveConfig[];           // 波次配置（旧版本兼容，新版本使用关卡配置）
}

// ====================== 关卡系统接口 ======================

// 难度等级枚举
export enum DifficultyLevel {
    EASY = 1,    // ⭐ 新手
    NORMAL = 2,  // ⭐⭐ 入门
    HARD = 3,    // ⭐⭐⭐ 标准
    EXPERT = 4,  // ⭐⭐⭐⭐ 困难
    MASTER = 5   // ⭐⭐⭐⭐⭐ 专家
}

// 世界主题枚举
export enum WorldTheme {
    GARDEN = "garden",         // 新手庭院
    FOREST = "forest",         // 森林前哨
    ICE = "ice",              // 冰原要塞
    VOLCANO = "volcano"       // 火山熔炉
}

// 特殊机制类型枚举
export enum SpecialMechanicType {
    SPEED_BOOST = "speedBoost",           // 敌人速度加成
    HEALTH_BOOST = "healthBoost",         // 敌人血量加成
    GOLD_MULTIPLIER = "goldMultiplier",   // 金币奖励倍率
    FREEZE_HEROES = "freezeHeroes",       // 冰冻英雄
    LIMITED_GRID = "limitedGrid",         // 限制部署网格
    VOLCANO_ERUPTION = "volcanoEruption", // 火山爆发
    BOSS_SUMMON = "bossSummon"           // BOSS召唤
}

// 关卡解锁条件枚举
export enum UnlockConditionType {
    COMPLETE_LEVEL = "completeLevel",     // 完成指定关卡
    COMPLETE_WORLD = "completeWorld",     // 完成指定世界
    ACHIEVEMENT = "achievement",          // 获得指定成就
    HERO_UNLOCK = "heroUnlock"           // 解锁指定英雄
}

// 奖励类型枚举
export enum RewardType {
    GOLD = "gold",                    // 金币奖励
    HERO_UNLOCK = "heroUnlock",       // 英雄解锁
    ACHIEVEMENT = "achievement",      // 成就解锁
    TITLE = "title",                 // 称号奖励
    SKIN = "skin",                   // 皮肤奖励
    BUFF = "buff"                    // 永久增益
}

// 特殊机制配置接口
export interface SpecialMechanic {
    type: SpecialMechanicType;               // 机制类型
    parameters: Record<string, any>;         // 参数配置
    triggerCondition?: string;               // 触发条件
    description: string;                     // 机制描述
}

// 解锁条件接口
export interface UnlockCondition {
    type: UnlockConditionType;               // 条件类型
    targetId: string;                        // 目标ID（关卡、世界、成就、英雄等）
    description: string;                     // 条件描述
}

// 奖励配置接口
export interface RewardConfig {
    type: RewardType;                        // 奖励类型
    value: number | string;                  // 奖励值（金币数量、英雄类型等）
    description: string;                     // 奖励描述
}

// 关卡配置接口
export interface LevelConfig {
    id: string;                              // 关卡唯一ID
    worldId: number;                         // 所属世界ID（1-4）
    levelId: number;                         // 关卡ID（1-5）
    name: string;                           // 关卡名称
    description: string;                     // 关卡描述
    difficulty: DifficultyLevel;             // 难度等级
    initialGold: number;                     // 初始金币
    waves: WaveConfig[];                     // 波次配置
    specialMechanics?: SpecialMechanic[];    // 特殊机制
    rewards: RewardConfig[];                 // 奖励配置
    unlockConditions: UnlockCondition[];     // 解锁条件
    estimatedDuration: number;               // 预期游戏时长（分钟）
    learningObjectives: string[];            // 学习目标
}

// 世界配置接口
export interface WorldConfig {
    id: number;                              // 世界ID
    name: string;                           // 世界名称
    theme: WorldTheme;                       // 世界主题
    description: string;                     // 世界描述
    levels: LevelConfig[];                   // 关卡列表
    unlockConditions: UnlockCondition[];     // 世界解锁条件
    completionRewards: RewardConfig[];       // 世界完成奖励
    backgroundImage?: string;                // 背景图片资源
    backgroundMusic?: string;                // 背景音乐资源
}

// 难度缩放配置接口
export interface DifficultyScaling {
    enemyHealthMultiplier: number;           // 敌人血量倍率
    enemySpeedMultiplier: number;            // 敌人速度倍率
    enemyCountMultiplier: number;            // 敌人数量倍率
    goldRewardMultiplier: number;            // 金币奖励倍率
    playerLevelBonus: number;                // 玩家等级奖励
}

// ====================== 玩家进度系统接口 ======================

// 关卡完成状态枚举
export enum LevelCompletionStatus {
    LOCKED = "locked",                       // 未解锁
    AVAILABLE = "available",                 // 可游玩
    COMPLETED = "completed",                 // 已完成
    PERFECT = "perfect"                      // 完美通关
}

// 关卡完成记录接口
export interface LevelCompletionRecord {
    levelId: string;                         // 关卡ID
    status: LevelCompletionStatus;           // 完成状态
    bestTime?: number;                       // 最佳通关时间（秒）
    highScore?: number;                      // 最高分数
    completionCount: number;                 // 通关次数
    firstCompletionDate?: Date;              // 首次通关日期
    lastPlayedDate?: Date;                   // 最后游玩日期
    starsEarned: number;                     // 获得星级（1-3）
}

// 英雄解锁状态枚举
export enum HeroUnlockStatus {
    LOCKED = "locked",                       // 未解锁
    UNLOCKED = "unlocked",                   // 已解锁
    UPGRADED = "upgraded"                    // 已升级
}

// 英雄解锁记录接口
export interface HeroUnlockRecord {
    heroType: HeroType;                      // 英雄类型
    status: HeroUnlockStatus;                // 解锁状态
    unlockDate?: Date;                       // 解锁日期
    level: number;                           // 英雄等级
    experience: number;                      // 经验值
    totalUsageCount: number;                 // 总使用次数
    totalKillCount: number;                  // 总击杀数
}

// ====================== 成就系统接口 ======================

// 成就类型枚举
export enum AchievementType {
    TUTORIAL = "tutorial",                   // 新手教学
    LEVEL_COMPLETION = "levelCompletion",    // 关卡完成
    COMBAT_MASTERY = "combatMastery",        // 战斗精通
    ECONOMIC_MASTERY = "economicMastery",    // 经济大师
    STRATEGY_EXPERT = "strategyExpert",      // 策略专家
    HIDDEN = "hidden",                       // 隐藏成就
    CREATIVE_PLAY = "creativePlay"          // 创意玩法
}

// 成就状态枚举
export enum AchievementStatus {
    LOCKED = "locked",                       // 未解锁
    IN_PROGRESS = "inProgress",             // 进行中
    COMPLETED = "completed"                  // 已完成
}

// 成就配置接口
export interface AchievementConfig {
    id: string;                              // 成就唯一ID
    name: string;                           // 成就名称
    description: string;                     // 成就描述
    type: AchievementType;                   // 成就类型
    requirements: Record<string, any>;       // 完成条件
    rewards: RewardConfig[];                 // 成就奖励
    points: number;                          // 成就点数
    isHidden: boolean;                       // 是否隐藏成就
    iconResource?: string;                   // 图标资源
}

// 成就进度接口
export interface AchievementProgress {
    achievementId: string;                   // 成就ID
    status: AchievementStatus;               // 完成状态
    currentProgress: Record<string, any>;    // 当前进度
    completionDate?: Date;                   // 完成日期
    notificationShown: boolean;              // 是否已显示通知
}

// ====================== 玩家数据接口 ======================

// 玩家统计数据接口
export interface PlayerStats {
    totalPlayTime: number;                   // 总游戏时间（秒）
    totalGoldEarned: number;                // 总获得金币
    totalEnemiesKilled: number;             // 总击杀敌人数
    totalGamesPlayed: number;               // 总游戏局数
    totalWavesCompleted: number;            // 总完成波次数
    favoriteHero: HeroType;                 // 最喜欢的英雄
    averageGameDuration: number;            // 平均游戏时长
    perfectCompletions: number;             // 完美通关次数
    highestWaveReached: number;             // 最高到达波次
    totalSkillsUsed: number;                // 总技能使用次数
}

// 玩家数据接口
export interface PlayerData {
    playerId: string;                        // 玩家ID
    playerName: string;                      // 玩家姓名
    playerLevel: number;                     // 玩家等级
    totalExperience: number;                 // 总经验值
    currentGold: number;                     // 当前金币
    totalAchievementPoints: number;          // 总成就点数
    
    // 进度记录
    levelRecords: Record<string, LevelCompletionRecord>;  // 关卡记录
    heroRecords: Record<HeroType, HeroUnlockRecord>;      // 英雄记录
    achievementProgress: Record<string, AchievementProgress>; // 成就进度
    
    // 统计数据
    stats: PlayerStats;                      // 统计数据
    
    // 设置和偏好
    settings: Record<string, any>;           // 玩家设置
    lastLoginDate: Date;                     // 最后登录日期
    creationDate: Date;                      // 创建日期
}

// ====================== 挑战模式接口 ======================

// 挑战模式类型枚举
export enum ChallengeMode {
    SPEEDRUN = "speedrun",                   // 竞速模式
    LIMITED = "limited",                     // 限定挑战
    ENDLESS = "endless",                     // 无尽模式
    DAILY = "daily",                        // 每日挑战
    SEASON = "season"                       // 赛季模式
}

// 挑战配置接口
export interface ChallengeConfig {
    id: string;                              // 挑战ID
    name: string;                           // 挑战名称
    description: string;                     // 挑战描述
    mode: ChallengeMode;                     // 挑战模式
    baseLevelId: string;                     // 基础关卡ID
    modifiers: SpecialMechanic[];            // 挑战修改器
    timeLimit?: number;                      // 时间限制（秒）
    rewards: RewardConfig[];                 // 奖励配置
    startDate?: Date;                        // 开始日期
    endDate?: Date;                          // 结束日期
    isActive: boolean;                       // 是否激活
}
