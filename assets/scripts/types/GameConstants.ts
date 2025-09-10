// 游戏常量配置文件
import { EnemyCategory, EnemyConfig, EnemyType, GameConfig, HeroCategory, HeroConfig, HeroType, WaveConfig } from './GameTypes';

// 英雄配置 - 按照新设计文档完全重构的12种英雄配置
export const HERO_CONFIGS: Record<HeroType, HeroConfig> = {
    // === 射击英雄 - 物理射击子类 (4种，67%中的一半) ===
    [HeroType.ORANGE_CAT]: {
        type: HeroType.ORANGE_CAT,
        name: "橘猫射手",
        category: HeroCategory.RANGED_PHYSICAL,
        attackDamage: 15,        // 基础物理射手，均衡型
        attackRange: 1000,       // 超大攻击范围，覆盖整个战场
        attackSpeed: 1.2,
        cost: 40,
        bulletSpeed: 300,
    },

    [HeroType.PERSIAN_SNIPER]: {
        type: HeroType.PERSIAN_SNIPER,
        name: "波斯猫狙击手",
        category: HeroCategory.RANGED_PHYSICAL,
        attackDamage: 30,        // 高伤害精确狙击手
        attackRange: 1000,       // 超大攻击范围，覆盖整个战场
        attackSpeed: 0.6,
        cost: 70,
        bulletSpeed: 500,
        critChance: 0.3,
        critMultiplier: 2.5
    },

    [HeroType.BENGAL_HUNTER]: {
        type: HeroType.BENGAL_HUNTER,
        name: "孟加拉猫猎手",
        category: HeroCategory.RANGED_PHYSICAL,
        attackDamage: 12,        // 高攻速连射专家
        attackRange: 1000,       // 超大攻击范围，覆盖整个战场
        attackSpeed: 2.0,
        cost: 55,
        bulletSpeed: 350,
    },

    [HeroType.SCOTTISH_MARKSMAN]: {
        type: HeroType.SCOTTISH_MARKSMAN,
        name: "苏格兰折耳猫射手",
        category: HeroCategory.RANGED_PHYSICAL,
        attackDamage: 20,        // 多重锁定射手，精确制导
        attackRange: 1000,       // 超大攻击范围，覆盖整个战场
        attackSpeed: 1.0,
        cost: 65,
        bulletSpeed: 400,
        multiTargets: 3          // 同时锁定3个目标
    },

    // === 射击英雄 - 魔法射击子类 (4种，67%中的另一半) ===
    [HeroType.SIAMESE_MAGE]: {
        type: HeroType.SIAMESE_MAGE,
        name: "暹罗猫法师",
        category: HeroCategory.RANGED_MAGIC,
        attackDamage: 28,        // AOE爆炸法师
        attackRange: 350,
        attackSpeed: 0.9,
        cost: 50,
        skillCooldown: 6,
        aoeDamage: 1.8,         // AOE伤害倍数
        aoeRange: 90            // 爆炸范围
    },

    [HeroType.MAINE_THUNDER]: {
        type: HeroType.MAINE_THUNDER,
        name: "缅因猫雷法师",
        category: HeroCategory.RANGED_MAGIC,
        attackDamage: 32,        // 链式攻击法师
        attackRange: 400,
        attackSpeed: 0.7,
        cost: 70,
        chainTargets: 4         // 链式跳跃4个目标
    },

    [HeroType.NORWEGIAN_ICE]: {
        type: HeroType.NORWEGIAN_ICE,
        name: "挪威森林猫冰法师",
        category: HeroCategory.RANGED_MAGIC,
        attackDamage: 20,        // 控制型法师
        attackRange: 320,
        attackSpeed: 1.0,
        cost: 75,
        slowEffect: 0.5,        // 50%减速效果
        aoeDamage: 1.2,         // AOE伤害倍数
        aoeRange: 60            // 冻结范围
    },

    [HeroType.ABYSSINIAN_ARCHER]: {
        type: HeroType.ABYSSINIAN_ARCHER,
        name: "阿比西尼亚猫弓箭手",
        category: HeroCategory.RANGED_MAGIC,
        attackDamage: 15,        // 远程多发齐射专家
        attackRange: 360,
        attackSpeed: 1.2,
        cost: 60,
        bulletSpeed: 300,
        multiShot: 5            // 扇形射出5支箭
    },

    // === 近战英雄 (3种，27%) ===
    [HeroType.BRITISH_KNIGHT]: {
        type: HeroType.BRITISH_KNIGHT,
        name: "英国短毛猫骑士",
        category: HeroCategory.MELEE,
        attackDamage: 30,        // 前排控制专家
        attackRange: 60,
        attackSpeed: 0.8,
        cost: 65,
    },

    [HeroType.RUSSIAN_BLUE]: {
        type: HeroType.RUSSIAN_BLUE,
        name: "俄罗斯蓝猫刺客",
        category: HeroCategory.MELEE,
        attackDamage: 45,        // 隐身突袭者，高爆发输出
        attackRange: 90,
        attackSpeed: 1.8,
        cost: 85,
        critChance: 0.3,
        critMultiplier: 2.0,
        penetration: 2          // 穿透2个目标
    },

    [HeroType.AMERICAN_BOMBER]: {
        type: HeroType.AMERICAN_BOMBER,
        name: "美国短毛猫爆破手",
        category: HeroCategory.MELEE,
        attackDamage: 42,        // 近程爆炸专家
        attackRange: 120,
        attackSpeed: 0.5,
        cost: 75,
        aoeDamage: 2.5,         // AOE伤害倍数
        aoeRange: 120           // 爆炸范围
    }
};

// 敌人配置 - 完整的老鼠敌人配置（移除攻击能力）
export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
    // === 基础单位 ===
    [EnemyType.BASIC_MOUSE]: {
        type: EnemyType.BASIC_MOUSE,
        name: "基础老鼠",
        category: EnemyCategory.BASIC,
        health: 25,           // 难度降低：从70降到25，2-3击就能消灭
        maxHealth: 25,
        moveSpeed: 50,        // 速度略微降低，给玩家更多反应时间
        goldReward: 3
    },

    [EnemyType.GIANT_MOUSE]: {
        type: EnemyType.GIANT_MOUSE,
        name: "巨型老鼠",
        category: EnemyCategory.BASIC,
        health: 80,           // 难度降低：从200降到80，更容易击杀
        maxHealth: 80,
        moveSpeed: 35,        // 移动速度降低
        goldReward: 8
    },

    // === 快速单位 ===
    [EnemyType.FAST_MOUSE]: {
        type: EnemyType.FAST_MOUSE,
        name: "快速老鼠",
        category: EnemyCategory.FAST,
        health: 20,           // 难度降低：从45降到20，容易击杀但速度快
        maxHealth: 20,
        moveSpeed: 80,        // 速度降低，给玩家更多瞄准时间
        goldReward: 5
    },

    [EnemyType.SPEED_MOUSE]: {
        type: EnemyType.SPEED_MOUSE,
        name: "疾速老鼠",
        category: EnemyCategory.FAST,
        health: 15,           // 难度降低：从35降到15，保持脆皮特性
        maxHealth: 15,
        moveSpeed: 90,        // 速度大幅降低，更容易追踪
        goldReward: 8
    },

    // === 装甲单位 ===
    [EnemyType.ARMORED_MOUSE]: {
        type: EnemyType.ARMORED_MOUSE,
        name: "装甲老鼠",
        category: EnemyCategory.ARMORED,
        health: 60,           // 难度降低：从130降到60，降低坦克属性
        maxHealth: 60,
        moveSpeed: 40,        // 略微降低速度
        goldReward: 6
    },

    [EnemyType.TANK_MOUSE]: {
        type: EnemyType.TANK_MOUSE,
        name: "坦克老鼠",
        category: EnemyCategory.ARMORED,
        health: 120,          // 难度降低：从250降到120，更容易击杀
        maxHealth: 120,
        moveSpeed: 25,        // 速度进一步降低
        goldReward: 12,
        armorValue: 3         // 护甲值降低，减少伤害减免
    },

    // === 特殊单位 ===

    [EnemyType.STEALTH_MOUSE]: {
        type: EnemyType.STEALTH_MOUSE,
        name: "潜行老鼠",
        category: EnemyCategory.SPECIAL,
        health: 30,           // 难度降低：从55降到30，降低血量
        maxHealth: 30,
        moveSpeed: 55,        // 速度降低
        goldReward: 10,
        stealthChance: 0.2    // 潜行几率降低
    },


    // === BOSS单位 ===
    [EnemyType.MOUSE_KING]: {
        type: EnemyType.MOUSE_KING,
        name: "老鼠王",
        category: EnemyCategory.BOSS,
        health: 200,          // 难度降低：从450降到200，更合理的BOSS血量
        maxHealth: 200,
        moveSpeed: 30,        // 速度降低
        goldReward: 30,
        summonCount: 2,       // 召唤数量减少
        summonType: EnemyType.BASIC_MOUSE
    },

    [EnemyType.MECH_MOUSE]: {
        type: EnemyType.MECH_MOUSE,
        name: "机械老鼠",
        category: EnemyCategory.BOSS,
        health: 180,          // 难度降低：从400降到180
        maxHealth: 180,
        moveSpeed: 40,        // 速度降低
        goldReward: 25
    },

    // === 新BOSS单位（关卡4-10专用） ===
    [EnemyType.ARMOR_OVERLORD]: {
        type: EnemyType.ARMOR_OVERLORD,
        name: "重甲统领",
        category: EnemyCategory.BOSS,
        health: 400,         // 难度降低：从1800降到400，更合理的重甲BOSS血量
        maxHealth: 400,
        moveSpeed: 20,       // 速度降低
        goldReward: 100,
        armorValue: 8        // 护甲值降低，减少过度减伤
    },

    [EnemyType.SHADOW_ASSASSIN]: {
        type: EnemyType.SHADOW_ASSASSIN,
        name: "潜影刺客",
        category: EnemyCategory.BOSS,
        health: 300,         // 难度降低：从1200降到300
        maxHealth: 300,
        moveSpeed: 45,       // 速度降低，更容易追踪
        goldReward: 80,
        stealthChance: 0.6,  // 潜行几率降低，不再永久潜行
        damageReduction: 0.3 // 减伤降低到30%
    },

    [EnemyType.STORM_TYRANT]: {
        type: EnemyType.STORM_TYRANT,
        name: "疾风暴君",
        category: EnemyCategory.BOSS,
        health: 250,         // 难度降低：从900降到250
        maxHealth: 250,
        moveSpeed: 60,       // 速度降低，更容易应对
        goldReward: 90,
        summonCount: 3,      // 召唤数量减少
        summonType: EnemyType.SPEED_MOUSE
    },

    [EnemyType.GIANT_BEHEMOTH]: {
        type: EnemyType.GIANT_BEHEMOTH,
        name: "巨兽霸主",
        category: EnemyCategory.BOSS,
        health: 500,         // 难度降低：从2700降到500
        maxHealth: 500,
        moveSpeed: 15,       // 速度进一步降低
        goldReward: 120,
        aoeAttackRange: 80   // 践踏范围减少
    },

    [EnemyType.THUNDER_MASTER]: {
        type: EnemyType.THUNDER_MASTER,
        name: "雷电大师",
        category: EnemyCategory.BOSS,
        health: 350,         // 难度降低：从1500降到350
        maxHealth: 350,
        moveSpeed: 30,       // 速度降低
        goldReward: 110,
        chainTargets: 3,     // 链式攻击目标减少
        shieldStrength: 100  // 护盾强度减半
    },

    [EnemyType.MECH_COMMANDER]: {
        type: EnemyType.MECH_COMMANDER,
        name: "机械军团长",
        category: EnemyCategory.BOSS,
        health: 400,         // 难度降低：从1800降到400
        maxHealth: 400,
        moveSpeed: 35,       // 速度降低
        goldReward: 150,
        summonCount: 6,      // 限制召唤数量，不再无限召唤
        summonType: EnemyType.MECH_MOUSE,
        healRate: 20         // 自我修复速度降低
    },

    [EnemyType.ULTIMATE_OVERLORD]: {
        type: EnemyType.ULTIMATE_OVERLORD,
        name: "终极霸王",
        category: EnemyCategory.BOSS,
        health: 800,         // 难度降低：从3750降到800，更合理的最终BOSS血量
        maxHealth: 800,
        moveSpeed: 25,       // 速度降低
        goldReward: 200,
        armorValue: 5,       // 护甲值降低
        stealthChance: 0.15, // 潜行几率大幅降低
        summonCount: 2,      // 召唤数量减少
        summonType: EnemyType.MOUSE_KING,
        chainTargets: 2,     // 链式攻击目标减少
        damageReduction: 0.1 // 减伤降低
    }
};


// 游戏配置
export const GAME_CONFIG: GameConfig = {
    initialGold: 400,                    // 难度降低：从250增加到400，提供更多初始金币
    castleHealth: 200,                   // 难度降低：从120增加到200，增强城堡防御
    restDuration: 90,                    // 难度降低：从120减到90秒，减少等待时间
    gridConfig: {
        rows: 11,
        cols: 6
    },
    heroConfigs: HERO_CONFIGS,
    enemyConfigs: ENEMY_CONFIGS,
    totalLevels: 10                      // 总关卡数
};

// UI常量
export const UI_CONSTANTS = {
    BUTTON_SIZE: { width: 100, height: 50 },
    PANEL_COLORS: {
        BACKGROUND: '#333333',
        HERO_PANEL: '#2E7D32',
        BUTTON_NORMAL: '#1976D2',
        BUTTON_PRESSED: '#0D47A1'
    }
} as const;
