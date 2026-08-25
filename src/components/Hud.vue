<script setup lang="ts">
import { useI18n } from '../composables/useI18n';

defineProps<{
    currentLayer: number;
    bestLayer: number;
    isTouchDevice: boolean;
}>();

const { tr } = useI18n();
</script>

<template>
    <!-- 键盘提示（仅 PC 显示） -->
    <div v-if="!isTouchDevice" class="tip">
        {{ tr('keyboardTip') }}
    </div>
    <!-- 层数显示 -->
    <div class="layer" :class="{ touch: isTouchDevice }">
        <span>{{ currentLayer }}</span> {{ tr('layerUnit') }}
        <small>{{ tr('best') }}<span class="best">{{ bestLayer }}</span> {{ tr('layerUnit') }}</small>
    </div>
</template>

<style scoped>
.tip {
    position: absolute;
    top: 15px;
    left: 15px;
    color: #fff;
    background: rgba(0, 0, 0, 0.8);
    padding: 10px 15px;
    border-radius: 8px;
    z-index: 99;
    font-size: 14px;
    backdrop-filter: blur(4px);
}

.layer {
    position: absolute;
    top: 15px;
    right: 15px;
    color: #ffe66d;
    background: rgba(0, 0, 0, 0.8);
    padding: 15px 25px;
    border-radius: 12px;
    z-index: 99;
    font-size: 28px;
    font-weight: bold;
    backdrop-filter: blur(4px);
    text-align: right;
    line-height: 1.2;
}

.layer small {
    display: block;
    font-size: 12px;
    color: #aaa;
    font-weight: normal;
    margin-top: 4px;
}

.best {
    color: #6dff8e;
}

/* 触控设备：层数显示移到左上角，给暂停按钮让位 */
.layer.touch {
    top: 15px;
    right: auto;
    left: 15px;
    font-size: 20px;
    padding: 8px 14px;
}
</style>
