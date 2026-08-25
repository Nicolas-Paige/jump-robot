<script setup lang="ts">
import { useI18n, type Language } from '../composables/useI18n';

defineProps<{
    visible: boolean;
    volume: number;
}>();

const emit = defineEmits<{
    'update:volume': [v: number];
    back: [];
}>();

const { language, setLanguage, tr } = useI18n();

function onInput(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    emit('update:volume', v);
}

function onLanguageChange(e: Event) {
    setLanguage((e.target as HTMLSelectElement).value as Language);
}
</script>

<template>
    <div v-if="visible" id="settingsPanel">
        <div class="panel-inner">
            <h2>{{ tr('settingsTitle') }}</h2>
            <div class="setting-row">
                <label for="volumeSlider">{{ tr('volume') }}</label>
                <input type="range" id="volumeSlider" min="0" max="100" :value="volume" @input="onInput">
                <span class="vol-val">{{ volume }}%</span>
            </div>
            <div class="setting-row">
                <label for="langSelect">{{ tr('language') }}</label>
                <select id="langSelect" :value="language" @change="onLanguageChange">
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                </select>
            </div>
            <button class="btn-back" @click="emit('back')">{{ tr('back') }}</button>
        </div>
    </div>
</template>

<style scoped>
#settingsPanel {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 1000;
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    padding:
        max(12px, env(safe-area-inset-top))
        max(12px, env(safe-area-inset-right))
        max(12px, env(safe-area-inset-bottom))
        max(12px, env(safe-area-inset-left));
    box-sizing: border-box;
}

/* margin:auto = 能容下时居中，容不下时从 padding 顶开始，永远不裁剪 */
.panel-inner {
    margin: auto;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    max-width: 420px;
}

#settingsPanel h2 {
    color: #fff;
    font-size: 32px;
    margin: 0 0 26px 0;
    text-align: center;
}

.setting-row {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 20px;
    color: #ddd;
    font-size: 18px;
}

.setting-row label {
    min-width: 80px;
    text-align: right;
    flex-shrink: 0;
}

.setting-row input[type="range"] {
    flex: 1 1 auto;
    min-width: 0;
    accent-color: #4a90e2;
    cursor: pointer;
}

.setting-row select {
    flex: 1 1 auto;
    min-width: 0;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid #4a5568;
    background: #2d3748;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    outline: none;
}

.setting-row select:focus {
    border-color: #4a90e2;
}

.setting-row .vol-val {
    min-width: 44px;
    text-align: left;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
}

.btn-back {
    display: block;
    align-self: center;
    width: 100%;
    max-width: 220px;
    font-size: 18px;
    font-weight: bold;
    color: #fff;
    background: linear-gradient(135deg, #718096, #4a5568);
    border: none;
    padding: 14px 0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 10px;
}

.btn-back:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(113, 128, 150, 0.4);
}

/* ================= 小屏压缩 ================= */
@media (max-height: 460px) {
    #settingsPanel h2 { font-size: 26px; margin-bottom: 18px; }
    .setting-row { font-size: 16px; margin-bottom: 14px; gap: 10px; }
    .setting-row label { min-width: 70px; font-size: 15px; }
    .setting-row select { padding: 6px 8px; font-size: 14px; }
    .btn-back { font-size: 16px; padding: 12px 0; max-width: 200px; }
}
@media (max-height: 380px) {
    #settingsPanel h2 { font-size: 22px; margin-bottom: 12px; }
    .setting-row { font-size: 14px; margin-bottom: 10px; gap: 8px; }
    .setting-row label { min-width: 64px; font-size: 14px; }
    .setting-row .vol-val { min-width: 40px; font-size: 14px; }
    .btn-back { font-size: 15px; padding: 10px 0; max-width: 180px; margin-top: 6px; }
}
@media (max-width: 480px) {
    .panel-inner { max-width: 100%; }
}
</style>
