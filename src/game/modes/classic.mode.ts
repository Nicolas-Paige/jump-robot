import type { GameMode } from './types';
import { ClassicGenerator } from '../platforms/generators/ClassicGenerator';

// ============== 经典模式 ==============
// 现有玩法：岩浆慢速追击，普通平台，能跳多高跳多高

export const classicMode: GameMode = {
    id: 'classic',
    name: 'mode.classic.name',
    description: 'mode.classic.desc',
    icon: '🌋',

    // 引擎数值（来自原 constants.ts）
    gravity: -25,
    jumpPower: 13,
    moveSpeed: 8,
    dashMultiplier: 1.6,
    friction: 0.85,

    // 岩浆
    lava: {
        enabled: true,
        riseSpeed: 0.8,
        initialY: -8,
    },

    // 平台
    layerHeight: 3.0,
    platformSize: 5,
    platformsPerLayer: 4,
    range: 8,

    // 无限模式，无时间限制
    // timeLimit, winLayer 都不设

    // 生成器工厂
    createGenerator: () => new ClassicGenerator(),

    // hooks：使用默认行为（触岩浆死，无胜利）
};
