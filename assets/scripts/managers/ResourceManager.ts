import { _decorator, Component, resources, Prefab, SpriteFrame, AudioClip, instantiate, Node } from 'cc';

const { ccclass, property } = _decorator;

// 资源类型枚举
export enum ResourceType {
    PREFAB = 'prefab',
    SPRITE = 'sprite', 
    AUDIO = 'audio',
    ANIMATION = 'animation'
}

// 资源加载结果
export interface ResourceLoadResult<T> {
    success: boolean;
    resource?: T;
    error?: string;
}

@ccclass('ResourceManager')
export class ResourceManager extends Component {
    
    @property({ tooltip: "是否启用资源缓存" })
    public enableCache: boolean = true;
    
    // 资源缓存
    private _resourceCache = new Map<string, any>();
    
    // 单例实例
    private static _instance: ResourceManager | null = null;
    
    public static get instance(): ResourceManager | null {
        return ResourceManager._instance;
    }
    
    protected onLoad(): void {
        // 设置单例
        if (ResourceManager._instance) {
            console.warn("ResourceManager实例已存在，销毁重复实例");
            this.node.destroy();
            return;
        }
        
        ResourceManager._instance = this;
        console.log("ResourceManager初始化完成");
    }
    
    protected onDestroy(): void {
        if (ResourceManager._instance === this) {
            ResourceManager._instance = null;
        }
        this.clearCache();
    }
    
    // 加载预制体
    public async loadPrefab(path: string): Promise<ResourceLoadResult<Prefab>> {
        return this.loadResource<Prefab>(path, Prefab, ResourceType.PREFAB);
    }
    
    // 加载精灵帧
    public async loadSprite(path: string): Promise<ResourceLoadResult<SpriteFrame>> {
        return this.loadResource<SpriteFrame>(path, SpriteFrame, ResourceType.SPRITE);
    }
    
    // 加载音频
    public async loadAudio(path: string): Promise<ResourceLoadResult<AudioClip>> {
        return this.loadResource<AudioClip>(path, AudioClip, ResourceType.AUDIO);
    }
    
    // 通用资源加载方法
    private async loadResource<T>(
        path: string, 
        type: any, 
        resourceType: ResourceType
    ): Promise<ResourceLoadResult<T>> {
        try {
            // 检查缓存
            const cacheKey = `${resourceType}_${path}`;
            if (this.enableCache && this._resourceCache.has(cacheKey)) {
                return {
                    success: true,
                    resource: this._resourceCache.get(cacheKey) as T
                };
            }
            
            // 异步加载资源
            const resource = await this.loadResourceAsync<T>(path, type);
            
            // 添加到缓存
            if (this.enableCache) {
                this._resourceCache.set(cacheKey, resource);
            }
            
            return {
                success: true,
                resource: resource
            };
            
        } catch (error) {
            console.error(`加载资源失败: ${path}`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    
    // Promise版本的资源加载
    private loadResourceAsync<T>(path: string, type: any): Promise<T> {
        return new Promise((resolve, reject) => {
            resources.load(path, type, (err: Error | null, resource: T) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resource);
                }
            });
        });
    }
    
    // 创建预制体实例
    public async createPrefabInstance(path: string): Promise<Node | null> {
        const result = await this.loadPrefab(path);
        
        if (result.success && result.resource) {
            return instantiate(result.resource);
        }
        
        console.error(`创建预制体实例失败: ${path}`, result.error);
        return null;
    }
    
    // 预加载资源列表
    public async preloadResources(resourcePaths: Array<{path: string, type: ResourceType}>): Promise<void> {
        console.log(`开始预加载 ${resourcePaths.length} 个资源...`);
        
        const loadPromises = resourcePaths.map(async ({ path, type }) => {
            try {
                switch (type) {
                    case ResourceType.PREFAB:
                        await this.loadPrefab(path);
                        break;
                    case ResourceType.SPRITE:
                        await this.loadSprite(path);
                        break;
                    case ResourceType.AUDIO:
                        await this.loadAudio(path);
                        break;
                    default:
                        console.warn(`未知的资源类型: ${type}`);
                }
                console.log(`预加载成功: ${path}`);
            } catch (error) {
                console.error(`预加载失败: ${path}`, error);
            }
        });
        
        await Promise.all(loadPromises);
        console.log("资源预加载完成");
    }
    
    // 获取缓存的资源
    public getCachedResource<T>(path: string, resourceType: ResourceType): T | null {
        const cacheKey = `${resourceType}_${path}`;
        return this._resourceCache.get(cacheKey) || null;
    }
    
    // 移除缓存的资源
    public removeCachedResource(path: string, resourceType: ResourceType): boolean {
        const cacheKey = `${resourceType}_${path}`;
        return this._resourceCache.delete(cacheKey);
    }
    
    // 清理所有缓存
    public clearCache(): void {
        this._resourceCache.clear();
        console.log("资源缓存已清理");
    }
    
    // 获取缓存统计信息
    public getCacheStats(): { count: number; keys: string[] } {
        return {
            count: this._resourceCache.size,
            keys: Array.from(this._resourceCache.keys())
        };
    }
    
    // 检查资源是否已缓存
    public isResourceCached(path: string, resourceType: ResourceType): boolean {
        const cacheKey = `${resourceType}_${path}`;
        return this._resourceCache.has(cacheKey);
    }
}

// 静态访问方法，方便其他组件使用
export class ResourceManagerHelper {
    
    public static async loadPrefab(path: string): Promise<ResourceLoadResult<Prefab>> {
        const manager = ResourceManager.instance;
        if (!manager) {
            return { success: false, error: "ResourceManager未初始化" };
        }
        return manager.loadPrefab(path);
    }
    
    public static async loadSprite(path: string): Promise<ResourceLoadResult<SpriteFrame>> {
        const manager = ResourceManager.instance;
        if (!manager) {
            return { success: false, error: "ResourceManager未初始化" };
        }
        return manager.loadSprite(path);
    }
    
    public static async createPrefabInstance(path: string): Promise<Node | null> {
        const manager = ResourceManager.instance;
        if (!manager) {
            console.error("ResourceManager未初始化");
            return null;
        }
        return manager.createPrefabInstance(path);
    }
}