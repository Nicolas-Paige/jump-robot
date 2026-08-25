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
</template>

<style scoped>
#settingsPanel {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(8px);
}

#settingsPanel h2 {
    color: #fff;
    font-size: 32px;
    margin-bottom: 30px;
}

.setting-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    color: #ddd;
    font-size: 18px;
}

.setting-row label {
    min-width: 80px;
    text-align: right;
}

.setting-row input[type="range"] {
    width: 200px;
    accent-color: #4a90e2;
    cursor: pointer;
}

.setting-row select {
    width: 140px;
    padding: 6px 10px;
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
}

.btn-back {
    display: block;
    width: 200px;
    font-size: 18px;
    font-weight: bold;
    color: #fff;
    background: linear-gradient(135deg, #718096, #4a5568);
    border: none;
    padding: 14px 0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-back:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(113, 128, 150, 0.4);
}
</style>
