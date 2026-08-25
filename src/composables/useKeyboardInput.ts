import { onMounted, onUnmounted, type Ref } from 'vue';
import { MOUSE_SENS } from '../game/constants';
import type { InputKeys } from '../game/types';

// useGame 返回的 input 对象类型
type InputBridge = {
    keys: InputKeys;
    setYaw: (v: number) => void;
    getYaw: () => number;
    mouseSens: number;
};

export interface UseKeyboardOptions {
    input: InputBridge;
    isTouchDevice: boolean;
    // 状态查询函数
    isPlaying: () => boolean;
    isPaused: () => boolean;
    isDead: () => boolean;
    isDying: () => boolean;
    isSettings: () => boolean;
    // 菜单控制
    togglePause: () => void;
    closeMenu: () => void;
    openMenu: () => void;
    // canvasRef 用于 requestPointerLock
    canvas: Ref<HTMLCanvasElement | null>;
}

export function useKeyboardInput(opts: UseKeyboardOptions) {
    const { input, isTouchDevice, canvas } = opts;

    const onKeyDown = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        if (k === 'w') input.keys.w = true;
        else if (k === 'a') input.keys.a = true;
        else if (k === 's') input.keys.s = true;
        else if (k === 'd') input.keys.d = true;
        else if (k === ' ') { input.keys.space = true; e.preventDefault(); }
        if (e.key === 'Shift') input.keys.shift = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        if (k === 'w') input.keys.w = false;
        else if (k === 'a') input.keys.a = false;
        else if (k === 's') input.keys.s = false;
        else if (k === 'd') input.keys.d = false;
        else if (k === ' ') input.keys.space = false;
        if (e.key === 'Shift') input.keys.shift = false;
    };

    const onClick = () => {
        if (isTouchDevice) return;
        // 只在游戏中点击才请求 pointer lock（避免开始按钮点击触发）
        if (!opts.isPlaying()) return;
        if (opts.isPaused() || opts.isSettings()) return;
        canvas.value?.requestPointerLock?.();
    };

    const onPointerLockChange = () => {
        if (isTouchDevice) return;
        if (!document.pointerLockElement && opts.isPlaying() && !opts.isDead() && !opts.isDying()) {
            opts.openMenu();
        }
    };

    const onMouseMove = (e: MouseEvent) => {
        if (document.pointerLockElement === document.body || document.pointerLockElement === canvas.value) {
            input.setYaw(input.getYaw() - e.movementX * MOUSE_SENS);
        }
    };

    // P 键开关暂停（playing ↔ paused 互切；settings 时回菜单）
    const onKeyToggle = (e: KeyboardEvent) => {
        if (e.key !== 'p' && e.key !== 'P') return;
        // idle / 死亡菜单 不处理
        if (!opts.isPlaying() && !opts.isPaused() && !opts.isSettings()) return;
        if (opts.isDead() || opts.isDying()) return;
        if (opts.isSettings()) {
            opts.closeMenu();  // 关设置回菜单
            return;
        }
        opts.togglePause();
    };

    // ESC 关闭菜单（paused→playing, settings→paused）
    const onKeyEsc = (e: KeyboardEvent) => {
        if (e.key !== 'Escape') return;
        // idle 不处理
        if (!opts.isPlaying() && !opts.isPaused() && !opts.isSettings()) return;
        if (opts.isDead() || opts.isDying()) return;
        if (opts.isSettings()) {
            opts.closeMenu();
            return;
        }
        if (opts.isPaused()) opts.closeMenu();
    };

    onMounted(() => {
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        document.addEventListener('click', onClick);
        document.addEventListener('pointerlockchange', onPointerLockChange);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('keydown', onKeyToggle);
        document.addEventListener('keydown', onKeyEsc);
    });

    onUnmounted(() => {
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
        document.removeEventListener('click', onClick);
        document.removeEventListener('pointerlockchange', onPointerLockChange);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('keydown', onKeyToggle);
        document.removeEventListener('keydown', onKeyEsc);
    });
}
