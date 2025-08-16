import { _decorator, Component, Node, Vec2, Vec3 } from 'cc';

// 游戏单位类型枚举
export enum UnitType {
    HERO = "hero",
    ENEMY = "enemy"
}

// 英雄类型枚举
export enum HeroType {
    ORANGE_CAT = "OrangeCat",      // 橘猫射手
    SIAMESE_CAT = "SiameseCat",    // 暹罗猫法师
    MAINE_CAT = "MaineCat"         // 缅因猫重炮
}

// 敌人类型枚举
export enum EnemyType {
    BASIC_MOUSE = "BasicMouse"     // 基础老鼠
}

// 游戏状态枚举
export enum GameState {
    MENU = "menu",
    DEPLOYMENT = "deployment",     // 部署阶段
    BATTLE = "battle",            // 战斗阶段
    RESTING = "resting",          // 休息阶段
    PLAYING = "playing",
    PAUSED = "paused",
    GAME_OVER = "game_over",
    VICTORY = "victory"
}

// 部署模式枚举
export enum DeploymentMode {
    GRID = "grid"                  // 网格部署模式
}

// 基础单位属性接口
export interface UnitStats {
    readonly name: string;         // 单位名称
    health: number;                // 生命值
    maxHealth: number;             // 最大生命值
    attackDamage: number;          // 攻击力
    attackRange: number;           // 攻击范围
    attackSpeed: number;           // 攻击速度(每秒攻击次数)
    moveSpeed: number;             // 移动速度
}

// 英雄配置接口
export interface HeroConfig extends UnitStats {
    readonly type: HeroType;       // 英雄类型
    bulletSpeed?: number;          // 子弹速度(射手类英雄)
    skillCooldown?: number;        // 技能冷却时间
}

// 敌人配置接口
export interface EnemyConfig extends UnitStats {
    readonly type: EnemyType;      // 敌人类型
    goldReward: number;            // 击败奖励金币
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
    cellSize: number;              // 单元格大小
    startPosition: WorldPosition; // 网格起始位置
}

// 游戏配置接口
export interface GameConfig {
    initialGold: number;           // 初始金币
    castleHealth: number;          // 城堡生命值
    gridConfig: GridConfig;        // 网格配置
    heroConfigs: Record<HeroType, HeroConfig>;     // 英雄配置
    enemyConfigs: Record<EnemyType, EnemyConfig>;  // 敌人配置
    waves: WaveConfig[];           // 波次配置
}