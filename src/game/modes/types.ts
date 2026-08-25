import type { PlatformPlacement } from '../platforms/types';
import type { Platform } from '../types';

// ============== 模式定义 ==============

// 游戏上下文（传给模式 hooks 的运行时信息）
export interface GameContext {
    currentLayer: number;
    bestLayer: number;
    timeElapsed: number;       // 已运行时间（秒）
    timeRemaining?: number;   // 剩余时间（秒，倒计时模式用）
    playerFootY: number;
    lavaY: number;
}

// 模式生命周期 hooks
export interface GameModeHooks {
    // 模式初始化（进入游戏时）
    onEnter?: (ctx: GameContext) => void;
    // 模式退出
    onExit?: (ctx: GameContext) => void;
    // 每帧更新（移动平台、消失倒计时等模式特有逻辑可在这里触发）
    onUpdate?: (delta: number, ctx: GameContext) => void;
    // 玩家落地后
    onPlayerLanded?: (platform: Platform, ctx: GameContext) => void;
    // 自定义胜利判定（默认无胜利）
    checkWin?: (ctx: GameContext) => boolean;
    // 自定义死亡判定（默认 = 触岩浆）
    checkDeath?: (ctx: GameContext) => boolean;
}

// 模式配置（数值 + 行为）
export interface GameModeConfig {
    id: string;
    name: string;            // i18n key，如 'mode.classic.name'
    description: string;     // i18n key
    icon: string;            // emoji 或图片 URL

    // 引擎数值
    gravity: number;
    jumpPower: number;
    moveSpeed: number;
    dashMultiplier: number;
    friction: number;        // 地面摩擦系数（0-1）

    // 岩浆
    lava: {
        enabled: boolean;
        riseSpeed: number;
        initialY: number;
    };

    // 平台
    layerHeight: number;
    platformSize: number;     // 单个平台边长
    platformsPerLayer: number;
    range: number;            // 平台水平随机范围

    // 胜负条件
    timeLimit?: number;       // 倒计时秒数（无 = 无限）
    winLayer?: number;        // 登顶层数（无 = 无限）
}

// 完整模式：配置 + 生成器工厂 + hooks
export interface GameMode extends GameModeConfig, GameModeHooks {
    // 平台生成器工厂（每次开始游戏创建新实例）
    createGenerator: () => PlatformGenerator;
}

// 平台生成器接口
export interface PlatformGenerator {
    // 生成一整层平台
    generate(layer: number, config: GameModeConfig): PlatformPlacement[];
}
