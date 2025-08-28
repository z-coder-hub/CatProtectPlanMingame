import { _decorator, Node } from 'cc';
import { EnemyType } from '../types/GameTypes';
import { ENEMY_CONFIGS } from '../types/GameConstants';

// 敌人组件导入
import { BasicMouse } from '../components/enemies/BasicMouse';
import { GiantMouse } from '../components/enemies/GiantMouse';
import { SpeedMouse } from '../components/enemies/SpeedMouse';

const { ccclass } = _decorator;

@ccclass('EnemyFactory')
export class EnemyFactory {
    
    // 敌人类型到组件类的映射
    private static readonly ENEMY_COMPONENTS = {
        [EnemyType.BASIC_MOUSE]: BasicMouse,
        [EnemyType.GIANT_MOUSE]: GiantMouse,
        [EnemyType.SPEED_MOUSE]: SpeedMouse,
        // 暂时注释未实现的敌人
        // [EnemyType.FAST_MOUSE]: FastMouse,
        // [EnemyType.ARMORED_MOUSE]: ArmoredMouse,
        // [EnemyType.TANK_MOUSE]: TankMouse,
        // [EnemyType.STEALTH_MOUSE]: StealthMouse,
        // [EnemyType.MOUSE_KING]: MouseKing,
        // [EnemyType.MECH_MOUSE]: MechMouse,
    };
    
    /**
     * 创建敌人节点
     * @param enemyType 敌人类型
     * @param parent 父节点
     * @param spawnPosition 生成位置
     * @returns 创建的敌人节点，如果失败返回null
     */
    public static createEnemy(enemyType: EnemyType, parent?: Node, spawnPosition?: { x: number; y: number }): Node | null {
        // 检查敌人类型是否有效
        if (!ENEMY_CONFIGS[enemyType]) {
            console.error(`未找到敌人类型配置: ${enemyType}`);
            return null;
        }
        
        // 检查是否有对应的组件类
        const ComponentClass = this.ENEMY_COMPONENTS[enemyType];
        if (!ComponentClass) {
            console.error(`敌人组件未实现: ${enemyType}`);
            return null;
        }
        
        try {
            // 创建敌人节点
            const enemyNode = new Node(`Enemy_${enemyType}_${Date.now()}`);
            
            // 设置父节点
            if (parent) {
                enemyNode.parent = parent;
            }
            
            // 设置生成位置
            if (spawnPosition) {
                enemyNode.setPosition(spawnPosition.x, spawnPosition.y, 0);
            }
            
            // 添加敌人组件
            const enemyComponent = enemyNode.addComponent(ComponentClass);
            
            // 验证组件是否正确创建
            if (!enemyComponent) {
                console.error(`敌人组件创建失败: ${enemyType}`);
                enemyNode.destroy();
                return null;
            }
            
            console.log(`敌人创建成功: ${enemyType}, 节点名: ${enemyNode.name}`);
            return enemyNode;
            
        } catch (error) {
            console.error(`创建敌人时发生错误: ${enemyType}`, error);
            return null;
        }
    }
    
    /**
     * 批量创建敌人
     * @param enemyTypes 敌人类型和数量的配置数组
     * @param parent 父节点
     * @param spawnArea 生成区域 {x, y, width, height}
     * @returns 创建成功的敌人节点数组
     */
    public static createMultipleEnemies(
        enemyTypes: { type: EnemyType; count: number }[], 
        parent?: Node,
        spawnArea?: { x: number; y: number; width: number; height: number }
    ): Node[] {
        const enemies: Node[] = [];
        
        for (const config of enemyTypes) {
            for (let i = 0; i < config.count; i++) {
                let spawnPosition: { x: number; y: number } | undefined;
                
                // 如果指定了生成区域，随机生成位置
                if (spawnArea) {
                    spawnPosition = {
                        x: spawnArea.x + Math.random() * spawnArea.width,
                        y: spawnArea.y + Math.random() * spawnArea.height
                    };
                }
                
                const enemy = this.createEnemy(config.type, parent, spawnPosition);
                if (enemy) {
                    enemies.push(enemy);
                }
            }
        }
        
        console.log(`批量创建敌人完成: ${enemies.length} 个敌人`);
        return enemies;
    }
    
    /**
     * 获取敌人配置信息
     * @param enemyType 敌人类型
     * @returns 敌人配置，如果不存在返回null
     */
    public static getEnemyConfig(enemyType: EnemyType) {
        return ENEMY_CONFIGS[enemyType] || null;
    }
    
    /**
     * 检查敌人类型是否可用
     * @param enemyType 敌人类型
     * @returns 是否可用
     */
    public static isEnemyAvailable(enemyType: EnemyType): boolean {
        return !!(ENEMY_CONFIGS[enemyType] && this.ENEMY_COMPONENTS[enemyType]);
    }
    
    /**
     * 获取所有可用的敌人类型
     * @returns 可用敌人类型数组
     */
    public static getAvailableEnemyTypes(): EnemyType[] {
        return Object.keys(this.ENEMY_COMPONENTS) as EnemyType[];
    }
    
    /**
     * 获取敌人击败奖励
     * @param enemyType 敌人类型
     * @returns 金币奖励，如果敌人不存在返回0
     */
    public static getEnemyReward(enemyType: EnemyType): number {
        const config = ENEMY_CONFIGS[enemyType];
        return config ? config.goldReward : 0;
    }
    
    /**
     * 获取敌人的详细信息（用于调试和UI显示）
     * @param enemyType 敌人类型
     * @returns 敌人详细信息
     */
    public static getEnemyInfo(enemyType: EnemyType): {
        type: EnemyType;
        name: string;
        goldReward: number;
        description: string;
        stats: {
            health: number;
            attack: number;
            range: number;
            speed: number;
        };
        specialAbilities: string[];
        available: boolean;
    } | null {
        const config = ENEMY_CONFIGS[enemyType];
        if (!config) return null;
        
        return {
            type: enemyType,
            name: config.name,
            goldReward: config.goldReward,
            description: this.getEnemyDescription(enemyType),
            stats: {
                health: config.maxHealth,
                attack: 0, // Enemies don't have attack damage anymore
                range: 0,  // Enemies don't have attack range anymore  
                speed: config.moveSpeed
            },
            specialAbilities: this.getEnemyAbilities(enemyType),
            available: this.isEnemyAvailable(enemyType)
        };
    }
    
    /**
     * 获取敌人描述
     * @param enemyType 敌人类型
     * @returns 敌人描述文本
     */
    private static getEnemyDescription(enemyType: EnemyType): string {
        const descriptions = {
            [EnemyType.BASIC_MOUSE]: "标准老鼠，基础威胁",
            [EnemyType.GIANT_MOUSE]: "巨型老鼠，高血量高攻击",
            [EnemyType.FAST_MOUSE]: "快速老鼠，高机动性",
            [EnemyType.SPEED_MOUSE]: "疾速老鼠，极高速度",
            [EnemyType.ARMORED_MOUSE]: "装甲老鼠，厚重防护",
            [EnemyType.TANK_MOUSE]: "坦克老鼠，终极护甲",
            [EnemyType.STEALTH_MOUSE]: "潜行老鼠，闪避攻击",
            [EnemyType.MOUSE_KING]: "老鼠王，召唤BOSS",
            [EnemyType.MECH_MOUSE]: "机械老鼠，远程火力"
        };
        
        return descriptions[enemyType] || "未知敌人";
    }
    
    /**
     * 获取敌人特殊能力
     * @param enemyType 敌人类型
     * @returns 特殊能力数组
     */
    private static getEnemyAbilities(enemyType: EnemyType): string[] {
        const abilities: Record<EnemyType, string[]> = {
            [EnemyType.BASIC_MOUSE]: [],
            [EnemyType.GIANT_MOUSE]: ["狂暴模式", "额外金币掉落"],
            [EnemyType.FAST_MOUSE]: [],
            [EnemyType.SPEED_MOUSE]: ["受伤加速", "残影效果"],
            [EnemyType.ARMORED_MOUSE]: [],
            [EnemyType.TANK_MOUSE]: ["护甲减伤"],
            [EnemyType.STEALTH_MOUSE]: ["闪避攻击"],
            [EnemyType.MOUSE_KING]: ["召唤小老鼠"],
            [EnemyType.MECH_MOUSE]: ["激光攻击", "远程威胁"]
        };
        
        return abilities[enemyType] || [];
    }
    
    /**
     * 为敌人启动移动AI
     * @param enemyNode 敌人节点
     */
    public static startEnemyMovement(enemyNode: Node): void {
        if (!enemyNode || !enemyNode.isValid) return;
        
        // 检查敌人是否有startMoving方法
        const availableTypes = this.getAvailableEnemyTypes();
        for (const enemyType of availableTypes) {
            const ComponentClass = this.ENEMY_COMPONENTS[enemyType];
            const component = enemyNode.getComponent(ComponentClass);
            if (component && typeof (component as any).startMoving === 'function') {
                (component as any).startMoving();
                break;
            }
        }
    }
    
    /**
     * 验证敌人节点是否有效
     * @param enemyNode 敌人节点
     * @returns 是否有效
     */
    public static validateEnemyNode(enemyNode: Node): boolean {
        if (!enemyNode || !enemyNode.isValid) {
            return false;
        }
        
        // 检查是否有有效的敌人组件
        const availableTypes = this.getAvailableEnemyTypes();
        for (const enemyType of availableTypes) {
            const ComponentClass = this.ENEMY_COMPONENTS[enemyType];
            if (enemyNode.getComponent(ComponentClass)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 获取敌人节点的类型
     * @param enemyNode 敌人节点
     * @returns 敌人类型，如果无法确定返回null
     */
    public static getEnemyTypeFromNode(enemyNode: Node): EnemyType | null {
        if (!enemyNode || !enemyNode.isValid) {
            return null;
        }
        
        // 检查节点上的敌人组件
        const availableTypes = this.getAvailableEnemyTypes();
        for (const enemyType of availableTypes) {
            const ComponentClass = this.ENEMY_COMPONENTS[enemyType];
            const component = enemyNode.getComponent(ComponentClass);
            if (component && (component as any).enemyType === enemyType) {
                return enemyType;
            }
        }
        
        return null;
    }
    
    /**
     * 根据难度等级随机选择敌人类型
     * @param difficultyLevel 难度等级 (1-10)
     * @returns 随机敌人类型
     */
    public static getRandomEnemyByDifficulty(difficultyLevel: number): EnemyType {
        const availableTypes = this.getAvailableEnemyTypes();
        
        // 根据难度等级过滤适合的敌人类型
        let suitableEnemies: EnemyType[] = [];
        
        if (difficultyLevel <= 2) {
            // 简单难度：只有基础敌人
            suitableEnemies = [EnemyType.BASIC_MOUSE];
        } else if (difficultyLevel <= 5) {
            // 中等难度：基础 + 一些进阶敌人
            suitableEnemies = [EnemyType.BASIC_MOUSE, EnemyType.SPEED_MOUSE];
        } else if (difficultyLevel <= 8) {
            // 困难难度：包含大部分敌人
            suitableEnemies = [EnemyType.BASIC_MOUSE, EnemyType.GIANT_MOUSE, EnemyType.SPEED_MOUSE];
        } else {
            // 极难难度：所有可用敌人
            suitableEnemies = availableTypes;
        }
        
        // 从适合的敌人中随机选择
        const randomIndex = Math.floor(Math.random() * suitableEnemies.length);
        return suitableEnemies[randomIndex] || EnemyType.BASIC_MOUSE;
    }
}