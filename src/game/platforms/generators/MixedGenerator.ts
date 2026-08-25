import type { PlatformPlacement } from '../types';
import type { PlatformGenerator, GameModeConfig } from '../../modes/types';
import type { PlatformType, PlatformBehavior } from '../types';

// ============== 混合生成器 ==============
// 按概率分布生成不同类型的平台

export interface MixedGeneratorOptions {
    // 各类型生成概率（总和应 ≤ 1.0，剩余部分按 normal 补足）
    probabilities?: Partial<Record<PlatformType, number>>;
    // 移动平台参数
    moveRange?: [number, number];   // 振幅范围
    moveSpeed?: [number, number];    // 速度范围
    // 消失平台参数
    disappearLifespan?: number;      // 消失倒计时（秒）
    // 是否允许 y 轴移动（默认 false）
    allowVerticalMove?: boolean;
}

export class MixedGenerator implements PlatformGenerator {
    constructor(private opts: MixedGeneratorOptions = {}) {}

    generate(layer: number, config: GameModeConfig): PlatformPlacement[] {
        const placements: PlatformPlacement[] = [];
        const minGap = 1.5;
        const placed: { x: number; z: number }[] = [];
        let attempts = 0;

        while (placed.length < config.platformsPerLayer && attempts < 30) {
            const x = (Math.random() * 2 - 1) * config.range;
            const z = (Math.random() * 2 - 1) * config.range;
            let ok = true;
            for (const q of placed) {
                const dx = Math.abs(x - q.x);
                const dz = Math.abs(z - q.z);
                if (dx < config.platformSize + minGap && dz < config.platformSize + minGap) {
                    ok = false;
                    break;
                }
            }
            if (ok) {
                placements.push(this.makePlacement(layer, x, z, config));
                placed.push({ x, z });
            }
            attempts++;
        }
        // 兜底补够
        while (placed.length < config.platformsPerLayer) {
            const x = (Math.random() * 2 - 1) * config.range;
            const z = (Math.random() * 2 - 1) * config.range;
            placements.push(this.makePlacement(layer, x, z, config));
            placed.push({ x, z });
        }
        return placements;
    }

    private makePlacement(layer: number, x: number, z: number, config: GameModeConfig): PlatformPlacement {
        const type = this.rollType();
        if (type === 'normal') {
            return { layer, x, z, size: config.platformSize, type: 'normal' };
        }
        const behavior = this.makeBehavior(type);
        return { layer, x, z, size: config.platformSize, type, behavior };
    }

    private rollType(): PlatformType {
        const r = Math.random();
        let cum = 0;
        const probs = this.opts.probabilities;
        for (const k in probs) {
            const t = k as PlatformType;
            cum += probs[t] ?? 0;
            if (r < cum) return t;
        }
        return 'normal';
    }

    private makeBehavior(type: PlatformType): PlatformBehavior {
        const opts = this.opts;
        if (type === 'moving') {
            const rangeRange = opts.moveRange ?? [2, 4];
            const speedRange = opts.moveSpeed ?? [0.8, 1.6];
            const moveRange = rangeRange[0] + Math.random() * (rangeRange[1] - rangeRange[0]);
            const moveSpeed = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
            // y 轴移动有概率出现
            const axes: ('x' | 'y' | 'z')[] = opts.allowVerticalMove ? ['x', 'y', 'z'] : ['x', 'z'];
            const moveAxis = axes[Math.floor(Math.random() * axes.length)];
            return {
                type: 'moving',
                moveAxis,
                moveRange,
                moveSpeed,
                movePhase: Math.random() * Math.PI * 2,
            };
        }
        if (type === 'disappearing') {
            return {
                type: 'disappearing',
                lifespan: opts.disappearLifespan ?? 3.0,
            };
        }
        return { type };
    }
}
