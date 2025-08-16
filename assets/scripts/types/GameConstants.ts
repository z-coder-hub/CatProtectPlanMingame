import { EnemyConfig, EnemyType, GameConfig, HeroConfig, HeroType, WaveConfig } from './GameTypes';

// 英雄配置 - 根据游戏设计文档的数值
export const HERO_CONFIGS: Record<HeroType, HeroConfig> = {
    [HeroType.ORANGE_CAT]: {
        type: HeroType.ORANGE_CAT,
        name: "橘猫射手",
        health: 120,
        maxHealth: 120,
        attackDamage: 25,
        attackRange: 150,
        attackSpeed: 1.2,
        moveSpeed: 100,
        bulletSpeed: 300,
        skillCooldown: 5
    },

    [HeroType.SIAMESE_CAT]: {
        type: HeroType.SIAMESE_CAT,
        name: "暹罗猫法师",
        health: 80,
        maxHealth: 80,
        attackDamage: 35,
        attackRange: 180,
        attackSpeed: 0.8,
        moveSpeed: 90,
        skillCooldown: 8
    },

    [HeroType.MAINE_CAT]: {
        type: HeroType.MAINE_CAT,
        name: "缅因猫重炮",
        health: 90,
        maxHealth: 90,
        attackDamage: 60,
        attackRange: 200,
        attackSpeed: 0.6,
        moveSpeed: 70,
        skillCooldown: 10
    }
};

// 敌人配置
export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
    [EnemyType.BASIC_MOUSE]: {
        type: EnemyType.BASIC_MOUSE,
        name: "基础老鼠",
        health: 40,
        maxHealth: 40,
        attackDamage: 8,
        attackRange: 50,
        attackSpeed: 1.0,
        moveSpeed: 60,
        goldReward: 3
    }
};

// 波次配置 - 简化版本，后续可扩展
export const WAVE_CONFIGS: WaveConfig[] = [
    {
        waveNumber: 1,
        enemies: [
            { type: EnemyType.BASIC_MOUSE, count: 5, spawnDelay: 0.5 }
        ]
    },
    {
        waveNumber: 2,
        enemies: [
            { type: EnemyType.BASIC_MOUSE, count: 8, spawnDelay: 0.4 }
        ]
    },
    {
        waveNumber: 3,
        enemies: [
            { type: EnemyType.BASIC_MOUSE, count: 12, spawnDelay: 0.3 }
        ]
    }
];

// 游戏配置
export const GAME_CONFIG: GameConfig = {
    initialGold: 100,
    castleHealth: 100,
    gridConfig: {
        rows: 13,
        cols: 7,
        cellSize: 85,
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
    CASTLE_POSITION: { x: 0, y: -400 },               // 城堡位置
    ENEMY_SPAWN_Y: 500                                // 敌人生成Y坐标
} as const;
