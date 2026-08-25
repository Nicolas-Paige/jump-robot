<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from '../composables/useI18n';

const props = defineProps<{
    loadingProgress: number;
    loadError: string | null;
}>();

const emit = defineEmits<{
    start: [];
    settings: [];
}>();

const { tr } = useI18n();

const started = ref(false);

// 加载失败时重置 started，允许用户重试
watch(() => props.loadError, (err) => {
    if (err) started.value = false;
});

const btnText = computed(() => {
    if (props.loadError) return tr('loadingFailed');
    if (started.value && props.loadingProgress > 0) return `${tr('loadingProgress')} ${props.loadingProgress}%`;
    if (started.value) return tr('loadingProgress');
    return tr('startBtn');
});

function onStart() {
    if (started.value) return;
    started.value = true;
    emit('start');
}
</script>

<template>
    <div id="startOverlay">
        <button id="btnStartSettings" :title="tr('settings')" @click="emit('settings')">⚙</button>
        <h1>Jump Robot</h1>
        <p v-html="tr('startHint').replace(/\n/g, '<br>')"></p>
        <button id="startBtn" :disabled="started" @click="onStart">{{ btnText }}</button>
    </div>
</template>

<style scoped>
#startOverlay {
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    color: #fff;
}

#btnStartSettings {
    position: absolute;
    top: 18px;
    right: 18px;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font-size: 32px;
    line-height: 42px;
    cursor: pointer;
    transition: transform 0.3s, background 0.2s;
    backdrop-filter: blur(4px);
    text-align: center;
    padding: 0;
}

#btnStartSettings:hover {
    background: rgba(255, 255, 255, 0.18);
    transform: rotate(60deg);
}

#startOverlay h1 {
    font-size: 56px;
    margin-bottom: 12px;
    background: linear-gradient(90deg, #ffe66d, #ff6b6b, #4a90e2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 30px rgba(255, 230, 109, 0.3);
}

#startOverlay p {
    font-size: 16px;
    color: #aab;
    margin-bottom: 40px;
    text-align: center;
    line-height: 1.8;
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
</style>
