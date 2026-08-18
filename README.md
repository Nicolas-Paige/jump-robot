# Jump Robot

一个基于 Three.js 的 3D 跳跃小游戏。控制机器人在随机生成的平台间往上跳跃，看你能跳到第几层——但底部的岩浆会持续追上来。

A 3D jumping mini-game built with Three.js. Control a robot to jump upward across randomly generated platforms and see how high you can climb — but the lava at the bottom keeps rising.

> 在线试玩 / Play online: https://static-mp-8348115f-96e8-418b-8155-9dd4a98d922f.next.bspapp.com/game/index.html

---

## 目录 / Table of Contents

- [Jump Robot](#jump-robot)
  - [目录 / Table of Contents](#目录--table-of-contents)
  - [游戏特性 / Features](#游戏特性--features)
  - [如何运行 / How to Run](#如何运行--how-to-run)
    - [方式一：直接打开 / Option 1: Direct Open](#方式一直接打开--option-1-direct-open)
    - [方式二：本地服务器（推荐） / Option 2: Local Server (Recommended)](#方式二本地服务器推荐--option-2-local-server-recommended)
  - [操作说明 / Controls](#操作说明--controls)
  - [岩浆系统 / Lava System](#岩浆系统--lava-system)
  - [设置面板 / Settings Panel](#设置面板--settings-panel)
  - [项目结构 / Project Structure](#项目结构--project-structure)
  - [技术栈 / Tech Stack](#技术栈--tech-stack)
  - [关键参数 / Key Parameters](#关键参数--key-parameters)
  - [许可证 / License](#许可证--license)

---

## 游戏特性 / Features

- **单文件实现**：整个游戏逻辑、UI 和样式都集中在 [index.html](file:///d:/work/test/jump-robot/index.html) 中，无需构建
  *Single-file implementation: all game logic, UI, and styles in [index.html](file:///d:/work/test/jump-robot/index.html), no build required*
- **三维场景**：天空背景 + 雾效 + 方向光阴影，营造立体空间感
  *3D scene: sky background + fog + directional light shadows for spatial depth*
- **GLTF 模型动画**：机器人内置 Idle / Walk / Run / Jump 动画，根据状态平滑过渡
  *GLTF model animation: built-in Idle / Walk / Run / Jump animations with smooth transitions*
- **动态平台生成**：随玩家上升不断生成新平台，远离玩家的低层平台自动回收
  *Dynamic platform generation: new platforms spawn as you climb, distant low platforms are recycled*
- **视线遮挡处理**：相机与玩家之间的平台自动半透明化，避免视野被挡
  *Line-of-sight occlusion: platforms between camera and player become semi-transparent*
- **冲刺跳跃**：Shift 冲刺时跳跃，跳得更高更远，是冲层关键
  *Dash jump: jump while dashing with Shift to go higher and farther — key to climbing*
- **岩浆追击**：底部岩浆缓慢上升，碰到即死，迫使玩家持续向上（详见 [岩浆系统](#岩浆系统--lava-system)）
  *Lava chase: bottom lava slowly rises, kills on contact (see [Lava System](#岩浆系统--lava-system))*
- **死亡菜单**：被岩浆烧死后弹出菜单，可选择重新开始或退出游戏
  *Death menu: pops up after death, offering restart or quit*
- **背景音乐**：进入游戏自动播放，退出游戏自动暂停（循环播放）
  *Background music: auto-plays on entry, pauses on exit (loops)*
- **设置面板**：暂停菜单中可调节音量
  *Settings panel: adjust volume from the pause menu*
- **层数记录**：实时显示当前层与历史最高层
  *Layer tracking: real-time display of current and best layer*

## 如何运行 / How to Run

游戏通过浏览器直接打开即可，无需安装依赖。

The game runs directly in a browser — no dependencies to install.

### 方式一：直接打开 / Option 1: Direct Open

双击 `index.html` 用现代浏览器打开即可。

Double-click `index.html` to open in a modern browser.

> 注意：部分浏览器对 `file://` 协议下的 ES Module 加载有限制。如果遇到模型或脚本加载失败，请使用下面的本地服务器方式。
>
> Note: Some browsers restrict ES Module loading under `file://`. If model/script loading fails, use the local server method below.

### 方式二：本地服务器（推荐） / Option 2: Local Server (Recommended)

在项目根目录下任选一种方式启动静态服务器：

Start a static server in the project root:

```bash
# Python
python -m http.server 8000

# Node.js (npx)
npx serve .
# 或 / or
npx http-server -p 8000
```

然后浏览器访问 `http://localhost:8000`。

Then visit `http://localhost:8000`.

## 操作说明 / Controls

| 按键 / Key | 功能 / Function |
| --- | --- |
| `W` / `A` / `S` / `D` | 前后左右移动 / Move forward / left / back / right |
| `Shift` | 冲刺（移动速度提升，跳跃力增强） / Dash (increased speed and jump force) |
| `Space` | 跳跃 / Jump |
| 鼠标移动 / Mouse | 转动视角（点击页面锁定鼠标） / Rotate view (click to lock pointer) |
| `ESC` | 打开 / 关闭暂停菜单 / Open / close pause menu |
| `P` | 打开 / 关闭暂停菜单 / Open / close pause menu |

**玩法要点 / Gameplay tips**：

冲刺时跳跃能跳得更高更远，是登上高层的核心技巧。掉出平台边缘会被拉回第 0 层中心继续游戏；但底部岩浆会持续上升，一旦脚底低于岩浆面即判定死亡，弹出菜单等待选择。因此要尽量保持向上，别被岩浆追上。

Jumping while dashing lets you go higher and farther — the core skill for climbing. Falling off platform edges pulls you back to the center of layer 0 to continue; however, the bottom lava keeps rising, and once your feet drop below the lava surface, you die and a menu appears. Keep climbing upward and don't get caught.

> 说明：在鼠标锁定状态下按 ESC，浏览器会吞掉 `keydown` 事件，因此打开菜单通过 `pointerlockchange` 事件检测；关闭菜单时鼠标已解锁，`keydown` 可正常派发。
>
> Note: When pointer is locked, pressing ESC makes the browser swallow the `keydown` event, so opening the menu is detected via `pointerlockchange`; closing the menu uses `keydown` since the pointer is already unlocked.

## 岩浆系统 / Lava System

底部有一片缓慢上升的岩浆面，是主要的失败条件。

A slowly rising lava surface at the bottom — the main failure condition.

- **Shader**：使用 Three.js 官方 `webgl_shader_lava` shader（由 TheGameMaker 出品，随官方 examples 长期维护）
  *Uses the official Three.js `webgl_shader_lava` shader (by TheGameMaker, maintained with official examples)*
- **纹理**：通过 CDN 加载官方 lava 纹理（`textures/lava/cloud.png` 噪声图 + `textures/lava/lavatile.jpg` 熔岩贴图），配合 `uvScale` 在大平面上平铺；多源回退（threejs.org → GitHub raw → canvas fallback）
  *Loads official lava textures via CDN (`cloud.png` noise + `lavatile.jpg`), tiled via `uvScale`; multi-source fallback (threejs.org → GitHub raw → canvas)*
- **流动**：纹理 UV 基于时间与 cloud 噪声做双路偏移（T1 / T2），再通过 `color * (p*2) + (color² - 0.1)` 混合，通道溢出形成高温发光带
  *Texture UV is offset in dual paths (T1 / T2) by time and cloud noise, mixed via `color * (p*2) + (color² - 0.1)`, channel overflow forms glowing bands*
- **红光预警**：岩浆点光源照亮附近平台与角色，岩浆逼近时视觉更紧张
  *Point light from lava illuminates nearby platforms and character, intensifying as lava approaches*
- **行为**：岩浆面以恒定速度向上推进，玩家脚底低于岩浆面时触发死亡
  *Lava surface advances upward at constant speed; death triggers when feet drop below the surface*
- **死亡流程**：角色消失约 1 秒（被烧化）→ 弹出"你死了"菜单 → 玩家选择"重新开始"（回到起点、岩浆归位、保留最高层数）或"退出游戏"（回开始界面、暂停音乐）
  *Character disappears ~1s (burned) → "You Died" menu → choose "Restart" (return to start, reset lava, keep best layer) or "Quit" (return to start screen, pause music)*

## 设置面板 / Settings Panel

暂停菜单中点击"设置"可进入设置面板，目前支持：

Click "Settings" in the pause menu to open the settings panel. Currently supports:

- **音量调节**：滑动条控制背景音乐音量（0–100%，默认 70%）
  *Volume control: slider for background music (0–100%, default 70%)*

## 项目结构 / Project Structure

```
jump-robot/
├── index.html              # 游戏主文件（HTML + CSS + JS） / Game main file
├── assets/                 # 游戏资源 / Game assets
│   └── bg-music.mp4        # 背景音乐 / Background music
├── models/                 # 备用角色模型 / Backup character models
│   ├── RobotExpressive.glb
│   ├── Xbot.glb
│   └── miku.glb
├── LICENSE                 # Apache License 2.0
└── README.md
```

> 说明：`index.html` 默认从 `https://threejs.org` 在线加载 `RobotExpressive.glb` 模型；`models/` 目录下的模型为本地备用资源，可按需替换加载地址使用。
>
> Note: `index.html` loads `RobotExpressive.glb` online from `https://threejs.org` by default; models in `models/` are local backups — replace the loading URL to use them.

## 技术栈 / Tech Stack

- [Three.js](https://threejs.org/) `0.160.0`（通过 CDN importmap 引入 / via CDN importmap）
- ES Modules
- WebGLRenderer + PCFSoftShadowMap
- GLTFLoader 加载角色模型与动画 / for character model and animations
- ShaderMaterial 应用 Three.js 官方 `webgl_shader_lava` shader（含 cloud / lavatile 纹理）/ applying official `webgl_shader_lava` shader (with cloud / lavatile textures)
- HTML5 `<audio>` 背景音乐播放 / for background music

## 关键参数 / Key Parameters

游戏内的核心参数定义在 [index.html](file:///d:/work/test/jump-robot/index.html) 中，可按需调整：

Core parameters are defined in [index.html](file:///d:/work/test/jump-robot/index.html) and adjustable as needed:

| 参数 / Parameter | 默认值 / Default | 含义 / Description |
| --- | --- | --- |
| `LAYER_HEIGHT` | `3.0` | 每层平台的高度间隔 / Height interval per layer |
| `PLATFORM_SIZE` | `5` | 平台边长 / Platform edge length |
| `PLATFORM_THICK` | `0.5` | 平台厚度 / Platform thickness |
| `RANGE` | `8` | 平台水平随机范围 / Horizontal random range |
| `PLATFORMS_PER_LAYER` | `4` | 每层平台数量 / Platforms per layer |
| `moveSpeed` | `8` | 玩家移动速度 / Player movement speed |
| `runSpeedMultiplier` | `1.6` | 冲刺速度倍率 / Dash speed multiplier |
| `dashJumpMultiplier` | `1.5` | 冲刺跳跃力倍率 / Dash jump force multiplier |
| `gravity` | `-25` | 重力加速度 / Gravity acceleration |
| `jumpPower` | `13` | 普通跳跃力 / Normal jump force |
| `LAVA_SIZE` | `100` | 岩浆平面边长 / Lava plane edge length |
| `LAVA_RISE_SPEED` | `0.8` | 岩浆每秒上升速度 / Lava rise speed per second |
| `LAVA_INITIAL_Y` | `-8` | 岩浆起始高度（低于第 0 层） / Lava starting height (below layer 0) |
| `LAVA_DEATH_MARGIN` | `0.1` | 玩家脚底低于岩浆面多少即判定死亡 / Distance below lava surface that triggers death |
| `DEATH_DURATION` | `1.0` | 死亡动画时长（秒） / Death animation duration (seconds) |
| `LAVA_UV_SCALE` | `(10, 10)` | 官方 lava 纹理在平面上的平铺密度 / Tiling density of lava texture |
| `LAVA_TIME_SCALE` | `1.0` | 官方 lava shader 流动速度整体缩放 / Overall flow speed scale of lava shader |

## 许可证 / License

本项目基于 [Apache License 2.0](file:///d:/work/test/jump-robot/LICENSE) 开源。

This project is open-sourced under the [Apache License 2.0](file:///d:/work/test/jump-robot/LICENSE).
