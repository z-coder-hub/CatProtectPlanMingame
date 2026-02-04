// 游戏常量配置文件
import { GameConfig, HeroCategory, HeroConfig, HeroType } from './GameTypes';

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
        name: "波斯狙击手",
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
        name: "孟加拉猎手",
        category: HeroCategory.RANGED_PHYSICAL,
        attackDamage: 12,        // 高攻速连射专家
        attackRange: 1000,       // 超大攻击范围，覆盖整个战场
        attackSpeed: 2.0,
        cost: 55,
        bulletSpeed: 350,
    },

    [HeroType.SCOTTISH_MARKSMAN]: {
        type: HeroType.SCOTTISH_MARKSMAN,
        name: "折耳射手",
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
        name: "缅因雷法师",
        category: HeroCategory.RANGED_MAGIC,
        attackDamage: 32,        // 链式攻击法师
        attackRange: 400,
        attackSpeed: 0.7,
        cost: 70,
        chainTargets: 4         // 链式跳跃4个目标
    },

    [HeroType.NORWEGIAN_ICE]: {
        type: HeroType.NORWEGIAN_ICE,
        name: "冰霜法师",
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
        name: "精灵弓手",
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
        name: "短毛骑士",
        category: HeroCategory.MELEE,
        attackDamage: 30,        // 前排控制专家
        attackRange: 60,
        attackSpeed: 0.8,
        cost: 65,
    },

    [HeroType.RUSSIAN_BLUE]: {
        type: HeroType.RUSSIAN_BLUE,
        name: "蓝猫刺客",
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
        name: "爆破专家",
        category: HeroCategory.MELEE,
        attackDamage: 42,        // 近程爆炸专家
        attackRange: 120,
        attackSpeed: 0.5,
        cost: 75,
        aoeDamage: 2.5,         // AOE伤害倍数
        aoeRange: 120           // 爆炸范围
    }
};



// 游戏配置
export const GAME_CONFIG: GameConfig = {
    initialGold: 400,                    // 难度降低：从250增加到400，提供更多初始金币
    castleHealth: 100,                   // 标准城堡生命值
    restDuration: 90,                    // 难度降低：从120减到90秒，减少等待时间
    gridConfig: {
        rows: 11,
        cols: 6
    },
    heroConfigs: HERO_CONFIGS,
    totalLevels: 10                      // 总关卡数
};

// 注意：EnemyType 枚举已在 GameTypes.ts 中定义，这里不再重复定义

// 投射物类型枚举
export enum ProjectileType {
    PHYSICAL_BULLET = "PhysicalBullet",
    MAGIC_MISSILE = "MagicMissile",
    SWORD_WAVE = "SwordWave",
    LIGHTNING_BOLT = "LightningBolt",
    ICE_SHARD = "IceShard",
    EXPLOSION_WAVE = "ExplosionWave"
}

// 投射物系统配置
export const PROJECTILE_CONFIG = {
    maxRange: 2000,                  // 投射物最大飞行距离
    boundaryBuffer: 100,             // 游戏边界缓冲区（像素）
    useGridBounds: true,             // 是否基于网格边界计算
    fallbackBounds: {                // 降级方案的固定边界
        minX: -600,
        maxX: 600,
        minY: -400,
        maxY: 400
    },
    uiMargins: {                     // UI元素占用空间
        top: 80,                     // 顶部状态栏高度
        bottom: 100,                 // 底部控制面板高度
        left: 50,                    // 左侧留白
        right: 50                    // 右侧留白
    }
} as const;

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
