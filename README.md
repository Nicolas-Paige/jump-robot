# Jump Robot

一个基于 Three.js 的 3D 跳跃小游戏。控制机器人角色在随机生成的平台间往上跳跃，看你能跳到第几层。

> 在线试玩：https://static-mp-8348115f-96e8-418b-8155-9dd4a98d922f.next.bspapp.com/game/index.html

## 游戏特性

- 单文件实现：整个游戏逻辑、UI 和样式都集中在 [index.html](file:///d:/work/test/jump-robot/index.html) 中，无需构建
- 三维场景：天空背景 + 雾效 + 方向光阴影，营造立体空间感
- GLTF 模型动画：机器人内置 Idle / Walk / Run / Jump 动画，根据状态平滑过渡
- 动态平台生成：随玩家上升不断生成新平台，远离玩家的低层平台自动回收
- 视线遮挡处理：相机与玩家之间的平台自动半透明化，避免视野被挡
- 冲刺跳跃：Shift 冲刺时跳跃，跳得更高更远，是冲层关键
- 岩浆追击：底部岩浆缓慢上升，碰到即死，迫使玩家持续向上（详见 [岩浆系统](#岩浆系统)）
- 死亡菜单：被岩浆烧死后弹出菜单，可选择重新开始或退出游戏
- 背景音乐：进入游戏自动播放，退出游戏自动暂停（循环播放）
- 层数记录：实时显示当前层与历史最高层

## 如何运行

游戏通过浏览器直接打开即可，无需安装依赖。

### 方式一：直接打开

双击 `index.html` 用现代浏览器打开即可。

> 注意：部分浏览器对 `file://` 协议下的 ES Module 加载有限制。如果遇到模型或脚本加载失败，请使用下面的本地服务器方式。

### 方式二：本地服务器（推荐）

在项目根目录下任选一种方式启动静态服务器：

```bash
# Python
python -m http.server 8000

# Node.js (npx)
npx serve .
# 或
npx http-server -p 8000
```

然后浏览器访问 `http://localhost:8000`。

## 操作说明

| 按键 | 功能 |
| --- | --- |
| `W` / `A` / `S` / `D` | 前后左右移动 |
| `Shift` | 冲刺（移动速度提升，跳跃力增强） |
| `Space` | 跳跃 |
| 鼠标移动 | 转动视角（点击页面锁定鼠标） |
| `ESC` / `P` | 打开 / 关闭暂停菜单 |

**玩法要点**：冲刺时跳跃能跳得更高更远，是登上高层的核心技巧。掉出平台边缘会被拉回第 0 层中心继续游戏；但底部岩浆会持续上升，一旦脚底低于岩浆面即判定死亡，弹出菜单等待选择。因此要尽量保持向上，别被岩浆追上。

## 岩浆系统

底部有一片缓慢上升的岩浆面，是主要的失败条件。

- **Shader**：使用 Three.js 官方 `webgl_shader_lava` shader（由 TheGameMaker 出品，随官方 examples 长期维护）
- **纹理**：通过 CDN 加载官方 lava 纹理（`textures/lava/cloud.png` 噪声图 + `textures/lava/lavatile.jpg` 熔岩贴图），配合 `uvScale` 在大平面上平铺
- **流动**：纹理 UV 基于时间与 cloud 噪声做双路偏移（T1 / T2），再通过 `color * (p*2) + (color² - 0.1)` 混合，通道溢出形成高温发光带
- **红光预警**：岩浆点光源会照亮附近平台与角色，岩浆逼近时视觉更紧张
- **行为**：岩浆面以恒定速度向上推进，玩家脚底低于岩浆面时触发死亡
- **死亡流程**：角色消失约 1 秒（被烧化）→ 弹出"你死了"菜单 → 玩家选择"重新开始"（回到起点、岩浆归位、保留最高层数）或"退出游戏"（回开始界面、暂停音乐）

## 项目结构

```
jump-robot/
├── index.html              # 游戏主文件（HTML + CSS + JS）
├── assets/                 # 游戏资源
│   └── bg-music.mp4        # 背景音乐
├── models/                 # 备用角色模型
│   ├── RobotExpressive.glb
│   ├── Xbot.glb
│   └── miku.glb
├── LICENSE                 # Apache License 2.0
└── README.md
```

> 说明：`index.html` 中默认从 `https://threejs.org` 在线加载 `RobotExpressive.glb` 模型；`models/` 目录下的模型为本地备用资源，可按需替换加载地址使用。

## 技术栈

- [Three.js](https://threejs.org/) `0.160.0`（通过 CDN importmap 引入）
- ES Modules
- WebGLRenderer + PCFSoftShadowMap
- GLTFLoader 加载角色模型与动画
- ShaderMaterial 应用 Three.js 官方 `webgl_shader_lava` shader（含 cloud / lavatile 纹理）
- HTML5 `<audio>` 背景音乐播放

## 关键参数

游戏内的核心参数定义在 [index.html](file:///d:/work/test/jump-robot/index.html) 中，可按需调整：

| 参数 | 默认值 | 含义 |
| --- | --- | --- |
| `LAYER_HEIGHT` | `3.0` | 每层平台的高度间隔 |
| `PLATFORM_SIZE` | `5` | 平台边长 |
| `PLATFORM_THICK` | `0.5` | 平台厚度 |
| `RANGE` | `8` | 平台水平随机范围 |
| `PLATFORMS_PER_LAYER` | `4` | 每层平台数量 |
| `moveSpeed` | `8` | 玩家移动速度 |
| `runSpeedMultiplier` | `1.6` | 冲刺速度倍率 |
| `dashJumpMultiplier` | `1.5` | 冲刺跳跃力倍率 |
| `gravity` | `-25` | 重力加速度 |
| `jumpPower` | `13` | 普通跳跃力 |
| `LAVA_SIZE` | `100` | 岩浆平面边长 |
| `LAVA_RISE_SPEED` | `0.8` | 岩浆每秒上升速度 |
| `LAVA_INITIAL_Y` | `-8` | 岩浆起始高度（低于第 0 层） |
| `LAVA_DEATH_MARGIN` | `0.1` | 玩家脚底低于岩浆面多少即判定死亡 |
| `DEATH_DURATION` | `1.0` | 死亡动画时长（秒） |
| `LAVA_UV_SCALE` | `(10, 10)` | 官方 lava 纹理在平面上的平铺密度 |
| `LAVA_TIME_SCALE` | `1.0` | 官方 lava shader 流动速度整体缩放 |

## 许可证

本项目基于 [Apache License 2.0](file:///d:/work/test/jump-robot/LICENSE) 开源。
