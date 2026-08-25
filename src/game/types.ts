import * as THREE from 'three';

// ============== 全局类型定义 ==============

// 平台对象（物理 + 渲染）
export interface Platform {
    mesh: THREE.Mesh;
    material: THREE.MeshLambertMaterial;  // 强类型引用，避免 Material | Material[] 联合
    x: number;
    z: number;
    layer: number;
    size: number;
    topY: number;
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
}

// 输入状态
export interface InputKeys {
    w: boolean;
    a: boolean;
    s: boolean;
    d: boolean;
    space: boolean;
    shift: boolean;
}

// 游戏状态机
export type GamePhase =
    | 'idle'         // 开始界面
    | 'playing'      // 游戏中
    | 'paused'       // 暂停菜单
    | 'settings'     // 设置面板
    | 'dying'        // 死亡动画进行中
    | 'dead';        // 死亡菜单

// 玩家死亡材质记录（用于变红动画）
export interface DeathMaterialRecord {
    mat: THREE.MeshStandardMaterial;
    origEmissiveR: number;
    origEmissiveG: number;
    origEmissiveB: number;
    origEmissiveI: number;
}

// 游戏对外暴露的上下文（给模式 / UI 用）
export interface GameContext {
    phase: GamePhase;
    currentLayer: number;
    bestLayer: number;
    volume: number;
}
