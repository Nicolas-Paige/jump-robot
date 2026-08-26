import { ref, onMounted, onUnmounted } from 'vue';
import { MOUSE_SENS } from '../game/constants';
import type { InputKeys } from '../game/types';

type InputBridge = {
    keys: InputKeys;
    setYaw: (v: number) => void;
    getYaw: () => number;
    setPitch: (v: number) => void;
    getPitch: () => number;
    toggleCameraMode: () => void;
    mouseSens: number;
};

export interface UseTouchOptions {
    input: InputBridge;
    // 状态查询
    isPlaying: () => boolean;
    isPaused: () => boolean;
    isDead: () => boolean;
    isDying: () => boolean;
    isSettings: () => boolean;
    // 菜单控制
    togglePause: () => void;
}

export function useTouchInput(opts: UseTouchOptions) {
    const { input } = opts;
    const JOY_RADIUS = 50;
    const JOY_DEADZONE = 0.35;
    let joyTouchId: number | null = null;
    let joyCenter = { x: 0, y: 0 };
    let camTouchId: number | null = null;
    let camLastX = 0;
    let camLastY = 0;

    // 冲刺切换状态（手机端点击切换，非按住）
    const dashActive = ref(false);

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    function applyJoystick(dx: number, dy: number) {
        const nx = dx / JOY_RADIUS;
        const ny = dy / JOY_RADIUS;
        const nMag = Math.min(1, Math.hypot(nx, ny));
        input.keys.w = false; input.keys.a = false; input.keys.s = false; input.keys.d = false;
        if (nMag < JOY_DEADZONE) return;
        if (ny < -0.4) input.keys.w = true;
        if (ny > 0.4) input.keys.s = true;
        if (nx < -0.4) input.keys.a = true;
        if (nx > 0.4) input.keys.d = true;
    }

    // 摇杆事件处理（动态浮动摇杆：中心由触摸点决定）
    function onJoystickStart(e: TouchEvent, centerX: number, centerY: number) {
        e.preventDefault();
        if (joyTouchId !== null) return;
        const t = e.changedTouches[0];
        joyTouchId = t.identifier;
        joyCenter = { x: centerX, y: centerY };
    }

    function onJoystickMove(e: TouchEvent): { dx: number; dy: number } {
        e.preventDefault();
        for (const t of Array.from(e.changedTouches)) {
            if (t.identifier !== joyTouchId) continue;
            let dx = t.clientX - joyCenter.x;
            let dy = t.clientY - joyCenter.y;
            const mag = Math.hypot(dx, dy);
            if (mag > JOY_RADIUS) {
                dx = dx / mag * JOY_RADIUS;
                dy = dy / mag * JOY_RADIUS;
            }
            applyJoystick(dx, dy);
            return { dx, dy };
        }
        return { dx: 0, dy: 0 };
    }

    function onJoystickEnd(e: TouchEvent) {
        e.preventDefault();
        for (const t of Array.from(e.changedTouches)) {
            if (t.identifier === joyTouchId) {
                joyTouchId = null;
                input.keys.w = false; input.keys.a = false; input.keys.s = false; input.keys.d = false;
            }
        }
    }

    // 相机拖拽
    function onCameraStart(e: TouchEvent) {
        e.preventDefault();
        if (camTouchId !== null) return;
        const t = e.changedTouches[0];
        camTouchId = t.identifier;
        camLastX = t.clientX;
        camLastY = t.clientY;
    }
    function onCameraMove(e: TouchEvent) {
        e.preventDefault();
        for (const t of Array.from(e.changedTouches)) {
            if (t.identifier !== camTouchId) continue;
            const dx = t.clientX - camLastX;
            const dy = t.clientY - camLastY;
            camLastX = t.clientX;
            camLastY = t.clientY;
            input.setYaw(input.getYaw() - dx * MOUSE_SENS * 1.5);
            input.setPitch(input.getPitch() - dy * MOUSE_SENS * 1.5);
        }
    }
    function onCameraEnd(e: TouchEvent) {
        e.preventDefault();
        for (const t of Array.from(e.changedTouches)) {
            if (t.identifier === camTouchId) camTouchId = null;
        }
    }

    // 按钮事件工厂
    function pressButton(key: keyof InputKeys) {
        return (e: TouchEvent) => {
            e.preventDefault();
            input.keys[key] = true as any;
        };
    }
    function releaseButton(key: keyof InputKeys) {
        return (e: TouchEvent) => {
            e.preventDefault();
            input.keys[key] = false as any;
        };
    }

    // 冲刺切换（手机端：点击一次开启，再点一次关闭）
    function toggleDash(e: TouchEvent) {
        e.preventDefault();
        dashActive.value = !dashActive.value;
        input.keys.shift = dashActive.value as any;
    }

    // 重置冲刺状态（游戏结束/重启/退出时调用）
    function resetDash() {
        dashActive.value = false;
        input.keys.shift = false as any;
    }

    // 暂停按钮（暂停↔游戏中 互切，但死亡/死亡动画期间禁用）
    function onPauseTouch(e: TouchEvent) {
        e.preventDefault();
        if (opts.isDead() || opts.isDying()) return;
        if (opts.isSettings()) return;  // 设置面板时由设置面板的按钮处理
        opts.togglePause();
    }

    // 防双指缩放 / 上下文菜单
    const onGestureStart = (e: Event) => e.preventDefault();
    const onContextMenu = (e: Event) => {
        if ((e.target as HTMLElement)?.closest('#touchControls')) e.preventDefault();
    };

    onMounted(() => {
        document.addEventListener('gesturestart', onGestureStart);
        document.addEventListener('contextmenu', onContextMenu);
    });

    onUnmounted(() => {
        document.removeEventListener('gesturestart', onGestureStart);
        document.removeEventListener('contextmenu', onContextMenu);
    });

    return {
        onJoystickStart, onJoystickMove, onJoystickEnd,
        onCameraStart, onCameraMove, onCameraEnd,
        pressJump: pressButton('space'),
        releaseJump: releaseButton('space'),
        toggleDash,
        dashActive,
        resetDash,
        toggleCameraMode: input.toggleCameraMode,
        onPauseTouch,
    };
}
