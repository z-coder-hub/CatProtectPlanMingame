import { _decorator, Component, Node, Graphics, Color } from 'cc';

const { ccclass } = _decorator;

// 简单对象池，专门用于子弹
@ccclass('SimpleObjectPool')
export class SimpleObjectPool {
    
    private static _bulletPool: Node[] = [];
    private static _maxPoolSize: number = 20; // 最大池大小
    
    // 获取子弹节点
    public static getBulletNode(): Node {
        if (this._bulletPool.length > 0) {
            const bulletNode = this._bulletPool.pop()!;
            bulletNode.active = true;
            
            // 重新绘制子弹图形，确保可见
            const graphics = bulletNode.getComponent(Graphics);
            if (graphics) {
                graphics.clear();
                graphics.fillColor = new Color(255, 255, 0); // 黄色子弹
                graphics.circle(0, 0, 3);
                graphics.fill();
            }
            
            return bulletNode;
        }
        
        // 池中没有可用对象，创建新的
        return this.createBulletNode();
    }
    
    // 回收子弹节点
    public static recycleBulletNode(bulletNode: Node): void {
        if (!bulletNode || !bulletNode.isValid) {
            return;
        }
        
        // 重置子弹状态
        bulletNode.setPosition(0, 0, 0);
        
        // 清理graphics但保持节点激活，这样重用时更简单
        const graphics = bulletNode.getComponent(Graphics);
        if (graphics) {
            graphics.clear();
        }
        
        // 如果池未满，放入池中
        if (this._bulletPool.length < this._maxPoolSize) {
            this._bulletPool.push(bulletNode);
        } else {
            // 池已满，直接销毁
            bulletNode.destroy();
        }
    }
    
    // 创建新的子弹节点
    private static createBulletNode(): Node {
        const bulletNode = new Node("PooledBullet");
        
        // 添加子弹图形
        const bulletGraphics = bulletNode.addComponent(Graphics);
        bulletGraphics.fillColor = new Color(255, 255, 0); // 黄色子弹
        bulletGraphics.circle(0, 0, 3);
        bulletGraphics.fill();
        
        return bulletNode;
    }
    
    // 清空对象池
    public static clearPool(): void {
        for (const bullet of this._bulletPool) {
            if (bullet && bullet.isValid) {
                bullet.destroy();
            }
        }
        this._bulletPool = [];
    }
    
    // 获取池状态信息
    public static getPoolInfo(): { poolSize: number; maxSize: number; usage: number } {
        return {
            poolSize: this._bulletPool.length,
            maxSize: this._maxPoolSize,
            usage: Math.round((1 - this._bulletPool.length / this._maxPoolSize) * 100)
        };
    }
}