import type { PlatformPlacement } from '../types';
import type { PlatformGenerator, GameModeConfig } from '../../modes/types';

// ============== 经典模式生成器 ==============
// 复用旧版生成逻辑：随机位置 + 平台间最小间距，全部 normal 类型

export class ClassicGenerator implements PlatformGenerator {
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
                placements.push({ layer, x, z, size: config.platformSize, type: 'normal' });
                placed.push({ x, z });
            }
            attempts++;
        }
        // 兜底：补够数量
        while (placed.length < config.platformsPerLayer) {
            const x = (Math.random() * 2 - 1) * config.range;
            const z = (Math.random() * 2 - 1) * config.range;
            placements.push({ layer, x, z, size: config.platformSize, type: 'normal' });
            placed.push({ x, z });
        }
        return placements;
    }
}
