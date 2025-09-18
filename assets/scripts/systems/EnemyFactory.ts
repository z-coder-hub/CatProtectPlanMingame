import { _decorator, Node } from 'cc';
import { EnemyType } from '../types/GameTypes';
import { EnemyPoolManager } from './EnemyPoolManager';

const { ccclass } = _decorator;

@ccclass('EnemyFactory')
export class EnemyFactory {
    
    /**
     * 创建敌人节点
     * @param enemyType 敌人类型
     * @param parent 父节点
     * @param spawnPosition 生成位置
     * @returns 创建的敌人节点，如果失败返回null
     */
    public static createEnemy(enemyType: EnemyType, parent?: Node, spawnPosition?: { x: number; y: number }): Node | null {
        try {
            // 从对象池获取敌人节点
            const enemyNode = EnemyPoolManager.getEnemy(enemyType);
            if (!enemyNode) {
                console.error(`无法从对象池获取敌人: ${enemyType}`);
                return null;
            }

            // 设置父节点
            if (parent) {
                enemyNode.parent = parent;
            }

            // 设置生成位置
            if (spawnPosition) {
                enemyNode.setPosition(spawnPosition.x, spawnPosition.y, 0);
            }
            
            console.log(`敌人创建成功: ${enemyType}, 节点名: ${enemyNode.name}`);
            return enemyNode;
            
        } catch (error) {
            console.error(`创建敌人时发生错误: ${enemyType}`, error);
            return null;
        }
    }
}