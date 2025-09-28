import { _decorator, Node } from 'cc';
import { HeroType } from '../types/GameTypes';
import { HERO_CONFIGS } from '../types/GameConstants';
import { BaseHero } from '../components/heroes/BaseHero';

// 英雄组件导入
import { OrangeCat } from '../components/heroes/OrangeCat';
import { PersianSniper } from '../components/heroes/PersianSniper';
import { BengalHunter } from '../components/heroes/BengalHunter';
import { SiameseMage } from '../components/heroes/SiameseMage';
import { MaineThunder } from '../components/heroes/MaineThunder';
import { NorwegianIce } from '../components/heroes/NorwegianIce';
import { BritishKnight } from '../components/heroes/BritishKnight';
import { ScottishMarksman } from '../components/heroes/ScottishMarksman';
import { AbyssinianArcher } from '../components/heroes/AbyssinianArcher';
import { RussianBlue } from '../components/heroes/RussianBlue';
import { AmericanBomber } from '../components/heroes/AmericanBomber';

const { ccclass } = _decorator;

/**
 * 英雄自动注册装饰器
 * 使用方式：@RegisterHero(HeroType.ORANGE_CAT)
 *
 * 遵循开闭原则：新增英雄时无需修改工厂类，只需使用此装饰器
 *
 * 示例：
 * ```typescript
 * @RegisterHero(HeroType.NEW_HERO)
 * export class NewHero extends BaseHero {
 *     // 英雄实现
 * }
 * ```
 */
export function RegisterHero(heroType: HeroType) {
    return function<T extends new (...args: any[]) => BaseHero>(constructor: T) {
        // 自动注册到工厂
        HeroFactory.registerHeroClass(heroType, constructor as new () => BaseHero);
        return constructor;
    };
}

@ccclass('HeroFactory')
export class HeroFactory {

    // 动态注册表 - 支持装饰器自动注册
    private static _heroRegistry: Map<HeroType, new () => BaseHero> = new Map();

    // 静态初始化 - 注册现有英雄（向后兼容）
    private static _initialized = false;

    /**
     * 初始化现有英雄注册（仅执行一次）
     */
    private static initializeRegistry(): void {
        if (this._initialized) return;

        // 注册现有英雄类型（向后兼容）
        this._heroRegistry.set(HeroType.ORANGE_CAT, OrangeCat);
        this._heroRegistry.set(HeroType.PERSIAN_SNIPER, PersianSniper);
        this._heroRegistry.set(HeroType.BENGAL_HUNTER, BengalHunter);
        this._heroRegistry.set(HeroType.SIAMESE_MAGE, SiameseMage);
        this._heroRegistry.set(HeroType.MAINE_THUNDER, MaineThunder);
        this._heroRegistry.set(HeroType.NORWEGIAN_ICE, NorwegianIce);
        this._heroRegistry.set(HeroType.BRITISH_KNIGHT, BritishKnight);
        this._heroRegistry.set(HeroType.SCOTTISH_MARKSMAN, ScottishMarksman);
        this._heroRegistry.set(HeroType.ABYSSINIAN_ARCHER, AbyssinianArcher);
        this._heroRegistry.set(HeroType.RUSSIAN_BLUE, RussianBlue);
        this._heroRegistry.set(HeroType.AMERICAN_BOMBER, AmericanBomber);

        this._initialized = true;
        console.log(`[HeroFactory] 📝 已注册 ${this._heroRegistry.size} 种英雄类型`);
    }

    /**
     * 注册英雄类（供装饰器使用）
     * @param heroType 英雄类型
     * @param heroClass 英雄类构造函数
     */
    public static registerHeroClass(heroType: HeroType, heroClass: new () => BaseHero): void {
        this.initializeRegistry();

        if (this._heroRegistry.has(heroType)) {
            console.warn(`[HeroFactory] ⚠️ 英雄类型 ${heroType} 已存在，将被覆盖`);
        }

        this._heroRegistry.set(heroType, heroClass);
        console.log(`[HeroFactory] ✅ 注册英雄类型: ${heroType}`);
    }
    
    /**
     * 创建英雄节点
     * @param heroType 英雄类型
     * @param parent 父节点
     * @returns 创建的英雄节点，如果失败返回null
     */
    public static CreateHero(heroType: HeroType, parent?: Node): Node | null {
        this.initializeRegistry();

        // 检查英雄类型是否有效
        if (!HERO_CONFIGS[heroType]) {
            console.error(`[HeroFactory] ❌ 未找到英雄类型配置: ${heroType}`);
            return null;
        }

        // 从注册表获取英雄类
        const ComponentClass = this._heroRegistry.get(heroType);
        if (!ComponentClass) {
            console.error(`[HeroFactory] ❌ 英雄组件未注册: ${heroType}`);
            return null;
        }

        try {
            // 创建英雄节点
            const heroNode = new Node(`Hero_${heroType}_${Date.now()}`);

            // 设置父节点
            if (parent) {
                heroNode.parent = parent;
            }

            // 添加英雄组件
            const heroComponent = heroNode.addComponent(ComponentClass as any);

            // 验证组件是否正确创建
            if (!heroComponent) {
                console.error(`[HeroFactory] ❌ 英雄组件创建失败: ${heroType}`);
                heroNode.destroy();
                return null;
            }

            console.log(`[HeroFactory] ✅ 英雄创建成功: ${heroType}, 节点名: ${heroNode.name}`);
            return heroNode;

        } catch (error) {
            console.error(`[HeroFactory] ❌ 创建英雄时发生错误: ${heroType}`, error);
            return null;
        }
    }
    
    
    /**
     * 获取英雄配置信息
     * @param heroType 英雄类型
     * @returns 英雄配置，如果不存在返回null
     */
    public static GetHeroConfig(heroType: HeroType) {
        return HERO_CONFIGS[heroType] || null;
    }

    /**
     * 获取英雄部署成本
     * @param heroType 英雄类型
     * @returns 部署成本，如果英雄不存在返回0
     */
    public static GetHeroCost(heroType: HeroType): number {
        const config = HERO_CONFIGS[heroType];
        return config ? config.cost : 0;
    }
    
    

}