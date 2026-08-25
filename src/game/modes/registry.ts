import type { GameMode } from './types';
import { classicMode } from './classic.mode';
import { infernoMode } from './inferno.mode';

// ============== 模式注册表 ==============
// UI 通过此表查询所有可用模式

export const MODES: GameMode[] = [
    classicMode,
    infernoMode,
];

export function getModeById(id: string): GameMode | undefined {
    return MODES.find(m => m.id === id);
}

export const DEFAULT_MODE = classicMode;
