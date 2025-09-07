import {
    LevelConfig, WorldConfig, WaveConfig, SpecialMechanic, RewardConfig, UnlockCondition,
    DifficultyLevel, WorldTheme, SpecialMechanicType, RewardType, UnlockConditionType,
    EnemyType, HeroType
} from './GameTypes';

// ====================== 关卡数据配置 ======================
// 3关极速设计 - 更激进的英雄解锁策略，让玩家快速体验全部12种英雄

// 极速关卡配置 (总共3关，快速解锁全部英雄)
const ULTRA_FAST_LEVELS: LevelConfig[] = [
    // 关卡1: 初入战场 - 解锁5个英雄（按面板从左到右顺序）
    {
        id: "1",
        worldId: 1,
        levelId: 1,
        name: "初入战场",
        description: "快速入门！立即解锁5个核心英雄体验多样化战术",
        difficulty: DifficultyLevel.EASY,
        initialGold: 200,
        waves: [
            {
                waveNumber: 1,
                enemies: [
                    { type: EnemyType.BASIC_MOUSE, count: 5, spawnDelay: 1.5 }
                ]
            },
            {
                waveNumber: 2,
                enemies: [
                    { type: EnemyType.BASIC_MOUSE, count: 8, spawnDelay: 1.0 },
                    { type: EnemyType.FAST_MOUSE, count: 3, spawnDelay: 2.0 }
                ]
            }
        ],
        rewards: [
            { type: RewardType.GOLD, value: 180, description: "关卡完成奖励" },
            // 按面板从左到右顺序解锁前5个英雄（橘猫默认解锁）
            { type: RewardType.HERO_UNLOCK, value: HeroType.PERSIAN_SNIPER, description: "解锁波斯狙击手" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.BENGAL_HUNTER, description: "解锁孟加拉猎手" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.SIAMESE_MAGE, description: "解锁暹罗法师" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.MAINE_THUNDER, description: "解锁缅因雷法" }
        ],
        unlockConditions: [], // 初始关卡
        estimatedDuration: 3,
        learningObjectives: ["基础部署", "远程射击", "AOE法术", "高伤狙击", "快速攻击"]
    },

    // 关卡2: 战术精通 - 解锁4个英雄（继续按面板顺序）
    {
        id: "2",
        worldId: 1,
        levelId: 2,
        name: "战术精通",
        description: "掌握控制与防御！解锁冰法、近战和辅助英雄",
        difficulty: DifficultyLevel.NORMAL,
        initialGold: 300,
        waves: [
            {
                waveNumber: 1,
                enemies: [
                    { type: EnemyType.ARMORED_MOUSE, count: 6, spawnDelay: 2.5 },
                    { type: EnemyType.FAST_MOUSE, count: 4, spawnDelay: 1.8 }
                ]
            },
            {
                waveNumber: 2,
                enemies: [
                    { type: EnemyType.GIANT_MOUSE, count: 3, spawnDelay: 5.0 },
                    { type: EnemyType.SPEED_MOUSE, count: 8, spawnDelay: 1.2 }
                ]
            },
            {
                waveNumber: 3,
                enemies: [
                    { type: EnemyType.STEALTH_MOUSE, count: 6, spawnDelay: 2.0 },
                    { type: EnemyType.ARMORED_MOUSE, count: 5, spawnDelay: 2.5 },
                    { type: EnemyType.BASIC_MOUSE, count: 10, spawnDelay: 1.0 }
                ]
            }
        ],
        rewards: [
            { type: RewardType.GOLD, value: 250, description: "关卡完成奖励" },
            // 继续按面板顺序解锁下4个英雄
            { type: RewardType.HERO_UNLOCK, value: HeroType.NORWEGIAN_ICE, description: "解锁挪威冰法" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.BRITISH_KNIGHT, description: "解锁英短骑士" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.RAGDOLL_GUARDIAN, description: "解锁布偶守护者" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.SCOTTISH_ENGINEER, description: "解锁苏格兰工程师" }
        ],
        unlockConditions: [
            { type: UnlockConditionType.COMPLETE_LEVEL, targetId: "1", description: "完成初入战场" }
        ],
        estimatedDuration: 5,
        learningObjectives: ["冰系控制", "近战防守", "团队增益", "复合策略"]
    },

    // 关卡3: 终极大师 - 解锁最后3个英雄（完成全部12英雄）
    {
        id: "3",
        worldId: 2,
        levelId: 1,
        name: "终极大师",
        description: "终极挑战！解锁最后的精英英雄，成为真正的大师！",
        difficulty: DifficultyLevel.EXPERT,
        initialGold: 400,
        specialMechanics: [
            {
                type: SpecialMechanicType.SPEED_BOOST,
                parameters: { speedMultiplier: 1.3 },
                description: "所有敌人移动速度+30%"
            },
            {
                type: SpecialMechanicType.HEALTH_BOOST,
                parameters: { healthMultiplier: 1.5 },
                description: "所有敌人血量+50%"
            }
        ],
        waves: [
            {
                waveNumber: 1,
                enemies: [
                    { type: EnemyType.TANK_MOUSE, count: 4, spawnDelay: 6.0 },
                    { type: EnemyType.SPEED_MOUSE, count: 12, spawnDelay: 1.0 }
                ]
            },
            {
                waveNumber: 2,
                enemies: [
                    { type: EnemyType.STEALTH_MOUSE, count: 10, spawnDelay: 1.8 },
                    { type: EnemyType.ARMORED_MOUSE, count: 8, spawnDelay: 2.0 },
                    { type: EnemyType.GIANT_MOUSE, count: 4, spawnDelay: 4.0 }
                ]
            },
            {
                waveNumber: 3,
                enemies: [
                    { type: EnemyType.MOUSE_KING, count: 2, spawnDelay: 12.0 },
                    { type: EnemyType.MECH_MOUSE, count: 2, spawnDelay: 15.0 },
                    { type: EnemyType.TANK_MOUSE, count: 6, spawnDelay: 8.0 }
                ]
            }
        ],
        rewards: [
            { type: RewardType.GOLD, value: 500, description: "丰厚完成奖励" },
            // 解锁最后3个英雄，完成全部12英雄解锁
            { type: RewardType.HERO_UNLOCK, value: HeroType.ABYSSINIAN_SCOUT, description: "解锁阿比侦察兵" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.RUSSIAN_BLUE, description: "解锁俄罗斯蓝猫精英" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.AMERICAN_BOMBER, description: "解锁美国爆破兵" },
            { type: RewardType.ACHIEVEMENT, value: "hero_master", description: "英雄大师称号" },
            { type: RewardType.ACHIEVEMENT, value: "ultimate_guardian", description: "终极守护者称号" }
        ],
        unlockConditions: [
            { type: UnlockConditionType.COMPLETE_LEVEL, targetId: "2", description: "完成战术精通" }
        ],
        estimatedDuration: 7,
        learningObjectives: ["射程增益", "穿透攻击", "AOE爆炸", "完美策略", "终极挑战"]
    }
];

// 世界配置 - 极速2世界（3关结构）
export const WORLDS: WorldConfig[] = [
    {
        id: 1,
        name: "新手速成",
        theme: WorldTheme.GARDEN,
        description: "快速掌握基础，立即体验9种英雄！",
        levels: ULTRA_FAST_LEVELS.slice(0, 2), // 关卡1-2
        unlockConditions: [],
        completionRewards: [
            { type: RewardType.GOLD, value: 400, description: "世界完成奖励" }
        ]
    },
    {
        id: 2,
        name: "终极大师",
        theme: WorldTheme.VOLCANO,
        description: "终极挑战！解锁最后3个精英英雄，成为真正的大师！",
        levels: ULTRA_FAST_LEVELS.slice(2, 3), // 关卡3
        unlockConditions: [
            { type: UnlockConditionType.COMPLETE_LEVEL, targetId: "2", description: "完成战术精通" }
        ],
        completionRewards: [
            { type: RewardType.GOLD, value: 1000, description: "丰厚世界完成奖励" },
            { type: RewardType.ACHIEVEMENT, value: "ultimate_master", description: "终极大师称号" },
            { type: RewardType.ACHIEVEMENT, value: "complete_collection", description: "收藏家称号" }
        ]
    }
];

// 导出完整的关卡配置
export const LEVEL_CONFIGS = {
    worlds: WORLDS,
    getAllLevels: () => {
        return ULTRA_FAST_LEVELS;
    },
    getLevelById: (levelId: string): LevelConfig | undefined => {
        return ULTRA_FAST_LEVELS.find(level => level.id === levelId);
    },
    getWorldById: (worldId: number): WorldConfig | undefined => {
        return WORLDS.find(world => world.id === worldId);
    },
    getLevelsByWorld: (worldId: number): LevelConfig[] => {
        const world = WORLDS.find(w => w.id === worldId);
        return world ? world.levels : [];
    }
};