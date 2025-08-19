import { _decorator, Component, Node, Vec3, Graphics, Color } from 'cc';

const { ccclass } = _decorator;

// 特效类型枚举
export enum EffectType {
    HIT = "hit",
    DEATH = "death", 
    SKILL = "skill",
    ATTACK = "attack",
    CLICK_FEEDBACK = "click_feedback",
    COOLDOWN_FEEDBACK = "cooldown_feedback",
    MAGIC_EXPLOSION = "magic_explosion",
    CHARGE_IMPACT = "charge_impact", 
    ARMOR_BLOCK = "armor_block",
    HEAL = "heal",
    LIGHTNING = "lightning",
    FIRE = "fire",
    ICE = "ice",
    SHIELD = "shield"
}

// 特效配置接口
export interface EffectConfig {
    color: Color;
    size: number;
    duration: number;
    fadeOut?: boolean;
    expand?: boolean;
    particles?: number;
}

// 预定义特效配置
const EFFECT_CONFIGS: Record<EffectType, EffectConfig> = {
    [EffectType.HIT]: {
        color: new Color(255, 255, 0, 150),
        size: 15,
        duration: 200,
        fadeOut: true
    },
    [EffectType.DEATH]: {
        color: new Color(255, 255, 0, 200),
        size: 20,
        duration: 500,
        particles: 8
    },
    [EffectType.SKILL]: {
        color: new Color(255, 215, 0),
        size: 30,
        duration: 800,
        expand: true
    },
    [EffectType.ATTACK]: {
        color: new Color(255, 0, 0, 150),
        size: 20,
        duration: 300,
        fadeOut: true
    },
    [EffectType.CLICK_FEEDBACK]: {
        color: new Color(255, 215, 0, 200),
        size: 15,
        duration: 600,
        expand: true,
        fadeOut: true
    },
    [EffectType.COOLDOWN_FEEDBACK]: {
        color: new Color(128, 128, 128, 150),
        size: 12,
        duration: 300,
        fadeOut: true
    },
    [EffectType.MAGIC_EXPLOSION]: {
        color: new Color(100, 100, 255, 180),
        size: 25,
        duration: 600,
        expand: true,
        fadeOut: true
    },
    [EffectType.CHARGE_IMPACT]: {
        color: new Color(255, 140, 0, 200),
        size: 30,
        duration: 400,
        expand: true,
        particles: 6
    },
    [EffectType.ARMOR_BLOCK]: {
        color: new Color(255, 215, 0, 180),
        size: 18,
        duration: 350,
        fadeOut: true
    },
    [EffectType.HEAL]: {
        color: new Color(0, 255, 0, 200),
        size: 20,
        duration: 800,
        expand: true,
        particles: 4
    },
    [EffectType.LIGHTNING]: {
        color: new Color(255, 255, 0, 255),
        size: 15,
        duration: 200,
        fadeOut: true
    },
    [EffectType.FIRE]: {
        color: new Color(255, 69, 0, 220),
        size: 22,
        duration: 500,
        expand: true,
        particles: 8
    },
    [EffectType.ICE]: {
        color: new Color(173, 216, 230, 200),
        size: 18,
        duration: 700,
        fadeOut: true
    },
    [EffectType.SHIELD]: {
        color: new Color(0, 191, 255, 150),
        size: 25,
        duration: 1000,
        expand: true
    }
};

@ccclass('EffectHelper')
export class EffectHelper {
    
    // 创建特效
    public static createEffect(
        type: EffectType, 
        position: Vec3, 
        parent: Node, 
        customConfig?: Partial<EffectConfig>
    ): Node {
        const config = { ...EFFECT_CONFIGS[type], ...customConfig };
        const effectNode = new Node(`${type}Effect_${Date.now()}`);
        effectNode.parent = parent;
        effectNode.setPosition(position);
        
        const graphics = effectNode.addComponent(Graphics);
        
        // 根据特效类型绘制
        switch (type) {
            case EffectType.DEATH:
            case EffectType.CHARGE_IMPACT:
            case EffectType.HEAL:
            case EffectType.FIRE:
                this.createParticleEffect(graphics, config);
                break;
            case EffectType.SKILL:
            case EffectType.SHIELD:
                this.createSkillGraphics(graphics, config, effectNode);
                break;
            case EffectType.CLICK_FEEDBACK:
            case EffectType.MAGIC_EXPLOSION:
                this.createExpandingEffect(graphics, config, effectNode);
                break;
            case EffectType.LIGHTNING:
                this.createLightningEffect(graphics, config);
                break;
            case EffectType.ICE:
                this.createIceEffect(graphics, config);
                break;
            default:
                this.createSimpleEffect(graphics, config);
                break;
        }
        
        // 设置自动销毁
        this.scheduleDestroy(effectNode, config.duration);
        
        return effectNode;
    }
    
    // 创建简单圆形特效
    private static createSimpleEffect(graphics: Graphics, config: EffectConfig): void {
        graphics.fillColor = config.color;
        graphics.circle(0, 0, config.size);
        graphics.fill();
    }
    
    // 创建粒子特效
    private static createParticleEffect(graphics: Graphics, config: EffectConfig): void {
        const particles = config.particles || 8;
        for (let i = 0; i < particles; i++) {
            const angle = (i / particles) * Math.PI * 2;
            const x = Math.cos(angle) * config.size;
            const y = Math.sin(angle) * config.size;
            
            graphics.fillColor = config.color;
            graphics.circle(x, y, 3);
            graphics.fill();
        }
    }
    
    // 创建技能环形特效
    private static createSkillGraphics(graphics: Graphics, config: EffectConfig, node: Node): void {
        if (config.expand) {
            this.createExpandingRing(graphics, config, node);
        } else {
            graphics.strokeColor = config.color;
            graphics.lineWidth = 3;
            graphics.circle(0, 0, config.size);
            graphics.stroke();
        }
    }
    
    // 创建扩散特效
    private static createExpandingEffect(graphics: Graphics, config: EffectConfig, node: Node): void {
        let scale = 1;
        let opacity = config.color.a;
        const originalOpacity = opacity;
        
        const animate = () => {
            scale += 0.1;
            if (config.fadeOut) {
                opacity = Math.max(0, opacity - 15);
            }
            
            if (graphics && node.isValid && opacity > 0) {
                graphics.clear();
                const currentColor = new Color(config.color);
                currentColor.a = opacity;
                graphics.fillColor = currentColor;
                graphics.circle(0, 0, config.size * scale);
                graphics.fill();
                
                // 使用 setTimeout 因为这是静态工具类
                setTimeout(animate, 16); // 约60FPS
            }
        };
        
        animate();
    }
    
    // 创建扩散环形特效
    private static createExpandingRing(graphics: Graphics, config: EffectConfig, node: Node): void {
        let radius = config.size;
        const maxRadius = config.size * 2.5;
        
        const expand = () => {
            radius += 5;
            if (graphics && node.isValid && radius < maxRadius) {
                graphics.clear();
                const alpha = Math.max(0, 255 - (radius - config.size) * 3);
                const currentColor = new Color(config.color);
                currentColor.a = alpha;
                
                graphics.strokeColor = currentColor;
                graphics.lineWidth = 3;
                graphics.circle(0, 0, radius);
                graphics.stroke();
                
                // 使用 setTimeout 因为这是静态工具类
                setTimeout(expand, 33); // 30FPS for smoother expansion
            }
        };
        
        expand();
    }
    
    // 创建闪电特效
    private static createLightningEffect(graphics: Graphics, config: EffectConfig): void {
        graphics.strokeColor = config.color;
        graphics.lineWidth = 3;
        
        // 绘制随机闪电路径
        const segments = 5;
        const zigzagRange = config.size * 0.3;
        let currentX = 0;
        let currentY = -config.size;
        
        graphics.moveTo(currentX, currentY);
        
        for (let i = 1; i <= segments; i++) {
            const progress = i / segments;
            const targetY = config.size * progress * 2 - config.size;
            const randomOffset = (Math.random() - 0.5) * zigzagRange;
            
            currentX += randomOffset;
            currentY = targetY;
            
            graphics.lineTo(currentX, currentY);
        }
        
        graphics.stroke();
        
        // 添加闪电球
        graphics.fillColor = config.color;
        graphics.circle(0, 0, 4);
        graphics.fill();
    }
    
    // 创建冰冻特效
    private static createIceEffect(graphics: Graphics, config: EffectConfig): void {
        // 绘制冰晶效果
        graphics.fillColor = config.color;
        graphics.circle(0, 0, config.size);
        graphics.fill();
        
        // 绘制冰晶线条
        graphics.strokeColor = new Color(135, 206, 250, 255); // 淡蓝色
        graphics.lineWidth = 2;
        
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * config.size * 0.8;
            const y = Math.sin(angle) * config.size * 0.8;
            
            graphics.moveTo(0, 0);
            graphics.lineTo(x, y);
        }
        
        graphics.stroke();
    }
    
    // 统一的销毁调度
    private static scheduleDestroy(node: Node, duration: number): void {
        if (node && node.isValid) {
            // 使用setTimeout而不是scheduleOnce，因为这是静态工具类
            setTimeout(() => {
                if (node && node.isValid) {
                    node.destroy();
                }
            }, duration);
        }
    }
    
    // 创建击中特效的快捷方法
    public static createHitEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.HIT, position, parent);
    }
    
    // 创建死亡特效的快捷方法
    public static createDeathEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.DEATH, position, parent);
    }
    
    // 创建技能特效的快捷方法  
    public static createSkillEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.SKILL, position, parent);
    }
    
    // 创建攻击特效的快捷方法
    public static createAttackEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.ATTACK, position, parent);
    }
    
    // 创建点击反馈特效的快捷方法
    public static createClickFeedback(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.CLICK_FEEDBACK, position, parent);
    }
    
    // 创建冷却反馈特效的快捷方法
    public static createCooldownFeedback(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.COOLDOWN_FEEDBACK, position, parent);
    }
    
    // 创建魔法爆炸特效的快捷方法
    public static createMagicExplosion(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.MAGIC_EXPLOSION, position, parent);
    }
    
    // 创建冲锋冲击特效的快捷方法
    public static createChargeImpact(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.CHARGE_IMPACT, position, parent);
    }
    
    // 创建护甲阻挡特效的快捷方法
    public static createArmorBlock(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.ARMOR_BLOCK, position, parent);
    }
    
    // 创建治疗特效的快捷方法
    public static createHealEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.HEAL, position, parent);
    }
    
    // 创建闪电特效的快捷方法
    public static createLightning(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.LIGHTNING, position, parent);
    }
    
    // 创建火焰特效的快捷方法
    public static createFire(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.FIRE, position, parent);
    }
    
    // 创建冰冻特效的快捷方法
    public static createIce(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.ICE, position, parent);
    }
    
    // 创建护盾特效的快捷方法
    public static createShield(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.SHIELD, position, parent);
    }
    
    // === 新增的特效方法 ===
    
    // 创建暴击特效
    public static createCriticalHitEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.HIT, position, parent, {
            color: new Color(255, 100, 0, 200),
            size: 25,
            duration: 400,
            expand: true
        });
    }
    
    // 创建魔法击中特效
    public static createMagicHitEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.MAGIC_EXPLOSION, position, parent, {
            color: new Color(150, 100, 255, 180),
            size: 18,
            duration: 300
        });
    }
    
    // 创建近战击中特效
    public static createMeleeHitEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.ATTACK, position, parent, {
            color: new Color(255, 150, 0, 200),
            size: 15,
            duration: 200
        });
    }
    
    // 创建冲锋击中特效
    public static createChargeHitEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.CHARGE_IMPACT, position, parent);
    }
    
    // 创建冲锋效果
    public static createChargeEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.SHIELD, position, parent, {
            color: new Color(255, 215, 0, 120),
            size: 30,
            duration: 3000
        });
    }
    
    // 创建护甲效果
    public static createArmorEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.ARMOR_BLOCK, position, parent);
    }
    
    // 创建城堡攻击特效
    public static createCastleAttackEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.FIRE, position, parent, {
            color: new Color(255, 0, 0, 220),
            size: 30,
            duration: 600
        });
    }
    
    // 创建敌人死亡特效
    public static createEnemyDeathEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.DEATH, position, parent, {
            color: new Color(255, 255, 0, 200),
            particles: 12
        });
    }
    
    // 创建敌人受伤特效
    public static createEnemyHurtEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.HIT, position, parent, {
            color: new Color(255, 0, 0, 150),
            size: 12,
            duration: 150
        });
    }
    
    // 创建咆哮特效
    public static createRoarEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.ATTACK, position, parent, {
            color: new Color(255, 100, 0, 180),
            size: 35,
            duration: 500,
            expand: true
        });
    }
    
    // 创建狂暴特效
    public static createBerserkEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.FIRE, position, parent, {
            color: new Color(200, 0, 0, 200),
            size: 40,
            duration: 800,
            particles: 15
        });
    }
    
    // 创建金币掉落特效
    public static createGoldDropEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.HEAL, position, parent, {
            color: new Color(255, 215, 0, 255),
            size: 20,
            duration: 1000,
            particles: 8
        });
    }
    
    // 创建速度爆发特效
    public static createSpeedBurstEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.LIGHTNING, position, parent, {
            color: new Color(255, 255, 100, 255),
            size: 25,
            duration: 300
        });
    }
    
    // 创建速度启动特效
    public static createSpeedStartEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.CLICK_FEEDBACK, position, parent, {
            color: new Color(200, 200, 50, 200),
            size: 20,
            duration: 400
        });
    }
    
    // 创建爆炸效果（带范围显示）
    public static createExplosionEffect(position: Vec3, parent: Node, range: number = 80): Node {
        const effectNode = this.createEffect(EffectType.MAGIC_EXPLOSION, position, parent, {
            color: new Color(255, 100, 0, 180),
            size: range / 3,
            duration: 800,
            expand: true
        });
        
        // 添加范围圈显示
        setTimeout(() => {
            if (parent && parent.isValid) {
                this.createEffect(EffectType.SKILL, position, parent, {
                    color: new Color(255, 100, 0, 100),
                    size: range,
                    duration: 200
                });
            }
        }, 100);
        
        return effectNode;
    }
}