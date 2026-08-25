import { ref, shallowRef, onUnmounted, type Ref } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
    LAYER_HEIGHT, PLATFORM_SIZE,
    MOUSE_SENS, MOVE_SPEED, RUN_SPEED_MULTIPLIER, DASH_JUMP_MULTIPLIER, GRAVITY, JUMP_POWER,
    CAM_DIST, CAM_HEIGHT, CAM_SMOOTH,
    LAVA_INITIAL_Y, DEATH_DURATION,
} from '../game/constants';
import { PlatformSystem } from '../game/PlatformSystem';
import { LavaSystem } from '../game/LavaSystem';
import { disposePixelTextures } from '../game/textures';
import type { GamePhase, InputKeys, DeathMaterialRecord } from '../game/types';

// 模型本地路径（Vite 会处理为 URL）
import robotModelUrl from '../../models/RobotExpressive.glb';

// 触控设备检测（模块级常量，避免重复计算）
export const IS_TOUCH_DEVICE =
    typeof navigator !== 'undefined' &&
    (('ontouchstart' in window) || navigator.maxTouchPoints > 0);

export interface UseGameOptions {
    canvas: Ref<HTMLCanvasElement | null>;
    bgMusic: Ref<HTMLAudioElement | null>;
}

export function useGame(options: UseGameOptions) {
    // ===== 响应式 UI 状态 =====
    const phase = ref<GamePhase>('idle');
    const currentLayer = ref(0);
    const bestLayer = ref(0);
    const volume = ref(70);
    const loadingProgress = ref(0);
    const loadError = ref<string | null>(null);

    // ===== Three.js 对象（shallowRef 避免响应式包装） =====
    const scene = shallowRef<THREE.Scene | null>(null);
    const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
    const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
    const playerGroup = shallowRef<THREE.Group | null>(null);

    // ===== 游戏内部状态（普通变量，不响应式） =====
    const keys: InputKeys = { w: false, a: false, s: false, d: false, space: false, shift: false };
    let yaw = 0;
    let velY = 0;
    let isGrounded = true;
    let mixer: THREE.AnimationMixer | null = null;
    let walkAction: any = null, runAction: any = null, idleAction: any = null, jumpAction: any = null;
    let currentAnimation = 'idle';
    let modelLoaded = false;

    // 死亡动画
    let deathModel: THREE.Object3D | null = null;
    let deathMaterials: DeathMaterialRecord[] = [];
    let deathStartY = 0;
    let deathTimer = 0;
    let deathPending = false;

    // 系统
    let platformSystem: PlatformSystem | null = null;
    let lavaSystem: LavaSystem | null = null;
    let clock: THREE.Clock | null = null;
    let rafId = 0;
    let animationRunning = false;

    // 对外暴露的 setter（给 input composable 用）
    const input = {
        keys,
        setYaw: (v: number) => { yaw = v; },
        getYaw: () => yaw,
        mouseSens: MOUSE_SENS,
    };

    // 死亡动画进行中（给 input composable 判断用）
    function isDying() { return deathTimer > 0; }

    // ============== 1. 初始化场景 ==============
    function initScene() {
        if (!options.canvas.value) return;

        const s = new THREE.Scene();
        s.background = new THREE.Color(0x87CEEB);
        s.fog = new THREE.Fog(0x87CEEB, 40, 120);
        scene.value = s;

        const cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cam.position.set(0, 5, 10);
        camera.value = cam;

        const r = new THREE.WebGLRenderer({
            canvas: options.canvas.value,
            antialias: !IS_TOUCH_DEVICE,
            powerPreference: 'high-performance',
        });
        r.setSize(window.innerWidth, window.innerHeight);
        r.setPixelRatio(Math.min(window.devicePixelRatio, IS_TOUCH_DEVICE ? 1.5 : 2));
        r.shadowMap.enabled = true;
        r.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.value = r;

        // 灯光
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        s.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(20, 60, 20);
        dirLight.castShadow = true;
        const smRes = IS_TOUCH_DEVICE ? 1024 : 2048;
        dirLight.shadow.mapSize.width = smRes;
        dirLight.shadow.mapSize.height = smRes;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 200;
        dirLight.shadow.camera.left = -60;
        dirLight.shadow.camera.right = 60;
        dirLight.shadow.camera.top = 60;
        dirLight.shadow.camera.bottom = -60;
        s.add(dirLight);

        // 玩家 Group
        const pg = new THREE.Group();
        pg.position.set(0, 0, 0);
        pg.visible = false;
        s.add(pg);
        playerGroup.value = pg;

        // 平台系统
        platformSystem = new PlatformSystem(s);
        platformSystem.initInitialLayers();

        // 岩浆
        lavaSystem = new LavaSystem(s, s.background as THREE.Color);

        clock = new THREE.Clock();
        animationRunning = true;
        animate();
    }

    // ============== 2. 模型加载 ==============
    function loadModel() {
        const loader = new GLTFLoader();
        loader.load(
            robotModelUrl,
            (gltf: any) => {
                const model = gltf.scene;
                model.scale.set(0.3, 0.3, 0.3);
                model.castShadow = true;
                const pg = playerGroup.value!;
                pg.add(model);
                pg.visible = true;

                mixer = new THREE.AnimationMixer(model);
                const animations = gltf.animations;
                const find = (re: RegExp) => animations.find((a: any) => re.test(a.name.toLowerCase()));
                const walkAnim = find(/walk|walking/);
                const runAnim = find(/run|running/);
                const idleAnim = find(/idle|standing/);
                const jumpAnim = find(/jump|jumping/);

                walkAction = mixer.clipAction(walkAnim || animations[0]);
                runAction = mixer.clipAction(runAnim || walkAnim || animations[0]);
                idleAction = mixer.clipAction(idleAnim || animations[0]);
                jumpAction = mixer.clipAction(jumpAnim || animations[0]);

                walkAction.setEffectiveWeight(1);
                runAction.setEffectiveWeight(1);
                idleAction.setEffectiveWeight(1);
                jumpAction.setEffectiveWeight(1);
                idleAction.play();

                deathModel = model;
                deathMaterials = [];
                model.traverse((child: any) => {
                    if (child.isMesh && child.material) {
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach((m: any) => {
                            if (m.isMeshStandardMaterial) {
                                deathMaterials.push({
                                    mat: m,
                                    origEmissiveR: m.emissive.r,
                                    origEmissiveG: m.emissive.g,
                                    origEmissiveB: m.emissive.b,
                                    origEmissiveI: m.emissiveIntensity,
                                });
                            }
                        });
                    }
                });

                modelLoaded = true;
                onModelReady();
            },
            (progress: { loaded: number; total: number }) => {
                if (progress.total) {
                    loadingProgress.value = Math.min(99, Math.floor((progress.loaded / progress.total) * 100));
                }
            },
            (error: unknown) => {
                console.error('模型加载失败：', error);
                loadError.value = '加载失败，点击重试';
            },
        );
    }

    // ============== 3. 模型就绪 → 进入游戏 ==============
    function onModelReady() {
        phase.value = 'playing';
        const bg = options.bgMusic.value;
        if (bg) {
            bg.currentTime = 0;
            bg.volume = volume.value / 100;
            bg.play().catch(err => console.warn('背景音乐播放失败：', err));
        }
    }

    // ============== 4. 动画切换 ==============
    function switchAnimation(target: string) {
        if (!modelLoaded || currentAnimation === target) return;
        const fade = 0.15;
        const actions: Record<string, any> = { walk: walkAction, run: runAction, idle: idleAction, jump: jumpAction };
        if (actions[currentAnimation]) actions[currentAnimation].fadeOut(fade);
        if (actions[target]) actions[target].reset().fadeIn(fade).play();
        currentAnimation = target;
    }

    // ============== 5. 死亡 ==============
    function onPlayerDeath() {
        deathTimer = DEATH_DURATION;
        deathStartY = playerGroup.value!.position.y;
        [walkAction, runAction, idleAction, jumpAction].forEach(a => { if (a) a.fadeOut(0.1); });
        playerGroup.value!.visible = true;
    }

    function openDeathMenu() {
        deathPending = true;
        phase.value = 'dead';
    }

    // ============== 6. 主循环 ==============
    function animate() {
        if (!animationRunning) return;
        rafId = requestAnimationFrame(animate);
        const delta = Math.min(clock!.getDelta(), 0.05);

        // 未开始：只渲染背景
        if (phase.value === 'idle') {
            renderer.value!.render(scene.value!, camera.value!);
            return;
        }
        // 暂停 / 设置 / 死亡菜单：只渲染不更新
        if (phase.value === 'paused' || phase.value === 'settings' || phase.value === 'dead') {
            renderer.value!.render(scene.value!, camera.value!);
            return;
        }

        // 死亡动画期间
        if (deathTimer > 0) {
            deathTimer -= delta;
            lavaSystem!.updateTime(delta);
            if (mixer) mixer.update(delta);

            const deathElapsed = DEATH_DURATION - deathTimer;
            const deathHalf = DEATH_DURATION * 0.5;
            const tNorm = Math.min(deathElapsed / deathHalf, 1.0);

            deathMaterials.forEach(d => {
                const r = d.origEmissiveR + (1.0 - d.origEmissiveR) * tNorm;
                const g = d.origEmissiveG * (1.0 - tNorm);
                const b = d.origEmissiveB * (1.0 - tNorm);
                d.mat.emissive.setRGB(r, g, b);
                d.mat.emissiveIntensity = d.origEmissiveI + 3.0 * tNorm;
            });

            const sinkTarget = lavaSystem!.y - 0.3;
            playerGroup.value!.position.y = deathStartY + (sinkTarget - deathStartY) * tNorm;

            const tiltX = Math.sin(deathElapsed * 5.0) * 0.15 * tNorm;
            const tiltZ = Math.cos(deathElapsed * 4.0) * 0.10 * tNorm;
            if (deathModel) {
                deathModel.rotation.x = tiltX;
                deathModel.rotation.z = tiltZ;
            }

            if (deathElapsed >= deathHalf && playerGroup.value!.visible) {
                playerGroup.value!.visible = false;
            }

            if (deathTimer <= 0) {
                deathTimer = 0;
                if (deathModel) deathModel.rotation.set(0, 0, 0);
                deathMaterials.forEach(d => {
                    d.mat.emissive.setRGB(d.origEmissiveR, d.origEmissiveG, d.origEmissiveB);
                    d.mat.emissiveIntensity = d.origEmissiveI;
                });
                openDeathMenu();
            }
            renderer.value!.render(scene.value!, camera.value!);
            return;
        }

        if (mixer) mixer.update(delta);

        // ===== 玩家移动 =====
        const pg = playerGroup.value!;
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw));
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw));

        const moveDir = new THREE.Vector3(0, 0, 0);
        if (keys.w) moveDir.sub(forward);
        if (keys.s) moveDir.add(forward);
        if (keys.a) moveDir.add(right);
        if (keys.d) moveDir.sub(right);
        if (moveDir.length() > 0) moveDir.normalize();

        const isRunning = keys.shift && moveDir.length() > 0;
        const curSpeed = isRunning ? MOVE_SPEED * RUN_SPEED_MULTIPLIER : MOVE_SPEED;
        pg.position.x += moveDir.x * curSpeed * delta;
        pg.position.z += moveDir.z * curSpeed * delta;

        // 朝向
        if (moveDir.length() > 0) {
            const targetYaw = Math.atan2(moveDir.x, moveDir.z);
            let diff = targetYaw - pg.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            pg.rotation.y += diff * 0.2;
        }

        // 跳跃
        if (keys.space && isGrounded) {
            const mult = isRunning ? DASH_JUMP_MULTIPLIER : 1;
            velY = JUMP_POWER * mult;
            isGrounded = false;
            switchAnimation('jump');
        }

        // 重力 + 落地
        const prevFootY = pg.position.y;
        velY += GRAVITY * delta;
        pg.position.y += velY * delta;
        const newFootY = pg.position.y;

        if (velY <= 0) {
            const landed = platformSystem!.tryLanding(prevFootY, newFootY, pg.position.x, pg.position.z);
            if (landed) {
                pg.position.y = landed.topY;
                velY = 0;
                isGrounded = true;
                if (landed.layer > currentLayer.value) {
                    currentLayer.value = landed.layer;
                    if (landed.layer > bestLayer.value) bestLayer.value = landed.layer;
                }
            } else {
                isGrounded = false;
            }
        } else {
            isGrounded = false;
        }

        if (isGrounded) {
            if (moveDir.length() > 0) switchAnimation(isRunning ? 'run' : 'walk');
            else switchAnimation('idle');
        }

        // 兜底
        if (pg.position.y < -0.5) {
            pg.position.set(0, 0, 0);
            velY = 0;
            isGrounded = true;
            currentLayer.value = 0;
        }

        // 平台动态管理
        platformSystem!.manage(pg.position.y);
        // 岩浆
        lavaSystem!.update(delta);
        if (lavaSystem!.checkDeath(pg.position.y)) onPlayerDeath();

        // 视线遮挡
        const camPos = camera.value!.position.clone();
        const playerPos = new THREE.Vector3(pg.position.x, pg.position.y + 1, pg.position.z);
        platformSystem!.updateOpacity(camPos, playerPos);

        // 相机跟随
        const targetCamX = pg.position.x - Math.sin(yaw) * CAM_DIST;
        const targetCamZ = pg.position.z - Math.cos(yaw) * CAM_DIST;
        const targetCamY = pg.position.y + CAM_HEIGHT;
        camera.value!.position.x += (targetCamX - camera.value!.position.x) * CAM_SMOOTH;
        camera.value!.position.z += (targetCamZ - camera.value!.position.z) * CAM_SMOOTH;
        camera.value!.position.y += (targetCamY - camera.value!.position.y) * CAM_SMOOTH;
        camera.value!.lookAt(pg.position.x, pg.position.y + 1, pg.position.z);

        renderer.value!.render(scene.value!, camera.value!);
    }

    // ============== 7. 控制 API（给 UI 调用） ==============
    function startGame() {
        loadingProgress.value = 0;
        loadError.value = null;
        // 重试时如果模型已挂载到 playerGroup（部分加载），先清理
        if (playerGroup.value && playerGroup.value.children.length > 0) {
            while (playerGroup.value.children.length > 0) {
                const obj = playerGroup.value.children[0];
                playerGroup.value.remove(obj);
            }
            modelLoaded = false;
            deathModel = null;
            deathMaterials = [];
        }
        loadModel();
    }

    function pauseGame() {
        if (deathPending || deathTimer > 0) return;
        phase.value = 'paused';
    }
    function resumeGame() {
        if (deathPending) return;
        phase.value = 'playing';
    }
    // 进入设置前的状态，关闭时回到那里（paused → 暂停菜单，idle → 开始界面）
    let previousPhase: GamePhase = 'paused';

    function openSettings() {
        previousPhase = phase.value;
        phase.value = 'settings';
    }
    function closeSettings() {
        phase.value = previousPhase;
    }

    function restartGame() {
        const pg = playerGroup.value!;
        pg.position.set(0, 0, 0);
        velY = 0;
        isGrounded = true;
        yaw = 0;

        platformSystem!.clear();
        platformSystem!.initInitialLayers();

        currentLayer.value = 0;
        lavaSystem!.reset();
        deathTimer = 0;
        deathPending = false;
        pg.visible = modelLoaded;

        if (deathModel) deathModel.rotation.set(0, 0, 0);
        deathMaterials.forEach(d => {
            d.mat.emissive.setRGB(d.origEmissiveR, d.origEmissiveG, d.origEmissiveB);
            d.mat.emissiveIntensity = d.origEmissiveI;
        });

        if (idleAction) {
            [walkAction, runAction, idleAction, jumpAction].forEach(a => { if (a) a.fadeOut(0); });
            idleAction.reset().fadeIn(0.15).play();
            currentAnimation = 'idle';
        }
        phase.value = 'playing';
    }

    function quitGame() {
        restartGame();
        phase.value = 'idle';
        playerGroup.value!.visible = false;
        if (document.pointerLockElement) document.exitPointerLock();
        options.bgMusic.value?.pause();
    }

    function setVolume(v: number) {
        volume.value = v;
        if (options.bgMusic.value) options.bgMusic.value.volume = v / 100;
    }

    function onResize() {
        if (!camera.value || !renderer.value) return;
        camera.value.aspect = window.innerWidth / window.innerHeight;
        camera.value.updateProjectionMatrix();
        renderer.value.setSize(window.innerWidth, window.innerHeight);
        renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, IS_TOUCH_DEVICE ? 1.5 : 2));
    }

    function dispose() {
        animationRunning = false;
        cancelAnimationFrame(rafId);
        platformSystem?.dispose();
        lavaSystem?.dispose();
        disposePixelTextures();
        renderer.value?.dispose();
    }

    onUnmounted(dispose);

    return {
        // 状态
        phase, currentLayer, bestLayer, volume,
        loadingProgress, loadError,
        // 引擎控制
        initScene, startGame, pauseGame, resumeGame,
        openSettings, closeSettings,
        restartGame, quitGame, setVolume, onResize,
        // 输入桥接
        input,
        // 死亡动画进行中（给 input composable 判断用）
        isDying,
        // 模块导出（给 input composable 判断状态）
        isTouchDevice: IS_TOUCH_DEVICE,
    };
}
