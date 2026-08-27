<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { CHARACTERS } from '../game/characters';
import { useI18n } from '../composables/useI18n';

const props = defineProps<{
    characterIndex: number;
    loadingProgress: number;
    loadError: string | null;
}>();

const emit = defineEmits<{
    prev: [];
    next: [];
    confirm: [];
    back: [];
}>();

const { tr } = useI18n();

const currentCharacter = computed(() => CHARACTERS[props.characterIndex] ?? CHARACTERS[0]);

// 加载提示延迟显示：加载超过 150ms 才显示，避免本地快速加载时闪烁
const showLoading = ref(false);
let loadingTimer: ReturnType<typeof setTimeout> | null = null;
watch(() => props.loadingProgress, (val) => {
    const isLoading = val > 0 && val < 100;
    if (isLoading) {
        if (!loadingTimer) {
            loadingTimer = setTimeout(() => { showLoading.value = true; }, 150);
        }
    } else {
        if (loadingTimer) { clearTimeout(loadingTimer); loadingTimer = null; }
        showLoading.value = false;
    }
});

// ===== 触摸滑动 =====
const touchStartX = ref(0);
const touchStartY = ref(0);
const SWIPE_THRESHOLD = 50; // 滑动触发阈值（px）

function onTouchStart(e: TouchEvent) {
    touchStartX.value = e.touches[0].clientX;
    touchStartY.value = e.touches[0].clientY;
}
function onTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.value;
    const dy = e.changedTouches[0].clientY - touchStartY.value;
    // 水平滑动距离大于垂直滑动，且超过阈值
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
        if (dx > 0) emit('prev');  // 向右滑 → 上一个
        else emit('next');          // 向左滑 → 下一个
    }
}

// ===== 键盘左右切换 =====
function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') emit('prev');
    else if (e.key === 'ArrowRight') emit('next');
    else if (e.key === 'Enter') emit('confirm');
    else if (e.key === 'Escape') emit('back');
}

onMounted(() => {
    window.addEventListener('keydown', onKeyDown);
});
onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown);
    if (loadingTimer) clearTimeout(loadingTimer);
});
</script>

<template>
    <div
        id="characterSelect"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
    >
        <!-- 顶部标题 + 返回 -->
        <div class="cs-top">
            <button class="cs-back" @click="emit('back')" title="返回">‹</button>
            <h2 class="cs-title">选择角色</h2>
            <div class="cs-placeholder"></div>
        </div>

        <!-- 左右箭头 -->
        <button class="cs-arrow cs-arrow-left" @click="emit('prev')" title="上一个">‹</button>
        <button class="cs-arrow cs-arrow-right" @click="emit('next')" title="下一个">›</button>

        <!-- 角色指示器（小圆点） -->
        <div class="cs-dots">
            <span
                v-for="(char, i) in CHARACTERS"
                :key="char.id"
                class="cs-dot"
                :class="{ active: i === characterIndex }"
                @click="i > characterIndex ? emit('next') : emit('prev')"
            ></span>
        </div>

        <!-- 加载中提示 -->
        <div v-if="showLoading" class="cs-loading">
            加载中... {{ loadingProgress }}%
        </div>

        <!-- 底部信息 + 按钮 -->
        <div class="cs-bottom">
            <button class="cs-confirm" @click="emit('confirm')">
                立即出发
            </button>
            <div class="cs-hint">
                ← → 切换角色 · 滑动切换 · Enter 确认
            </div>
        </div>
    </div>
</template>

<style scoped>
#characterSelect {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    color: #fff;
    /* 半透明渐变背景，中间透出3D模型 */
    background: linear-gradient(
        to bottom,
        rgba(10, 15, 30, 0.85) 0%,
        rgba(10, 15, 30, 0.2) 25%,
        rgba(10, 15, 30, 0.2) 65%,
        rgba(10, 15, 30, 0.9) 100%
    );
    overflow: hidden;
    touch-action: pan-y;
}

/* 顶部 */
.cs-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: max(16px, env(safe-area-inset-top)) 20px 0;
    box-sizing: border-box;
}
.cs-title {
    font-size: 22px;
    margin: 0;
    letter-spacing: 4px;
    background: linear-gradient(90deg, #ffe66d, #ff6b6b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
.cs-back {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,0.1);
    color: #fff;
    font-size: 28px;
    line-height: 36px;
    cursor: pointer;
    transition: background 0.2s;
}
.cs-back:hover { background: rgba(255,255,255,0.2); }
.cs-placeholder { width: 40px; }

/* 左右箭头 */
.cs-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.08);
    color: #fff;
    font-size: 32px;
    line-height: 46px;
    cursor: pointer;
    transition: all 0.2s;
    backdrop-filter: blur(4px);
    z-index: 2;
}
.cs-arrow:hover {
    background: rgba(255,255,255,0.18);
    border-color: rgba(255,255,255,0.4);
    transform: translateY(-50%) scale(1.08);
}
.cs-arrow-left { left: max(20px, env(safe-area-inset-left)); }
.cs-arrow-right { right: max(20px, env(safe-area-inset-right)); }

/* 角色指示器 */
.cs-dots {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    gap: 8px;
    margin-top: 140px;
}
.cs-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255,255,255,0.25);
    cursor: pointer;
    transition: all 0.2s;
}
.cs-dot.active {
    background: #fff;
    width: 24px;
    border-radius: 4px;
}

/* 加载提示 */
.cs-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 16px;
    color: #aab;
    background: rgba(0,0,0,0.5);
    padding: 10px 24px;
    border-radius: 20px;
}

/* 底部 */
.cs-bottom {
    margin-top: auto;
    padding: 0 20px max(24px, env(safe-area-inset-bottom));
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
}

.cs-confirm {
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
    border: none;
    padding: 16px 64px;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 8px 30px rgba(238, 90, 111, 0.4);
    min-width: 220px;
}
.cs-confirm:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(238, 90, 111, 0.6);
}

.cs-hint {
    font-size: 12px;
    color: #667;
    text-align: center;
}

/* ===== 移动端适配 ===== */
@media (max-width: 600px) {
    .cs-title { font-size: 18px; letter-spacing: 2px; }
    .cs-arrow { width: 44px; height: 44px; font-size: 26px; line-height: 40px; }
    .cs-arrow-left { left: 12px; }
    .cs-arrow-right { right: 12px; }
    .cs-dots { margin-top: 120px; }
    .cs-confirm { font-size: 17px; padding: 14px 48px; min-width: 180px; }
    .cs-hint { display: none; }
}

@media (max-height: 500px) {
    .cs-top { padding-top: max(10px, env(safe-area-inset-top)); }
    .cs-title { font-size: 16px; }
    .cs-dots { margin-top: 90px; }
    .cs-confirm { font-size: 16px; padding: 12px 40px; }
    .cs-bottom { gap: 10px; padding-bottom: max(16px, env(safe-area-inset-bottom)); }
}
</style>
