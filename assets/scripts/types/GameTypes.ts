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

// 英雄分类枚举 - 按照新设计文档统一分类
export enum HeroCategory {
    RANGED_PHYSICAL = "ranged_physical",  // 射击英雄-物理射击子类
    RANGED_MAGIC = "ranged_magic",        // 射击英雄-魔法射击子类  
    MELEE = "melee"                       // 近战英雄
}

// 英雄类型枚举 - 按照新设计文档重新分类
export enum HeroType {
    // 射击英雄 - 物理射击子类 (4种)
    ORANGE_CAT = "OrangeCat",              // 橘猫射手
    PERSIAN_SNIPER = "PersianSniper",      // 波斯猫狙击手
    BENGAL_HUNTER = "BengalHunter",        // 孟加拉猎手
    SCOTTISH_MARKSMAN = "ScottishMarksman", // 苏格兰折耳猫射手

    // 射击英雄 - 魔法射击子类 (4种)
    SIAMESE_MAGE = "SiameseMage",          // 暹罗猫法师
    MAINE_THUNDER = "MaineThunder",        // 缅因猫雷法师
    NORWEGIAN_ICE = "NorwegianIce",        // 挪威森林猫冰法师
    ABYSSINIAN_ARCHER = "AbyssinianArcher", // 阿比西尼亚猫弓箭手

    // 近战英雄 (3种)
    BRITISH_KNIGHT = "BritishKnight",      // 英国短毛猫骑士
    RUSSIAN_BLUE = "RussianBlue",          // 俄罗斯蓝猫刺客
    AMERICAN_BOMBER = "AmericanBomber"     // 美国短毛猫爆破手
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
    
    // 新BOSS单位（关卡4-10专用）
    ARMOR_OVERLORD = "ArmorOverlord",       // 重甲统领
    SHADOW_ASSASSIN = "ShadowAssassin",     // 潜影刺客
    STORM_TYRANT = "StormTyrant",           // 疾风暴君
    GIANT_BEHEMOTH = "GiantBehemoth",       // 巨兽霸主
    THUNDER_MASTER = "ThunderMaster",       // 雷电大师
    MECH_COMMANDER = "MechCommander",       // 机械军团长
    ULTIMATE_OVERLORD = "UltimateOverlord"  // 终极霸王
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
    aoeDamage?: number;            // AOE伤害倍率(法师英雄)
    aoeRange?: number;             // AOE攻击范围
    critChance?: number;           // 暴击几率(0-1)
    critMultiplier?: number;       // 暴击倍率
    slowEffect?: number;           // 减速效果(0-1)
    chainTargets?: number;         // 链式攻击目标数
    penetration?: number;          // 穿透攻击目标数
    
    // 新射击英雄专用属性
    multiTargets?: number;         // 多重锁定目标数(苏格兰射手)
    multiShot?: number;            // 多发齐射数量(阿比西尼亚弓箭手)

    // 技能系统属性
    skillCooldown?: number;        // 技能冷却时间(秒)
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
    
    // 新BOSS专用属性
    chainTargets?: number;         // 链式攻击目标数(雷电大师)
    shieldStrength?: number;       // 护盾强度(雷电大师)
    healRate?: number;             // 自我修复速度/秒(机械军团长)
    damageReduction?: number;      // 伤害减免比例(0-1，潜影刺客等)
    aoeAttackRange?: number;       // 范围攻击半径(巨兽霸主践踏)
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
    'enemy-spawned': { enemy: any; position: WorldPosition };
    'unit-destroyed': { unit: any; position: WorldPosition };
    'wave-completed': { wave: number };
    'game-state-changed': { newState: GameState; oldState: GameState };
    'hero-unlocked': { heroType: HeroType };
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
    totalLevels: number;          // 总关卡数
}

// ====================== 关卡系统接口 ======================

// 奖励类型枚举 (仅保留实际使用的)
export enum RewardType {
    GOLD = "gold",                    // 金币奖励
    HERO_UNLOCK = "heroUnlock"        // 英雄解锁
}

// 奖励配置接口
export interface RewardConfig {
    type: RewardType;                 // 奖励类型
    value: number | string;           // 奖励值（金币数量、英雄类型等）
    description: string;              // 奖励描述
}

// 关卡配置接口 (简化版，仅保留实际使用的字段)
export interface LevelConfig {
    id: string;                       // 关卡唯一ID
    name: string;                     // 关卡名称
    description: string;              // 关卡描述
    initialGold: number;              // 初始金币
    waves: WaveConfig[];              // 波次配置
    rewards: RewardConfig[];          // 奖励配置
    learningObjectives: string[];     // 学习目标
}

// ====================== 扩展系统接口 ======================
