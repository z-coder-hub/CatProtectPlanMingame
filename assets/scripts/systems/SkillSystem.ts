import { _decorator, Component, Node, Vec3 } from 'cc';
import { HeroType } from '../types/GameTypes';

const { ccclass, property } = _decorator;

// 技能目标类型
export enum SkillTargetType {
    ENEMY = "enemy",           // 敌人目标
    GROUND = "ground",         // 地面位置
    SELF = "self",            // 自身
    ALLY = "ally",            // 友军
    ALL_ENEMIES = "all_enemies" // 所有敌人
}

// 技能效果类型
export enum SkillEffectType {
    DAMAGE = "damage",         // 伤害
    HEAL = "heal",            // 治疗
    BUFF = "buff",            // 增益
    DEBUFF = "debuff",        // 减益
    SUMMON = "summon",        // 召唤
    TELEPORT = "teleport"     // 传送
}

// 技能配置接口
export interface SkillConfig {
    id: string;                    // 技能ID
    name: string;                  // 技能名称
    description: string;           // 技能描述
    cooldown: number;              // 冷却时间（秒）
    manaCost?: number;             // 法力消耗（预留）
    targetType: SkillTargetType;   // 目标类型
    effectType: SkillEffectType;   // 效果类型
    range?: number;                // 技能范围
    duration?: number;             // 效果持续时间
    damage?: number;               // 伤害值
    damageMultiplier?: number;     // 伤害倍率
    healAmount?: number;           // 治疗量
    buffEffect?: any;              // 增益效果（预留）
    debuffEffect?: any;            // 减益效果（预留）
}

// 技能实例接口
export interface SkillInstance {
    config: SkillConfig;           // 技能配置
    cooldownRemaining: number;     // 剩余冷却时间
    level: number;                 // 技能等级（预留）
    owner: Node;                   // 技能拥有者
}

// 英雄技能配置
export const HERO_SKILLS: Record<HeroType, SkillConfig[]> = {
    [HeroType.ORANGE_CAT]: [
        {
            id: "orange_cat_precision_shot",
            name: "精准射击",
            description: "对单个目标造成300%攻击力的伤害",
            cooldown: 5,
            targetType: SkillTargetType.ENEMY,
            effectType: SkillEffectType.DAMAGE,
            range: 150,
            damageMultiplier: 3.0
        }
    ],
    [HeroType.SIAMESE_CAT]: [
        {
            id: "siamese_cat_magic_storm",
            name: "魔法风暴",
            description: "对所有敌人造成200%攻击力的魔法伤害",
            cooldown: 8,
            targetType: SkillTargetType.ALL_ENEMIES,
            effectType: SkillEffectType.DAMAGE,
            damageMultiplier: 2.0
        },
        {
            id: "siamese_cat_freeze",
            name: "冰冻术",
            description: "冻结目标敌人2秒，使其无法移动",
            cooldown: 12,
            targetType: SkillTargetType.ENEMY,
            effectType: SkillEffectType.DEBUFF,
            range: 180,
            duration: 2
        }
    ],
    [HeroType.MAINE_CAT]: [
        {
            id: "maine_cat_bombardment",
            name: "炮击轰炸",
            description: "对所有敌人造成250%攻击力的爆炸伤害",
            cooldown: 10,
            targetType: SkillTargetType.ALL_ENEMIES,
            effectType: SkillEffectType.DAMAGE,
            damageMultiplier: 2.5
        },
        {
            id: "maine_cat_armor_break",
            name: "破甲冲击",
            description: "冲锋攻击，无视敌人护甲，造成400%攻击力伤害",
            cooldown: 15,
            targetType: SkillTargetType.ENEMY,
            effectType: SkillEffectType.DAMAGE,
            range: 200,
            damageMultiplier: 4.0
        }
    ]
};

@ccclass('SkillSystem')
export class SkillSystem extends Component {
    
    private static _instance: SkillSystem | null = null;
    
    // 活跃技能实例
    private _activeSkills: Map<string, SkillInstance> = new Map();
    
    // 技能效果回调
    private _skillEffectCallbacks: Map<string, Function> = new Map();
    
    public static get instance(): SkillSystem | null {
        return this._instance;
    }
    
    protected onLoad(): void {
        if (SkillSystem._instance === null) {
            SkillSystem._instance = this;
        } else {
            this.destroy();
            return;
        }
        
        this.initializeSkillSystem();
    }
    
    protected onDestroy(): void {
        if (SkillSystem._instance === this) {
            SkillSystem._instance = null;
        }
    }
    
    // 初始化技能系统
    private initializeSkillSystem(): void {
        console.log("技能系统初始化完成");
        
        // 注册默认技能效果回调
        this.registerSkillEffectCallbacks();
    }
    
    // 注册技能效果回调
    private registerSkillEffectCallbacks(): void {
        // 伤害效果回调
        this._skillEffectCallbacks.set('damage', (skill: SkillInstance, target?: Node, position?: Vec3) => {
            this.applyDamageEffect(skill, target, position);
        });
        
        // 治疗效果回调（预留）
        this._skillEffectCallbacks.set('heal', (skill: SkillInstance, target?: Node) => {
            this.applyHealEffect(skill, target);
        });
        
        // 增益效果回调（预留）
        this._skillEffectCallbacks.set('buff', (skill: SkillInstance, target?: Node) => {
            this.applyBuffEffect(skill, target);
        });
        
        // 减益效果回调（预留）
        this._skillEffectCallbacks.set('debuff', (skill: SkillInstance, target?: Node) => {
            this.applyDebuffEffect(skill, target);
        });
    }
    
    // 为英雄创建技能实例
    public createHeroSkills(heroNode: Node, heroType: HeroType): SkillInstance[] {
        const skillConfigs = HERO_SKILLS[heroType] || [];
        const skillInstances: SkillInstance[] = [];
        
        for (const config of skillConfigs) {
            const skillInstance: SkillInstance = {
                config: config,
                cooldownRemaining: 0,
                level: 1,
                owner: heroNode
            };
            
            const skillKey = `${heroNode.uuid}_${config.id}`;
            this._activeSkills.set(skillKey, skillInstance);
            skillInstances.push(skillInstance);
        }
        
        return skillInstances;
    }
    
    // 使用技能
    public useSkill(skillInstance: SkillInstance, target?: Node, position?: Vec3): boolean {
        if (!this.canUseSkill(skillInstance)) {
            return false;
        }
        
        // 设置冷却时间
        skillInstance.cooldownRemaining = skillInstance.config.cooldown;
        
        // 执行技能效果
        this.executeSkillEffect(skillInstance, target, position);
        
        console.log(`${skillInstance.owner.name} 使用技能: ${skillInstance.config.name}`);
        return true;
    }
    
    // 检查技能是否可用
    public canUseSkill(skillInstance: SkillInstance): boolean {
        return skillInstance.cooldownRemaining <= 0;
    }
    
    // 获取技能冷却剩余时间
    public getSkillCooldownRemaining(skillInstance: SkillInstance): number {
        return Math.max(0, skillInstance.cooldownRemaining);
    }
    
    // 更新技能冷却（每帧调用）
    public updateSkillCooldowns(dt: number): void {
        for (const skillInstance of this._activeSkills.values()) {
            if (skillInstance.cooldownRemaining > 0) {
                skillInstance.cooldownRemaining -= dt;
            }
        }
    }
    
    // 执行技能效果
    private executeSkillEffect(skillInstance: SkillInstance, target?: Node, position?: Vec3): void {
        const effectCallback = this._skillEffectCallbacks.get(skillInstance.config.effectType);
        if (effectCallback) {
            effectCallback(skillInstance, target, position);
        } else {
            console.warn(`未找到技能效果回调: ${skillInstance.config.effectType}`);
        }
    }
    
    // 应用伤害效果
    private applyDamageEffect(skill: SkillInstance, target?: Node, position?: Vec3): void {
        const ownerUnit = skill.owner.getComponent('BaseHero');
        if (!ownerUnit) return;
        
        const baseDamage = ownerUnit.attackDamage;
        const actualDamage = skill.config.damageMultiplier ? 
            baseDamage * skill.config.damageMultiplier : 
            (skill.config.damage || baseDamage);
        
        switch (skill.config.targetType) {
            case SkillTargetType.ENEMY:
                if (target) {
                    const targetUnit = target.getComponent('BaseMouse');
                    if (targetUnit) {
                        targetUnit.takeDamage(actualDamage);
                    }
                }
                break;
                
            case SkillTargetType.ALL_ENEMIES:
                this.applyDamageToAllEnemies(actualDamage);
                break;
                
            case SkillTargetType.GROUND:
                if (position) {
                    this.applyAreaDamage(actualDamage, position, skill.config.range || 100);
                }
                break;
        }
    }
    
    // 对所有敌人造成伤害
    private applyDamageToAllEnemies(damage: number): void {
        const BattleManager = require('../managers/BattleManager').BattleManager;
        const battleManager = BattleManager.instance;
        
        if (battleManager) {
            const enemies = battleManager.GetAllEnemies();
            for (const enemy of enemies) {
                const enemyUnit = enemy.getComponent('BaseMouse');
                if (enemyUnit && enemyUnit.isAlive) {
                    enemyUnit.takeDamage(damage);
                }
            }
        }
    }
    
    // 区域伤害
    private applyAreaDamage(damage: number, center: Vec3, radius: number): void {
        const BattleManager = require('../managers/BattleManager').BattleManager;
        const battleManager = BattleManager.instance;
        
        if (battleManager) {
            const enemies = battleManager.GetAllEnemies();
            for (const enemy of enemies) {
                const distance = Vec3.distance(enemy.position, center);
                if (distance <= radius) {
                    const enemyUnit = enemy.getComponent('BaseMouse');
                    if (enemyUnit && enemyUnit.isAlive) {
                        enemyUnit.takeDamage(damage);
                    }
                }
            }
        }
    }
    
    // 应用治疗效果（预留）
    private applyHealEffect(skill: SkillInstance, target?: Node): void {
        console.log("治疗效果（暂未实现）");
    }
    
    // 应用增益效果（预留）
    private applyBuffEffect(skill: SkillInstance, target?: Node): void {
        console.log("增益效果（暂未实现）");
    }
    
    // 应用减益效果（预留）
    private applyDebuffEffect(skill: SkillInstance, target?: Node): void {
        console.log("减益效果（暂未实现）");
    }
    
    // 移除英雄技能
    public removeHeroSkills(heroNode: Node): void {
        const keysToRemove: string[] = [];
        
        for (const [key, skill] of this._activeSkills.entries()) {
            if (skill.owner === heroNode) {
                keysToRemove.push(key);
            }
        }
        
        for (const key of keysToRemove) {
            this._activeSkills.delete(key);
        }
    }
    
    // 获取英雄的所有技能
    public getHeroSkills(heroNode: Node): SkillInstance[] {
        const skills: SkillInstance[] = [];
        
        for (const skill of this._activeSkills.values()) {
            if (skill.owner === heroNode) {
                skills.push(skill);
            }
        }
        
        return skills;
    }
    
    // 通过技能ID获取技能配置
    public getSkillConfig(skillId: string): SkillConfig | null {
        for (const heroSkills of Object.values(HERO_SKILLS)) {
            for (const skill of heroSkills) {
                if (skill.id === skillId) {
                    return skill;
                }
            }
        }
        return null;
    }
    
    protected update(dt: number): void {
        // 更新所有技能冷却
        this.updateSkillCooldowns(dt);
    }
}