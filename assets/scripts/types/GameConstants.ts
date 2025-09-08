// 游戏常量配置文件
import { EnemyCategory, EnemyConfig, EnemyType, GameConfig, HeroCategory, HeroConfig, HeroType, WaveConfig } from './GameTypes';

// 英雄配置 - 完整的猫咪英雄配置
export const HERO_CONFIGS: Record<HeroType, HeroConfig> = {
    // === 远程英雄 ===
    // 注意：远程射击英雄（橘猫、波斯猫、孟加拉猫）拥有全局攻击能力，
    // attackRange仅用于UI显示和平衡性参考，实际攻击无范围限制
    [HeroType.ORANGE_CAT]: {
        type: HeroType.ORANGE_CAT,
        name: "橘猫射手",
        category: HeroCategory.RANGED,
        attackDamage: 25,
        attackRange: 150,  // 全局攻击，此值仅用于显示
        attackSpeed: 1.2,
        cost: 40,
        bulletSpeed: 300,
        skillCooldown: 5
    },

    [HeroType.PERSIAN_SNIPER]: {
        type: HeroType.PERSIAN_SNIPER,
        name: "波斯猫狙击手",
        category: HeroCategory.RANGED,
        attackDamage: 50,
        attackRange: 250,  // 全局攻击，此值仅用于显示
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
        attackDamage: 20,        // 从18提升到20，修复略弱问题
        attackRange: 160,  // 全局攻击，此值仅用于显示
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
        attackDamage: 35,
        attackRange: 180,
        attackSpeed: 0.8,
        cost: 65,
        skillCooldown: 8,
        aoeDamage: 1.5,
        aoeRange: 80
    },

    [HeroType.MAINE_THUNDER]: {
        type: HeroType.MAINE_THUNDER,
        name: "缅因猫雷法",
        category: HeroCategory.MAGE,
        attackDamage: 45,        // 从60降低到45，修复过强问题
        attackRange: 200,
        attackSpeed: 0.6,
        cost: 90,
        skillCooldown: 10,
        chainTargets: 3
    },

    [HeroType.NORWEGIAN_ICE]: {
        type: HeroType.NORWEGIAN_ICE,
        name: "挪威森林猫冰法",
        category: HeroCategory.MAGE,
        attackDamage: 35,        // 从30提升到35，修复过弱问题
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
        attackDamage: 45,
        attackRange: 60,
        attackSpeed: 0.8,
        cost: 65,               // 从80降低到65，修复性价比问题
        skillCooldown: 12
    },

    [HeroType.RAGDOLL_GUARDIAN]: {
        type: HeroType.RAGDOLL_GUARDIAN,
        name: "布偶猫守护者",
        category: HeroCategory.MELEE,
        attackDamage: 40,        // 从35提升到40，修复过弱问题
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
        attackDamage: 20,
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
        attackDamage: 15,
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
        attackDamage: 35,        // 从45降低到35，修复过强问题
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
        attackDamage: 70,
        attackRange: 120,
        attackSpeed: 0.5,
        cost: 95,
        skillCooldown: 15,
        aoeDamage: 2.0,
        aoeRange: 100
    }
};

// 敌人配置 - 完整的老鼠敌人配置（移除攻击能力）
export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
    // === 基础单位 ===
    [EnemyType.BASIC_MOUSE]: {
        type: EnemyType.BASIC_MOUSE,
        name: "基础老鼠",
        category: EnemyCategory.BASIC,
        health: 40,
        maxHealth: 40,
        moveSpeed: 60,
        goldReward: 3
    },

    [EnemyType.GIANT_MOUSE]: {
        type: EnemyType.GIANT_MOUSE,
        name: "巨型老鼠",
        category: EnemyCategory.BASIC,
        health: 120,
        maxHealth: 120,
        moveSpeed: 40,
        goldReward: 8
    },

    // === 快速单位 ===
    [EnemyType.FAST_MOUSE]: {
        type: EnemyType.FAST_MOUSE,
        name: "快速老鼠",
        category: EnemyCategory.FAST,
        health: 25,
        maxHealth: 25,
        moveSpeed: 100,
        goldReward: 5
    },

    [EnemyType.SPEED_MOUSE]: {
        type: EnemyType.SPEED_MOUSE,
        name: "疾速老鼠",
        category: EnemyCategory.FAST,
        health: 15,
        maxHealth: 15,
        moveSpeed: 120,
        goldReward: 8
    },

    // === 装甲单位 ===
    [EnemyType.ARMORED_MOUSE]: {
        type: EnemyType.ARMORED_MOUSE,
        name: "装甲老鼠",
        category: EnemyCategory.ARMORED,
        health: 80,
        maxHealth: 80,
        moveSpeed: 45,
        goldReward: 6
    },

    [EnemyType.TANK_MOUSE]: {
        type: EnemyType.TANK_MOUSE,
        name: "坦克老鼠",
        category: EnemyCategory.ARMORED,
        health: 150,
        maxHealth: 150,
        moveSpeed: 30,
        goldReward: 12,
        armorValue: 5
    },

    // === 特殊单位 ===

    [EnemyType.STEALTH_MOUSE]: {
        type: EnemyType.STEALTH_MOUSE,
        name: "潜行老鼠",
        category: EnemyCategory.SPECIAL,
        health: 30,
        maxHealth: 30,
        moveSpeed: 65,
        goldReward: 10,
        stealthChance: 0.3
    },


    // === BOSS单位 ===
    [EnemyType.MOUSE_KING]: {
        type: EnemyType.MOUSE_KING,
        name: "老鼠王",
        category: EnemyCategory.BOSS,
        health: 300,
        maxHealth: 300,
        moveSpeed: 35,
        goldReward: 30,
        summonCount: 3,
        summonType: EnemyType.BASIC_MOUSE
    },

    [EnemyType.MECH_MOUSE]: {
        type: EnemyType.MECH_MOUSE,
        name: "机械老鼠",
        category: EnemyCategory.BOSS,
        health: 250,
        maxHealth: 250,
        moveSpeed: 50,
        goldReward: 25
    },

    // === 新BOSS单位（关卡4-10专用） ===
    [EnemyType.ARMOR_OVERLORD]: {
        type: EnemyType.ARMOR_OVERLORD,
        name: "重甲统领",
        category: EnemyCategory.BOSS,
        health: 1200,
        maxHealth: 1200,
        moveSpeed: 25,
        goldReward: 100,
        armorValue: 15        // 超高护甲值，减伤80%
    },

    [EnemyType.SHADOW_ASSASSIN]: {
        type: EnemyType.SHADOW_ASSASSIN,
        name: "潜影刺客",
        category: EnemyCategory.BOSS,
        health: 800,
        maxHealth: 800,
        moveSpeed: 55,
        goldReward: 80,
        stealthChance: 1.0,   // 永久潜行
        damageReduction: 0.5  // 免疫50%伤害
    },

    [EnemyType.STORM_TYRANT]: {
        type: EnemyType.STORM_TYRANT,
        name: "疾风暴君",
        category: EnemyCategory.BOSS,
        health: 600,
        maxHealth: 600,
        moveSpeed: 85,        // 极速移动
        goldReward: 90,
        summonCount: 5,
        summonType: EnemyType.SPEED_MOUSE
    },

    [EnemyType.GIANT_BEHEMOTH]: {
        type: EnemyType.GIANT_BEHEMOTH,
        name: "巨兽霸主",
        category: EnemyCategory.BOSS,
        health: 1800,
        maxHealth: 1800,
        moveSpeed: 20,
        goldReward: 120,
        aoeAttackRange: 120   // 践踏范围伤害
    },

    [EnemyType.THUNDER_MASTER]: {
        type: EnemyType.THUNDER_MASTER,
        name: "雷电大师",
        category: EnemyCategory.BOSS,
        health: 1000,
        maxHealth: 1000,
        moveSpeed: 35,
        goldReward: 110,
        chainTargets: 5,      // 雷电链式攻击
        shieldStrength: 200   // 电流场护盾
    },

    [EnemyType.MECH_COMMANDER]: {
        type: EnemyType.MECH_COMMANDER,
        name: "机械军团长",
        category: EnemyCategory.BOSS,
        health: 1200,
        maxHealth: 1200,
        moveSpeed: 40,
        goldReward: 150,
        summonCount: 999,     // 无限召唤
        summonType: EnemyType.MECH_MOUSE,
        healRate: 50         // 自我修复能力
    },

    [EnemyType.ULTIMATE_OVERLORD]: {
        type: EnemyType.ULTIMATE_OVERLORD,
        name: "终极霸王",
        category: EnemyCategory.BOSS,
        health: 2500,
        maxHealth: 2500,
        moveSpeed: 30,
        goldReward: 200,
        armorValue: 10,
        stealthChance: 0.3,
        summonCount: 3,
        summonType: EnemyType.MOUSE_KING,
        chainTargets: 3,
        damageReduction: 0.2  // 融合所有BOSS能力
    }
};


// 游戏配置
export const GAME_CONFIG: GameConfig = {
    initialGold: 250,                    // 关卡1的初始金币
    castleHealth: 120,                   // 城堡血量
    restDuration: 120,                   // 关卡间休息时长120秒，支持手动跳过
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
