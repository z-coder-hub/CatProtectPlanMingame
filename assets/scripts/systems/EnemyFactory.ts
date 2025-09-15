import { _decorator, Node } from 'cc';
import { EnemyType } from '../types/GameTypes';

// 敌人组件导入
import { BasicMouse } from '../components/enemies/BasicMouse';
import { GiantMouse } from '../components/enemies/GiantMouse';
import { SpeedMouse } from '../components/enemies/SpeedMouse';
import { FastMouse } from '../components/enemies/FastMouse';
import { ArmoredMouse } from '../components/enemies/ArmoredMouse';
import { TankMouse } from '../components/enemies/TankMouse';
import { StealthMouse } from '../components/enemies/StealthMouse';
import { MouseKing } from '../components/enemies/MouseKing';
import { MechMouse } from '../components/enemies/MechMouse';

// 新BOSS组件导入
import { ArmorOverlord } from '../components/enemies/ArmorOverlord';
import { ShadowAssassin } from '../components/enemies/ShadowAssassin';
import { StormTyrant } from '../components/enemies/StormTyrant';
import { GiantBehemoth } from '../components/enemies/GiantBehemoth';
import { ThunderMaster } from '../components/enemies/ThunderMaster';
import { MechCommander } from '../components/enemies/MechCommander';
import { UltimateOverlord } from '../components/enemies/UltimateOverlord';

const { ccclass } = _decorator;

@ccclass('EnemyFactory')
export class EnemyFactory {
    
    // 敌人类型到组件类的映射
    private static readonly ENEMY_COMPONENTS = {
        [EnemyType.BASIC_MOUSE]: BasicMouse,
        [EnemyType.GIANT_MOUSE]: GiantMouse,
        [EnemyType.FAST_MOUSE]: FastMouse,
        [EnemyType.SPEED_MOUSE]: SpeedMouse,
        [EnemyType.ARMORED_MOUSE]: ArmoredMouse,
        [EnemyType.TANK_MOUSE]: TankMouse,
        [EnemyType.STEALTH_MOUSE]: StealthMouse,
        [EnemyType.MOUSE_KING]: MouseKing,
        [EnemyType.MECH_MOUSE]: MechMouse,
        
        // 新BOSS组件映射
        [EnemyType.ARMOR_OVERLORD]: ArmorOverlord,
        [EnemyType.SHADOW_ASSASSIN]: ShadowAssassin,
        [EnemyType.STORM_TYRANT]: StormTyrant,
        [EnemyType.GIANT_BEHEMOTH]: GiantBehemoth,
        [EnemyType.THUNDER_MASTER]: ThunderMaster,
        [EnemyType.MECH_COMMANDER]: MechCommander,
        [EnemyType.ULTIMATE_OVERLORD]: UltimateOverlord,
    };
    
    /**
     * 创建敌人节点
     * @param enemyType 敌人类型
     * @param parent 父节点
     * @param spawnPosition 生成位置
     * @returns 创建的敌人节点，如果失败返回null
     */
    public static createEnemy(enemyType: EnemyType, parent?: Node, spawnPosition?: { x: number; y: number }): Node | null {
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
            const enemyComponent = enemyNode.addComponent(ComponentClass as any);
            
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
     * 检查敌人类型是否可用
     * @param enemyType 敌人类型
     * @returns 是否可用
     */
    public static isEnemyAvailable(enemyType: EnemyType): boolean {
        return !!this.ENEMY_COMPONENTS[enemyType];
    }
    
    /**
     * 获取所有可用的敌人类型
     * @returns 可用敌人类型数组
     */
    public static getAvailableEnemyTypes(): EnemyType[] {
        return Object.keys(this.ENEMY_COMPONENTS) as EnemyType[];
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
            [EnemyType.MECH_MOUSE]: "机械老鼠，远程火力",
            
            // 新BOSS描述
            [EnemyType.ARMOR_OVERLORD]: "重甲统领，超高护甲减伤80%",
            [EnemyType.SHADOW_ASSASSIN]: "潜影刺客，永久潜行免疫50%伤害",
            [EnemyType.STORM_TYRANT]: "疾风暴君，极速移动召唤疾速小兵",
            [EnemyType.GIANT_BEHEMOTH]: "巨兽霸主，超大血量践踏范围伤害",
            [EnemyType.THUNDER_MASTER]: "雷电大师，链式雷电攻击电流场护盾",
            [EnemyType.MECH_COMMANDER]: "机械军团长，无限召唤机械兵自我修复",
            [EnemyType.ULTIMATE_OVERLORD]: "终极霸王，融合所有BOSS能力最终挑战"
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
            [EnemyType.MECH_MOUSE]: ["激光攻击", "远程威胁"],
            
            // 新BOSS特殊能力
            [EnemyType.ARMOR_OVERLORD]: ["超高护甲", "伤害减免80%", "重装冲锋"],
            [EnemyType.SHADOW_ASSASSIN]: ["永久潜行", "伤害免疫50%", "暗影闪烁"],
            [EnemyType.STORM_TYRANT]: ["极速移动", "召唤疾速小兵", "风暴冲击"],
            [EnemyType.GIANT_BEHEMOTH]: ["超大血量", "践踏范围伤害", "地震冲击"],
            [EnemyType.THUNDER_MASTER]: ["链式雷电", "电流场护盾", "雷电风暴"],
            [EnemyType.MECH_COMMANDER]: ["无限召唤机械兵", "自我修复", "激光炮台"],
            [EnemyType.ULTIMATE_OVERLORD]: ["融合所有能力", "多重形态", "终极毁灭"]
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
            const component = enemyNode.getComponent(ComponentClass as any);
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
            if (enemyNode.getComponent(ComponentClass as any)) {
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
            const component = enemyNode.getComponent(ComponentClass as any);
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