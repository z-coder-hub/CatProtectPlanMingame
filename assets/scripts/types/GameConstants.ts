import { EnemyCategory, EnemyConfig, EnemyType, GameConfig, HeroCategory, HeroConfig, HeroType, WaveConfig } from './GameTypes';

// 英雄配置 - 完整的猫咪英雄配置
export const HERO_CONFIGS: Record<HeroType, HeroConfig> = {
    // === 远程英雄 ===
    [HeroType.ORANGE_CAT]: {
        type: HeroType.ORANGE_CAT,
        name: "橘猫射手",
        category: HeroCategory.RANGED,
        health: 120,
        maxHealth: 120,
        attackDamage: 25,
        attackRange: 150,
        attackSpeed: 1.2,
        moveSpeed: 100,
        cost: 40,
        bulletSpeed: 300,
        skillCooldown: 5
    },

    [HeroType.PERSIAN_SNIPER]: {
        type: HeroType.PERSIAN_SNIPER,
        name: "波斯猫狙击手",
        category: HeroCategory.RANGED,
        health: 100,
        maxHealth: 100,
        attackDamage: 50,
        attackRange: 250,
        attackSpeed: 0.6,
        moveSpeed: 80,
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
        health: 110,
        maxHealth: 110,
        attackDamage: 18,
        attackRange: 160,
        attackSpeed: 2.0,
        moveSpeed: 120,
        cost: 55,
        bulletSpeed: 350,
        skillCooldown: 6
    },

    // === 法师英雄 ===
    [HeroType.SIAMESE_MAGE]: {
        type: HeroType.SIAMESE_MAGE,
        name: "暹罗猫法师",
        category: HeroCategory.MAGE,
        health: 80,
        maxHealth: 80,
        attackDamage: 35,
        attackRange: 180,
        attackSpeed: 0.8,
        moveSpeed: 90,
        cost: 65,
        skillCooldown: 8,
        aoeDamage: 1.5,
        aoeRange: 80
    },

    [HeroType.MAINE_THUNDER]: {
        type: HeroType.MAINE_THUNDER,
        name: "缅因猫雷法",
        category: HeroCategory.MAGE,
        health: 90,
        maxHealth: 90,
        attackDamage: 60,
        attackRange: 200,
        attackSpeed: 0.6,
        moveSpeed: 70,
        cost: 90,
        skillCooldown: 10,
        chainTargets: 3
    },

    [HeroType.NORWEGIAN_ICE]: {
        type: HeroType.NORWEGIAN_ICE,
        name: "挪威森林猫冰法",
        category: HeroCategory.MAGE,
        health: 85,
        maxHealth: 85,
        attackDamage: 30,
        attackRange: 170,
        attackSpeed: 1.0,
        moveSpeed: 85,
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
        health: 250,
        maxHealth: 250,
        attackDamage: 45,
        attackRange: 60,
        attackSpeed: 0.8,
        moveSpeed: 60,
        cost: 80,
        skillCooldown: 12
    },

    [HeroType.RAGDOLL_GUARDIAN]: {
        type: HeroType.RAGDOLL_GUARDIAN,
        name: "布偶猫守护者",
        category: HeroCategory.MELEE,
        health: 180,
        maxHealth: 180,
        attackDamage: 35,
        attackRange: 70,
        attackSpeed: 1.0,
        moveSpeed: 80,
        cost: 60,
        skillCooldown: 8
    },

    // === 辅助英雄 ===
    [HeroType.SCOTTISH_ENGINEER]: {
        type: HeroType.SCOTTISH_ENGINEER,
        name: "苏格兰折耳猫工程师",
        category: HeroCategory.SUPPORT,
        health: 100,
        maxHealth: 100,
        attackDamage: 20,
        attackRange: 120,
        attackSpeed: 1.0,
        moveSpeed: 90,
        cost: 50,
        skillCooldown: 15,
        buffRange: 120,
        attackSpeedBuff: 1.5
    },

    [HeroType.ABYSSINIAN_SCOUT]: {
        type: HeroType.ABYSSINIAN_SCOUT,
        name: "阿比西尼亚猫侦察兵",
        category: HeroCategory.SUPPORT,
        health: 90,
        maxHealth: 90,
        attackDamage: 15,
        attackRange: 140,
        attackSpeed: 1.2,
        moveSpeed: 110,
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
        health: 100,
        maxHealth: 100,
        attackDamage: 45,
        attackRange: 140,
        attackSpeed: 1.8,
        moveSpeed: 100,
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
        health: 110,
        maxHealth: 110,
        attackDamage: 70,
        attackRange: 120,
        attackSpeed: 0.5,
        moveSpeed: 70,
        cost: 95,
        skillCooldown: 15,
        aoeDamage: 2.0,
        aoeRange: 100
    }
};

// 敌人配置 - 完整的老鼠敌人配置
export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
    // === 基础单位 ===
    [EnemyType.BASIC_MOUSE]: {
        type: EnemyType.BASIC_MOUSE,
        name: "基础老鼠",
        category: EnemyCategory.BASIC,
        health: 40,
        maxHealth: 40,
        attackDamage: 8,
        attackRange: 50,
        attackSpeed: 1.0,
        moveSpeed: 60,
        goldReward: 3
    },

    [EnemyType.GIANT_MOUSE]: {
        type: EnemyType.GIANT_MOUSE,
        name: "巨型老鼠",
        category: EnemyCategory.BASIC,
        health: 120,
        maxHealth: 120,
        attackDamage: 20,
        attackRange: 60,
        attackSpeed: 0.6,
        moveSpeed: 30,
        goldReward: 8
    },

    // === 快速单位 ===
    [EnemyType.FAST_MOUSE]: {
        type: EnemyType.FAST_MOUSE,
        name: "快速老鼠",
        category: EnemyCategory.FAST,
        health: 25,
        maxHealth: 25,
        attackDamage: 6,
        attackRange: 45,
        attackSpeed: 1.3,
        moveSpeed: 120,
        goldReward: 4
    },

    [EnemyType.SPEED_MOUSE]: {
        type: EnemyType.SPEED_MOUSE,
        name: "疾速老鼠",
        category: EnemyCategory.FAST,
        health: 15,
        maxHealth: 15,
        attackDamage: 4,
        attackRange: 40,
        attackSpeed: 1.5,
        moveSpeed: 180,
        goldReward: 5
    },

    // === 装甲单位 ===
    [EnemyType.ARMORED_MOUSE]: {
        type: EnemyType.ARMORED_MOUSE,
        name: "装甲老鼠",
        category: EnemyCategory.ARMORED,
        health: 80,
        maxHealth: 80,
        attackDamage: 12,
        attackRange: 55,
        attackSpeed: 0.8,
        moveSpeed: 40,
        goldReward: 6
    },

    [EnemyType.TANK_MOUSE]: {
        type: EnemyType.TANK_MOUSE,
        name: "坦克老鼠",
        category: EnemyCategory.ARMORED,
        health: 150,
        maxHealth: 150,
        attackDamage: 15,
        attackRange: 55,
        attackSpeed: 0.7,
        moveSpeed: 25,
        goldReward: 10,
        armorValue: 5
    },

    // === 特殊单位 ===
    [EnemyType.FLYING_MOUSE]: {
        type: EnemyType.FLYING_MOUSE,
        name: "飞行老鼠",
        category: EnemyCategory.SPECIAL,
        health: 30,
        maxHealth: 30,
        attackDamage: 8,
        attackRange: 45,
        attackSpeed: 1.2,
        moveSpeed: 80,
        goldReward: 5,
        isFlying: true
    },

    [EnemyType.BOMB_MOUSE]: {
        type: EnemyType.BOMB_MOUSE,
        name: "爆炸老鼠",
        category: EnemyCategory.SPECIAL,
        health: 20,
        maxHealth: 20,
        attackDamage: 5,
        attackRange: 40,
        attackSpeed: 1.0,
        moveSpeed: 70,
        goldReward: 5,
        explosionDamage: 40,
        explosionRange: 80
    },

    [EnemyType.STEALTH_MOUSE]: {
        type: EnemyType.STEALTH_MOUSE,
        name: "潜行老鼠",
        category: EnemyCategory.SPECIAL,
        health: 30,
        maxHealth: 30,
        attackDamage: 10,
        attackRange: 45,
        attackSpeed: 1.2,
        moveSpeed: 80,
        goldReward: 7,
        stealthChance: 0.3
    },

    // === BOSS单位 ===
    [EnemyType.MOUSE_KING]: {
        type: EnemyType.MOUSE_KING,
        name: "老鼠王",
        category: EnemyCategory.BOSS,
        health: 300,
        maxHealth: 300,
        attackDamage: 25,
        attackRange: 70,
        attackSpeed: 0.7,
        moveSpeed: 40,
        goldReward: 25,
        summonCount: 3,
        summonType: EnemyType.BASIC_MOUSE
    },

    [EnemyType.MECH_MOUSE]: {
        type: EnemyType.MECH_MOUSE,
        name: "机械老鼠",
        category: EnemyCategory.BOSS,
        health: 250,
        maxHealth: 250,
        attackDamage: 30,
        attackRange: 150,
        attackSpeed: 0.8,
        moveSpeed: 35,
        goldReward: 30
    }
};

// 波次配置 - 扩展版本，包含新敌人类型
export const WAVE_CONFIGS: WaveConfig[] = [
    {
        waveNumber: 1,
        enemies: [
            { type: EnemyType.BASIC_MOUSE, count: 5, spawnDelay: 0.8 }
        ]
    },
    {
        waveNumber: 2,
        enemies: [
            { type: EnemyType.BASIC_MOUSE, count: 6, spawnDelay: 0.6 },
            { type: EnemyType.FAST_MOUSE, count: 2, spawnDelay: 0.4 }
        ]
    },
    {
        waveNumber: 3,
        enemies: [
            { type: EnemyType.BASIC_MOUSE, count: 8, spawnDelay: 0.5 },
            { type: EnemyType.FAST_MOUSE, count: 3, spawnDelay: 0.3 },
            { type: EnemyType.ARMORED_MOUSE, count: 1, spawnDelay: 1.0 }
        ]
    },
    {
        waveNumber: 4,
        enemies: [
            { type: EnemyType.BASIC_MOUSE, count: 10, spawnDelay: 0.4 },
            { type: EnemyType.FAST_MOUSE, count: 5, spawnDelay: 0.3 },
            { type: EnemyType.ARMORED_MOUSE, count: 2, spawnDelay: 0.8 }
        ]
    },
    {
        waveNumber: 5,
        enemies: [
            { type: EnemyType.BASIC_MOUSE, count: 12, spawnDelay: 0.3 },
            { type: EnemyType.FAST_MOUSE, count: 8, spawnDelay: 0.2 },
            { type: EnemyType.ARMORED_MOUSE, count: 4, spawnDelay: 0.6 }
        ]
    }
];

// 游戏配置
export const GAME_CONFIG: GameConfig = {
    initialGold: 150,                    // 增加初始金币，方便早期部署
    castleHealth: 120,                   // 增加城堡血量，提供更多容错
    gridConfig: {
        rows: 11,
        cols: 6,
        cellSize: 100,
        startPosition: { x: 0, y: -200 }
    },
    heroConfigs: HERO_CONFIGS,
    enemyConfigs: ENEMY_CONFIGS,
    waves: WAVE_CONFIGS
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

// 游戏常量
export const GAME_CONSTANTS = {
    CANVAS_DESIGN_SIZE: { width: 720, height: 1280 },  // 竖屏设计分辨率
    GRID_OFFSET_Y: 0,                               // 网格Y轴偏移
    HERO_PANEL_HEIGHT: 120,                           // 英雄面板高度
    CASTLE_POSITION: { x: 0, y: -580 },               // 城堡位置
    ENEMY_SPAWN_Y: 500                                // 敌人生成Y坐标
} as const;
