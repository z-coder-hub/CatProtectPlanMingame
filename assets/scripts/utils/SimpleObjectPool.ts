import { _decorator, Component, Node, Graphics, Color } from 'cc';

const { ccclass } = _decorator;

// 简单对象池，专门用于子弹
@ccclass('SimpleObjectPool')
export class SimpleObjectPool {
    
    private static _bulletPool: Node[] = [];
    private static _maxPoolSize: number = 20; // 最大池大小
    
    // 获取子弹节点
    public static getBulletNode(): Node {
        // 从池中获取有效的节点
        while (this._bulletPool.length > 0) {
            const bulletNode = this._bulletPool.pop()!;
            
            // 检查节点是否仍然有效
            if (!bulletNode || !bulletNode.isValid) {
                continue; // 节点无效，继续寻找
            }
            
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
        
        // 池中没有有效对象，创建新的
        return this.createBulletNode();
    }
    
    // 回收子弹节点
    public static recycleBulletNode(bulletNode: Node): void {
        if (!bulletNode || !bulletNode.isValid) {
            console.warn("[SimpleObjectPool] 尝试回收无效的子弹节点");
            return;
        }
        
        // 重置子弹状态
        bulletNode.setPosition(0, 0, 0);
        bulletNode.active = false; // 设置为非激活状态
        
        // 清理graphics
        const graphics = bulletNode.getComponent(Graphics);
        if (graphics) {
            graphics.clear();
        }
        
        // 如果池未满，放入池中
        if (this._bulletPool.length < this._maxPoolSize) {
            this._bulletPool.push(bulletNode);
            console.log(`[SimpleObjectPool] 子弹回收到池，当前池大小: ${this._bulletPool.length}`);
        } else {
            // 池已满，直接销毁
            console.log("[SimpleObjectPool] 池已满，销毁子弹节点");
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
        console.log("[SimpleObjectPool] 对象池已清空");
    }
    
    // 清理无效节点（定期维护）
    public static cleanupInvalidNodes(): void {
        const originalLength = this._bulletPool.length;
        this._bulletPool = this._bulletPool.filter(bullet => bullet && bullet.isValid);
        const cleanedCount = originalLength - this._bulletPool.length;
        
        if (cleanedCount > 0) {
            console.log(`[SimpleObjectPool] 清理了 ${cleanedCount} 个无效节点，当前池大小: ${this._bulletPool.length}`);
        }
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