import { _decorator, Node, Vec3, Graphics, Color, tween } from 'cc';

const { ccclass } = _decorator;

// 特效类型枚举
export enum EffectType {
    HIT = "hit",
    DEATH = "death",
    ATTACK = "attack",
    HEAL = "heal",
    LIGHTNING = "lightning",
    FIRE = "fire"
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
    [EffectType.ATTACK]: {
        color: new Color(255, 0, 0, 150),
        size: 20,
        duration: 300,
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
            case EffectType.HEAL:
            case EffectType.FIRE:
                this.createParticleEffect(graphics, config);
                break;
            case EffectType.LIGHTNING:
                this.createLightningEffect(graphics, config);
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

        // 如果需要淡出效果
        if (config.fadeOut && graphics.node) {
            const node = graphics.node;
            let opacity = config.color.a;

            const fade = () => {
                opacity = Math.max(0, opacity - 10);
                if (opacity > 0 && node.isValid) {
                    graphics.clear();
                    const currentColor = new Color(config.color);
                    currentColor.a = opacity;
                    graphics.fillColor = currentColor;
                    graphics.circle(0, 0, config.size);
                    graphics.fill();

                    tween(node)
                        .delay(0.016)
                        .call(fade)
                        .start();
                }
            };

            fade();
        }
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
    
    
    // 统一的销毁调度
    private static scheduleDestroy(node: Node, duration: number): void {
        if (node && node.isValid) {
            // 转换毫秒为秒，使用 Tween 系统进行延迟销毁
            const delayInSeconds = duration / 1000;
            
            tween(node)
                .delay(delayInSeconds)
                .call(() => {
                    if (node && node.isValid) {
                        node.destroy();
                    }
                })
                .start();
        }
    }
    
    // 创建死亡特效的快捷方法
    public static createDeathEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.DEATH, position, parent);
    }

    // 创建攻击特效的快捷方法
    public static createAttackEffect(position: Vec3, parent: Node): Node {
        return this.createEffect(EffectType.ATTACK, position, parent);
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
        return this.createEffect(EffectType.FIRE, position, parent, {
            color: new Color(255, 100, 0, 180),
            size: 35,
            duration: 500,
            particles: 12
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
    
}