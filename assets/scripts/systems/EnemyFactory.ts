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
}