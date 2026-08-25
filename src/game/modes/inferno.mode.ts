import type { GameMode } from './types';
import { MixedGenerator } from '../platforms/generators/MixedGenerator';

// ============== 地狱模式 ==============
// 移动平台 + 消失平台（3 秒后破碎），岩浆更快，平台更小更稀疏

export const infernoMode: GameMode = {
    id: 'inferno',
    name: 'mode.inferno.name',
    description: 'mode.inferno.desc',
    icon: '🔥',

    // 引擎数值：重力更强、跳跃更高、移动更快
    gravity: -28,
    jumpPower: 14,
    moveSpeed: 9,
    dashMultiplier: 1.8,
    friction: 0.85,

    // 岩浆：更快追击
    lava: {
        enabled: true,
        riseSpeed: 1.5,
        initialY: -4,
    },

    // 平台：更小、更稀疏
    layerHeight: 3.2,
    platformSize: 4,
    platformsPerLayer: 3,
    range: 9,

    // 混合生成器：50% normal + 25% moving + 25% disappearing
    createGenerator: () => new MixedGenerator({
        probabilities: {
            normal: 0.5,
            moving: 0.25,
            disappearing: 0.25,
        },
        moveRange: [2.5, 4.5],
        moveSpeed: [1.0, 2.0],
        disappearLifespan: 3.0,
        allowVerticalMove: true,   // 允许上下移动
    }),
};
