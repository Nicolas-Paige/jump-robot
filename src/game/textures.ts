import * as THREE from 'three';
import { MC_PALETTE, PIXEL_TEX_VARIANTS, type PaletteSeg } from './constants';

// ============== Minecraft 像素风纹理生成 ==============
// 每色段预生成 PIXEL_TEX_VARIANTS 个 16x16 像素纹理变体
// NearestFilter 保留像素硬边，4x4 cell 形成方块拼接感

const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

// 生成 16x16 像素纹理：4x4 个 cell，每 cell 内同色，cell 间 ±15% 亮度差异
function makePixelTexture(base: { r: number; g: number; b: number }): THREE.CanvasTexture {
    const size = 16;
    const cellSize = 4;
    const cvs = document.createElement('canvas');
    cvs.width = cvs.height = size;
    const ctx = cvs.getContext('2d')!;

    for (let cy = 0; cy < size; cy += cellSize) {
        for (let cx = 0; cx < size; cx += cellSize) {
            // 每 cell 基础亮度（±15%）—— 形成"小方块"拼接感
            const cellJitter = (Math.random() - 0.5) * 0.30;
            const r = base.r * (1 + cellJitter);
            const g = base.g * (1 + cellJitter);
            const b = base.b * (1 + cellJitter);
            ctx.fillStyle = `rgb(${clamp255(r)},${clamp255(g)},${clamp255(b)})`;
            ctx.fillRect(cx, cy, cellSize, cellSize);
            // cell 内每像素再 ±5% 微扰，模拟材质噪声
            for (let py = 0; py < cellSize; py++) {
                for (let px = 0; px < cellSize; px++) {
                    const pxJ = (Math.random() - 0.5) * 0.10;
                    ctx.fillStyle = `rgb(${clamp255(r * (1 + pxJ))},${clamp255(g * (1 + pxJ))},${clamp255(b * (1 + pxJ))})`;
                    ctx.fillRect(cx + px, cy + py, 1, 1);
                }
            }
        }
    }

    const tex = new THREE.CanvasTexture(cvs);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// 每色段预生成 4 个纹理变体
const pixelTexturesBySeg: THREE.CanvasTexture[][] = MC_PALETTE.map((seg: PaletteSeg) => {
    const arr: THREE.CanvasTexture[] = [];
    for (let i = 0; i < PIXEL_TEX_VARIANTS; i++) {
        arr.push(makePixelTexture(seg.base));
    }
    return arr;
});

// 按 layer 取一个纹理变体（每个平台独立 clone 以便独立 repeat）
export function getLayerTexture(layer: number): THREE.CanvasTexture {
    let segIdx = MC_PALETTE.findIndex(s => layer <= s.maxLayer);
    if (segIdx < 0) segIdx = MC_PALETTE.length - 1;
    const variants = pixelTexturesBySeg[segIdx];
    const src = variants[Math.floor(Math.random() * variants.length)];
    const clone = src.clone();
    clone.needsUpdate = true;
    return clone;
}

// 色段名（调试用）
export function getLayerSegName(layer: number): string {
    let segIdx = MC_PALETTE.findIndex(s => layer <= s.maxLayer);
    if (segIdx < 0) segIdx = MC_PALETTE.length - 1;
    return MC_PALETTE[segIdx].name;
}

// 释放所有缓存的纹理（卸载游戏时调用）
export function disposePixelTextures(): void {
    for (const variants of pixelTexturesBySeg) {
        for (const tex of variants) tex.dispose();
    }
}
