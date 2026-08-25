<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../composables/useI18n';

const props = defineProps<{
    // 是否进入游戏（控制摇杆/按钮显示，旋转提示不受此影响）
    gameActive: boolean;
    handlers: {
        onJoystickStart: (e: TouchEvent, thumb: HTMLElement) => void;
        onJoystickMove: (e: TouchEvent, thumb: HTMLElement) => void;
        onJoystickEnd: (e: TouchEvent, thumb: HTMLElement) => void;
        onCameraStart: (e: TouchEvent) => void;
        onCameraMove: (e: TouchEvent) => void;
        onCameraEnd: (e: TouchEvent) => void;
        pressJump: (e: TouchEvent) => void;
        releaseJump: (e: TouchEvent) => void;
        pressDash: (e: TouchEvent) => void;
        releaseDash: (e: TouchEvent) => void;
        onPauseTouch: (e: TouchEvent) => void;
    };
}>();

const { tr } = useI18n();

const emit = defineEmits<{
    pause: [];
}>();

const joystickThumb = ref<HTMLElement | null>(null);

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

// 适配 handlers（绑定 thumb）
function joyStart(e: TouchEvent) {
    if (joystickThumb.value) props.handlers.onJoystickStart(e, joystickThumb.value);
}
function joyMove(e: TouchEvent) {
    if (joystickThumb.value) props.handlers.onJoystickMove(e, joystickThumb.value);
}
function joyEnd(e: TouchEvent) {
    if (joystickThumb.value) props.handlers.onJoystickEnd(e, joystickThumb.value);
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
        <div id="cameraLayer"
            @touchstart="props.handlers.onCameraStart"
            @touchmove="props.handlers.onCameraMove"
            @touchend="props.handlers.onCameraEnd"
            @touchcancel="props.handlers.onCameraEnd"
        />
        <div id="joystick"
            @touchstart="joyStart"
            @touchmove="joyMove"
            @touchend="joyEnd"
            @touchcancel="joyEnd"
        >
            <div ref="joystickThumb" id="joystickThumb" />
        </div>
        <button class="touch-btn" id="btnDash"
            @touchstart="props.handlers.pressDash"
            @touchend="props.handlers.releaseDash"
            @touchcancel="props.handlers.releaseDash"
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

/* 摇杆 —— left/bottom 使用 safe-area 防刘海/黑边遮挡 */
#joystick {
    position: absolute;
    left: max(30px, env(safe-area-inset-left) + 20px);
    bottom: max(30px, env(safe-area-inset-bottom) + 20px);
    width: 130px;
    height: 130px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(4px);
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
        left: max(18px, env(safe-area-inset-left) + 12px);
        bottom: max(18px, env(safe-area-inset-bottom) + 12px);
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
