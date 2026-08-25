<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from '../composables/useI18n';
import { MODES } from '../game/modes';
import type { GameMode } from '../game/modes/types';

const props = defineProps<{
    loadingProgress: number;
    loadError: string | null;
}>();

const emit = defineEmits<{
    start: [mode: GameMode];
    settings: [];
}>();

const { tr } = useI18n();

const started = ref(false);
const selectedModeId = ref(MODES[0]?.id ?? 'classic');

// 加载失败时重置 started，允许用户重试
watch(() => props.loadError, (err) => {
    if (err) started.value = false;
});

const selectedMode = computed<GameMode>(
    () => MODES.find(m => m.id === selectedModeId.value) ?? MODES[0],
);

const btnText = computed(() => {
    if (props.loadError) return tr('loadingFailed');
    if (started.value && props.loadingProgress > 0) return `${tr('loadingProgress')} ${props.loadingProgress}%`;
    if (started.value) return tr('loadingProgress');
    return tr('startBtn');
});

function onStart() {
    if (started.value) return;
    started.value = true;
    emit('start', selectedMode.value);
}
</script>

<template>
    <div id="startOverlay">
        <button id="btnStartSettings" :title="tr('settings')" @click="emit('settings')">⚙</button>

        <div class="overlay-inner">
            <h1>Jump Robot</h1>
            <p class="hint-text" v-html="tr('startHint').replace(/\n/g, '<br>')"></p>

            <!-- 模式选择 -->
            <div v-if="MODES.length > 1" class="mode-cards">
                <div
                    v-for="mode in MODES"
                    :key="mode.id"
                    class="mode-card"
                    :class="{ active: mode.id === selectedModeId }"
                    @click="selectedModeId = mode.id"
                >
                    <div class="mode-icon">{{ mode.icon }}</div>
                    <div class="mode-name">{{ tr(mode.name) }}</div>
                    <div class="mode-desc">{{ tr(mode.description) }}</div>
                </div>
            </div>
            <!-- 仅一个模式时显示标签 + 描述 -->
            <div v-else class="single-mode">
                <span class="mode-icon">{{ selectedMode.icon }}</span>
                <span class="mode-name">{{ tr(selectedMode.name) }}</span>
                <span class="mode-desc-inline">{{ tr(selectedMode.description) }}</span>
            </div>

            <button id="startBtn" :disabled="started" @click="onStart">{{ btnText }}</button>
        </div>
    </div>
</template>

<style scoped>
#startOverlay {
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    z-index: 1000;
    color: #fff;
    display: flex;
    flex-direction: column;
    padding:
        max(14px, env(safe-area-inset-top))
        max(14px, env(safe-area-inset-right))
        max(14px, env(safe-area-inset-bottom))
        max(14px, env(safe-area-inset-left));
    box-sizing: border-box;
    overflow: hidden;
}

/* 右上角设置按钮（相对 startOverlay 定位） */
#btnStartSettings {
    position: absolute;
    top: max(14px, env(safe-area-inset-top));
    right: max(14px, env(safe-area-inset-right));
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font-size: 28px;
    line-height: 40px;
    cursor: pointer;
    transition: transform 0.3s, background 0.2s;
    backdrop-filter: blur(4px);
    text-align: center;
    padding: 0;
    z-index: 2;
}
#btnStartSettings:hover {
    background: rgba(255, 255, 255, 0.18);
    transform: rotate(60deg);
}

/* 内层 margin:auto 居中，放不下则从顶部开始，永远不裁 */
.overlay-inner {
    margin: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 720px;
}

#startOverlay h1 {
    font-size: 56px;
    margin: 0 0 10px 0;
    background: linear-gradient(90deg, #ffe66d, #ff6b6b, #4a90e2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: center;
    text-shadow: 0 0 30px rgba(255, 230, 109, 0.3);
}

.hint-text {
    font-size: 16px;
    color: #aab;
    margin: 0 0 28px 0;
    text-align: center;
    line-height: 1.8;
    max-width: 560px;
}

#startBtn {
    font-size: 22px;
    font-weight: bold;
    color: #fff;
    background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
    border: none;
    padding: 18px 60px;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 8px 30px rgba(238, 90, 111, 0.4);
    min-width: 240px;
}
#startBtn:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(238, 90, 111, 0.6);
}
#startBtn:disabled {
    background: #555;
    cursor: wait;
    box-shadow: none;
}

/* 模式选择卡片 */
.mode-cards {
    display: flex;
    gap: 12px;
    margin: 0 0 28px 0;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 100%;
}

.mode-card {
    width: 150px;
    padding: 14px 10px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.06);
    border: 2px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    color: #fff;
    flex: 0 0 auto;
}
.mode-card:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
}
.mode-card.active {
    background: rgba(255, 107, 107, 0.15);
    border-color: #ff6b6b;
    box-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
}
.mode-icon { font-size: 32px; margin-bottom: 6px; }
.mode-name { font-size: 15px; font-weight: bold; margin-bottom: 4px; }
.mode-desc { font-size: 11px; color: #aab; line-height: 1.4; }

/* 单模式标签 */
.single-mode {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 28px 0;
    color: #aab;
    font-size: 14px;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 80vw;
}
.single-mode .mode-icon { font-size: 22px; margin: 0; }
.single-mode .mode-name { color: #fff; font-weight: bold; margin: 0; font-size: 14px; }
.single-mode .mode-desc-inline { color: #889; font-size: 12px; }
.single-mode .mode-desc-inline::before {
    content: "·";
    margin: 0 4px;
    color: #556;
}

/* =====================================================
   手机竖屏（短边屏）：整体压缩
   ===================================================== */
@media (max-width: 480px) and (orientation: portrait) {
    #startOverlay h1 { font-size: 40px; margin-bottom: 6px; }
    .hint-text { font-size: 13px; line-height: 1.6; margin-bottom: 18px; }
    .mode-card { width: 130px; padding: 12px 8px; }
    .mode-icon { font-size: 26px; }
    .mode-name { font-size: 13px; }
    .mode-desc { font-size: 10px; }
    .mode-cards { margin-bottom: 20px; gap: 10px; }
    .single-mode { margin-bottom: 20px; }
    #startBtn { font-size: 18px; padding: 14px 44px; min-width: 200px; }
    #btnStartSettings { width: 36px; height: 36px; font-size: 24px; line-height: 36px; }
}
/* 更短的竖屏（< 600px 高） */
@media (max-height: 620px) and (orientation: portrait) {
    #startOverlay h1 { font-size: 34px; }
    .hint-text { font-size: 12px; margin-bottom: 14px; }
    .mode-card { width: 116px; padding: 10px 6px; }
    .mode-icon { font-size: 24px; margin-bottom: 4px; }
    .mode-name { font-size: 12px; }
    .mode-cards { margin-bottom: 16px; gap: 8px; }
    .single-mode { margin-bottom: 16px; }
    #startBtn { font-size: 17px; padding: 12px 36px; min-width: 180px; }
}

/* =====================================================
   手机横屏（高度小）：整体再压缩一档
   ===================================================== */
@media (max-height: 460px) and (orientation: landscape) {
    #startOverlay h1 { font-size: 34px; margin-bottom: 4px; }
    .hint-text { font-size: 12px; line-height: 1.5; margin-bottom: 12px; }
    .mode-card { width: 120px; padding: 10px 8px; }
    .mode-icon { font-size: 24px; margin-bottom: 4px; }
    .mode-name { font-size: 12px; margin-bottom: 2px; }
    .mode-desc { font-size: 10px; }
    .mode-cards { margin-bottom: 14px; gap: 8px; }
    .single-mode { margin-bottom: 14px; }
    #startBtn { font-size: 17px; padding: 12px 40px; min-width: 200px; }
    #btnStartSettings { width: 36px; height: 36px; font-size: 24px; line-height: 36px; }
}
@media (max-height: 380px) and (orientation: landscape) {
    #startOverlay h1 { font-size: 28px; }
    .hint-text { font-size: 11px; margin-bottom: 8px; }
    .mode-card { width: 106px; padding: 8px 6px; border-radius: 10px; }
    .mode-icon { font-size: 20px; margin-bottom: 2px; }
    .mode-name { font-size: 11px; }
    .mode-desc { font-size: 9px; line-height: 1.3; }
    .mode-cards { margin-bottom: 10px; gap: 6px; }
    .single-mode { margin-bottom: 10px; font-size: 12px; }
    #startBtn { font-size: 15px; padding: 10px 32px; min-width: 160px; border-radius: 40px; }
}
/* 超窄横屏宽 < 580px（模式卡片 2 张可能超出） */
@media (max-width: 580px) and (orientation: landscape) {
    .mode-card { width: calc(50% - 6px); box-sizing: border-box; }
}
</style>
