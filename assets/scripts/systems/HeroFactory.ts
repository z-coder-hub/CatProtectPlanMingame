import { _decorator, Component, Node } from 'cc';
import { HeroType } from '../types/GameTypes';
import { HERO_CONFIGS } from '../types/GameConstants';

// 英雄组件导入
import { OrangeCat } from '../components/heroes/OrangeCat';
import { PersianSniper } from '../components/heroes/PersianSniper';
import { BengalHunter } from '../components/heroes/BengalHunter';
import { SiameseMage } from '../components/heroes/SiameseMage';
import { MaineThunder } from '../components/heroes/MaineThunder';
import { NorwegianIce } from '../components/heroes/NorwegianIce';
import { BritishKnight } from '../components/heroes/BritishKnight';
import { RagdollGuardian } from '../components/heroes/RagdollGuardian';
import { ScottishMarksman } from '../components/heroes/ScottishMarksman';
import { AbyssinianArcher } from '../components/heroes/AbyssinianArcher';
import { RussianBlue } from '../components/heroes/RussianBlue';
import { AmericanBomber } from '../components/heroes/AmericanBomber';

const { ccclass } = _decorator;

@ccclass('HeroFactory')
export class HeroFactory {
    
    // 英雄类型到组件类的映射
    private static readonly HERO_COMPONENTS = {
        [HeroType.ORANGE_CAT]: OrangeCat,
        [HeroType.PERSIAN_SNIPER]: PersianSniper,
        [HeroType.BENGAL_HUNTER]: BengalHunter,
        [HeroType.SIAMESE_MAGE]: SiameseMage,
        [HeroType.MAINE_THUNDER]: MaineThunder,
        [HeroType.NORWEGIAN_ICE]: NorwegianIce,
        [HeroType.BRITISH_KNIGHT]: BritishKnight,
        [HeroType.RAGDOLL_GUARDIAN]: RagdollGuardian,
        [HeroType.SCOTTISH_MARKSMAN]: ScottishMarksman,
        [HeroType.ABYSSINIAN_ARCHER]: AbyssinianArcher,
        [HeroType.RUSSIAN_BLUE]: RussianBlue,
        [HeroType.AMERICAN_BOMBER]: AmericanBomber,
    };
    
    /**
     * 创建英雄节点
     * @param heroType 英雄类型
     * @param parent 父节点
     * @returns 创建的英雄节点，如果失败返回null
     */
    public static CreateHero(heroType: HeroType, parent?: Node): Node | null {
        // 检查英雄类型是否有效
        if (!HERO_CONFIGS[heroType]) {
            console.error(`未找到英雄类型配置: ${heroType}`);
            return null;
        }
        
        // 检查是否有对应的组件类
        const ComponentClass = this.HERO_COMPONENTS[heroType];
        if (!ComponentClass) {
            console.error(`英雄组件未实现: ${heroType}`);
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
            const heroComponent = heroNode.addComponent(ComponentClass);
            
            // 验证组件是否正确创建
            if (!heroComponent) {
                console.error(`英雄组件创建失败: ${heroType}`);
                heroNode.destroy();
                return null;
            }
            
            console.log(`英雄创建成功: ${heroType}, 节点名: ${heroNode.name}`);
            return heroNode;
            
        } catch (error) {
            console.error(`创建英雄时发生错误: ${heroType}`, error);
            return null;
        }
    }
    
    /**
     * 批量创建英雄
     * @param heroTypes 英雄类型数组
     * @param parent 父节点
     * @returns 创建成功的英雄节点数组
     */
    public static CreateMultipleHeroes(heroTypes: HeroType[], parent?: Node): Node[] {
        const heroes: Node[] = [];
        
        for (const heroType of heroTypes) {
            const hero = this.CreateHero(heroType, parent);
            if (hero) {
                heroes.push(hero);
            }
        }
        
        console.log(`批量创建英雄完成: ${heroes.length}/${heroTypes.length} 成功`);
        return heroes;
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
     * 检查英雄类型是否可用
     * @param heroType 英雄类型
     * @returns 是否可用
     */
    public static IsHeroAvailable(heroType: HeroType): boolean {
        return !!(HERO_CONFIGS[heroType] && this.HERO_COMPONENTS[heroType]);
    }
    
    /**
     * 获取所有可用的英雄类型
     * @returns 可用英雄类型数组
     */
    public static GetAvailableHeroTypes(): HeroType[] {
        return Object.keys(this.HERO_COMPONENTS) as HeroType[];
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
    
    /**
     * 根据成本过滤可用英雄
     * @param maxCost 最大可承受成本
     * @returns 符合成本要求的英雄类型数组
     */
    public static GetAffordableHeroes(maxCost: number): HeroType[] {
        return this.GetAvailableHeroTypes().filter(heroType => {
            const cost = this.GetHeroCost(heroType);
            return cost <= maxCost;
        });
    }
    
    /**
     * 获取英雄的详细信息（用于UI显示）
     * @param heroType 英雄类型
     * @returns 英雄详细信息
     */
    public static GetHeroInfo(heroType: HeroType): {
        type: HeroType;
        name: string;
        cost: number;
        description: string;
        stats: {
            attack: number;
            range: number;
            speed: number;
        };
        available: boolean;
    } | null {
        const config = HERO_CONFIGS[heroType];
        if (!config) return null;
        
        return {
            type: heroType,
            name: config.name,
            cost: config.cost,
            description: this.GetHeroDescription(heroType),
            stats: {
                attack: config.attackDamage,
                range: config.attackRange,
                speed: config.attackSpeed
            },
            available: this.IsHeroAvailable(heroType)
        };
    }
    
    /**
     * 获取英雄描述
     * @param heroType 英雄类型
     * @returns 英雄描述文本
     */
    private static GetHeroDescription(heroType: HeroType): string {
        const descriptions = {
            [HeroType.ORANGE_CAT]: "基础远程射手，精准射击技能",
            [HeroType.PERSIAN_SNIPER]: "超远程狙击手，高暴击伤害",
            [HeroType.SIAMESE_MAGE]: "AOE法师，元素爆炸攻击",
            [HeroType.BRITISH_KNIGHT]: "重装坦克，冲锋技能",
            [HeroType.BENGAL_HUNTER]: "连发射手，快速攻击",
            [HeroType.MAINE_THUNDER]: "雷电法师，链式攻击",
            [HeroType.NORWEGIAN_ICE]: "冰霜法师，减速控制",
            [HeroType.RAGDOLL_GUARDIAN]: "中型坦克，守护技能",
            [HeroType.SCOTTISH_MARKSMAN]: "多重锁定射手，精确制导",
            [HeroType.ABYSSINIAN_ARCHER]: "扇形箭雨弓箭手，覆盖攻击",
            [HeroType.RUSSIAN_BLUE]: "精英射手，穿透攻击",
            [HeroType.AMERICAN_BOMBER]: "爆破兵，AOE爆炸"
        };
        
        return descriptions[heroType] || "未知英雄";
    }
    
    /**
     * 验证英雄节点是否有效
     * @param heroNode 英雄节点
     * @returns 是否有效
     */
    public static ValidateHeroNode(heroNode: Node): boolean {
        if (!heroNode || !heroNode.isValid) {
            return false;
        }
        
        // 检查是否有有效的英雄组件
        const availableTypes = this.GetAvailableHeroTypes();
        for (const heroType of availableTypes) {
            const ComponentClass = this.HERO_COMPONENTS[heroType];
            if (heroNode.getComponent(ComponentClass)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 获取英雄节点的类型
     * @param heroNode 英雄节点
     * @returns 英雄类型，如果无法确定返回null
     */
    public static GetHeroTypeFromNode(heroNode: Node): HeroType | null {
        if (!heroNode || !heroNode.isValid) {
            return null;
        }
        
        // 检查节点上的英雄组件
        const availableTypes = this.GetAvailableHeroTypes();
        for (const heroType of availableTypes) {
            const ComponentClass = this.HERO_COMPONENTS[heroType];
            const component = heroNode.getComponent(ComponentClass);
            if (component && (component as any).heroType === heroType) {
                return heroType;
            }
        }
        
        return null;
    }
}