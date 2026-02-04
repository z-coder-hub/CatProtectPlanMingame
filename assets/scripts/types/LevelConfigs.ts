import {
    LevelConfig,
    RewardType, EnemyType, HeroType
} from './GameTypes';

// ====================== 关卡数据配置 ======================
// 10关渐进解锁设计 - 前3关解锁全英雄，后7关BOSS挑战

// 完整10关配置，按设计文档实现
const COMPLETE_10_LEVELS: LevelConfig[] = [
    // === 关卡1: 新手训练 - 解锁4个英雄 ===
    {
        id: "1",
        name: "新手训练",
        description: "基础防御训练！解锁4种核心英雄类型体验多样化战术",
        initialGold: 400,        // 难度降低：提升初始金币
        waves: [
            {
                waveNumber: 1,
                enemies: [
                    { type: EnemyType.BASIC_MOUSE, count: 3, spawnDelay: 2.0 }  // 难度降低：减少敌人数量
                ]
            },
            {
                waveNumber: 2,
                enemies: [
                    { type: EnemyType.BASIC_MOUSE, count: 8, spawnDelay: 1.0 },
                    { type: EnemyType.FAST_MOUSE, count: 4, spawnDelay: 1.5 }
                ]
            },
            {
                waveNumber: 3,
                enemies: [
                    { type: EnemyType.BASIC_MOUSE, count: 10, spawnDelay: 0.8 },
                    { type: EnemyType.FAST_MOUSE, count: 6, spawnDelay: 1.2 }
                ]
            }
        ],
        rewards: [
            { type: RewardType.GOLD, value: 250, description: "关卡完成奖励" },  // 难度降低：增加奖励金币
            { type: RewardType.HERO_UNLOCK, value: HeroType.PERSIAN_SNIPER, description: "解锁波斯狙击手" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.SIAMESE_MAGE, description: "解锁暹罗法师" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.BRITISH_KNIGHT, description: "解锁英短骑士" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.SCOTTISH_MARKSMAN, description: "解锁苏格兰射手" }
        ],
        learningObjectives: ["基础部署", "狙击射击", "AOE法术", "近战防守", "团队增益"]
    },

    // === 关卡2: 进阶学习 - 解锁4个英雄 ===
    {
        id: "2",
        name: "进阶学习",
        description: "组合战术精通！解锁快射、雷法、防御和射程增益英雄",
        initialGold: 450,        // 难度降低：提升初始金币
        waves: [
            {
                waveNumber: 1,
                enemies: [
                    { type: EnemyType.FAST_MOUSE, count: 8, spawnDelay: 1.0 }
                ]
            },
            {
                waveNumber: 2,
                enemies: [
                    { type: EnemyType.SPEED_MOUSE, count: 4, spawnDelay: 1.2 },
                    { type: EnemyType.BASIC_MOUSE, count: 4, spawnDelay: 1.0 }
                ]
            },
            {
                waveNumber: 3,
                enemies: [
                    { type: EnemyType.SPEED_MOUSE, count: 8, spawnDelay: 0.8 },
                    { type: EnemyType.FAST_MOUSE, count: 6, spawnDelay: 1.0 }
                ]
            }
        ],
        rewards: [
            { type: RewardType.GOLD, value: 200, description: "关卡完成奖励" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.BENGAL_HUNTER, description: "解锁孟加拉猎手" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.MAINE_THUNDER, description: "解锁缅因雷法" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.ABYSSINIAN_ARCHER, description: "解锁阿比西尼亚弓箭手" }
        ],
        learningObjectives: ["快速射击", "雷电攻击", "防御姿态", "射程增益"]
    },

    // === 关卡3: 精英训练 - 解锁最后3个英雄 ===
    {
        id: "3",
        name: "精英训练",
        description: "高级技巧掌握！解锁最后3个英雄，完成全部12英雄集合",
        initialGold: 350,
        waves: [
            {
                waveNumber: 1,
                enemies: [
                    { type: EnemyType.GIANT_MOUSE, count: 6, spawnDelay: 2.0 },
                    { type: EnemyType.STEALTH_MOUSE, count: 8, spawnDelay: 1.5 }
                ]
            },
            {
                waveNumber: 2,
                enemies: [
                    { type: EnemyType.STEALTH_MOUSE, count: 10, spawnDelay: 1.2 },
                    { type: EnemyType.ARMORED_MOUSE, count: 6, spawnDelay: 1.5 }
                ]
            },
            {
                waveNumber: 3,
                enemies: [
                    { type: EnemyType.TANK_MOUSE, count: 4, spawnDelay: 2.5 },
                    { type: EnemyType.FAST_MOUSE, count: 12, spawnDelay: 0.5 },
                    { type: EnemyType.STEALTH_MOUSE, count: 8, spawnDelay: 1.0 }
                ]
            }
        ],
        rewards: [
            { type: RewardType.GOLD, value: 250, description: "关卡完成奖励" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.NORWEGIAN_ICE, description: "解锁挪威冰法" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.RUSSIAN_BLUE, description: "解锁俄罗斯蓝猫精英" },
            { type: RewardType.HERO_UNLOCK, value: HeroType.AMERICAN_BOMBER, description: "解锁美国爆破兵" }
        ],
        learningObjectives: ["冰系控制", "穿透攻击", "AOE爆炸", "复合策略"]
    },

    // === 关卡4: 装甲统领 - BOSS挑战 ===
    {
        id: "4",
        name: "装甲统领",
        description: "重甲BOSS挑战！面对超高护甲的统领，需要穿透攻击才能有效对付",
        initialGold: 400,
        waves: [
            {
                waveNumber: 1,
                enemies: [
                    { type: EnemyType.ARMORED_MOUSE, count: 12, spawnDelay: 1.0 }
                ]
            },
            {
                waveNumber: 2,
                enemies: [
                    { type: EnemyType.TANK_MOUSE, count: 8, spawnDelay: 1.5 },
                    { type: EnemyType.ARMORED_MOUSE, count: 10, spawnDelay: 1.0 }
                ]
            },
            {
                waveNumber: 3,
                enemies: [
                    { type: EnemyType.ARMOR_OVERLORD, count: 1, spawnDelay: 5.0 },
                    { type: EnemyType.TANK_MOUSE, count: 6, spawnDelay: 1.5 }
                ]
            }
        ],
        rewards: [
            { type: RewardType.GOLD, value: 300, description: "关卡完成奖励" }
        ],
        learningObjectives: ["穿透攻击必备", "装甲渗透", "BOSS对抗", "集火打击"]
    },

    // === 关卡5: 潜影刺客 - BOSS挑战 ===
    {
        id: "5",
        name: "潜影刺客",
        description: "潜行BOSS挑战！永久潜行的刺客需要AOE法术探测和大范围攻击",
        initialGold: 420,
        waves: [
            {
                waveNumber: 1,
                enemies: [
                    { type: EnemyType.STEALTH_MOUSE, count: 15, spawnDelay: 1.0 }
                ]
            },
            {
                waveNumber: 2,
                enemies: [
                    { type: EnemyType.STEALTH_MOUSE, count: 20, spawnDelay: 0.8 },
                    { type: EnemyType.SPEED_MOUSE, count: 8, spawnDelay: 1.0 }
                ]
            },
            {
                waveNumber: 3,
                enemies: [
                    { type: EnemyType.SHADOW_ASSASSIN, count: 1, spawnDelay: 5.0 },
                    { type: EnemyType.STEALTH_MOUSE, count: 12, spawnDelay: 0.8 }
                ]
            }
        ],
        rewards: [
            { type: RewardType.GOLD, value: 320, description: "关卡完成奖励" }
        ],
        learningObjectives: ["AOE法术探测", "隐身反制", "范围攻击", "持续输出"]
    },

    // === 关卡6: 疾风暴君 - BOSS挑战 ===
    {
        id: "6",
        name: "疾风暴君",
        description: "速度BOSS挑战！极速移动的暴君召唤疾速小兵，需要范围控制和预判",
        initialGold: 450,
        waves: [
            {
                waveNumber: 1,
                enemies: [
                    { type: EnemyType.SPEED_MOUSE, count: 20, spawnDelay: 0.5 }
                ]
            },
            {
                waveNumber: 2,
                enemies: [
                    { type: EnemyType.SPEED_MOUSE, count: 25, spawnDelay: 0.4 },
                    { type: EnemyType.FAST_MOUSE, count: 10, spawnDelay: 0.6 }
                ]
            },
            {
                waveNumber: 3,
                enemies: [
                    { type: EnemyType.STORM_TYRANT, count: 1, spawnDelay: 5.0 },
                    { type: EnemyType.SPEED_MOUSE, count: 15, spawnDelay: 0.3 }
                ]
            }
        ],
        rewards: [
            { type: RewardType.GOLD, value: 350, description: "关卡完成奖励" }
        ],
        learningObjectives: ["范围控制", "预判移动", "高速目标", "发火力集中"]
    },

    // === 关卡7: 巨兽霸主 - BOSS挑战 ===
    {
        id: "7",
        name: "巨兽霸主",
        description: "巨型BOSS挑战！超大血量的霸主具有踩踏范围伤害，需要高火力集中打击",
        initialGold: 480,
        waves: [
            {
                waveNumber: 1,
                enemies: [
                    { type: EnemyType.GIANT_MOUSE, count: 6, spawnDelay: 2.0 }
                ]
            },
            {
                waveNumber: 2,
                enemies: [
                    { type: EnemyType.GIANT_MOUSE, count: 8, spawnDelay: 1.5 },
                    { type: EnemyType.TANK_MOUSE, count: 12, spawnDelay: 1.2 }
                ]
            },
            {
                waveNumber: 3,
                enemies: [
                    { type: EnemyType.GIANT_BEHEMOTH, count: 1, spawnDelay: 5.0 },
                    { type: EnemyType.GIANT_MOUSE, count: 4, spawnDelay: 2.0 }
                ]
            }
        ],
        rewards: [
            { type: RewardType.GOLD, value: 380, description: "关卡完成奖励" }
        ],
        learningObjectives: ["高火力集中", "踩踏范围规避", "超高血量打击", "精准部署"]
    },

    // === 关卡8: 雷电大师 - BOSS挑战 ===
    {
        id: "8",
        name: "雷电大师",
        description: "法术BOSS挑战！雷电链式攻击和电流场护盾，需要分散布阵和绝缘策略",
        initialGold: 500,
        waves: [
            {
                waveNumber: 1,
                enemies: [
                    { type: EnemyType.BASIC_MOUSE, count: 10, spawnDelay: 0.5 }
                ]
            },
            {
                waveNumber: 2,
                enemies: [
                    { type: EnemyType.FAST_MOUSE, count: 15, spawnDelay: 0.4 }
                ]
            },
            {
                waveNumber: 3,
                enemies: [
                    { type: EnemyType.THUNDER_MASTER, count: 1, spawnDelay: 5.0 }
                ]
            }
        ],
        rewards: [
            { type: RewardType.GOLD, value: 400, description: "关卡完成奖励" }
        ],
        learningObjectives: ["分散布阵", "雷电绝缘", "电流场突破", "链式反制"]
    },

    // === 关卡9: 机械军团长 - BOSS挑战 ===
    {
        id: "9",
        name: "机械军团长",
        description: "召唤BOSS挑战！无限召唤机械兵并且具有修复能力，需要速战速决和AOE清理",
        initialGold: 550,
        waves: [
            {
                waveNumber: 1,
                enemies: [
                    { type: EnemyType.MECH_MOUSE, count: 8, spawnDelay: 1.5 }
                ]
            },
            {
                waveNumber: 2,
                enemies: [
                    { type: EnemyType.MECH_MOUSE, count: 12, spawnDelay: 1.2 }
                ]
            },
            {
                waveNumber: 3,
                enemies: [
                    { type: EnemyType.MECH_COMMANDER, count: 1, spawnDelay: 5.0 }
                ]
            }
        ],
        rewards: [
            { type: RewardType.GOLD, value: 450, description: "关卡完成奖励" }
        ],
        learningObjectives: ["速战速决", "AOE清理", "召唤反制", "自修复对抗"]
    },

    // === 关卡10: 终极霸王 - 最终BOSS挑战 ===
    {
        id: "10",
        name: "终极霸王",
        description: "最终BOSS挑战！融合所有BOSS能力的终极霸王，需要完美的英雄配置才能胜利",
        initialGold: 600,
        waves: [
            {
                waveNumber: 1,
                enemies: [
                    { type: EnemyType.ARMORED_MOUSE, count: 10, spawnDelay: 0.8 },
                    { type: EnemyType.STEALTH_MOUSE, count: 8, spawnDelay: 1.0 }
                ]
            },
            {
                waveNumber: 2,
                enemies: [
                    { type: EnemyType.MECH_MOUSE, count: 4, spawnDelay: 2.0 },
                    { type: EnemyType.MOUSE_KING, count: 4, spawnDelay: 3.0 },
                    { type: EnemyType.ARMORED_MOUSE, count: 10, spawnDelay: 1.0 }
                ]
            },
            {
                waveNumber: 3,
                enemies: [
                    { type: EnemyType.ULTIMATE_OVERLORD, count: 1, spawnDelay: 8.0 }
                ]
            }
        ],
        rewards: [
            { type: RewardType.GOLD, value: 800, description: "丰厚最终奖励" },
            { type: "achievement" as any, value: "ultimate_master", description: "终极大师称号" },
            { type: "achievement" as any, value: "complete_collection", description: "收藏家称号" }
        ],
        learningObjectives: ["完美英雄配置", "全BOSS能力对抗", "最高难度挑战", "游戏大师成就"]
    }
];

// 导出完整的关卡配置
export const LEVEL_CONFIGS = {
    getAllLevels: () => {
        return COMPLETE_10_LEVELS;
    },
    getLevelById: (levelId: string): LevelConfig | undefined => {
        return COMPLETE_10_LEVELS.find(level => level.id === levelId);
    }
};