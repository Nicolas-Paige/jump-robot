<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../composables/useI18n';

const props = defineProps<{
    // 是否进入游戏（控制摇杆/按钮显示，旋转提示不受此影响）
    gameActive: boolean;
    handlers: {
        onJoystickStart: (e: TouchEvent, centerX: number, centerY: number) => void;
        onJoystickMove: (e: TouchEvent) => { dx: number; dy: number };
        onJoystickEnd: (e: TouchEvent) => void;
        onCameraStart: (e: TouchEvent) => void;
        onCameraMove: (e: TouchEvent) => void;
        onCameraEnd: (e: TouchEvent) => void;
        pressJump: (e: TouchEvent) => void;
        releaseJump: (e: TouchEvent) => void;
        toggleDash: (e: TouchEvent) => void;
        dashActive: { value: boolean };
        onPauseTouch: (e: TouchEvent) => void;
    };
}>();

const { tr } = useI18n();

const emit = defineEmits<{
    pause: [];
}>();

// ===== 动态浮动摇杆状态 =====
const joystickActive = ref(false);
const joystickCenter = ref({ x: 0, y: 0 });
const joystickThumbOffset = ref({ x: 0, y: 0 });

// 竖屏检测：响应式控制旋转提示
const isPortrait = ref(false);
function updateOrientation() {
    isPortrait.value = window.matchMedia('(orientation: portrait)').matches;
}

onMounted(() => {
    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
});
onUnmounted(() => {
    window.removeEventListener('resize', updateOrientation);
    window.removeEventListener('orientationchange', updateOrientation);
});

// 左半屏触摸 → 在触摸点生成动态摇杆
function joyLayerStart(e: TouchEvent) {
    e.preventDefault();
    const t = e.changedTouches[0];
    joystickCenter.value = { x: t.clientX, y: t.clientY };
    joystickThumbOffset.value = { x: 0, y: 0 };
    joystickActive.value = true;
    props.handlers.onJoystickStart(e, t.clientX, t.clientY);
}
function joyLayerMove(e: TouchEvent) {
    e.preventDefault();
    const offset = props.handlers.onJoystickMove(e);
    joystickThumbOffset.value = { x: offset.dx, y: offset.dy };
}
function joyLayerEnd(e: TouchEvent) {
    e.preventDefault();
    props.handlers.onJoystickEnd(e);
    joystickActive.value = false;
    joystickThumbOffset.value = { x: 0, y: 0 };
}
</script>

<template>
    <!-- 竖屏旋转提示（仅竖屏时显示，z-index 2000 盖住所有 UI） -->
    <div v-if="isPortrait" id="rotateHint">
        <div class="rotate-icon">📱</div>
        <h2>{{ tr('rotateHintTitle') }}</h2>
        <p>{{ tr('rotateHintDesc') }}</p>
    </div>

    <!-- 触控控件（横屏 + 游戏中时显示） -->
    <div v-if="!isPortrait && gameActive" id="touchControls">
        <!-- 左半屏：动态摇杆触摸层（任意位置按下生成摇杆） -->
        <div id="joystickLayer"
            @touchstart="joyLayerStart"
            @touchmove="joyLayerMove"
            @touchend="joyLayerEnd"
            @touchcancel="joyLayerEnd"
        />
        <!-- 右半屏：相机拖拽 -->
        <div id="cameraLayer"
            @touchstart="props.handlers.onCameraStart"
            @touchmove="props.handlers.onCameraMove"
            @touchend="props.handlers.onCameraEnd"
            @touchcancel="props.handlers.onCameraEnd"
        />
        <!-- 动态浮动摇杆（触摸时出现在手指位置） -->
        <div v-if="joystickActive" id="joystick"
            :style="{ left: joystickCenter.x + 'px', top: joystickCenter.y + 'px' }">
            <div id="joystickThumb"
                :style="{ transform: `translate(${joystickThumbOffset.x}px, ${joystickThumbOffset.y}px)` }" />
        </div>
        <button class="touch-btn" id="btnDash"
            :class="{ active: props.handlers.dashActive.value }"
            @touchstart="props.handlers.toggleDash"
        >{{ tr('dash') }}</button>
        <button class="touch-btn" id="btnJump"
            @touchstart="props.handlers.pressJump"
            @touchend="props.handlers.releaseJump"
            @touchcancel="props.handlers.releaseJump"
        >{{ tr('jump') }}</button>
        <button class="touch-btn" id="btnPauseTouch"
            @touchstart="props.handlers.onPauseTouch"
        >‖</button>
    </div>
</template>

<style scoped>
/* 旋转提示（竖屏遮罩） */
#rotateHint {
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #fff;
    text-align: center;
    padding: 0 20px;
}
#rotateHint .rotate-icon {
    font-size: 64px;
    margin-bottom: 20px;
    animation: rotateAnim 2s ease-in-out infinite;
}
@keyframes rotateAnim {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(90deg); }
}
#rotateHint h2 {
    font-size: 22px;
    margin-bottom: 8px;
}
#rotateHint p {
    font-size: 14px;
    color: #aab;
}

/* 触控控件容器 */
#touchControls {
    position: fixed;
    inset: 0;
    z-index: 100;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
}

/* 左半屏：动态摇杆触摸层 */
#joystickLayer {
    position: absolute;
    top: 0;
    left: 0;
    width: 50%;
    height: 100%;
    background: transparent;
}

/* 动态浮动摇杆 —— 固定定位，中心对齐触摸点，pointer-events 穿透 */
#joystick {
    position: fixed;
    width: 130px;
    height: 130px;
    margin-left: -65px;
    margin-top: -65px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(4px);
    pointer-events: none;
    animation: joyFadeIn 0.15s ease-out;
    z-index: 101;
}
@keyframes joyFadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
}
#joystickThumb {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 56px;
    height: 56px;
    margin: -28px 0 0 -28px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), rgba(200,200,220,0.7));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    pointer-events: none;
}

/* 按钮 */
.touch-btn {
    position: absolute;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    font-weight: bold;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    backdrop-filter: blur(4px);
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
    user-select: none;
}
.touch-btn:active {
    transform: scale(0.92);
}

#btnJump {
    right: max(30px, env(safe-area-inset-right) + 20px);
    bottom: max(40px, env(safe-area-inset-bottom) + 24px);
    width: 90px;
    height: 90px;
    background: rgba(74, 144, 226, 0.45);
}
#btnDash {
    right: max(135px, env(safe-area-inset-right) + 120px);
    bottom: max(110px, env(safe-area-inset-bottom) + 70px);
    width: 70px;
    height: 70px;
    font-size: 14px;
    background: rgba(255, 107, 107, 0.45);
}
#btnDash.active {
    background: rgba(255, 60, 60, 0.8);
    border-color: rgba(255, 200, 200, 0.9);
    box-shadow: 0 0 16px rgba(255, 80, 80, 0.7);
    transform: scale(0.95);
}
#btnPauseTouch {
    top: max(15px, env(safe-area-inset-top) + 10px);
    right: max(15px, env(safe-area-inset-right) + 10px);
    width: 50px;
    height: 50px;
    font-size: 22px;
    background: rgba(0, 0, 0, 0.5);
}

/* 相机拖拽层（右半屏） */
#cameraLayer {
    position: absolute;
    top: 0;
    right: 0;
    width: 50%;
    height: 100%;
    background: transparent;
}

/* ============ 小屏横屏适配（高度 < 400px 或 宽度 < 650px） ============ */
@media (max-height: 400px), (max-width: 650px) {
    #joystick {
        width: 100px;
        height: 100px;
        margin-left: -50px;
        margin-top: -50px;
    }
    #joystickThumb {
        width: 44px;
        height: 44px;
        margin: -22px 0 0 -22px;
    }
    #btnJump {
        width: 72px;
        height: 72px;
        right: max(20px, env(safe-area-inset-right) + 14px);
        bottom: max(24px, env(safe-area-inset-bottom) + 14px);
        font-size: 14px;
    }
    #btnDash {
        width: 56px;
        height: 56px;
        right: max(102px, env(safe-area-inset-right) + 88px);
        bottom: max(72px, env(safe-area-inset-bottom) + 44px);
        font-size: 12px;
    }
    #btnPauseTouch {
        width: 42px;
        height: 42px;
        font-size: 18px;
        top: max(10px, env(safe-area-inset-top) + 6px);
        right: max(10px, env(safe-area-inset-right) + 6px);
    }
}

/* 更极端的小屏（高度 < 340px，例如超窄安卓横屏）：再缩一档 */
@media (max-height: 340px) {
    #joystick {
        width: 84px;
        height: 84px;
        margin-left: -42px;
        margin-top: -42px;
    }
    #joystickThumb {
        width: 38px;
        height: 38px;
        margin: -19px 0 0 -19px;
    }
    #btnJump {
        width: 60px;
        height: 60px;
    }
    #btnDash {
        width: 48px;
        height: 48px;
        right: max(82px, env(safe-area-inset-right) + 68px);
        bottom: max(56px, env(safe-area-inset-bottom) + 32px);
    }
}
</style>
