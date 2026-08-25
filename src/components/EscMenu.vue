<script setup lang="ts">
import type { GamePhase } from '../game/types';
import { useI18n } from '../composables/useI18n';

const props = defineProps<{
    phase: GamePhase;
}>();

const emit = defineEmits<{
    restart: [];
    settings: [];
    quit: [];
    close: [];
}>();

const { tr } = useI18n();

// 是否显示 ESC 菜单（暂停 或 死亡 菜单）
function isMenuVisible(): boolean {
    return props.phase === 'paused' || props.phase === 'dead';
}
</script>

<template>
    <div v-if="isMenuVisible()" id="escMenu">
        <h2>{{ phase === 'dead' ? tr('dead') : tr('paused') }}</h2>
        <!-- 仅暂停时显示"继续游戏"按钮 -->
        <button v-if="phase === 'paused'" id="btnResume" @click="emit('close')">{{ tr('resume') }}</button>
        <button id="btnRestart" @click="emit('restart')">{{ tr('restart') }}</button>
        <button id="btnSettings" @click="emit('settings')">{{ tr('settings') }}</button>
        <button id="btnQuit" @click="emit('quit')">{{ tr('quit') }}</button>
        <div class="hint">
            {{ phase === 'dead' ? tr('deadHint') : tr('pausedHint') }}
        </div>
    </div>
</template>

<style scoped>
#escMenu {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(6px);
}

#escMenu h2 {
    color: #fff;
    font-size: 36px;
    margin-bottom: 40px;
}

#escMenu button {
    display: block;
    width: 240px;
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    border: none;
    padding: 16px 0;
    border-radius: 12px;
    cursor: pointer;
    margin-bottom: 16px;
    transition: all 0.2s;
}

#btnRestart {
    background: linear-gradient(135deg, #4a90e2, #357abd);
}

#btnRestart:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
}

#btnResume {
    background: linear-gradient(135deg, #6dff8e, #4ade80);
    color: #0f3460;
}

#btnResume:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(109, 255, 142, 0.4);
}

#btnQuit {
    background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
}

#btnQuit:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(238, 90, 111, 0.4);
}

#btnSettings {
    background: linear-gradient(135deg, #718096, #4a5568);
}

#btnSettings:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(113, 128, 150, 0.4);
}

.hint {
    color: #888;
    font-size: 13px;
    margin-top: 12px;
}
</style>
