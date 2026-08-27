// ============== 可选角色配置 ==============
// 仅包含拥有 walk / run / idle / jump 四种必需动画的模型

import robotModelUrl from '../../models/RobotExpressive.glb';
import manModelUrl from '../../models/Man.glb';
import manSleevesModelUrl from '../../models/Man in Long Sleeves.glb';
import manSuitModelUrl from '../../models/Man in Suit.glb';
import manOtherModelUrl from '../../models/Man-fjHyMd5Wxw.glb';

// 动作信息
export interface ActionInfo {
    key: string;       // 动作标识
    name: string;      // 中文名称
    icon: string;      // emoji 图标
    required: boolean; // 是否为游戏必需动作（walk/run/idle/jump）
}

// 游戏必需的 4 种动作
const REQUIRED_ACTIONS: ActionInfo[] = [
    { key: 'walk',  name: '走路', icon: '🚶', required: true },
    { key: 'run',   name: '跑步', icon: '🏃', required: true },
    { key: 'idle',  name: '待机', icon: '🧍', required: true },
    { key: 'jump',  name: '跳跃', icon: '🦘', required: true },
];

// 机器人额外动作
const ROBOT_EXTRA_ACTIONS: ActionInfo[] = [
    { key: 'death',    name: '死亡',   icon: '💀', required: false },
    { key: 'punch',    name: '出拳',   icon: '👊', required: false },
    { key: 'dance',    name: '跳舞',   icon: '💃', required: false },
    { key: 'wave',     name: '挥手',   icon: '👋', required: false },
    { key: 'thumbsup', name: '点赞',   icon: '👍', required: false },
    { key: 'no',       name: '摇头',   icon: '🙅', required: false },
    { key: 'yes',      name: '点头',   icon: '🙆', required: false },
    { key: 'sitting',  name: '坐下',   icon: '🪑', required: false },
    { key: 'standing', name: '站立',   icon: '🧍', required: false },
    { key: 'walkjump', name: '走跳',   icon: '🚶‍♂️', required: false },
];

// 人形模型额外动作（4个 Man 模型动画完全一致）
const HUMAN_EXTRA_ACTIONS: ActionInfo[] = [
    { key: 'death',       name: '死亡',   icon: '💀', required: false },
    { key: 'punch',       name: '出拳',   icon: '👊', required: false },
    { key: 'clapping',    name: '鼓掌',   icon: '👏', required: false },
    { key: 'swordslash',  name: '挥剑',   icon: '⚔️', required: false },
    { key: 'runningjump', name: '跑跳',   icon: '🏃‍♂️', required: false },
    { key: 'sitting',     name: '坐下',   icon: '🪑', required: false },
    { key: 'standing',    name: '站立',   icon: '🧍', required: false },
];

export interface Character {
    id: string;
    name: string;                // 角色名称
    icon: string;                // emoji 图标
    desc: string;                // 简短描述
    modelUrl: string;            // 模型文件 URL
    scale: number;               // 模型缩放
    type: 'robot' | 'human';     // 角色类型
    typeLabel: string;           // 类型标签文字
    typeColor: string;           // 类型标签颜色（css 颜色）
    actions: ActionInfo[];       // 全部动作列表
    featured: string[];          // 特色动作 key（卡片上高亮展示）
}

function buildActions(extra: ActionInfo[]): ActionInfo[] {
    return [...REQUIRED_ACTIONS, ...extra];
}

export const CHARACTERS: Character[] = [
    {
        id: 'robot',
        name: '机器人',
        icon: '🤖',
        desc: '经典机器人，动画最丰富',
        modelUrl: robotModelUrl,
        scale: 0.3,
        type: 'robot',
        typeLabel: '机器人',
        typeColor: '#4a90e2',
        actions: buildActions(ROBOT_EXTRA_ACTIONS),
        featured: ['dance', 'wave', 'thumbsup', 'no', 'yes'],
    },
    {
        id: 'man',
        name: '休闲男',
        icon: '🧍',
        desc: '休闲装扮，含挥剑动作',
        modelUrl: manModelUrl,
        scale: 0.3,
        type: 'human',
        typeLabel: '人形',
        typeColor: '#e2a04a',
        actions: buildActions(HUMAN_EXTRA_ACTIONS),
        featured: ['swordslash', 'clapping', 'runningjump'],
    },
    {
        id: 'man-sleeves',
        name: '长袖男',
        icon: '🧥',
        desc: '长袖装扮，含挥剑动作',
        modelUrl: manSleevesModelUrl,
        scale: 0.3,
        type: 'human',
        typeLabel: '人形',
        typeColor: '#e2a04a',
        actions: buildActions(HUMAN_EXTRA_ACTIONS),
        featured: ['swordslash', 'clapping', 'runningjump'],
    },
    {
        id: 'man-suit',
        name: '西装男',
        icon: '🕴️',
        desc: '西装革履，含挥剑动作',
        modelUrl: manSuitModelUrl,
        scale: 0.3,
        type: 'human',
        typeLabel: '人形',
        typeColor: '#e2a04a',
        actions: buildActions(HUMAN_EXTRA_ACTIONS),
        featured: ['swordslash', 'clapping', 'runningjump'],
    },
    {
        id: 'man-other',
        name: '运动男',
        icon: '🏃',
        desc: '运动装扮，含挥剑动作',
        modelUrl: manOtherModelUrl,
        scale: 0.3,
        type: 'human',
        typeLabel: '人形',
        typeColor: '#e2a04a',
        actions: buildActions(HUMAN_EXTRA_ACTIONS),
        featured: ['swordslash', 'clapping', 'runningjump'],
    },
];

export const DEFAULT_CHARACTER_ID = CHARACTERS[0].id;

export function getCharacterById(id: string): Character {
    return CHARACTERS.find(c => c.id === id) ?? CHARACTERS[0];
}

// 根据 key 获取动作信息
export function getActionByKey(actions: ActionInfo[], key: string): ActionInfo | undefined {
    return actions.find(a => a.key === key);
}
