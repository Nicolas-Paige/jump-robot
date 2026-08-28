<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useGame, IS_TOUCH_DEVICE } from './composables/useGame';
import { useKeyboardInput } from './composables/useKeyboardInput';
import { useTouchInput } from './composables/useTouchInput';
import StartOverlay from './components/StartOverlay.vue';
import CharacterSelect from './components/CharacterSelect.vue';
import Hud from './components/Hud.vue';
import EscMenu from './components/EscMenu.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import TouchControls from './components/TouchControls.vue';
import type { GamePhase } from './game/types';
import type { GameMode } from './game/modes/types';
import bgMusicUrl from '../assets/bg-music.mp4';

// canvas + audio 引用（都在顶层，不随 v-if 销毁）
const canvasRef = ref<HTMLCanvasElement | null>(null);
const bgMusicRef = ref<HTMLAudioElement | null>(null);

// ===== 游戏引擎 =====
const game = useGame({
    canvas: canvasRef,
    bgMusic: bgMusicRef,
});

// 状态判断
const isPlaying = () => game.phase.value === 'playing';
const isPaused = () => game.phase.value === 'paused';
const isDead = () => game.phase.value === 'dead';
const isDying = () => game.isDying();
const isSettings = () => game.phase.value === 'settings';

function togglePause() {
    if (isPaused() || isSettings()) game.resumeGame();
    else game.pauseGame();
}
function openMenu() { game.pauseGame(); }
function closeMenu() {
    if (isSettings()) game.closeSettings();
    else game.resumeGame();
}

// ===== 输入 =====
useKeyboardInput({
    input: game.input,
    isTouchDevice: IS_TOUCH_DEVICE,
    isPlaying, isPaused, isDead, isDying, isSettings,
    togglePause, closeMenu, openMenu,
    canvas: canvasRef,
});

const touchHandlers = useTouchInput({
    input: game.input,
    isPlaying, isPaused, isDead, isDying, isSettings,
    togglePause,
});

// ===== 开始游戏 → 进入选人页面 =====
async function onStart(mode: GameMode) {
    if (IS_TOUCH_DEVICE) document.body.classList.add('touch');
    touchHandlers.resetDash();
    await nextTick();
    if (canvasRef.value) {
        game.initScene();
        game.enterCharacterSelect(mode);
    }
}

// ===== 选人页面确认 → 正式进入游戏 =====
function onConfirmCharacter() {
    game.confirmCharacter();
}

// ===== 选人页面返回 → 回到开始界面 =====
function onBackFromSelect() {
    game.quitGame();
}

// ===== 菜单事件 =====
function onRestart() { touchHandlers.resetDash(); game.restartGame(); }
function onSettings() { game.openSettings(); }
function onSettingsBack() { game.closeSettings(); }
function onQuit() { touchHandlers.resetDash(); game.quitGame(); }
function onVolumeUpdate(v: number) { game.setVolume(v); }

// ===== 窗口适配 =====
function onResize() { game.onResize(); }
onMounted(() => {
    // bgMusic 元素在顶层模板里，挂载后立即绑定
    bgMusicRef.value = document.getElementById('bgMusic') as HTMLAudioElement;
    if (bgMusicRef.value) bgMusicRef.value.volume = game.volume.value / 100;
    window.addEventListener('resize', onResize);
});
onUnmounted(() => {
    window.removeEventListener('resize', onResize);
});

const showGameUI = computed(() => !['idle', 'character-select'].includes(game.phase.value));
</script>

<template>
    <div class="app">
        <!-- canvas + audio（始终存在，不随 v-if 销毁） -->
        <canvas ref="canvasRef" />
        <audio id="bgMusic" :src="bgMusicUrl" loop preload="auto" />

        <!-- 开始界面 -->
        <StartOverlay
            v-if="game.phase.value === 'idle'"
            :loading-progress="game.loadingProgress.value"
            :load-error="game.loadError.value"
            :is-touch-device="IS_TOUCH_DEVICE"
            @start="onStart"
            @settings="onSettings"
        />

        <!-- 角色选择页面 -->
        <CharacterSelect
            v-if="game.phase.value === 'character-select'"
            :character-index="game.characterIndex.value"
            :loading-progress="game.loadingProgress.value"
            :load-error="game.loadError.value"
            @prev="game.switchCharacter(-1)"
            @next="game.switchCharacter(1)"
            @confirm="onConfirmCharacter"
            @back="onBackFromSelect"
        />

        <!-- HUD（游戏中显示） -->
        <Hud
            v-if="showGameUI"
            :current-layer="game.currentLayer.value"
            :best-layer="game.bestLayer.value"
            :is-touch-device="IS_TOUCH_DEVICE"
        />

        <!-- ESC / 死亡菜单 -->
        <EscMenu
            :phase="game.phase.value as GamePhase"
            @restart="onRestart"
            @settings="onSettings"
            @quit="onQuit"
            @close="closeMenu"
        />

        <!-- 设置面板 -->
        <SettingsPanel
            :visible="game.phase.value === 'settings'"
            :volume="game.volume.value"
            @update:volume="onVolumeUpdate"
            @back="onSettingsBack"
        />

        <!-- 移动端触控 UI（触控设备始终渲染：竖屏显示旋转提示，横屏显示摇杆） -->
        <TouchControls
            v-if="IS_TOUCH_DEVICE"
            :game-active="showGameUI"
            :settings-open="game.phase.value === 'settings'"
            :handlers="touchHandlers"
            @pause="togglePause"
        />
    </div>
</template>

<style scoped>
.app {
    width: 100vw;
    height: 100vh;
    position: relative;
    overflow: hidden;
}

canvas {
    width: 100%;
    height: 100%;
    display: block;
}

#bgMusic {
    display: none;
}
</style>
