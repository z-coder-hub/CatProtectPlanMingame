// 游戏常量配置文件
import { EnemyCategory, EnemyConfig, EnemyType, GameConfig, HeroCategory, HeroConfig, HeroType, WaveConfig } from './GameTypes';

// 英雄配置 - 完整的猫咪英雄配置
export const HERO_CONFIGS: Record<HeroType, HeroConfig> = {
    // === 远程英雄 ===
    // 注意：远程射击英雄（橘猫、波斯猫、孟加拉猫）拥有超大范围攻击能力，
    // 攻击范围设置为超大值，可以覆盖整个战场区域
    [HeroType.ORANGE_CAT]: {
        type: HeroType.ORANGE_CAT,
        name: "橘猫射手",
        category: HeroCategory.RANGED,
        attackDamage: 15,        // 平衡性调整：从25降低到15（降低40%），防止秒杀低血量敌人
        attackRange: 1000,  // 远程英雄大范围攻击，覆盖整个战场区域
        attackSpeed: 1.2,
        cost: 40,
        bulletSpeed: 300,
        skillCooldown: 5
    },

    [HeroType.PERSIAN_SNIPER]: {
        type: HeroType.PERSIAN_SNIPER,
        name: "波斯猫狙击手",
        category: HeroCategory.RANGED,
        attackDamage: 30,        // 平衡性调整：从50降低到30（降低40%），防止一击秒杀所有基础敌人
        attackRange: 1000,  // 远程英雄大范围攻击，覆盖整个战场区域
        attackSpeed: 0.6,
        cost: 70,
        bulletSpeed: 500,
        skillCooldown: 8,
        critChance: 0.3,
        critMultiplier: 2.5
    },

    [HeroType.BENGAL_HUNTER]: {
        type: HeroType.BENGAL_HUNTER,
        name: "孟加拉猫猎手",
        category: HeroCategory.RANGED,
        attackDamage: 12,        // 平衡性调整：从20降低到12（降低40%），与其他远程英雄同比例
        attackRange: 1000,  // 远程英雄大范围攻击，覆盖整个战场区域
        attackSpeed: 2.0,
        cost: 55,
        bulletSpeed: 350,
        skillCooldown: 6
    },

    // === 法师英雄 ===
    [HeroType.SIAMESE_MAGE]: {
        type: HeroType.SIAMESE_MAGE,
        name: "暹罗猫法师",
        category: HeroCategory.MAGE,
        attackDamage: 28,        // 难度降低：从20提升到28，增强AOE伤害
        attackRange: 200,        // 攻击范围扩大
        attackSpeed: 0.9,        // 攻速提升
        cost: 50,               // 成本降低
        skillCooldown: 6,       // 冷却时间减少
        aoeDamage: 1.8,         // AOE伤害倍数提升
        aoeRange: 90            // AOE范围扩大
    },

    [HeroType.MAINE_THUNDER]: {
        type: HeroType.MAINE_THUNDER,
        name: "缅因猫雷法",
        category: HeroCategory.MAGE,
        attackDamage: 32,        // 难度降低：从25提升到32，增强链式伤害
        attackRange: 220,        // 攻击范围扩大
        attackSpeed: 0.7,        // 攻速提升
        cost: 70,               // 成本大幅降低
        skillCooldown: 8,       // 冷却时间减少
        chainTargets: 4         // 链式目标数增加
    },

    [HeroType.NORWEGIAN_ICE]: {
        type: HeroType.NORWEGIAN_ICE,
        name: "挪威森林猫冰法",
        category: HeroCategory.MAGE,
        attackDamage: 20,        // 平衡性调整：从35降低到20（降低43%），与其他法师同比例
        attackRange: 170,
        attackSpeed: 1.0,
        cost: 75,
        skillCooldown: 7,
        slowEffect: 0.5,
        aoeDamage: 1.2,
        aoeRange: 60
    },

    // === 近战英雄 ===
    [HeroType.BRITISH_KNIGHT]: {
        type: HeroType.BRITISH_KNIGHT,
        name: "英国短毛猫骑士",
        category: HeroCategory.MELEE,
        attackDamage: 30,        // 平衡性调整：从45降低到30（降低33%），近战英雄保持相对高伤害
        attackRange: 60,
        attackSpeed: 0.8,
        cost: 65,               // 从80降低到65，修复性价比问题
        skillCooldown: 12
    },

    [HeroType.RAGDOLL_GUARDIAN]: {
        type: HeroType.RAGDOLL_GUARDIAN,
        name: "布偶猫守护者",
        category: HeroCategory.MELEE,
        attackDamage: 25,        // 平衡性调整：从40降低到25（降低38%），防御型近战适度伤害
        attackRange: 70,
        attackSpeed: 1.0,
        cost: 60,
        skillCooldown: 8
    },

    // === 辅助英雄 ===
    [HeroType.SCOTTISH_ENGINEER]: {
        type: HeroType.SCOTTISH_ENGINEER,
        name: "苏格兰折耳猫工程师",
        category: HeroCategory.SUPPORT,
        attackDamage: 15,        // 平衡性调整：从20降低到15（降低25%），辅助英雄适度减少
        attackRange: 120,
        attackSpeed: 1.0,
        cost: 50,
        skillCooldown: 15,
        buffRange: 120,
        attackSpeedBuff: 1.5
    },

    [HeroType.ABYSSINIAN_SCOUT]: {
        type: HeroType.ABYSSINIAN_SCOUT,
        name: "阿比西尼亚猫侦察兵",
        category: HeroCategory.SUPPORT,
        attackDamage: 12,        // 平衡性调整：从15降低到12（降低20%），侦察兵保持较低攻击力
        attackRange: 140,
        attackSpeed: 1.2,
        cost: 45,
        skillCooldown: 12,
        buffRange: 100,
        attackRangeBuff: 30
    },

    // === 特殊英雄 ===
    [HeroType.RUSSIAN_BLUE]: {
        type: HeroType.RUSSIAN_BLUE,
        name: "俄罗斯蓝猫精英",
        category: HeroCategory.SPECIAL,
        attackDamage: 22,        // 平衡性调整：从35进一步降低到22（降低37%），穿透攻击需要适度伤害
        attackRange: 140,
        attackSpeed: 1.8,
        cost: 85,
        skillCooldown: 12,
        critChance: 0.3,
        critMultiplier: 2.0,
        penetration: 2
    },

    [HeroType.AMERICAN_BOMBER]: {
        type: HeroType.AMERICAN_BOMBER,
        name: "美国短毛猫爆破兵",
        category: HeroCategory.SPECIAL,
        attackDamage: 42,        // 平衡性调整：从70降低到42（降低40%），AOE爆炸伤害适度控制
        attackRange: 120,
        attackSpeed: 0.5,
        cost: 75,               // 成本降低
        skillCooldown: 12,      // 冷却时间减少
        aoeDamage: 2.5,         // AOE伤害倍数提升
        aoeRange: 120           // AOE范围扩大
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
