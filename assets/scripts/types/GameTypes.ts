import { Component } from 'cc';

// 游戏单位类型枚举
export enum UnitType {
    HERO = "hero",
    ENEMY = "enemy"
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
    FLYING_MOUSE = "FlyingMouse",       // 飞行老鼠
    BOMB_MOUSE = "BombMouse",           // 爆炸老鼠
    STEALTH_MOUSE = "StealthMouse",     // 潜行老鼠

    // BOSS单位
    MOUSE_KING = "MouseKing",           // 老鼠王
    MECH_MOUSE = "MechMouse"            // 机械老鼠
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
    isFlying?: boolean;            // 是否飞行单位
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
    waves: WaveConfig[];           // 波次配置
}
