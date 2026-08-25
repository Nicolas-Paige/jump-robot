import * as THREE from 'three';
import {
    LAYER_HEIGHT, PLATFORM_SIZE, PLATFORM_THICK, RANGE, PLATFORMS_PER_LAYER,
} from './constants';
import { getLayerTexture } from './textures';
import type { Platform } from './types';

// ============== 平台系统：生成 / 管理 / 清理 ==============

export class PlatformSystem {
    readonly platforms: Platform[] = [];
    private readonly scene: THREE.Scene;
    private readonly platformGeo: THREE.BoxGeometry;
    private highestGeneratedLayer = 0;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.platformGeo = new THREE.BoxGeometry(PLATFORM_SIZE, PLATFORM_THICK, PLATFORM_SIZE);
    }

    // 创建单个平台
    private createPlatform(layer: number, x: number, z: number, size = PLATFORM_SIZE): Platform {
        const useGeo = (size === PLATFORM_SIZE)
            ? this.platformGeo
            : new THREE.BoxGeometry(size, PLATFORM_THICK, size);

        const tex = getLayerTexture(layer);
        const repeat = Math.max(1, Math.round(size / 1.5));
        tex.repeat.set(repeat, repeat);

        const mat = new THREE.MeshLambertMaterial({
            map: tex,
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
        });
        const mesh = new THREE.Mesh(useGeo, mat);
        const topY = layer * LAYER_HEIGHT;
        mesh.position.set(x, topY - PLATFORM_THICK / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        const half = size / 2;
        const p: Platform = {
            mesh, material: mat, x, z, layer, size, topY,
            minX: x - half, maxX: x + half,
            minZ: z - half, maxZ: z + half,
        };
        this.platforms.push(p);
        return p;
    }

    // 生成一整层平台
    generateLayer(layer: number): void {
        if (layer === 0) {
            this.createPlatform(0, 0, 0, 50);
            return;
        }
        const minGap = 1.5;
        const placed: { x: number; z: number }[] = [];
        let attempts = 0;
        while (placed.length < PLATFORMS_PER_LAYER && attempts < 30) {
            const x = (Math.random() * 2 - 1) * RANGE;
            const z = (Math.random() * 2 - 1) * RANGE;
            let ok = true;
            for (const q of placed) {
                const dx = Math.abs(x - q.x);
                const dz = Math.abs(z - q.z);
                if (dx < PLATFORM_SIZE + minGap && dz < PLATFORM_SIZE + minGap) {
                    ok = false;
                    break;
                }
            }
            if (ok) {
                this.createPlatform(layer, x, z);
                placed.push({ x, z });
            }
            attempts++;
        }
        while (placed.length < PLATFORMS_PER_LAYER) {
            const x = (Math.random() * 2 - 1) * RANGE;
            const z = (Math.random() * 2 - 1) * RANGE;
            this.createPlatform(layer, x, z);
            placed.push({ x, z });
        }
    }

    // 初始化 0~5 层
    initInitialLayers(): void {
        for (let l = 0; l <= 5; l++) {
            this.generateLayer(l);
            this.highestGeneratedLayer = l;
        }
    }

    // 玩家附近动态生成 / 远处平台清理
    manage(playerY: number): void {
        const playerLayerApprox = Math.round(playerY / LAYER_HEIGHT);

        while (this.highestGeneratedLayer < playerLayerApprox + 12) {
            this.highestGeneratedLayer++;
            this.generateLayer(this.highestGeneratedLayer);
        }

        const minKeepLayer = playerLayerApprox - 10;
        for (let i = this.platforms.length - 1; i >= 0; i--) {
            const p = this.platforms[i];
            if (p.layer < minKeepLayer && p.layer !== 0) {
                this.scene.remove(p.mesh);
                if (p.material.map) p.material.map.dispose();
                p.material.dispose();
                this.platforms.splice(i, 1);
            }
        }
    }

    // 清除所有平台（重启用）
    clear(): void {
        for (const p of this.platforms) {
            this.scene.remove(p.mesh);
            if (p.material.map) p.material.map.dispose();
            p.material.dispose();
        }
        this.platforms.length = 0;
        this.highestGeneratedLayer = 0;
    }

    // 落地检测：前后帧穿越法
    tryLanding(prevFootY: number, newFootY: number, px: number, pz: number): Platform | null {
        let best: Platform | null = null;
        for (const p of this.platforms) {
            if (prevFootY >= p.topY - 0.01 && newFootY <= p.topY + 0.01) {
                if (px >= p.minX - 0.3 && px <= p.maxX + 0.3 &&
                    pz >= p.minZ - 0.3 && pz <= p.maxZ + 0.3) {
                    if (!best || p.topY > best.topY) best = p;
                }
            }
        }
        return best;
    }

    // 视线遮挡：相机与玩家之间的平台变透明
    updateOpacity(camPos: THREE.Vector3, playerPos: THREE.Vector3): void {
        const viewDir = playerPos.clone().sub(camPos);
        const viewLen = viewDir.length();
        viewDir.normalize();

        for (const p of this.platforms) {
            if (p.layer === 0) {
                p.material.opacity = 1.0;
                continue;
            }
            const platCenter = new THREE.Vector3(p.x, p.topY, p.z);
            const toPlat = platCenter.clone().sub(camPos);
            const proj = toPlat.dot(viewDir);
            let targetOpacity = 1.0;
            if (proj > 0 && proj < viewLen) {
                const closest = camPos.clone().add(viewDir.clone().multiplyScalar(proj));
                const dist = platCenter.distanceTo(closest);
                if (dist < 3) targetOpacity = 0.25;
                else if (dist < 5) targetOpacity = 0.5;
            }
            // lerp 平滑过渡，避免瞬间跳变导致透明时暴露岩浆光照亮的底面
            p.material.opacity += (targetOpacity - p.material.opacity) * 0.2;
        }
    }

    dispose(): void {
        this.clear();
        this.platformGeo.dispose();
    }
}
