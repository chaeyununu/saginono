import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

const STORAGE_KEY = 'mind-room-memos-v3';
const STORAGE_PAYLOAD_VERSION = 4;
const ENABLE_HEAVY_DUMMY_MEMOS = false;
const DUMMY_MEMO_ID_PREFIX = 'dummy-mixed-20260329-v7-100-old-recent';
const HEAVY_DUMMY_MEMO_COUNTS = Object.freeze({
  clutter: 20,
  routine: 20,
  record: 20,
  snack: 20,
  emotion: 20,
});
const NON_DESK_SCALE_MULTIPLIER = 2;

const SILENCE_MS = 3000;
const SPEECH_FINALIZE_GRACE_MS = 3000;
const RESTART_RECOGNITION_DELAY_MS = 35;
const HYBRID_RECOGNITION_LANG = 'ko-KR';
const CLUTTER_MERGE_DAYS = 5;
const ROUTINE_SCATTER_DAYS = 3;
const EMOTION_DECAY_DAYS = 7;
const NEGATIVE_EMOTION_VISIBLE_MS = 6500;
const POSITIVE_EMOTION_VISIBLE_MS = 5200;
const VISUAL_CHECK_MS = 4000;
const EMOTION_REWARD_DROP_MS = 920;
const EMOTION_REWARD_DROP_HEIGHT = 1.55;
const CLUTTER_DROP_MS = 980;
const ROUTINE_DROP_MS = 920;
const ROUTINE_DROP_HEIGHT = 1.38;
const SURFACE_DROP_MS = 920;
const SURFACE_DROP_HEIGHT = 1.44;
const FLOOR_TUMBLER_DROP_MS = 1020;
const FLOOR_TUMBLER_DROP_HEIGHT = 5.2;
const CLUTTER_DROP_LOW_HEIGHT = 0.88;
const CLUTTER_DROP_HIGH_HEIGHT = 5.85;

const DESK_ASSET_Y_OFFSET = {
  note: 0.1,
  scribble: -0.78,
  tumbler: -0.05,
};

const DESK_LAYOUT = {
  x: -6.95,
  floorY: 0.02,
  backInset: 5.55,
};

const DESK_TOP_ITEM_WORLD_COMP = {
  x: 0.5,
  z: 0,
};

const PREVIOUS_LAYOUT_CACHE_SLOT_MIGRATION_VERSION = 'non-desk-slot-baked-left-v2-right-tighten-floor-tumbler-inset-v5-floor-tumbler-bottom-right-extra-inset';
const LAYOUT_CACHE_SLOT_MIGRATION_VERSION = 'non-desk-slot-baked-left-v2-right-tighten-floor-tumbler-inset-v7-floor-front-priority-v1-floor-tumbler-right-hard-inset-v2';
const NON_DESK_SLOT_BAKED_X_SHIFT = -0.48;
const RIGHT_SIDE_RANGE_TIGHTEN_START_X = 5.05;
const RIGHT_SIDE_RANGE_TIGHTEN_EXTRA_START_X = 6.2;
const RIGHT_SIDE_RANGE_TIGHTEN_X = -0.34;
const RIGHT_SIDE_RANGE_TIGHTEN_EXTRA_X = -0.18;
const FLOOR_TUMBLER_RIGHT_INSET_MIN_X = 3.55;
const FLOOR_TUMBLER_RIGHT_INSET_X = -1.08;
const FLOOR_TUMBLER_BOTTOM_RIGHT_EXTRA_MIN_X = 4.1;
const FLOOR_TUMBLER_BOTTOM_RIGHT_EXTRA_MIN_Z = 1.55;
const FLOOR_TUMBLER_BOTTOM_RIGHT_EXTRA_INSET_X = -1.42;
const FLOOR_TUMBLER_FAR_RIGHT_HARD_MIN_X = 5.05;
const FLOOR_TUMBLER_FAR_RIGHT_HARD_INSET_X = -1.08;
const FLOOR_TUMBLER_MIN_DISTANCE = 3.05;
const FLOOR_TUMBLER_CENTER_PULL_X = 0.42;

const MAX_DESK_NOTE_COUNT = 4;
const MAX_DESK_TUMBLER_COUNT = 5;

const CATEGORY_INFO = {
  emotion: { label: '감정' },
  record: { label: '기록' },
  clutter: { label: '잡생각' },
  routine: { label: '정리' },
  snack: { label: '다짐' },
};

const ASSET_FILES = {
  desk: 'desk.glb',
  note: 'note.glb',
  scribble: 'scribble_note.glb',
  clothesFolded: 'clothes_folded.glb',
  clothesScattered: 'clothes_scattered.glb',
  paperSingle: 'paper_single.glb',
  paperSingle2: 'paper_single2.glb',
  paperPile: 'paper_pile.glb',
  snack: 'snack.glb',
  strawberry: 'strawberry.glb',
  jar: 'jar.glb',
  burn: 'burn.glb',
  tumbler: 'tumbler.glb',
};

const TARGET_MAX_DIMENSION = {
  desk: 7.75,
  note: 1.64,
  scribble: 1.98,
  clothesFolded: 1.12,
  clothesScattered: 1.4,
  paperSingle: 0.58,
  paperSingle2: 0.54,
  paperPile: 1.0,
  snack: 0.95,
  strawberry: 0.92,
  jar: 0.59,
  burn: 0.99,
  tumbler: 1.18,
};

const FLOOR_ONLY_SCALE_MULTIPLIERS = Object.freeze({
  paperSingle: 1.35,
  paperSingle2: 1.35,
  paperPile: 1.3,
  snack: 1.16,
  strawberry: 1.16,
  jar: 1.14,
  burn: 1.16,
  tumbler: 1.5,
  clothesFolded: 1.12,
  clothesScattered: 1.12,
});

const EMOTION_FLOOR_MIN_DISTANCE = 2.18;
const EMOTION_DECAY_FLOOR_MIN_DISTANCE = 2.42;

const DESK_SLOTS = [
  { x: -1.2, z: -4.5, rotY: -0.25 },
  { x: -0.5, z: -4.3, rotY: 0.12 },
  { x: 0.15, z: -4.55, rotY: -0.1 },
  { x: 0.82, z: -4.32, rotY: 0.18 },
  { x: -0.82, z: -3.7, rotY: 0.22 },
  { x: 0.4, z: -3.65, rotY: -0.2 },
  { x: 1.08, z: -3.86, rotY: -0.08 },
];

const CLUTTER_SLOTS = [
  { x: -4.92, z: 3.42, rotY: -0.18, rotZ: 0.06 },
  { x: -3.3, z: 3.56, rotY: -0.14, rotZ: 0.05 },
  { x: -1.66, z: 3.62, rotY: -0.1, rotZ: 0.04 },
  { x: 0.18, z: 3.58, rotY: 0.1, rotZ: -0.04 },
  { x: 1.8, z: 3.48, rotY: 0.12, rotZ: -0.05 },
  { x: 3.46, z: 3.28, rotY: 0.16, rotZ: -0.06 },
  { x: -4.4, z: -2.82, rotY: -0.16, rotZ: -0.04 },
  { x: -3.24, z: -2.58, rotY: -0.14, rotZ: -0.04 },
  { x: -2.02, z: -2.42, rotY: -0.10, rotZ: 0.03 },
  { x: -0.76, z: -2.36, rotY: -0.08, rotZ: 0.03 },
  { x: 0.58, z: -2.28, rotY: 0.08, rotZ: -0.03 },
  { x: 1.84, z: -2.46, rotY: 0.10, rotZ: -0.04 },
  { x: 3.04, z: -2.68, rotY: 0.14, rotZ: -0.05 },
  { x: -3.82, z: -1.84, rotY: -0.14, rotZ: -0.03 },
  { x: -2.6, z: -1.66, rotY: -0.10, rotZ: 0.04 },
  { x: -1.3, z: -1.58, rotY: -0.08, rotZ: 0.03 },
  { x: 0.04, z: -1.54, rotY: 0.08, rotZ: -0.03 },
  { x: 1.36, z: -1.62, rotY: 0.10, rotZ: -0.04 },
  { x: 2.66, z: -1.86, rotY: 0.12, rotZ: -0.05 },
  { x: -7.42, z: 2.78, rotY: -0.22, rotZ: 0.08 },
  { x: 6.5, z: 2.74, rotY: 0.2, rotZ: -0.08 },
  { x: -6.2, z: 2.52, rotY: -0.16, rotZ: 0.06 },
  { x: 5.4, z: 2.48, rotY: 0.18, rotZ: -0.06 },
  { x: -4.94, z: 2.24, rotY: -0.14, rotZ: 0.05 },
  { x: 4.2, z: 2.18, rotY: 0.14, rotZ: -0.05 },
  { x: -3.66, z: 2.06, rotY: -0.12, rotZ: 0.04 },
  { x: 2.78, z: 1.98, rotY: 0.12, rotZ: -0.04 },
  { x: -2.2, z: 1.88, rotY: -0.1, rotZ: 0.04 },
  { x: 1.38, z: 1.84, rotY: 0.1, rotZ: -0.04 },
  { x: -8.03, z: -1.58, rotY: -0.42, rotZ: -0.07 },
  { x: 6.44, z: -1.34, rotY: 0.24, rotZ: -0.05 },
  { x: -7.34, z: -2.08, rotY: -0.28, rotZ: -0.06 },
  { x: 5.86, z: -1.92, rotY: 0.18, rotZ: -0.05 },
  { x: -6.7, z: -0.88, rotY: -0.16, rotZ: 0.05 },
  { x: 5.68, z: -0.32, rotY: 0.18, rotZ: 0.04 },
  { x: -7.14, z: 0.72, rotY: -0.2, rotZ: 0.08 },
  { x: 6.24, z: 0.88, rotY: 0.22, rotZ: -0.08 },
  { x: -6.6, z: -4.18, rotY: -0.34, rotZ: -0.08 },
  { x: 5.98, z: -4.22, rotY: 0.22, rotZ: 0.06 },
  { x: -7.82, z: -4.94, rotY: -0.52, rotZ: -0.12 },
  { x: 6.48, z: -4.84, rotY: 0.26, rotZ: 0.08 },
  { x: 6.8, z: -4.36, rotY: 0.22, rotZ: 0.05 },
  { x: 6.94, z: -1.86, rotY: 0.18, rotZ: -0.05 },
  { x: 6.7, z: -0.08, rotY: 0.16, rotZ: 0.05 },
  { x: 6.56, z: 1.62, rotY: 0.18, rotZ: -0.06 },
  { x: -6.2, z: -2.86, rotY: -0.2, rotZ: -0.04 },
  { x: 5.4, z: -3.08, rotY: 0.18, rotZ: 0.06 },
  { x: -5.52, z: -1.42, rotY: -0.18, rotZ: -0.03 },
  { x: 4.48, z: -1.84, rotY: 0.16, rotZ: -0.06 },
  { x: -4.66, z: -2.34, rotY: -0.12, rotZ: 0.04 },
  { x: 3.88, z: -2.46, rotY: 0.14, rotZ: -0.05 },
  { x: -6.32, z: 1.82, rotY: -0.18, rotZ: 0.08 },
  { x: 5.6, z: 1.72, rotY: 0.18, rotZ: -0.09 },
  { x: -5.54, z: 1.52, rotY: -0.18, rotZ: 0.07 },
  { x: -6.9, z: -1.36, rotY: -0.16, rotZ: 0.03 },
  { x: -6.66, z: -0.18, rotY: -0.14, rotZ: 0.04 },
  { x: -5.82, z: -1.88, rotY: -0.16, rotZ: -0.02 },
  { x: -4.94, z: -0.94, rotY: -0.1, rotZ: 0.03 },
  { x: -6.26, z: -1.72, rotY: -0.16, rotZ: -0.02 },
  { x: -6.44, z: -0.46, rotY: -0.12, rotZ: 0.04 },
  { x: 4.86, z: 2.02, rotY: 0.16, rotZ: -0.07 },
  { x: -1.66, z: 1.46, rotY: -0.16, rotZ: 0.07 },
  { x: -3.14, z: -1.08, rotY: -0.14, rotZ: 0.05 },
  { x: -2.24, z: -1.34, rotY: -0.1, rotZ: 0.04 },
  { x: -1.26, z: -1.52, rotY: -0.08, rotZ: 0.03 },
  { x: -0.2, z: -1.58, rotY: 0.08, rotZ: -0.03 },
  { x: 0.94, z: -1.42, rotY: 0.12, rotZ: -0.04 },
  { x: 2.06, z: -1.72, rotY: 0.14, rotZ: -0.05 },
  { x: -2.56, z: -2.18, rotY: -0.12, rotZ: 0.04 },
  { x: -1.4, z: -2.34, rotY: -0.08, rotZ: 0.03 },
  { x: -0.04, z: -2.48, rotY: 0.08, rotZ: -0.03 },
  { x: 1.3, z: -2.26, rotY: 0.1, rotZ: -0.04 },
  { x: -3.66, z: -1.78, rotY: -0.14, rotZ: 0.05 },
  { x: -3.36, z: -0.38, rotY: -0.12, rotZ: 0.04 },
];

const RECORD_FLOOR_SLOTS = [
  { x: -4.66, z: 3.34, rotY: -0.16, rotZ: 0.05 },
  { x: -3.02, z: 3.48, rotY: -0.14, rotZ: 0.04 },
  { x: -1.44, z: 3.54, rotY: -0.1, rotZ: 0.03 },
  { x: 0.38, z: 3.46, rotY: 0.1, rotZ: -0.03 },
  { x: 1.86, z: 3.34, rotY: 0.12, rotZ: -0.04 },
  { x: 3.34, z: 3.16, rotY: 0.14, rotZ: -0.05 },
  { x: -4.32, z: -2.74, rotY: -0.16, rotZ: -0.04 },
  { x: -3.1, z: -2.48, rotY: -0.14, rotZ: -0.04 },
  { x: -1.82, z: -2.28, rotY: -0.10, rotZ: 0.03 },
  { x: -0.46, z: -2.18, rotY: 0.08, rotZ: -0.03 },
  { x: 0.86, z: -2.14, rotY: 0.10, rotZ: -0.04 },
  { x: 2.08, z: -2.32, rotY: 0.12, rotZ: -0.04 },
  { x: 3.26, z: -2.58, rotY: 0.14, rotZ: -0.05 },
  { x: -3.64, z: -1.78, rotY: -0.14, rotZ: -0.03 },
  { x: -2.4, z: -1.52, rotY: -0.10, rotZ: 0.04 },
  { x: -1.1, z: -1.42, rotY: -0.08, rotZ: 0.03 },
  { x: 0.24, z: -1.36, rotY: 0.08, rotZ: -0.03 },
  { x: 1.56, z: -1.42, rotY: 0.10, rotZ: -0.04 },
  { x: 2.76, z: -1.68, rotY: 0.12, rotZ: -0.05 },
  { x: -7.3, z: 2.68, rotY: -0.18, rotZ: 0.06 },
  { x: 6.38, z: 2.64, rotY: 0.16, rotZ: -0.06 },
  { x: -6.02, z: 2.42, rotY: -0.14, rotZ: 0.05 },
  { x: 5.14, z: 2.38, rotY: 0.14, rotZ: -0.05 },
  { x: -4.66, z: 2.12, rotY: -0.12, rotZ: 0.04 },
  { x: 3.76, z: 2.08, rotY: 0.12, rotZ: -0.04 },
  { x: -3.32, z: 1.94, rotY: -0.1, rotZ: 0.03 },
  { x: 2.44, z: 1.92, rotY: 0.1, rotZ: -0.03 },
  { x: -1.92, z: 1.78, rotY: -0.08, rotZ: 0.03 },
  { x: 1.04, z: 1.74, rotY: 0.08, rotZ: -0.03 },
  { x: -7.86, z: -1.26, rotY: -0.28, rotZ: -0.07 },
  { x: 6.36, z: -1.08, rotY: 0.18, rotZ: 0.05 },
  { x: -7.14, z: -2.04, rotY: -0.22, rotZ: -0.04 },
  { x: 5.74, z: -1.88, rotY: 0.16, rotZ: -0.05 },
  { x: -6.56, z: -0.38, rotY: -0.12, rotZ: 0.03 },
  { x: 5.54, z: -0.02, rotY: 0.2, rotZ: 0.06 },
  { x: -7, z: 0.74, rotY: -0.16, rotZ: 0.04 },
  { x: 6.06, z: 0.92, rotY: 0.16, rotZ: -0.04 },
  { x: -6.76, z: -4.08, rotY: -0.32, rotZ: -0.06 },
  { x: 5.9, z: -4.02, rotY: 0.18, rotZ: 0.06 },
  { x: -7.8, z: -4.64, rotY: -0.26, rotZ: -0.08 },
  { x: 6.38, z: -4.56, rotY: 0.2, rotZ: 0.06 },
  { x: 6.7, z: -4.12, rotY: 0.18, rotZ: 0.05 },
  { x: 6.88, z: -1.74, rotY: 0.16, rotZ: -0.04 },
  { x: 6.66, z: 0.22, rotY: 0.16, rotZ: 0.04 },
  { x: 6.5, z: 1.36, rotY: 0.12, rotZ: 0.04 },
  { x: -5.7, z: -1.06, rotY: -0.18, rotZ: -0.04 },
  { x: -5.6, z: -1.94, rotY: -0.14, rotZ: -0.06 },
  { x: -5.06, z: -0.92, rotY: -0.1, rotZ: 0.03 },
  { x: -4.9, z: -2.58, rotY: -0.16, rotZ: -0.04 },
  { x: -3.6, z: -1.82, rotY: -0.14, rotZ: -0.06 },
  { x: -2.6, z: -0.86, rotY: 0.12, rotZ: 0.04 },
  { x: 4.16, z: -2.08, rotY: 0.14, rotZ: -0.05 },
  { x: -7.42, z: -2.94, rotY: -0.3, rotZ: 0.02 },
  { x: 5.48, z: -2.82, rotY: 0.12, rotZ: -0.04 },
  { x: -5.96, z: -3.06, rotY: -0.18, rotZ: 0.03 },
  { x: 4.88, z: 1.5, rotY: 0.1, rotZ: 0.04 },
  { x: -6.12, z: 1.52, rotY: -0.1, rotZ: 0.03 },
  { x: -6.42, z: -1.58, rotY: -0.16, rotZ: -0.02 },
  { x: -6.26, z: -0.18, rotY: -0.1, rotZ: 0.03 },
  { x: -3.32, z: -1.02, rotY: -0.14, rotZ: -0.03 },
  { x: -2.46, z: -1.18, rotY: -0.1, rotZ: 0.04 },
  { x: -1.54, z: -1.28, rotY: -0.08, rotZ: 0.03 },
  { x: -0.42, z: -1.36, rotY: 0.08, rotZ: -0.03 },
  { x: 0.68, z: -1.3, rotY: 0.1, rotZ: -0.04 },
  { x: 1.74, z: -1.48, rotY: 0.12, rotZ: -0.04 },
  { x: -2.66, z: -2.02, rotY: -0.12, rotZ: -0.04 },
  { x: -1.42, z: -2.18, rotY: -0.08, rotZ: 0.03 },
  { x: -0.1, z: -2.26, rotY: 0.08, rotZ: -0.03 },
  { x: 1.2, z: -2.08, rotY: 0.1, rotZ: -0.04 },
  { x: -3.92, z: -1.54, rotY: -0.12, rotZ: -0.03 },
  { x: -3.5, z: -0.42, rotY: -0.1, rotZ: 0.03 },
];

const RECORD_SECONDARY_SPREAD_SLOTS = [
  { x: -4.2, z: 3.22, rotY: -0.16, rotZ: 0.05 },
  { x: 3.1, z: 3.08, rotY: 0.14, rotZ: -0.05 },
  { x: -2.34, z: 3.42, rotY: -0.12, rotZ: 0.04 },
  { x: 1.48, z: 3.34, rotY: 0.12, rotZ: -0.04 },
  { x: -4.2, z: -2.62, rotY: -0.16, rotZ: -0.04 },
  { x: 3.16, z: -2.52, rotY: 0.14, rotZ: -0.05 },
  { x: -2.7, z: -1.58, rotY: -0.12, rotZ: 0.04 },
  { x: 1.78, z: -1.52, rotY: 0.12, rotZ: -0.04 },
  { x: -7.3, z: 2.68, rotY: -0.18, rotZ: 0.06 },
  { x: 6.38, z: 2.64, rotY: 0.16, rotZ: -0.06 },
  { x: -6.02, z: 2.42, rotY: -0.14, rotZ: 0.05 },
  { x: 5.14, z: 2.38, rotY: 0.14, rotZ: -0.05 },
  { x: -4.66, z: 2.12, rotY: -0.12, rotZ: 0.04 },
  { x: 3.76, z: 2.08, rotY: 0.12, rotZ: -0.04 },
  { x: -3.32, z: 1.94, rotY: -0.1, rotZ: 0.03 },
  { x: 2.44, z: 1.92, rotY: 0.1, rotZ: -0.03 },
  { x: -7.86, z: -1.26, rotY: -0.28, rotZ: -0.07 },
  { x: 6.36, z: -1.08, rotY: 0.18, rotZ: 0.05 },
  { x: -6.76, z: -4.08, rotY: -0.32, rotZ: -0.06 },
  { x: 5.9, z: -4.02, rotY: 0.18, rotZ: 0.06 },
];

const FLOOR_TUMBLER_PREFERRED_SLOTS = [
  ...RECORD_SECONDARY_SPREAD_SLOTS.map((slot) => ({ ...slot })),
  { x: -2.48, z: 0.52, rotY: -0.12, rotZ: 0.04 },
  { x: -0.92, z: 0.68, rotY: -0.08, rotZ: 0.03 },
  { x: 0.54, z: 0.64, rotY: 0.1, rotZ: -0.03 },
  { x: 1.98, z: 0.5, rotY: 0.12, rotZ: -0.04 },
  { x: -2.82, z: 3.62, rotY: -0.14, rotZ: 0.05 },
  { x: -1.08, z: 3.76, rotY: -0.1, rotZ: 0.03 },
  { x: 0.84, z: 3.68, rotY: 0.1, rotZ: -0.03 },
  { x: 2.58, z: 3.52, rotY: 0.12, rotZ: -0.04 },
];

const CLUTTER_SECONDARY_SPREAD_SLOTS = [
  { x: -4.54, z: 3.28, rotY: -0.18, rotZ: 0.06 },
  { x: 3.48, z: 3.16, rotY: 0.16, rotZ: -0.06 },
  { x: -2.64, z: 3.48, rotY: -0.14, rotZ: 0.05 },
  { x: 1.64, z: 3.42, rotY: 0.12, rotZ: -0.05 },
  { x: -7.42, z: 2.78, rotY: -0.22, rotZ: 0.08 },
  { x: 6.5, z: 2.74, rotY: 0.2, rotZ: -0.08 },
  { x: -6.2, z: 2.52, rotY: -0.16, rotZ: 0.06 },
  { x: 5.4, z: 2.48, rotY: 0.18, rotZ: -0.06 },
  { x: -4.94, z: 2.24, rotY: -0.14, rotZ: 0.05 },
  { x: 4.2, z: 2.18, rotY: 0.14, rotZ: -0.05 },
  { x: -8.03, z: -1.58, rotY: -0.42, rotZ: -0.07 },
  { x: 6.44, z: -1.34, rotY: 0.24, rotZ: -0.05 },
  { x: -6.6, z: -4.18, rotY: -0.34, rotZ: -0.08 },
  { x: 5.98, z: -4.22, rotY: 0.22, rotZ: 0.06 },
  { x: -6.32, z: 1.82, rotY: -0.18, rotZ: 0.08 },
  { x: 5.6, z: 1.72, rotY: 0.18, rotZ: -0.09 },
];

const CAMERA_FRONT_SLOT_ADJUST = {
  frontBandMinZ: 1.55,
  frontShiftZ: -0.22,
  cornerBandMinZ: 0.0,
  cornerEdgeAbsX: 6.15,
  cornerPullX: 0.84,
  cornerShiftZ: -0.12,
};

function applyCameraFrontSlotAdjustments(slotLists) {
  slotLists.forEach((slotList) => {
    slotList.forEach((slot) => {
      const isFrontBand = slot.z >= CAMERA_FRONT_SLOT_ADJUST.frontBandMinZ;
      const isNearFrontCorner = Math.abs(slot.x) >= CAMERA_FRONT_SLOT_ADJUST.cornerEdgeAbsX
        && slot.z >= CAMERA_FRONT_SLOT_ADJUST.cornerBandMinZ;

      if (isFrontBand) {
        slot.z += CAMERA_FRONT_SLOT_ADJUST.frontShiftZ;
      }

      if (isNearFrontCorner) {
        slot.x += slot.x > 0 ? -CAMERA_FRONT_SLOT_ADJUST.cornerPullX : CAMERA_FRONT_SLOT_ADJUST.cornerPullX;
        slot.z += CAMERA_FRONT_SLOT_ADJUST.cornerShiftZ;
      }
    });
  });
}

applyCameraFrontSlotAdjustments([
  CLUTTER_SLOTS,
  RECORD_FLOOR_SLOTS,
  RECORD_SECONDARY_SPREAD_SLOTS,
  CLUTTER_SECONDARY_SPREAD_SLOTS,
]);

const RIGHT_SIDE_RANGE_EXPAND = {
  minX: 4.75,
  frontMinZ: 0.5,
  strongFrontMinZ: 1.45,
  baseShiftX: 0.32,
  frontShiftX: 1.01,
  strongFrontShiftX: 1.04,
  frontShiftZ: -0.14,
  strongFrontShiftZ: -0.28,
  rotYAdd: 0.06,
};

function applyRightSideRangeExpand(slotLists) {
  slotLists.forEach((slotList) => {
    slotList.forEach((slot) => {
      if (slot.x < RIGHT_SIDE_RANGE_EXPAND.minX) return;

      const isStrongFront = slot.z >= RIGHT_SIDE_RANGE_EXPAND.strongFrontMinZ;
      const isFront = slot.z >= RIGHT_SIDE_RANGE_EXPAND.frontMinZ;

      if (isStrongFront) {
        slot.x += RIGHT_SIDE_RANGE_EXPAND.strongFrontShiftX;
        slot.z += RIGHT_SIDE_RANGE_EXPAND.strongFrontShiftZ;
      } else if (isFront) {
        slot.x += RIGHT_SIDE_RANGE_EXPAND.frontShiftX;
        slot.z += RIGHT_SIDE_RANGE_EXPAND.frontShiftZ;
      } else {
        slot.x += RIGHT_SIDE_RANGE_EXPAND.baseShiftX;
      }

      slot.rotY = (slot.rotY || 0) + RIGHT_SIDE_RANGE_EXPAND.rotYAdd;
    });
  });
}

const CLOTHES_SLOTS = [
  { x: 3.22, z: 1.0, rotY: -0.4 },
  { x: 4.22, z: 1.9, rotY: 0.18 },
  { x: 4.67, z: 0.6, rotY: -0.1 },
  { x: 3.07, z: 2.5, rotY: 0.28 },
];

const SNACK_SLOTS = [
  { x: -3.73, z: 2.85, rotY: 0.38 },
  { x: -2.43, z: 2.45, rotY: -0.16 },
  { x: -1.33, z: 2.12, rotY: 0.12 },
  { x: -4.63, z: 3.18, rotY: -0.24 },
];

const GOOD_EMOTION_ANCHORS = [
  { x: -2.35, y: 3.04, z: -1.04 },
  { x: -1.18, y: 2.78, z: -2.16 },
  { x: 0.18, y: 3.32, z: -0.72 },
  { x: 1.62, y: 2.84, z: -2.04 },
  { x: 2.52, y: 3.08, z: -0.98 },
  { x: -0.34, y: 2.48, z: -2.86 },
  { x: -2.82, y: 2.7, z: -2.34 },
  { x: 2.88, y: 2.78, z: -2.42 },
];

const BAD_EMOTION_ANCHORS = [
  { x: -2.08, y: 2.56, z: -0.94 },
  { x: -1.02, y: 2.34, z: -1.88 },
  { x: 0.34, y: 2.82, z: -0.72 },
  { x: 1.58, y: 2.28, z: -1.86 },
  { x: 2.22, y: 2.48, z: -0.94 },
  { x: -0.22, y: 2.12, z: -2.52 },
  { x: 2.7, y: 2.2, z: -2.18 },
];

const EMOTION_REWARD_SLOTS = [
  { x: -6.2, z: 3.18, rotY: 0.34 },
  { x: 4.96, z: 3.12, rotY: -0.28 },
  { x: -5.06, z: 2.42, rotY: 0.28 },
  { x: 3.98, z: 2.38, rotY: -0.22 },
  { x: -3.96, z: 3.28, rotY: -0.18 },
  { x: 3.08, z: 3.22, rotY: 0.16 },
  { x: -2.94, z: 2.02, rotY: 0.16 },
  { x: 2.1, z: 1.98, rotY: -0.12 },
  { x: -2.02, z: 2.76, rotY: 0.12 },
  { x: 1.14, z: 2.68, rotY: -0.08 },
  { x: -1.16, z: 1.96, rotY: 0.1 },
  { x: 0.28, z: 1.92, rotY: -0.08 },
  { x: -5.46, z: 1.52, rotY: 0.22 },
  { x: 4.34, z: 1.58, rotY: -0.18 },
  { x: -2.54, z: 3.36, rotY: 0.08 },
  { x: 1.66, z: 3.32, rotY: -0.08 },
];

const DESK_EMOTION_REWARD_SLOTS = [
  { u: 0.36, v: 0.36, rotY: -0.08, zOffset: -0.34, xOffset: -0.02 },
  { u: 0.44, v: 0.44, rotY: 0.08, zOffset: -0.32, xOffset: 0.06 },
];

applyRightSideRangeExpand([
  CLUTTER_SLOTS,
  RECORD_FLOOR_SLOTS,
  RECORD_SECONDARY_SPREAD_SLOTS,
  CLUTTER_SECONDARY_SPREAD_SLOTS,
  CLOTHES_SLOTS,
  EMOTION_REWARD_SLOTS,
]);

const FRONT_INNER_GATHER_CONFIG = {
  frontMinZ: 1.15,
  centerBandAbsXMax: 2.35,
  centerShiftZ: -0.34,
  edgeBandAbsXMin: 4.9,
  edgePullX: 1.18,
  edgeShiftZ: -0.28,
  extremeEdgeAbsXMin: 6.15,
  extremeEdgePullX: 0.72,
  extremeEdgeShiftZ: -0.14,
};

function applyFrontInnerGather(slotLists) {
  slotLists.forEach((slotList) => {
    slotList.forEach((slot) => {
      if (slot.z < FRONT_INNER_GATHER_CONFIG.frontMinZ) return;

      if (Math.abs(slot.x) <= FRONT_INNER_GATHER_CONFIG.centerBandAbsXMax) {
        slot.z += FRONT_INNER_GATHER_CONFIG.centerShiftZ;
      }

      if (Math.abs(slot.x) >= FRONT_INNER_GATHER_CONFIG.edgeBandAbsXMin) {
        slot.x += slot.x > 0 ? -FRONT_INNER_GATHER_CONFIG.edgePullX : FRONT_INNER_GATHER_CONFIG.edgePullX;
        slot.z += FRONT_INNER_GATHER_CONFIG.edgeShiftZ;
      }

      if (Math.abs(slot.x) >= FRONT_INNER_GATHER_CONFIG.extremeEdgeAbsXMin) {
        slot.x += slot.x > 0 ? -FRONT_INNER_GATHER_CONFIG.extremeEdgePullX : FRONT_INNER_GATHER_CONFIG.extremeEdgePullX;
        slot.z += FRONT_INNER_GATHER_CONFIG.extremeEdgeShiftZ;
      }
    });
  });
}

applyFrontInnerGather([
  CLUTTER_SLOTS,
  RECORD_FLOOR_SLOTS,
  RECORD_SECONDARY_SPREAD_SLOTS,
  CLUTTER_SECONDARY_SPREAD_SLOTS,
]);

const RIGHT_FRONT_FORBIDDEN = {
  minX: 4.2,
  minZ: -0.62,
  strongFrontMinZ: 0.92,
  targetMinX: 6.08,
  targetMaxX: 7.78,
  sidePushX: 1.48,
  strongSidePushX: 1.92,
  targetSideX: 6.82,
  targetZ: -1.88,
  strongTargetZ: -3.08,
  rotYAdd: 0.16,
  cacheFlag: '__rightFrontForbiddenV6',
};

function isInRightFrontForbiddenZone(slot) {
  return !!slot
    && Number.isFinite(slot.x)
    && Number.isFinite(slot.z)
    && slot.x >= RIGHT_FRONT_FORBIDDEN.minX
    && slot.z >= RIGHT_FRONT_FORBIDDEN.minZ;
}

function applyRightFrontRedirectToSlot(slot) {
  if (!slot || slot[RIGHT_FRONT_FORBIDDEN.cacheFlag]) return slot;
  if (!isInRightFrontForbiddenZone(slot)) return slot;

  const isStrongFront = slot.z >= RIGHT_FRONT_FORBIDDEN.strongFrontMinZ;
  const pushedX = slot.x + (isStrongFront ? RIGHT_FRONT_FORBIDDEN.strongSidePushX : RIGHT_FRONT_FORBIDDEN.sidePushX);

  slot.x = clamp(
    Math.max(pushedX, RIGHT_FRONT_FORBIDDEN.targetSideX),
    RIGHT_FRONT_FORBIDDEN.targetMinX,
    RIGHT_FRONT_FORBIDDEN.targetMaxX,
  );
  slot.z = isStrongFront ? RIGHT_FRONT_FORBIDDEN.strongTargetZ : RIGHT_FRONT_FORBIDDEN.targetZ;
  slot.rotY = (slot.rotY || 0) + RIGHT_FRONT_FORBIDDEN.rotYAdd;
  slot[RIGHT_FRONT_FORBIDDEN.cacheFlag] = true;
  return slot;
}

function applyRightFrontRedirect(slotLists) {
  slotLists.forEach((slotList) => {
    slotList.forEach((slot) => {
      applyRightFrontRedirectToSlot(slot);
    });
  });
}

applyRightFrontRedirect([
  CLUTTER_SLOTS,
  RECORD_FLOOR_SLOTS,
  RECORD_SECONDARY_SPREAD_SLOTS,
  CLUTTER_SECONDARY_SPREAD_SLOTS,
  CLOTHES_SLOTS,
  EMOTION_REWARD_SLOTS,
]);

const LEFT_FRONT_FORBIDDEN = {
  minX: -5.58,
  maxX: -4.1,
  minZ: 0.38,
  strongFrontMinZ: 1.26,
  targetMinX: -6.92,
  targetMaxX: -5.62,
  targetSideX: -6.24,
  sidePushX: -0.92,
  strongSidePushX: -1.26,
  targetZ: -1.12,
  strongTargetZ: -2.04,
  rotYAdd: -0.16,
};

const FAR_LEFT_FRONT_FILL = {
  maxX: -6.02,
  minZ: 1.34,
  maxZ: 3.22,
  pullLeftX: -0.22,
  pullForwardZ: 0.34,
  extremeMaxX: -6.86,
  extremeExtraLeftX: -0.12,
  extremeExtraForwardZ: 0.22,
  clampMaxZ: 3.48,
  rotYAdd: -0.04,
};

const CENTER_FRONT_FORBIDDEN = {
  minX: -2.5,
  maxX: 2.5,
  minZ: 1.42,
  strongFrontMinZ: 2.32,
  sideTargetAbsX: 2.88,
  strongSideTargetAbsX: 3.52,
  targetZ: 0.42,
  strongTargetZ: -0.22,
  rotYAdd: 0.08,
};

const DESK_UNDER_RIGHT_SOFT_AVOID = {
  minX: 1.05,
  maxX: 3.75,
  minZ: -4.1,
  maxZ: -1.02,
};

const DESK_LEG_RIGHT_LEFT_HARD_AVOID = {
  minX: 0.18,
  maxX: 1.72,
  minZ: -4.34,
  maxZ: -2.14,
  targetX: -0.48,
  targetZ: -1.86,
  rotYAdd: -0.08,
};

const LEFT_EDGE_FORWARD_PULL = {
  maxX: -5.72,
  minZ: -2.82,
  maxZ: 2.52,
  pullForwardZ: 0.42,
  clampMaxZ: 2.82,
  extremeMaxX: -6.48,
  extremeExtraPullForwardZ: 0.28,
  extremeClampMaxZ: 3.08,
};

const BACK_CORNER_BLIND = {
  minAbsX: 5.1,
  maxZ: -3.58,
  targetAbsX: 4.42,
  targetZ: -2.54,
  rotYAdd: 0.12,
};

const FLOOR_PLACEMENT_NORMALIZE_VERSION = '__floorPlacementNormalizedV9';

function isInLeftFrontForbiddenZone(slot) {
  return !!slot
    && Number.isFinite(slot.x)
    && Number.isFinite(slot.z)
    && slot.x >= LEFT_FRONT_FORBIDDEN.minX
    && slot.x <= LEFT_FRONT_FORBIDDEN.maxX
    && slot.z >= LEFT_FRONT_FORBIDDEN.minZ;
}

function applyLeftFrontRedirectToSlot(slot) {
  if (!slot) return slot;
  if (!isInLeftFrontForbiddenZone(slot)) return slot;

  const isStrongFront = slot.z >= LEFT_FRONT_FORBIDDEN.strongFrontMinZ;
  const pushedX = slot.x + (isStrongFront ? LEFT_FRONT_FORBIDDEN.strongSidePushX : LEFT_FRONT_FORBIDDEN.sidePushX);

  slot.x = clamp(
    Math.min(pushedX, LEFT_FRONT_FORBIDDEN.targetSideX),
    LEFT_FRONT_FORBIDDEN.targetMinX,
    LEFT_FRONT_FORBIDDEN.targetMaxX,
  );
  slot.z = isStrongFront ? LEFT_FRONT_FORBIDDEN.strongTargetZ : LEFT_FRONT_FORBIDDEN.targetZ;
  slot.rotY = (slot.rotY || 0) + LEFT_FRONT_FORBIDDEN.rotYAdd;
  return slot;
}

function isInCenterFrontForbiddenZone(slot) {
  return !!slot
    && Number.isFinite(slot.x)
    && Number.isFinite(slot.z)
    && slot.x >= CENTER_FRONT_FORBIDDEN.minX
    && slot.x <= CENTER_FRONT_FORBIDDEN.maxX
    && slot.z >= CENTER_FRONT_FORBIDDEN.minZ;
}

function applyCenterFrontRedirectToSlot(slot) {
  if (!slot) return slot;
  if (!isInCenterFrontForbiddenZone(slot)) return slot;

  const isStrongFront = slot.z >= CENTER_FRONT_FORBIDDEN.strongFrontMinZ;
  const sideTargetAbsX = isStrongFront
    ? CENTER_FRONT_FORBIDDEN.strongSideTargetAbsX
    : CENTER_FRONT_FORBIDDEN.sideTargetAbsX;

  const moveRight = slot.x > 0 ? true : slot.x < 0 ? false : (slot.rotY || 0) >= 0;
  slot.x = moveRight ? sideTargetAbsX : -sideTargetAbsX;
  slot.z = isStrongFront ? CENTER_FRONT_FORBIDDEN.strongTargetZ : CENTER_FRONT_FORBIDDEN.targetZ;
  slot.rotY = (slot.rotY || 0) + (moveRight ? CENTER_FRONT_FORBIDDEN.rotYAdd : -CENTER_FRONT_FORBIDDEN.rotYAdd);
  return slot;
}

function isInDeskUnderRightSoftAvoidZone(slot) {
  return !!slot
    && Number.isFinite(slot.x)
    && Number.isFinite(slot.z)
    && slot.x >= DESK_UNDER_RIGHT_SOFT_AVOID.minX
    && slot.x <= DESK_UNDER_RIGHT_SOFT_AVOID.maxX
    && slot.z >= DESK_UNDER_RIGHT_SOFT_AVOID.minZ
    && slot.z <= DESK_UNDER_RIGHT_SOFT_AVOID.maxZ;
}

function applyDeskUnderRightReduceToSlot(slot) {
  if (!slot) return slot;
  if (!isInDeskUnderRightSoftAvoidZone(slot)) return slot;

  slot.x -= 1.12;
  slot.z += 0.58;
  slot.rotY = (slot.rotY || 0) - 0.06;
  return slot;
}

function isInDeskLegRightLeftHardAvoidZone(slot) {
  return !!slot
    && Number.isFinite(slot.x)
    && Number.isFinite(slot.z)
    && slot.x >= DESK_LEG_RIGHT_LEFT_HARD_AVOID.minX
    && slot.x <= DESK_LEG_RIGHT_LEFT_HARD_AVOID.maxX
    && slot.z >= DESK_LEG_RIGHT_LEFT_HARD_AVOID.minZ
    && slot.z <= DESK_LEG_RIGHT_LEFT_HARD_AVOID.maxZ;
}

function applyDeskLegRightLeftRedirectToSlot(slot) {
  if (!slot) return slot;
  if (!isInDeskLegRightLeftHardAvoidZone(slot)) return slot;

  slot.x = Math.min(slot.x - 1.04, DESK_LEG_RIGHT_LEFT_HARD_AVOID.targetX);
  slot.z = Math.max(slot.z + 0.92, DESK_LEG_RIGHT_LEFT_HARD_AVOID.targetZ);
  slot.rotY = (slot.rotY || 0) + DESK_LEG_RIGHT_LEFT_HARD_AVOID.rotYAdd;
  return slot;
}

function isInBackCornerBlindZone(slot) {
  return !!slot
    && Number.isFinite(slot.x)
    && Number.isFinite(slot.z)
    && Math.abs(slot.x) >= BACK_CORNER_BLIND.minAbsX
    && slot.z <= BACK_CORNER_BLIND.maxZ;
}

function applyBackCornerBlindRedirectToSlot(slot) {
  if (!slot) return slot;
  if (!isInBackCornerBlindZone(slot)) return slot;

  const sign = slot.x >= 0 ? 1 : -1;
  slot.x = sign * Math.min(Math.abs(slot.x) - 0.84, BACK_CORNER_BLIND.targetAbsX);
  slot.x = sign * Math.max(Math.abs(slot.x), 3.72);
  slot.z = Math.max(slot.z + 1.46, BACK_CORNER_BLIND.targetZ);
  slot.rotY = (slot.rotY || 0) + (sign > 0 ? -BACK_CORNER_BLIND.rotYAdd : BACK_CORNER_BLIND.rotYAdd);
  return slot;
}

function shouldPullLeftEdgeSlotForward(slot) {
  return !!slot
    && Number.isFinite(slot.x)
    && Number.isFinite(slot.z)
    && slot.x <= LEFT_EDGE_FORWARD_PULL.maxX
    && slot.z >= LEFT_EDGE_FORWARD_PULL.minZ
    && slot.z <= LEFT_EDGE_FORWARD_PULL.maxZ
    && !isInBackCornerBlindZone(slot)
    && !isInLeftFrontForbiddenZone(slot);
}

function applyLeftEdgeForwardPullToSlot(slot) {
  if (!slot) return slot;
  if (!shouldPullLeftEdgeSlotForward(slot)) return slot;

  const isExtremeLeftEdge = Number.isFinite(slot.x) && slot.x <= LEFT_EDGE_FORWARD_PULL.extremeMaxX;
  const forwardPull = LEFT_EDGE_FORWARD_PULL.pullForwardZ + (isExtremeLeftEdge ? LEFT_EDGE_FORWARD_PULL.extremeExtraPullForwardZ : 0);
  const clampMaxZ = isExtremeLeftEdge ? LEFT_EDGE_FORWARD_PULL.extremeClampMaxZ : LEFT_EDGE_FORWARD_PULL.clampMaxZ;

  slot.z = Math.min(slot.z + forwardPull, clampMaxZ);
  return slot;
}

function shouldFillFarLeftFrontSlot(slot) {
  return !!slot
    && Number.isFinite(slot.x)
    && Number.isFinite(slot.z)
    && slot.x <= FAR_LEFT_FRONT_FILL.maxX
    && slot.z >= FAR_LEFT_FRONT_FILL.minZ
    && slot.z <= FAR_LEFT_FRONT_FILL.maxZ
    && !isInBackCornerBlindZone(slot);
}

function applyFarLeftFrontFillToSlot(slot) {
  if (!slot) return slot;
  if (!shouldFillFarLeftFrontSlot(slot)) return slot;

  const isExtremeFarLeft = Number.isFinite(slot.x) && slot.x <= FAR_LEFT_FRONT_FILL.extremeMaxX;
  const leftShift = FAR_LEFT_FRONT_FILL.pullLeftX + (isExtremeFarLeft ? FAR_LEFT_FRONT_FILL.extremeExtraLeftX : 0);
  const forwardShift = FAR_LEFT_FRONT_FILL.pullForwardZ + (isExtremeFarLeft ? FAR_LEFT_FRONT_FILL.extremeExtraForwardZ : 0);

  slot.x += leftShift;
  slot.z = Math.min(slot.z + forwardShift, FAR_LEFT_FRONT_FILL.clampMaxZ);
  slot.rotY = (slot.rotY || 0) + FAR_LEFT_FRONT_FILL.rotYAdd;
  return slot;
}

function isHardBlockedFloorSlot(slot) {
  return isInRightFrontForbiddenZone(slot)
    || isInLeftFrontForbiddenZone(slot)
    || isInCenterFrontForbiddenZone(slot)
    || isInDeskLegRightLeftHardAvoidZone(slot)
    || isInBackCornerBlindZone(slot);
}

function stabilizeFloorSlotCandidate(slot) {
  if (!slot) return slot;
  normalizeFloorPlacementSlot(slot);

  if (isHardBlockedFloorSlot(slot)) {
    const sign = slot.x >= 0 ? 1 : -1;
    slot.x = sign * Math.min(Math.max(Math.abs(slot.x), 2.8), 4.3);
    slot.z = clamp(slot.z, -2.8, 2.6);
    slot.rotY = (slot.rotY || 0) + (sign > 0 ? -0.06 : 0.06);
    normalizeFloorPlacementSlot(slot);
  }

  return slot;
}

function applyRightSidePullLeftToSlot(slot) {
  if (!slot || !Number.isFinite(slot.x)) return slot;
  if (slot.x < RIGHT_SIDE_RANGE_TIGHTEN_START_X) return slot;

  slot.x += RIGHT_SIDE_RANGE_TIGHTEN_X;

  if (slot.x >= RIGHT_SIDE_RANGE_TIGHTEN_EXTRA_START_X) {
    slot.x += RIGHT_SIDE_RANGE_TIGHTEN_EXTRA_X;
  }

  return slot;
}

function normalizeFloorPlacementSlot(slot) {
  if (!slot || slot[FLOOR_PLACEMENT_NORMALIZE_VERSION]) return slot;

  applyRightFrontRedirectToSlot(slot);
  applyLeftFrontRedirectToSlot(slot);
  applyCenterFrontRedirectToSlot(slot);
  applyDeskUnderRightReduceToSlot(slot);
  applyDeskLegRightLeftRedirectToSlot(slot);
  applyBackCornerBlindRedirectToSlot(slot);
  applyLeftEdgeForwardPullToSlot(slot);
  applyFarLeftFrontFillToSlot(slot);
  applyRightSidePullLeftToSlot(slot);

  slot[FLOOR_PLACEMENT_NORMALIZE_VERSION] = true;
  return slot;
}

function applyFloorPlacementNormalization(slotLists) {
  slotLists.forEach((slotList) => {
    slotList.forEach((slot) => {
      normalizeFloorPlacementSlot(slot);
    });
  });
}

function getFloorSlotSpreadBucket(slot) {
  if (isInDeskUnderRightSoftAvoidZone(slot) || isInDeskLegRightLeftHardAvoidZone(slot)) return 8;
  if (slot.z < -2.1 && slot.x < -1.0) return 0;
  if (slot.z < -2.1 && slot.x > 1.0) return 1;
  if (slot.z < 0.6 && Math.abs(slot.x) <= 2.4) return 2;
  if (slot.z < 1.7 && slot.x < -1.0) return 3;
  if (slot.z < 1.7 && slot.x > 1.0) return 4;
  if (slot.z < 1.7) return 5;
  if (slot.x < 0) return 6;
  return 7;
}

function rebalanceFloorSlotSpread(slotLists) {
  slotLists.forEach((slotList) => {
    const buckets = Array.from({ length: 9 }, () => []);
    slotList.forEach((slot) => {
      buckets[getFloorSlotSpreadBucket(slot)].push(slot);
    });

    buckets.forEach((bucket) => {
      bucket.sort((a, b) => {
        const depthDiff = a.z - b.z;
        if (depthDiff !== 0) return depthDiff;
        return Math.abs(a.x) - Math.abs(b.x);
      });
    });

    const next = [];
    let added = true;
    while (added) {
      added = false;
      for (let i = 0; i < buckets.length; i += 1) {
        if (buckets[i].length) {
          next.push(buckets[i].shift());
          added = true;
        }
      }
    }

    slotList.splice(0, slotList.length, ...next);
  });
}

applyFloorPlacementNormalization([
  CLUTTER_SLOTS,
  RECORD_FLOOR_SLOTS,
  RECORD_SECONDARY_SPREAD_SLOTS,
  CLUTTER_SECONDARY_SPREAD_SLOTS,
  CLOTHES_SLOTS,
  SNACK_SLOTS,
  EMOTION_REWARD_SLOTS,
]);

rebalanceFloorSlotSpread([
  CLUTTER_SLOTS,
  RECORD_FLOOR_SLOTS,
  RECORD_SECONDARY_SPREAD_SLOTS,
  CLUTTER_SECONDARY_SPREAD_SLOTS,
  CLOTHES_SLOTS,
  EMOTION_REWARD_SLOTS,
]);

const EMOTION_REWARD_DESK_LIMIT = 1;

const UI = {
  appShell: document.getElementById('app'),
  sceneRoot: document.getElementById('scene-root'),
  permissionModal: document.getElementById('permission-modal'),
  allowMic: document.getElementById('allow-mic'),
  entryPanel: document.getElementById('entry-panel'),
  categoryGrid: document.getElementById('category-grid'),
  toneWrap: document.getElementById('emotion-tone-wrap'),
  toneChips: Array.from(document.querySelectorAll('.tone-chip')),
  selectionCopy: document.getElementById('selection-copy'),
  recordBtn: document.getElementById('record-btn'),
  transcriptText: document.getElementById('transcript-text'),
  micBadge: document.getElementById('mic-badge'),
  roomTitle: document.getElementById('room-title'),
  roomSubtitle: document.getElementById('room-subtitle'),
  memoCount: document.getElementById('memo-count'),
  activeVisualCount: document.getElementById('active-visual-count'),
  newMemoBtn: document.getElementById('new-memo-btn'),
  closeEntryBtn: document.getElementById('close-entry-btn'),
  openHistoryBtn: document.getElementById('open-history-btn'),
  closeHistoryBtn: document.getElementById('close-history-btn'),
  historyPanel: document.getElementById('history-panel'),
  historyList: document.getElementById('history-list'),
  memoDetailPanel: document.getElementById('memo-detail-panel'),
  memoDetailLabel: document.getElementById('memo-detail-label'),
  memoDetailText: document.getElementById('memo-detail-text'),
  memoDetailDate: document.getElementById('memo-detail-date'),
  memoDetailClear: document.getElementById('memo-detail-clear'),
  memoDetailDelete: document.getElementById('memo-detail-delete'),
  closeDetailBtn: document.getElementById('close-detail-btn'),
};

function buildHeavyDummyMemos(nowMs = Date.now()) {
  const messages = {
    clutter: [
      '해야 할 말이 머릿속에서 계속 겹친다',
      '지금 생각을 정리하지 않으면 더 산만해질 것 같다',
      '괜히 다시 확인하고 싶은 장면이 남아 있다',
      '방금 떠오른 아이디어를 놓치기 싫다',
      '해야 할 일과 하고 싶은 일이 계속 엉킨다',
      '기분은 애매한데 손은 계속 바쁘다',
      '중요하지 않은 생각이 오히려 크게 남는다',
      '메모하지 않으면 금방 흩어질 생각이다',
      '자꾸 되새김질하게 되는 한 문장이 남아 있다',
      '오늘 해야 할 것들이 한꺼번에 떠올랐다',
    ],
    routine: [
      '책상 위를 다시 정리해야 한다',
      '옷과 가방 위치를 정해두고 싶다',
      '오늘은 정리 루틴을 지키고 싶다',
      '자기 전 10분 정리를 루틴으로 만들자',
      '아침 준비 순서를 다시 단순하게 만들자',
      '정리한 상태를 오래 유지하고 싶다',
      '보이는 곳부터 정리하면 마음도 덜 복잡할 것 같다',
      '작은 정리라도 해두면 내일이 편해질 것 같다',
      '습관처럼 다시 제자리로 돌려놓자',
      '쌓이기 전에 조금씩 정리하자',
    ],
    record: [
      '오늘 떠오른 문장을 저장해 둔다',
      '다음 작업 전에 확인할 포인트를 적는다',
      '이건 나중에 확장할 아이디어 메모다',
      '바로 잊을 것 같아서 짧게 남겨둔다',
      '이 감각은 나중에도 다시 보고 싶다',
      '지금 화면 구성을 다시 참고할 것 같다',
      '짧지만 지금 아니면 사라질 생각이다',
      '나중에 다시 꺼내 볼 단서만 남겨둔다',
      '오늘 흐름을 기억하려고 한 줄 적는다',
      '작업하다 떠오른 포인트를 임시 저장한다',
    ],
    snack: [
      '오늘은 끝까지 해보자',
      '지금 흐름을 끊지 말자',
      '조금만 더 집중해보자',
      '중간에 포기하지 말자',
      '다시 시작해도 된다',
      '리듬만 유지하자',
      '완벽하려고 하지 말고 계속 가자',
      '하던 만큼만 더 밀어보자',
      '멈추더라도 다시 붙으면 된다',
      '한 번만 더 집중해서 마무리하자',
    ],
    emotion: [
      '괜히 마음이 올라왔다',
      '생각보다 덜 힘들었다',
      '조용한 안정감이 남는다',
      '순간적으로 서늘해졌다',
      '기분이 생각보다 괜찮다',
      '아직도 약간 걸리는 감정이 있다',
      '한참 지난 감정인데 아직 잔상이 남아 있다',
      '그때의 안도감이 뒤늦게 다시 떠올랐다',
      '이제는 옅어졌지만 완전히 끝난 감정은 아니다',
      '시간이 꽤 지났는데도 문득 다시 올라온다',
      '별일 아닌데도 감정이 길게 남았다',
      '갑자기 기분의 결이 바뀌는 순간이 있었다',
    ],
  };

  const templates = [];
  Object.entries(HEAVY_DUMMY_MEMO_COUNTS).forEach(([category, count]) => {
    for (let index = 0; index < count; index += 1) {
      templates.push({ category, index });
    }
  });

  function getAgeMs(category, index) {
    if (category === 'clutter') {
      if (index < 6) return (3 + index * 7) * 60 * 60 * 1000;
      if (index < 12) return (2 + (index - 6) * 0.45) * 24 * 60 * 60 * 1000;
      return (32 + (index - 12) * 14) * 24 * 60 * 60 * 1000;
    }

    if (category === 'routine') {
      if (index < 6) return (5 + index * 5) * 60 * 60 * 1000;
      if (index < 12) return (1.25 + (index - 6) * 0.38) * 24 * 60 * 60 * 1000;
      return (18 + (index - 12) * 9) * 24 * 60 * 60 * 1000;
    }

    if (category === 'record') {
      if (index < 7) return (12 + index * 34) * 60 * 1000;
      if (index < 13) return (1 + (index - 7) * 0.85) * 24 * 60 * 60 * 1000;
      return (26 + (index - 13) * 19) * 24 * 60 * 60 * 1000;
    }

    if (category === 'snack') {
      if (index < 8) return (15 + index * 170) * 60 * 1000;
      if (index < 14) return (2 + (index - 8) * 0.8) * 24 * 60 * 60 * 1000;
      return (12 + (index - 14) * 11) * 24 * 60 * 60 * 1000;
    }

    if (category === 'emotion') {
      if (index < 7) return (2 + index * 9) * 60 * 60 * 1000;
      if (index < 13) return (3 + (index - 7) * 0.65) * 24 * 60 * 60 * 1000;
      return (14 + (index - 13) * 21) * 24 * 60 * 60 * 1000;
    }

    return (index + 1) * 60 * 60 * 1000;
  }

  return templates.map(({ category, index }, globalIndex) => {
    const ageMs = getAgeMs(category, index);
    const sampleList = messages[category] || ['테스트 메모'];
    const sample = sampleList[index % sampleList.length];
    const createdAt = new Date(nowMs - ageMs - globalIndex * 1700).toISOString();
    const emotionTone = category === 'emotion'
      ? (index % 3 === 0 || index % 3 === 2 ? 'good' : 'bad')
      : null;

    return {
      id: `${DUMMY_MEMO_ID_PREFIX}-${category}-${String(index + 1).padStart(3, '0')}`,
      category,
      emotionTone,
      transcript: `[더미 ${category} ${index + 1}] ${sample}`,
      createdAt,
      clearedAt: null,
    };
  });
}

function ensureHeavyDummyMemos() {
  const previousCount = STATE.memos.length;
  const previousDummyKeys = new Set(
    STATE.memos
      .filter((memo) => typeof memo?.id === 'string' && memo.id.startsWith('dummy-'))
      .map((memo) => memo.id)
  );

  if (!ENABLE_HEAVY_DUMMY_MEMOS) {
    const nonDummyMemos = STATE.memos.filter(
      (memo) => !(typeof memo?.id === 'string' && memo.id.startsWith('dummy-'))
    );
    if (nonDummyMemos.length === STATE.memos.length) return 0;

    STATE.memos = nonDummyMemos;

    const nextLayoutCache = Object.create(null);
    Object.entries(STATE.layoutCache || {}).forEach(([key, entry]) => {
      if (typeof key === 'string' && (key.includes('dummy-') || key === 'clutter-old:shared')) return;
      nextLayoutCache[key] = entry;
    });
    STATE.layoutCache = nextLayoutCache;

    return Math.abs(previousCount - STATE.memos.length) || 1;
  }

  const desiredDummyMemos = buildHeavyDummyMemos();
  const desiredIds = new Set(desiredDummyMemos.map((memo) => memo.id));

  const nonDummyMemos = STATE.memos.filter(
    (memo) => !(typeof memo?.id === 'string' && memo.id.startsWith('dummy-'))
  );
  STATE.memos = [...nonDummyMemos, ...desiredDummyMemos]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let changed = STATE.memos.length !== previousCount;
  if (!changed) {
    if (previousDummyKeys.size !== desiredIds.size) changed = true;
    else {
      for (const id of previousDummyKeys) {
        if (!desiredIds.has(id)) {
          changed = true;
          break;
        }
      }
    }
  }

  if (!changed) return 0;

  const nextLayoutCache = Object.create(null);
  Object.entries(STATE.layoutCache || {}).forEach(([key, entry]) => {
    if (typeof key === 'string' && (key.includes('dummy-') || key === 'clutter-old:shared')) return;
    nextLayoutCache[key] = entry;
  });
  STATE.layoutCache = nextLayoutCache;

  return Math.abs(STATE.memos.length - previousCount) || 1;
}

const STATE = {
  memos: [],
  selection: {
    category: '',
    emotionTone: 'good',
  },
  recognition: null,
  recognitionLanguage: HYBRID_RECOGNITION_LANG,
  hasMicPermission: false,
  isListening: false,
  keepRecognitionAlive: false,
  isFinalizing: false,
  finalTranscript: '',
  interimTranscript: '',
  silenceTimer: null,
  scene: null,
  camera: null,
  renderer: null,
  clock: new THREE.Clock(),
  pointer: new THREE.Vector2(),
  pointerClient: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 },
  raycaster: new THREE.Raycaster(),
  hoveredRoot: null,
  hoverDebounceTimer: null,
  hoverDebouncePendingRoot: null,
  detailMemoIds: null,
  mixers: [],
  templates: {},
  visuals: [],
  staticDecor: [],
  room: {
    desk: null,
    deskTopY: 1.28,
    deskCenter: new THREE.Vector3(0, 0, -4.2),
    deskSurfaceBounds: null,
    deskSurfaceYTolerance: 0.16,
    chairSeatY: 0.72,
    chairSurfaceBounds: null,
    chairSurfaceYTolerance: 0.14,
    deskMeshes: [],
    deskBounds: null,
  },
  lastVisualSignature: '',
  visualCheckElapsed: 0,
  pendingVisualRebuild: false,
  appReady: false,
  loadingOverlay: null,
  hasOrientationPermission: false,
  useDeviceOrientation: false,
  playedEmotionRewardDropMemoIds: new Set(),
  layoutCache: Object.create(null),
  easter: {
    overlayRoot: null,
    deleteStreakCount: 0,
    deleteStreakTriggered: false,
    lastDeleteAt: 0,
    sessionRa4Shown: false,
    seen: {
      ra1: false,
      ra5: false,
      ra6: false,
    },
    cooldowns: {
      ra2: 0,
      ra4: 0,
    },
  },
};


const CLICK_SOUND_PATH = './assets/click.mp3';
const BUTTON_SOUND_VOLUME = 0.22;
const BUTTON_SOUND_POOL_SIZE = 8;
const BUTTON_SOUND_SELECTOR = 'button';

const BUTTON_SOUND_POOL = [];
let buttonSoundPoolIndex = 0;
let buttonPressReleaseTimer = null;

const EASTER_STORAGE_KEY = 'mind-room-easter-v1';
const EASTER_ASSET_PATHS = Object.freeze({
  ra1: './assets/ra1.png',
  ra2: './assets/ra2.png',
  ra3: './assets/ra3.png',
  ra4: './assets/ra4.png',
  ra5: './assets/ra5.png',
  ra6: './assets/ra6.png',
});
const EASTER_DELETE_STREAK_WINDOW_MS = 4200;
const EASTER_DELETE_STREAK_TRIGGER = 10;
const EASTER_CREATION_DELAY_MS = 2000;
const EASTER_TUMBLER_BATCH_SIZE = 5;
const EASTER_EMOTION_BATCH_SIZE = 10;
const EASTER_ROUTINE_BATCH_SIZE = 10;
const EASTER_ULTRA_RARE_CHANCE = 0.0025;
const EASTER_RA4_COOLDOWN_MS = 12 * 60 * 1000;


function isDummyMemo(memo) {
  return typeof memo?.id === 'string' && memo.id.startsWith('dummy-');
}

function loadEasterState() {
  try {
    const raw = localStorage.getItem(EASTER_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;

    STATE.easter.seen = {
      ...STATE.easter.seen,
      ...(parsed.seen && typeof parsed.seen === 'object' ? parsed.seen : {}),
    };
    STATE.easter.cooldowns = {
      ...STATE.easter.cooldowns,
      ...(parsed.cooldowns && typeof parsed.cooldowns === 'object' ? parsed.cooldowns : {}),
    };
  } catch (error) {
    console.warn('Failed to load easter state.', error);
  }
}

function persistEasterState() {
  try {
    localStorage.setItem(EASTER_STORAGE_KEY, JSON.stringify({
      seen: STATE.easter.seen,
      cooldowns: STATE.easter.cooldowns,
    }));
  } catch (error) {
    console.warn('Failed to persist easter state.', error);
  }
}

function ensureEasterOverlayRoot() {
  if (STATE.easter.overlayRoot) return STATE.easter.overlayRoot;
  if (!UI.appShell) return null;

  const root = document.createElement('div');
  root.id = 'easter-overlay-root';
  Object.assign(root.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: '90',
  });
  UI.appShell.appendChild(root);
  STATE.easter.overlayRoot = root;
  return root;
}

function createEasterImage(assetKey, style = {}) {
  const root = ensureEasterOverlayRoot();
  if (!root) return null;

  const img = document.createElement('img');
  img.src = EASTER_ASSET_PATHS[assetKey];
  img.alt = '';
  img.draggable = false;
  Object.assign(img.style, {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    transformOrigin: 'center center',
    objectFit: 'contain',
    userSelect: 'none',
    willChange: 'transform, opacity',
    opacity: '0',
    filter: 'drop-shadow(0 18px 30px rgba(20, 16, 12, 0.22))',
  }, style);
  img.onerror = () => {
    console.warn(`[easter] Failed to load ${assetKey}: ${EASTER_ASSET_PATHS[assetKey]}`);
    img.remove();
  };
  root.appendChild(img);
  return img;
}

function animateAndRemove(element, keyframes, options) {
  if (!element) return;
  const animation = element.animate(keyframes, options);
  animation.onfinish = () => {
    element.remove();
  };
}

function showEasterRa1() {
  const img = createEasterImage('ra1', { width: 'min(54vw, 520px)', maxWidth: '78vw', maxHeight: '58vh' });
  animateAndRemove(img, [
    { opacity: 0, transform: 'translate(-50%, -50%) scale(0.82)' },
    { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.18 },
    { opacity: 1, transform: 'translate(-50%, -50%) scale(1.03)', offset: 0.78 },
    { opacity: 0, transform: 'translate(-50%, -50%) scale(1.1)' },
  ], { duration: 1320, easing: 'cubic-bezier(0.22, 0.8, 0.25, 1)', fill: 'forwards' });
}

function showEasterRa2() {
  const img = createEasterImage('ra2', { width: 'min(36vw, 320px)', maxWidth: '48vw', maxHeight: '48vh' });
  animateAndRemove(img, [
    { opacity: 0, transform: 'translate(-50%, -50%) scale(0.18)' },
    { opacity: 1, transform: 'translate(-50%, -50%) scale(0.32)', offset: 0.16 },
    { opacity: 1, transform: 'translate(-50%, -50%) scale(0.92)', offset: 0.42 },
    { opacity: 1, transform: 'translate(-50%, -50%) scale(1.8)', offset: 0.68 },
    { opacity: 0.96, transform: 'translate(-50%, -50%) scale(2.6)', offset: 0.84 },
    { opacity: 0, transform: 'translate(-50%, -50%) scale(3.4)' },
  ], { duration: 1880, easing: 'cubic-bezier(0.14, 0.7, 0.2, 1)', fill: 'forwards' });
}

function showEasterRa3() {
  const top = `${18 + Math.random() * 46}%`;
  const img = createEasterImage('ra3', {
    width: 'min(38vw, 360px)',
    maxWidth: '54vw',
    maxHeight: '38vh',
    left: '108vw',
    top,
    transform: 'translateY(-50%) scale(1.18)',
    opacity: '1',
  });
  animateAndRemove(img, [
    { opacity: 0, transform: 'translateY(-50%) translateX(0vw) scale(1.12)' },
    { opacity: 1, transform: 'translateY(-50%) translateX(-8vw) scale(1.18)', offset: 0.14 },
    { opacity: 1, transform: 'translateY(-50%) translateX(-86vw) scale(1.22)', offset: 0.86 },
    { opacity: 0, transform: 'translateY(-50%) translateX(-124vw) scale(1.26)' },
  ], { duration: 2380, easing: 'cubic-bezier(0.2, 0.72, 0.24, 1)', fill: 'forwards' });
}

function showEasterRa4() {
  const left = `${14 + Math.random() * 72}%`;
  const top = `${14 + Math.random() * 66}%`;
  const img = createEasterImage('ra4', {
    width: 'min(16vw, 150px)',
    maxWidth: '24vw',
    maxHeight: '24vh',
    left,
    top,
    transform: 'translate(-50%, -50%) scale(0.84)',
  });
  animateAndRemove(img, [
    { opacity: 0, transform: 'translate(-50%, -50%) scale(0.78)' },
    { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.22 },
    { opacity: 1, transform: 'translate(-50%, -50%) scale(1.02)', offset: 0.76 },
    { opacity: 0, transform: 'translate(-50%, -50%) scale(1.08)' },
  ], { duration: 1120, easing: 'ease-out', fill: 'forwards' });
}

function showEasterRa5() {
  const img = createEasterImage('ra5', { width: 'min(32vw, 300px)', maxWidth: '46vw', maxHeight: '36vh', top: '42%' });
  animateAndRemove(img, [
    { opacity: 0, transform: 'translate(-50%, -50%) scale(0.84)' },
    { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.2 },
    { opacity: 1, transform: 'translate(-50%, -50%) scale(1.03)', offset: 0.78 },
    { opacity: 0, transform: 'translate(-50%, -50%) scale(1.1)' },
  ], { duration: 1180, easing: 'cubic-bezier(0.23, 0.82, 0.24, 1)', fill: 'forwards' });
}

function showEasterRa6() {
  const img = createEasterImage('ra6', { width: 'min(34vw, 320px)', maxWidth: '48vw', maxHeight: '38vh', top: '36%' });
  animateAndRemove(img, [
    { opacity: 0, transform: 'translate(-50%, -50%) scale(0.82)' },
    { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.2 },
    { opacity: 1, transform: 'translate(-50%, -50%) scale(1.02)', offset: 0.76 },
    { opacity: 0, transform: 'translate(-50%, -50%) scale(1.08)' },
  ], { duration: 1160, easing: 'ease-out', fill: 'forwards' });
}

function getRealMemoCountByCategory(category) {
  return STATE.memos.filter((memo) => memo && !isDummyMemo(memo) && memo.category === category).length;
}

function resetDeleteStreak() {
  STATE.easter.deleteStreakCount = 0;
  STATE.easter.lastDeleteAt = 0;
  STATE.easter.deleteStreakTriggered = false;
}

function maybeTriggerUltraRareRa4() {
  const now = Date.now();
  if (STATE.easter.sessionRa4Shown) return;
  if (now - (STATE.easter.cooldowns.ra4 || 0) < EASTER_RA4_COOLDOWN_MS) return;
  if (Math.random() >= EASTER_ULTRA_RARE_CHANCE) return;

  STATE.easter.sessionRa4Shown = true;
  STATE.easter.cooldowns.ra4 = now;
  persistEasterState();
  showEasterRa4();
}

function maybeTriggerReloadRa3() {
  if (Math.random() >= 0.1) return;
  window.setTimeout(() => {
    showEasterRa3();
  }, 380 + Math.random() * 540);
}

function scheduleCreationEaster(triggerCount, validator, callback) {
  window.setTimeout(() => {
    if (typeof validator === 'function' && !validator(triggerCount)) return;
    callback();
  }, EASTER_CREATION_DELAY_MS);
}

function maybeTriggerCreationEasters(memo) {
  if (!memo || isDummyMemo(memo)) return;

  if (memo.category === 'snack') {
    const tumblerCount = getRealMemoCountByCategory('snack');
    const previousTumblerCount = Math.max(0, tumblerCount - 1);
    const crossedTumblerBatch = Math.floor(tumblerCount / EASTER_TUMBLER_BATCH_SIZE)
      > Math.floor(previousTumblerCount / EASTER_TUMBLER_BATCH_SIZE);

    if (crossedTumblerBatch) {
      scheduleCreationEaster(
        tumblerCount,
        (requiredCount) => getRealMemoCountByCategory('snack') >= requiredCount,
        () => {
          console.info(`[easter] ra1 triggered at tumbler count ${tumblerCount}`);
          showEasterRa1();
        },
      );
    }
  }

  if (memo.category === 'emotion') {
    const emotionCount = getRealMemoCountByCategory('emotion');
    const previousEmotionCount = Math.max(0, emotionCount - 1);
    const crossedEmotionBatch = Math.floor(emotionCount / EASTER_EMOTION_BATCH_SIZE)
      > Math.floor(previousEmotionCount / EASTER_EMOTION_BATCH_SIZE);

    if (crossedEmotionBatch) {
      scheduleCreationEaster(
        emotionCount,
        (requiredCount) => getRealMemoCountByCategory('emotion') >= requiredCount,
        () => {
          console.info(`[easter] ra5 triggered at emotion count ${emotionCount}`);
          showEasterRa5();
        },
      );
    }
  }

  if (memo.category === 'routine') {
    const routineCount = getRealMemoCountByCategory('routine');
    const previousRoutineCount = Math.max(0, routineCount - 1);
    const crossedRoutineBatch = Math.floor(routineCount / EASTER_ROUTINE_BATCH_SIZE)
      > Math.floor(previousRoutineCount / EASTER_ROUTINE_BATCH_SIZE);

    if (crossedRoutineBatch) {
      scheduleCreationEaster(
        routineCount,
        (requiredCount) => getRealMemoCountByCategory('routine') >= requiredCount,
        () => {
          console.info(`[easter] ra6 triggered at routine count ${routineCount}`);
          showEasterRa6();
        },
      );
    }
  }

  maybeTriggerUltraRareRa4();
}

function registerDeleteActionForEaster() {
  const now = Date.now();
  const elapsed = now - (STATE.easter.lastDeleteAt || 0);

  if (!STATE.easter.lastDeleteAt || elapsed > EASTER_DELETE_STREAK_WINDOW_MS) {
    STATE.easter.deleteStreakCount = 1;
    STATE.easter.deleteStreakTriggered = false;
  } else {
    STATE.easter.deleteStreakCount += 1;
  }

  STATE.easter.lastDeleteAt = now;

  if (STATE.easter.deleteStreakCount >= EASTER_DELETE_STREAK_TRIGGER
      && STATE.easter.deleteStreakCount % EASTER_DELETE_STREAK_TRIGGER === 0) {
    window.setTimeout(() => {
      showEasterRa2();
    }, EASTER_CREATION_DELAY_MS);
  }

  maybeTriggerUltraRareRa4();
}

function initButtonSoundPool() {
  if (BUTTON_SOUND_POOL.length) return;

  for (let index = 0; index < BUTTON_SOUND_POOL_SIZE; index += 1) {
    const audio = new Audio(CLICK_SOUND_PATH);
    audio.preload = 'auto';
    audio.volume = BUTTON_SOUND_VOLUME;
    BUTTON_SOUND_POOL.push(audio);
  }
}

function playButtonClickSound() {
  if (!BUTTON_SOUND_POOL.length) return;

  const audio = BUTTON_SOUND_POOL[buttonSoundPoolIndex];
  buttonSoundPoolIndex = (buttonSoundPoolIndex + 1) % BUTTON_SOUND_POOL.length;

  try {
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  } catch (error) {
    // intentionally ignore optional UI sound errors
  }
}

function clearPressedButtons() {
  document.querySelectorAll('.is-pressing').forEach((element) => {
    element.classList.remove('is-pressing');
  });
}

function markButtonPress(button) {
  if (!(button instanceof HTMLElement)) return;
  button.classList.add('is-pressing');

  if (buttonPressReleaseTimer) {
    clearTimeout(buttonPressReleaseTimer);
  }

  buttonPressReleaseTimer = setTimeout(() => {
    clearPressedButtons();
    buttonPressReleaseTimer = null;
  }, 180);
}

function setupButtonSoundUI() {
  initButtonSoundPool();

  const isValidButtonTarget = (button) => (
    button
    && !button.disabled
    && button.getAttribute('aria-disabled') !== 'true'
  );

  const shouldPlaySound = (button) => {
    // Don't play click sounds during active recording
    if (STATE.isListening || STATE.keepRecognitionAlive) return false;
    // Don't play for the record button itself (mic interaction clash)
    if (button && button.id === 'record-btn') return false;
    return true;
  };

  document.addEventListener('pointerdown', (event) => {
    const button = event.target instanceof Element ? event.target.closest(BUTTON_SOUND_SELECTOR) : null;
    if (!isValidButtonTarget(button)) return;
    markButtonPress(button);
    if (shouldPlaySound(button)) playButtonClickSound();
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
    const button = event.target instanceof Element ? event.target.closest(BUTTON_SOUND_SELECTOR) : null;
    if (!isValidButtonTarget(button)) return;
    markButtonPress(button);
    if (shouldPlaySound(button)) playButtonClickSound();
  }, true);

  ['pointerup', 'pointercancel', 'dragend', 'keyup', 'blur'].forEach((eventName) => {
    window.addEventListener(eventName, () => {
      clearPressedButtons();
    }, true);
  });
}


init();

async function init() {
  loadStorage();
  loadEasterState();
  setupButtonSoundUI();
  ensureEasterOverlayRoot();
  const addedDummyMemoCount = ensureHeavyDummyMemos();
  if (addedDummyMemoCount > 0) persistStorage();
  seedPlayedEmotionRewardDropsFromExistingMemos();
  setupUI();
  renderCategoryChips();
  syncSelectionUI();
  setupScene();
  await loadAssets();
  buildDeskAndDecor();
  rebuildVisuals();
  renderHistory();
  maybeTriggerReloadRa3();
  startLoop();
  STATE.appReady = true;
  hideLoadingOverlay();
}

function setupUI() {
  UI.allowMic.addEventListener('click', async () => {
    const ok = await requestMicrophonePermission();
    if (!ok) return;
    await requestOrientationPermission();
    UI.permissionModal.classList.remove('visible');
    ensureRecognition();

    if (!STATE.appReady) {
      showLoadingOverlay('...');
    } else {
      hideLoadingOverlay();
    }
  });

  UI.recordBtn.addEventListener('click', async () => {
    if (!canRecord()) return;

    if (!STATE.recognition) {
      const ok = await requestMicrophonePermission();
      if (!ok) return;
      ensureRecognition();
    }

    if (STATE.isListening || STATE.keepRecognitionAlive) {
      finalizeListening(true);
      return;
    }

    beginListening();
  });

  UI.newMemoBtn.addEventListener('click', () => {
    openEntryPanel();
    hideMemoHover();
  });

  UI.openHistoryBtn.addEventListener('click', () => {
    openHistoryPanel();
    hideMemoHover();
  });

  if (UI.closeEntryBtn) {
    UI.closeEntryBtn.addEventListener('click', () => {
      closeEntryPanel();
      hideMemoHover();
    });
  }

  UI.closeHistoryBtn.addEventListener('click', () => {
    closeHistoryPanel();
    hideMemoHover();
  });

  UI.toneChips.forEach((button) => {
    button.addEventListener('click', () => {
      STATE.selection.emotionTone = button.dataset.tone;
      syncSelectionUI();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    if (STATE.detailMemoIds) {
      closeDetailPanel();
      return;
    }

    if (!UI.historyPanel.classList.contains('hidden')) {
      closeHistoryPanel();
      hideMemoHover();
      return;
    }

    if (!UI.entryPanel.classList.contains('hidden')) {
      closeEntryPanel();
      hideMemoHover();
    }
  });

  createLoadingOverlay();
  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerleave', hideMemoHover);
  UI.sceneRoot.addEventListener('pointerleave', hideMemoHover);

  UI.sceneRoot.addEventListener('pointerdown', onScenePointerDown);

  if (UI.closeDetailBtn) {
    UI.closeDetailBtn.addEventListener('click', () => { closeDetailPanel(); });
  }
  if (UI.memoDetailClear) {
    UI.memoDetailClear.addEventListener('click', () => {
      if (!STATE.detailMemoIds || !STATE.detailMemoIds.length) return;
      STATE.detailMemoIds.forEach((id) => clearMemo(id));
      closeDetailPanel();
    });
  }
  if (UI.memoDetailDelete) {
    UI.memoDetailDelete.hidden = true;
    UI.memoDetailDelete.disabled = true;
    UI.memoDetailDelete.setAttribute('aria-hidden', 'true');
  }
}

function openEntryPanel() {
  closeDetailPanel();
  UI.entryPanel.classList.remove('hidden');
  UI.historyPanel.classList.add('hidden');
}

function closeEntryPanel() {
  UI.entryPanel.classList.add('hidden');
}

function openHistoryPanel() {
  closeDetailPanel();
  UI.historyPanel.classList.remove('hidden');
  UI.entryPanel.classList.add('hidden');
}

function closeHistoryPanel() {
  UI.historyPanel.classList.add('hidden');
}

function createLoadingOverlay() {
  if (STATE.loadingOverlay) return STATE.loadingOverlay;

  const style = document.createElement('style');
  style.textContent = `
    .app-loading-overlay {
      position: absolute;
      inset: 0;
      z-index: 45;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(44, 36, 32, 0.12);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    .app-loading-overlay.visible {
      display: flex;
    }
    .app-loading-card {
      width: min(240px, calc(100vw - 40px));
      min-height: 116px;
      padding: 0 22px 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #1f160f;
      background-image: url('./assets/ui2.png');
      background-repeat: no-repeat;
      background-position: center center;
      background-size: 100% 100%;
      filter: drop-shadow(0 12px 22px rgba(28, 21, 14, 0.16));
    }
    .app-loading-ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.18em;
      transform: translateY(-1px);
    }
    .app-loading-dot-char {
      display: inline-block;
      font-size: clamp(1.9rem, 5vw, 2.4rem);
      line-height: 1;
      font-weight: 800;
      color: #1f160f;
      opacity: 0.18;
      animation: appLoadingEllipsis 1.15s infinite ease-in-out;
    }
    .app-loading-dot-char:nth-child(2) {
      animation-delay: 0.14s;
    }
    .app-loading-dot-char:nth-child(3) {
      animation-delay: 0.28s;
    }
    @keyframes appLoadingEllipsis {
      0%, 80%, 100% {
        opacity: 0.18;
        transform: translateY(0) scale(1);
      }
      40% {
        opacity: 1;
        transform: translateY(-1px) scale(1.06);
      }
    }
    @media (max-width: 640px) {
      .app-loading-card {
        width: min(210px, calc(100vw - 32px));
        min-height: 102px;
      }
      .app-loading-dot-char {
        font-size: clamp(1.7rem, 7vw, 2.1rem);
      }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'app-loading-overlay';
  overlay.innerHTML = `
    <div class="app-loading-card" role="status" aria-live="polite" aria-label="로딩 중">
      <div class="app-loading-ellipsis" aria-hidden="true">
        <span class="app-loading-dot-char">.</span>
        <span class="app-loading-dot-char">.</span>
        <span class="app-loading-dot-char">.</span>
      </div>
    </div>
  `;

  UI.appShell.appendChild(overlay);
  STATE.loadingOverlay = overlay;
  return overlay;
}

function showLoadingOverlay(title = '...', copy = '') {
  const overlay = createLoadingOverlay();
  overlay.classList.add('visible');
}

function hideLoadingOverlay() {
  if (!STATE.loadingOverlay) return;
  STATE.loadingOverlay.classList.remove('visible');
}

function renderCategoryChips() {
  UI.categoryGrid.innerHTML = '';
  Object.entries(CATEGORY_INFO).forEach(([category, info]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.dataset.category = category;
    button.textContent = info.label;
    button.addEventListener('click', () => {
      STATE.selection.category = category;
      syncSelectionUI();
    });
    UI.categoryGrid.appendChild(button);
  });
}

function syncSelectionUI() {
  UI.categoryGrid.querySelectorAll('[data-category]').forEach((button) => {
    button.classList.toggle('active', button.dataset.category === STATE.selection.category);
  });

  const isEmotion = STATE.selection.category === 'emotion';
  UI.toneWrap.classList.toggle('hidden', !isEmotion);

  UI.toneChips.forEach((button) => {
    button.classList.toggle('active', isEmotion && button.dataset.tone === STATE.selection.emotionTone);
  });

  if (!STATE.selection.category) {
    UI.selectionCopy.textContent = '';
  } else if (isEmotion) {
    UI.selectionCopy.textContent = '';
  } else {
    UI.selectionCopy.textContent = '';
  }

  UI.recordBtn.disabled = !canRecord();
}

function canRecord() {
  if (!STATE.selection.category) return false;
  if (STATE.selection.category === 'emotion' && !STATE.selection.emotionTone) return false;
  return true;
}

async function requestMicrophonePermission() {
  if (STATE.hasMicPermission) return true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });
    stream.getTracks().forEach((track) => track.stop());
    STATE.hasMicPermission = true;
    setMicBadge('idle', '대기');
    return true;
  } catch (error) {
    console.warn('Microphone permission error:', error);
    setMicBadge('idle', '불가');
    UI.selectionCopy.textContent = '';
    return false;
  }
}

async function requestOrientationPermission() {
  if (STATE.hasOrientationPermission) return true;

  // iOS 13+ Safari requires explicit permission request
  if (typeof DeviceOrientationEvent !== 'undefined'
    && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const result = await DeviceOrientationEvent.requestPermission();
      if (result === 'granted') {
        STATE.hasOrientationPermission = true;
        STATE.useDeviceOrientation = true;
        startDeviceOrientationListener();
        return true;
      }
      console.warn('Device orientation permission denied');
      return false;
    } catch (error) {
      console.warn('Device orientation permission error:', error);
      return false;
    }
  }

  // Android / non-Safari: no permission needed, just listen
  if (window.DeviceOrientationEvent) {
    STATE.hasOrientationPermission = true;
    STATE.useDeviceOrientation = true;
    startDeviceOrientationListener();
    return true;
  }

  return false;
}

function startDeviceOrientationListener() {
  let initialBeta = null;
  let initialGamma = null;

  window.addEventListener('deviceorientation', (event) => {
    if (!STATE.useDeviceOrientation) return;
    if (event.beta === null || event.gamma === null) return;

    // Capture rest position on first valid reading
    if (initialBeta === null) {
      initialBeta = event.beta;
      initialGamma = event.gamma;
    }

    // gamma: left/right tilt (-90..90), beta: front/back tilt (-180..180)
    const deltaGamma = event.gamma - initialGamma;
    const deltaBeta = event.beta - initialBeta;

    // Map tilt to pointer range (-1..1) with a comfortable 20-degree range
    const tiltRange = 20;
    STATE.pointer.x = Math.max(-1, Math.min(1, deltaGamma / tiltRange));
    STATE.pointer.y = Math.max(-1, Math.min(1, -deltaBeta / tiltRange));
  }, { passive: true });
}

function ensureRecognition() {
  if (STATE.recognition) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    UI.selectionCopy.textContent = '';
    UI.recordBtn.disabled = true;
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = HYBRID_RECOGNITION_LANG;
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    STATE.isListening = true;
    setMicBadge('live', getRecognitionLanguageBadgeLabel());
    UI.recordBtn.textContent = '중지';
  };

  recognition.onresult = (event) => {
    let interimText = '';

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const text = getBestRecognitionText(result);
      if (!text) continue;
      if (result.isFinal) {
        STATE.finalTranscript = [STATE.finalTranscript, text].filter(Boolean).join(' ').trim();
      } else {
        interimText = [interimText, text].filter(Boolean).join(' ').trim();
      }
    }

    STATE.interimTranscript = interimText;
    const combined = getCombinedTranscript();
    UI.transcriptText.textContent = combined || '듣는 중...';

    if (combined) scheduleRecognitionFinalize();
  };

  recognition.onspeechend = () => {
    if (!STATE.keepRecognitionAlive || STATE.isFinalizing) return;
    if (!getCombinedTranscript()) return;
    scheduleRecognitionFinalize(SPEECH_FINALIZE_GRACE_MS);
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);

    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      STATE.keepRecognitionAlive = false;
      setMicBadge('idle', '권한');
      return;
    }

    if ((event.error === 'no-speech' || event.error === 'aborted' || event.error === 'audio-capture') && STATE.keepRecognitionAlive && !STATE.isFinalizing) {
      window.setTimeout(() => safeStartRecognition(), RESTART_RECOGNITION_DELAY_MS);
      return;
    }

    if (STATE.keepRecognitionAlive && !STATE.isFinalizing) {
      window.setTimeout(() => safeStartRecognition(), RESTART_RECOGNITION_DELAY_MS);
    }
  };

  recognition.onend = () => {
    STATE.isListening = false;

    if (STATE.keepRecognitionAlive && !STATE.isFinalizing) {
      window.setTimeout(() => safeStartRecognition(), RESTART_RECOGNITION_DELAY_MS);
      return;
    }

    if (!STATE.isFinalizing) {
      setMicBadge('idle', '대기');
      UI.recordBtn.textContent = '말하기';
    }
  };

  STATE.recognition = recognition;
}

function beginListening() {
  if (!canRecord() || !STATE.recognition) return;

  clearTimeout(STATE.silenceTimer);
  STATE.finalTranscript = '';
  STATE.interimTranscript = '';
  STATE.keepRecognitionAlive = true;
  STATE.isFinalizing = false;
  STATE.recognition.lang = HYBRID_RECOGNITION_LANG;
  UI.transcriptText.textContent = '듣는 중...';
  safeStartRecognition();
}

function safeStartRecognition() {
  if (!STATE.recognition) return;
  try {
    STATE.recognition.start();
  } catch (error) {
    // Chrome active session guard
  }
}

function finalizeListening(cancelOnly) {
  clearTimeout(STATE.silenceTimer);
  STATE.keepRecognitionAlive = false;
  STATE.isFinalizing = true;
  const transcript = getCombinedTranscript();

  if (STATE.isListening && STATE.recognition) {
    try {
      STATE.recognition.stop();
    } catch (error) {
      // noop
    }
  }

  setMicBadge('processing', cancelOnly ? '중지' : '저장');
  UI.recordBtn.textContent = '말하기';

  window.setTimeout(() => {
    STATE.isFinalizing = false;
    setMicBadge('idle', '대기');

    if (cancelOnly || !transcript) {
      UI.transcriptText.textContent = transcript || '...';
      return;
    }

    createMemoFromTranscript(transcript);
    STATE.finalTranscript = '';
    STATE.interimTranscript = '';
  }, 40);
}

function getCombinedTranscript() {
  return [STATE.finalTranscript, STATE.interimTranscript].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function scheduleRecognitionFinalize(delay = SILENCE_MS) {
  clearTimeout(STATE.silenceTimer);
  STATE.silenceTimer = window.setTimeout(() => finalizeListening(false), delay);
}

function getBestRecognitionText(result) {
  if (!result) return '';

  return (result[0]?.transcript || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getRecognitionLanguageBadgeLabel() {
  return 'KO·EN';
}

function createMemoFromTranscript(transcript) {
  const memo = {
    id: crypto.randomUUID(),
    category: STATE.selection.category,
    emotionTone: STATE.selection.category === 'emotion' ? STATE.selection.emotionTone : null,
    transcript,
    createdAt: new Date().toISOString(),
    clearedAt: null,
  };

  snapshotLiveVisualTransformsToLayoutCache();
  STATE.memos.unshift(memo);
  const handledIncrementally = createAndAttachVisualForMemo(memo, memo.id);
  persistStorage();
  if (!handledIncrementally) {
    rebuildVisuals(memo.id);
  }
  renderHistory();
  resetDeleteStreak();
  maybeTriggerCreationEasters(memo);
  updateRoomCopy(memo);
  UI.entryPanel.classList.add('hidden');
  UI.historyPanel.classList.add('hidden');
  UI.transcriptText.textContent = transcript;
}

function updateRoomCopy(memo) {
  if (!UI.roomTitle || !UI.roomSubtitle) return;

  const label = CATEGORY_INFO[memo.category]?.label || memo.category;

  if (memo.category === 'emotion') {
    UI.roomTitle.textContent = memo.emotionTone === 'good' ? '감정 GLB가 바로 방 안에 놓였어' : '감정 GLB가 바로 방 안에 놓였어';
    UI.roomSubtitle.textContent = `감정 메모도 다른 GLB처럼 바로 배치되고, 추가·삭제돼도 나머지는 같은 자리를 유지해. 범주: ${label}`;
  } else if (memo.category === 'record') {
    UI.roomTitle.textContent = '기록이 책상 위에 놓였어';
    UI.roomSubtitle.textContent = 'note는 책상 왼쪽, tumbler는 책상 오른쪽에 놓이도록 정리돼.';
  } else if (memo.category === 'clutter') {
    UI.roomTitle.textContent = '잡생각이 바닥 쪽 시야 안에서 흩어졌어';
    UI.roomSubtitle.textContent = '2일이 지나면 오래된 잡생각 메모가 한 덩이 pile로 합쳐져 보여.';
  } else if (memo.category === 'routine') {
    UI.roomTitle.textContent = '정리 메모가 방 한쪽에 쌓였어';
    UI.roomSubtitle.textContent = '1일이 지나면 folded에서 scattered 상태로 바뀌어.';
  } else {
    UI.roomTitle.textContent = '다짐이 텀블러로 책상 위에 놓였어';
    UI.roomSubtitle.textContent = '다짐 텀블러도 책상 위 가까운 쪽에서 생성돼.';
  }
}

function setupScene() {
  const width = UI.sceneRoot.clientWidth || window.innerWidth;
  const height = UI.sceneRoot.clientHeight || window.innerHeight;
  const isMobile = width < 768;

  const roomColor = 0xf6f1eb;

  STATE.scene = new THREE.Scene();
  STATE.scene.background = new THREE.Color(roomColor);
  STATE.scene.fog = new THREE.FogExp2(roomColor, 0.0018);

  const fov = isMobile ? 58 : 43;
  STATE.camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100);
  if (isMobile) {
    STATE.camera.position.set(-0.2, 6.8, 12.5);
    STATE.camera.lookAt(-0.2, 0.8, -2.2);
  } else {
    STATE.camera.position.set(-0.55, 5.1, 11.6);
    STATE.camera.lookAt(-0.55, 1.35, -2.35);
  }

  STATE.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  STATE.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  STATE.renderer.setSize(width, height);
  STATE.renderer.outputColorSpace = THREE.SRGBColorSpace;
  STATE.renderer.shadowMap.enabled = true;
  STATE.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  STATE.renderer.toneMappingExposure = 1.08;
  UI.sceneRoot.innerHTML = '';
  UI.sceneRoot.appendChild(STATE.renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xfffbf4, 0xe9dfd3, 1.7);
  STATE.scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffe2c6, 1.9);
  key.position.set(5.6, 9.5, 6.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -14;
  key.shadow.camera.right = 14;
  key.shadow.camera.top = 12;
  key.shadow.camera.bottom = -12;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 40;
  STATE.scene.add(key);

  const fill = new THREE.PointLight(0xfff0e0, 12, 30, 2.0);
  fill.position.set(-6, 3.6, 1.5);
  STATE.scene.add(fill);

  const backGlow = new THREE.PointLight(0xfff8ef, 8.5, 24, 2.0);
  backGlow.position.set(1, 4.2, -5.2);
  STATE.scene.add(backGlow);

  buildRoomShell();
}

function buildRoomShell() {
  const group = new THREE.Group();
  STATE.scene.add(group);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 14),
    new THREE.MeshStandardMaterial({ color: 0xe8e0d5, roughness: 0.96, metalness: 0.005 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 10),
    new THREE.MeshStandardMaterial({ color: 0xf7f1ea, roughness: 0.95, metalness: 0 })
  );
  backWall.position.set(0, 5, -6.2);
  group.add(backWall);

  const leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 10),
    new THREE.MeshStandardMaterial({ color: 0xf4ede5, roughness: 0.96, metalness: 0 })
  );
  leftWall.position.set(-9, 5, 0);
  leftWall.rotation.y = Math.PI / 2;
  group.add(leftWall);

  const rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 10),
    new THREE.MeshStandardMaterial({ color: 0xf2ebe3, roughness: 0.96, metalness: 0 })
  );
  rightWall.position.set(9, 5, 0);
  rightWall.rotation.y = -Math.PI / 2;
  group.add(rightWall);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 14),
    new THREE.MeshStandardMaterial({ color: 0xfcf9f5, roughness: 1, metalness: 0 })
  );
  ceiling.position.set(0, 10, 0);
  ceiling.rotation.x = Math.PI / 2;
  group.add(ceiling);

  const wallGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 3.4),
    new THREE.MeshBasicMaterial({ color: 0xfff4df, transparent: true, opacity: 0.045 })
  );
  wallGlow.position.set(0.2, 5.2, -6.08);
  group.add(wallGlow);
}

async function loadAssets() {
  const loader = new GLTFLoader();

  const entries = [
    ['note', ASSET_FILES.note, createNoteFallback],
    ['scribble', ASSET_FILES.scribble, createScribbleFallback],
    ['clothesFolded', ASSET_FILES.clothesFolded, createClothesFoldedFallback],
    ['clothesScattered', ASSET_FILES.clothesScattered, createClothesScatteredFallback],
    ['paperSingle', ASSET_FILES.paperSingle, () => createPaperFallback(0xe5dacb)],
    ['paperSingle2', ASSET_FILES.paperSingle2, () => createPaperFallback(0xd9d0e2)],
    ['paperPile', ASSET_FILES.paperPile, createPaperPileFallback],
    ['snack', ASSET_FILES.snack, createSnackFallback],
    ['strawberry', ASSET_FILES.strawberry, createStrawberryFallback],
    ['jar', ASSET_FILES.jar, createJarFallback],
    ['burn', ASSET_FILES.burn, createBurnFallback],
    ['tumbler', ASSET_FILES.tumbler, createTumblerFallback],
    ['desk', ASSET_FILES.desk, createDeskFallback],
  ];

  const results = await Promise.all(
    entries.map(([key, file, fallback]) => loadTemplate(loader, key, file, fallback))
  );

  results.forEach((template) => {
    STATE.templates[template.key] = template;
  });
}

async function loadTemplate(loader, key, filename, fallbackFactory) {
  let root;

  try {
    const gltf = await loader.loadAsync(`./assets/${filename}`);
    root = gltf.scene;
    root.animations = gltf.animations || [];
  } catch (error) {
    console.warn(`Failed to load ${filename}. Using fallback.`, error);
    root = fallbackFactory();
    root.animations = [];
  }

  normalizeTemplate(root, key);
  applyShadowSettings(root);

  return {
    key,
    root,
    animations: root.animations || [],
  };
}

function normalizeTemplate(root, key) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const baseTargetMax = TARGET_MAX_DIMENSION[key] || 1;
  const targetMax = key === 'desk' ? baseTargetMax : baseTargetMax * NON_DESK_SCALE_MULTIPLIER;
  const scale = targetMax / maxDim;

  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= box.min.y;
  root.scale.multiplyScalar(scale);
  root.updateMatrixWorld(true);
}

function applyShadowSettings(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (child.material && !Array.isArray(child.material) && 'envMapIntensity' in child.material) {
      child.material.envMapIntensity = 1.1;
      if (child.material.roughness !== undefined) {
        child.material.roughness = Math.min(child.material.roughness + 0.02, 1);
      }
    }
  });
}


const TMP_BOX_3 = new THREE.Box3();
const TMP_VEC3_A = new THREE.Vector3();
const TMP_VEC3_B = new THREE.Vector3();
const TMP_VEC3_C = new THREE.Vector3();
const TMP_VEC3_D = new THREE.Vector3();
const TMP_NORMAL_MATRIX = new THREE.Matrix3();
const TMP_MATRIX_4 = new THREE.Matrix4();
const CAMERA_FRUSTUM = new THREE.Frustum();
const DESK_RAYCASTER = new THREE.Raycaster();

const HOVER_PROXY_SETTINGS = {
  default: { padX: 1.14, padY: 1.14, padZ: 1.14, minX: 0.18, minY: 0.22, minZ: 0.18 },
  note: { padX: 1.28, padY: 1.9, padZ: 1.3, minX: 0.26, minY: 0.46, minZ: 0.28 },
  scribble: { padX: 1.32, padY: 2.05, padZ: 1.34, minX: 0.28, minY: 0.5, minZ: 0.3 },
  tumbler: { padX: 1.2, padY: 1.22, padZ: 1.2, minX: 0.24, minY: 0.34, minZ: 0.24 },
  snack: { padX: 1.16, padY: 1.18, padZ: 1.16, minX: 0.22, minY: 0.24, minZ: 0.22 },
  strawberry: { padX: 1.18, padY: 1.18, padZ: 1.18, minX: 0.24, minY: 0.24, minZ: 0.24 },
  jar: { padX: 1.2, padY: 1.24, padZ: 1.2, minX: 0.24, minY: 0.28, minZ: 0.24 },
  burn: { padX: 1.22, padY: 1.18, padZ: 1.22, minX: 0.26, minY: 0.2, minZ: 0.26 },
};

const VISIBLE_SAFE_ZONE = {
  minX: -6.45,
  maxX: 7.25,
  minZ: -5.78,
  maxZ: 3.1,
};

const FLOOR_RECORD_CLUTTER_VISIBLE_ZONE = {
  minX: -8.45,
  maxX: 9.85,
  minZ: -6.05,
  maxZ: 4.78,
};

const DEFAULT_CAMERA_VISIBILITY_BOUNDS = {
  minX: -1.3,
  maxX: 1.48,
  minY: -1.2,
  maxY: 1.2,
  maxZ: 1.2,
};

const FLOOR_RECORD_CLUTTER_CAMERA_VISIBILITY_BOUNDS = {
  minX: -1.5,
  maxX: 1.86,
  minY: -1.34,
  maxY: 1.38,
  maxZ: 1.36,
};

const DEFAULT_VISIBILITY_NUDGES = [
  { x: 0, z: 0.45 },
  { x: 0.35, z: 0.35 },
  { x: -0.35, z: 0.35 },
  { x: 0.55, z: 0.18 },
  { x: -0.55, z: 0.18 },
  { x: 0, z: 0.75 },
];

const FLOOR_VISIBILITY_NUDGES = [
  { x: 0, z: 0.38 },
  { x: 0, z: 0.72 },
  { x: 0.18, z: 0.22 },
  { x: -0.18, z: 0.22 },
  { x: 0.42, z: 0.1 },
  { x: -0.42, z: 0.1 },
  { x: 0, z: 0.96 },
];

function getWorldUpNormal(hit) {
  if (!hit?.face || !hit.object) return null;
  TMP_NORMAL_MATRIX.getNormalMatrix(hit.object.matrixWorld);
  return hit.face.normal.clone().applyMatrix3(TMP_NORMAL_MATRIX).normalize();
}

function getDeskMeshes() {
  const meshes = [];
  STATE.room.desk?.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });
  return meshes;
}

function analyzeDeskSurface() {
  if (!STATE.room.desk) return null;

  const box = new THREE.Box3().setFromObject(STATE.room.desk);
  const size = box.getSize(new THREE.Vector3());
  const meshes = getDeskMeshes();
  if (!meshes.length) return null;

  const samples = [];
  const padX = size.x * 0.05;
  const padZ = size.z * 0.05;
  const originY = box.max.y + Math.max(0.8, size.y * 0.28);
  const stepsX = 18;
  const stepsZ = 16;

  for (let ix = 0; ix < stepsX; ix += 1) {
    for (let iz = 0; iz < stepsZ; iz += 1) {
      const x = THREE.MathUtils.lerp(box.min.x + padX, box.max.x - padX, ix / Math.max(stepsX - 1, 1));
      const z = THREE.MathUtils.lerp(box.min.z + padZ, box.max.z - padZ, iz / Math.max(stepsZ - 1, 1));
      DESK_RAYCASTER.set(new THREE.Vector3(x, originY, z), new THREE.Vector3(0, -1, 0));
      const hits = DESK_RAYCASTER.intersectObjects(meshes, false);
      const hit = hits.find((entry) => {
        const worldNormal = getWorldUpNormal(entry);
        return worldNormal && worldNormal.y >= 0.35;
      }) || hits[0];

      if (!hit) continue;
      if (hit.point.y < box.min.y + size.y * 0.28) continue;
      samples.push({ x: hit.point.x, y: hit.point.y, z: hit.point.z });
    }
  }

  if (samples.length < 8) return null;

  const sortedY = samples.map((sample) => sample.y).sort((a, b) => a - b);
  const topSliceStart = Math.floor(sortedY.length * 0.72);
  const topSlice = sortedY.slice(topSliceStart);
  const surfaceY = topSlice[Math.floor(topSlice.length * 0.5)] ?? (box.min.y + size.y * 0.46);
  const tolerance = Math.max(0.055, size.y * 0.065);
  const surfaceBand = samples.filter((sample) => Math.abs(sample.y - surfaceY) <= tolerance);

  if (surfaceBand.length < 6) {
    return {
      y: surfaceY,
      tolerance,
      bounds: {
        minX: box.min.x + size.x * 0.16,
        maxX: box.max.x - size.x * 0.16,
        minZ: box.min.z + size.z * 0.12,
        maxZ: box.min.z + size.z * 0.36,
      },
    };
  }

  const minX = Math.min(...surfaceBand.map((sample) => sample.x));
  const maxX = Math.max(...surfaceBand.map((sample) => sample.x));
  const minZ = Math.min(...surfaceBand.map((sample) => sample.z));
  const maxZ = Math.max(...surfaceBand.map((sample) => sample.z));
  const insetX = Math.max(0.03, (maxX - minX) * 0.08);
  const insetZ = Math.max(0.03, (maxZ - minZ) * 0.08);

  return {
    y: surfaceY,
    tolerance,
    bounds: {
      minX: minX + insetX,
      maxX: maxX - insetX,
      minZ: minZ + insetZ,
      maxZ: maxZ - insetZ,
    },
  };
}

function findClosestHorizontalSurfacePoint(meshes, bounds, targetY, tolerance, x, z, options = {}) {
  if (!meshes?.length || !bounds) return null;

  const size = bounds.getSize(TMP_VEC3_A);
  const originY = bounds.max.y + Math.max(0.8, size.y * 0.28);
  const minNormalY = options.minNormalY ?? 0.45;
  const searchRadius = Math.max(0, options.searchRadius ?? 0.16);
  const steps = Math.max(0, options.steps ?? 2);
  const maxVerticalDistance = Math.max(options.maxVerticalDistance ?? tolerance * 2.25, tolerance);

  let bestHit = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let ix = -steps; ix <= steps; ix += 1) {
    for (let iz = -steps; iz <= steps; iz += 1) {
      const sampleX = x + ((steps ? ix / steps : 0) * searchRadius);
      const sampleZ = z + ((steps ? iz / steps : 0) * searchRadius);
      DESK_RAYCASTER.set(new THREE.Vector3(sampleX, originY, sampleZ), new THREE.Vector3(0, -1, 0));
      const hits = DESK_RAYCASTER.intersectObjects(meshes, false);

      hits.forEach((hit) => {
        const worldNormal = getWorldUpNormal(hit);
        if (worldNormal && worldNormal.y < minNormalY) return;
        const verticalDistance = Math.abs(hit.point.y - targetY);
        if (verticalDistance > maxVerticalDistance) return;

        const planarDistance = distance2D(x, z, hit.point.x, hit.point.z);
        const score = (verticalDistance * 3.5) + planarDistance;

        if (score < bestScore) {
          bestScore = score;
          bestHit = hit;
        }
      });
    }
  }

  return bestHit ? { x: bestHit.point.x, y: bestHit.point.y, z: bestHit.point.z } : null;
}

function getDeskSurfaceYAt(x, z) {
  const { deskMeshes, deskBounds, deskTopY, deskSurfaceYTolerance } = STATE.room;
  if (!deskMeshes?.length || !deskBounds) return deskTopY;

  const point = findClosestHorizontalSurfacePoint(
    deskMeshes,
    deskBounds,
    deskTopY,
    Math.max(deskSurfaceYTolerance * 2, 0.24),
    x,
    z,
    { searchRadius: 0.14, steps: 2, minNormalY: 0.42 },
  );

  return point?.y ?? deskTopY;
}

function analyzeChairSeatSurface() {
  const { deskBounds, deskMeshes, deskTopY } = STATE.room;
  const deskSurfaceBounds = getDeskSurfaceBounds();
  if (!deskBounds || !deskMeshes?.length || !deskSurfaceBounds) return null;

  const size = deskBounds.getSize(new THREE.Vector3());
  const minX = Math.max(deskBounds.min.x + size.x * 0.26, deskSurfaceBounds.minX + 0.08);
  const maxX = Math.min(deskBounds.max.x - size.x * 0.26, deskSurfaceBounds.maxX - 0.08);
  const minZ = Math.max(deskSurfaceBounds.maxZ + Math.max(0.14, size.z * 0.02), deskBounds.min.z + size.z * 0.34);
  const maxZ = Math.min(deskBounds.max.z - Math.max(0.12, size.z * 0.08), deskSurfaceBounds.maxZ + Math.max(0.48, size.z * 0.15));

  if (minX >= maxX || minZ >= maxZ) return null;

  const samples = [];
  const originY = deskBounds.max.y + Math.max(0.8, size.y * 0.28);
  const stepsX = 10;
  const stepsZ = 10;

  for (let ix = 0; ix < stepsX; ix += 1) {
    for (let iz = 0; iz < stepsZ; iz += 1) {
      const x = THREE.MathUtils.lerp(minX, maxX, ix / Math.max(stepsX - 1, 1));
      const z = THREE.MathUtils.lerp(minZ, maxZ, iz / Math.max(stepsZ - 1, 1));
      DESK_RAYCASTER.set(new THREE.Vector3(x, originY, z), new THREE.Vector3(0, -1, 0));
      const hits = DESK_RAYCASTER.intersectObjects(deskMeshes, false);
      const hit = hits.find((entry) => {
        const worldNormal = getWorldUpNormal(entry);
        return worldNormal && worldNormal.y >= 0.55
          && entry.point.y <= deskTopY - 0.22
          && entry.point.y >= deskBounds.min.y + size.y * 0.12;
      });

      if (hit) samples.push({ x: hit.point.x, y: hit.point.y, z: hit.point.z });
    }
  }

  if (samples.length >= 6) {
    const sortedY = samples.map((sample) => sample.y).sort((a, b) => b - a);
    const seatY = sortedY[Math.min(sortedY.length - 1, Math.floor(sortedY.length * 0.25))] ?? sortedY[0];
    const tolerance = Math.max(0.05, size.y * 0.055);
    const surfaceBand = samples.filter((sample) => Math.abs(sample.y - seatY) <= tolerance);

    if (surfaceBand.length >= 4) {
      const seatMinX = Math.min(...surfaceBand.map((sample) => sample.x));
      const seatMaxX = Math.max(...surfaceBand.map((sample) => sample.x));
      const seatMinZ = Math.min(...surfaceBand.map((sample) => sample.z));
      const seatMaxZ = Math.max(...surfaceBand.map((sample) => sample.z));
      const insetX = Math.max(0.02, (seatMaxX - seatMinX) * 0.1);
      const insetZ = Math.max(0.02, (seatMaxZ - seatMinZ) * 0.1);

      return {
        y: seatY,
        tolerance,
        bounds: {
          minX: seatMinX + insetX,
          maxX: seatMaxX - insetX,
          minZ: seatMinZ + insetZ,
          maxZ: seatMaxZ - insetZ,
        },
      };
    }
  }

  const centerX = (minX + maxX) * 0.5;
  const width = Math.min(0.82, Math.max(0.46, (maxX - minX) * 0.62));
  const depth = Math.min(0.62, Math.max(0.34, (maxZ - minZ) * 0.7));
  const seatY = Math.max(deskBounds.min.y + size.y * 0.24, deskTopY - Math.max(0.54, size.y * 0.24));
  const centerZ = Math.min(maxZ - depth * 0.5, Math.max(minZ + depth * 0.5, deskSurfaceBounds.maxZ + 0.28));

  return {
    y: seatY,
    tolerance: Math.max(0.06, size.y * 0.06),
    bounds: {
      minX: centerX - width * 0.5,
      maxX: centerX + width * 0.5,
      minZ: centerZ - depth * 0.5,
      maxZ: centerZ + depth * 0.5,
    },
  };
}

function getChairSurfaceYAt(x, z) {
  const { deskMeshes, deskBounds, chairSeatY, chairSurfaceYTolerance } = STATE.room;
  if (!deskMeshes?.length || !deskBounds) return chairSeatY;

  const point = findClosestHorizontalSurfacePoint(
    deskMeshes,
    deskBounds,
    chairSeatY,
    Math.max(chairSurfaceYTolerance * 2, 0.2),
    x,
    z,
    { searchRadius: 0.12, steps: 2, minNormalY: 0.52 },
  );

  return point?.y ?? chairSeatY;
}

function placeObjectOnDeskSurface(object, slot, key) {
  const bounds = getDeskSurfaceBounds();
  const isTumbler = key === 'tumbler';
  const backOverflow = isTumbler ? 0.02 : key === 'note' ? 0.38 : 0.12;
  const frontOverflow = isTumbler ? -0.1 : 0.08;
  const xInset = isTumbler ? 0.22 : 0;
  const zInsetBack = isTumbler ? 0.22 : 0;
  const zInsetFront = isTumbler ? 0.18 : 0;
  const minX = bounds.minX + xInset;
  const maxX = bounds.maxX - xInset;
  const minZ = bounds.minZ + zInsetBack;
  const maxZ = bounds.maxZ - zInsetFront;
  const clampedX = clamp(slot.x, minX, maxX);
  const clampedZ = clamp(slot.z, minZ - backOverflow, maxZ + frontOverflow);
  const surfacePoint = findClosestHorizontalSurfacePoint(
    STATE.room.deskMeshes,
    STATE.room.deskBounds,
    STATE.room.deskTopY,
    Math.max(STATE.room.deskSurfaceYTolerance * (isTumbler ? 2.3 : 2), isTumbler ? 0.28 : 0.24),
    clampedX,
    clamp(clampedZ, minZ, maxZ),
    { searchRadius: isTumbler ? 0.1 : 0.14, steps: isTumbler ? 3 : 2, minNormalY: isTumbler ? 0.68 : 0.42 },
  );

  object.position.x = clamp(surfacePoint?.x ?? clampedX, minX, maxX);
  object.position.z = clamp(surfacePoint?.z ?? clampedZ, minZ - backOverflow, maxZ + frontOverflow);
  object.rotation.y = slot.rotY || 0;
  object.rotation.z = slot.rotZ || 0;

  const surfaceProbeZ = clamp(object.position.z, minZ, maxZ);
  const surfaceY = surfacePoint?.y ?? getDeskSurfaceYAt(object.position.x, surfaceProbeZ);
  restObjectOnY(object, surfaceY);
  liftDeskObject(object, key);
}

function placeObjectOnChairSurface(object, slot, key) {
  const bounds = getChairSurfaceBounds();
  object.position.x = clamp(slot.x, bounds.minX, bounds.maxX);
  object.position.z = clamp(slot.z, bounds.minZ, bounds.maxZ);
  object.rotation.y = slot.rotY || 0;
  object.rotation.z = slot.rotZ || 0;

  const surfaceY = getChairSurfaceYAt(object.position.x, object.position.z);
  restObjectOnY(object, surfaceY);
  liftDeskObject(object, key);
}

function updateCameraFrustum() {
  if (!STATE.camera) return;
  STATE.camera.updateMatrixWorld(true);
  TMP_MATRIX_4.multiplyMatrices(STATE.camera.projectionMatrix, STATE.camera.matrixWorldInverse);
  CAMERA_FRUSTUM.setFromProjectionMatrix(TMP_MATRIX_4);
}

function isObjectVisibleToCamera(object, bounds = DEFAULT_CAMERA_VISIBILITY_BOUNDS) {
  if (!object || !STATE.camera) return true;
  updateCameraFrustum();
  TMP_BOX_3.setFromObject(object);
  if (!Number.isFinite(TMP_BOX_3.min.x)) return true;
  if (!CAMERA_FRUSTUM.intersectsBox(TMP_BOX_3)) return false;

  TMP_BOX_3.getCenter(TMP_VEC3_D);
  TMP_VEC3_D.project(STATE.camera);
  return TMP_VEC3_D.z <= bounds.maxZ
    && TMP_VEC3_D.x >= bounds.minX
    && TMP_VEC3_D.x <= bounds.maxX
    && TMP_VEC3_D.y >= bounds.minY
    && TMP_VEC3_D.y <= bounds.maxY;
}

function keepObjectWithinVisibleZone(object, zone = VISIBLE_SAFE_ZONE) {
  if (!object) return;

  object.updateMatrixWorld(true);
  TMP_BOX_3.setFromObject(object);
  if (!Number.isFinite(TMP_BOX_3.min.x)) return;

  TMP_BOX_3.getCenter(TMP_VEC3_A);
  TMP_BOX_3.getSize(TMP_VEC3_B);

  const halfX = TMP_VEC3_B.x * 0.5;
  const halfZ = TMP_VEC3_B.z * 0.5;
  const minCenterX = zone.minX + halfX;
  const maxCenterX = zone.maxX - halfX;
  const minCenterZ = zone.minZ + halfZ;
  const maxCenterZ = zone.maxZ - halfZ;

  const nextCenterX = minCenterX <= maxCenterX ? clamp(TMP_VEC3_A.x, minCenterX, maxCenterX) : TMP_VEC3_A.x;
  const nextCenterZ = minCenterZ <= maxCenterZ ? clamp(TMP_VEC3_A.z, minCenterZ, maxCenterZ) : TMP_VEC3_A.z;

  object.position.x += nextCenterX - TMP_VEC3_A.x;
  object.position.z += nextCenterZ - TMP_VEC3_A.z;
  object.updateMatrixWorld(true);
}

function ensureObjectStartsVisible(
  object,
  zone = VISIBLE_SAFE_ZONE,
  nudges = DEFAULT_VISIBILITY_NUDGES,
  cameraBounds = DEFAULT_CAMERA_VISIBILITY_BOUNDS,
) {
  if (!object) return;

  keepObjectWithinVisibleZone(object, zone);
  if (isObjectVisibleToCamera(object, cameraBounds)) return;

  for (const nudge of nudges) {
    object.position.x += nudge.x;
    object.position.z += nudge.z;
    keepObjectWithinVisibleZone(object, zone);
    if (isObjectVisibleToCamera(object, cameraBounds)) return;
  }
}

function syncHoverProxyBounds(proxy, owner) {
  if (!proxy || !owner) return;
  TMP_BOX_3.setFromObject(owner);
  if (!Number.isFinite(TMP_BOX_3.min.x)) return;

  const assetKey = owner.userData?.assetKey || 'default';
  const settings = HOVER_PROXY_SETTINGS[assetKey] || HOVER_PROXY_SETTINGS.default;

  TMP_BOX_3.getCenter(TMP_VEC3_A);
  TMP_BOX_3.getSize(TMP_VEC3_B);

  proxy.position.copy(TMP_VEC3_A);
  proxy.scale.set(
    Math.max(TMP_VEC3_B.x * settings.padX, settings.minX),
    Math.max(TMP_VEC3_B.y * settings.padY, settings.minY),
    Math.max(TMP_VEC3_B.z * settings.padZ, settings.minZ),
  );
  proxy.updateMatrixWorld(true);
}

function createMemoHoverProxy(object) {
  const proxy = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      colorWrite: false,
    }),
  );

  proxy.userData.memoVisual = true;
  proxy.userData.hoverOwner = object;
  proxy.userData.memoIds = [...(object.userData.memoIds || [])];
  proxy.userData.memoPreview = object.userData.memoPreview;
  proxy.userData.memoLabel = object.userData.memoLabel;
  proxy.renderOrder = -1000;
  proxy.frustumCulled = false;
  syncHoverProxyBounds(proxy, object);
  STATE.scene.add(proxy);
  object.userData.hoverProxy = proxy;
  return proxy;
}

function buildDeskAndDecor() {
  if (STATE.room.desk) {
    STATE.scene.remove(STATE.room.desk);
  }

  const deskInstance = createAssetInstance('desk');
  STATE.room.desk = deskInstance.root;
  STATE.room.desk.position.set(DESK_LAYOUT.x, 0, -5.12);
  STATE.room.desk.rotation.y = 0;
  restObjectOnY(STATE.room.desk, DESK_LAYOUT.floorY);
  STATE.scene.add(STATE.room.desk);

  let box = new THREE.Box3().setFromObject(STATE.room.desk);
  STATE.room.desk.position.z += (-6.2 + DESK_LAYOUT.backInset) - box.min.z;
  STATE.room.desk.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(STATE.room.desk);
  const fallbackSize = box.getSize(new THREE.Vector3());
  const fallbackCenterX = (box.min.x + box.max.x) / 2;
  const fallbackBackZ = box.min.z;
  const fallbackTopGuess = box.min.y + fallbackSize.y * 0.46;
  const fallbackDeskHalfWidth = Math.min(1.32, fallbackSize.x * 0.25);
  const fallbackDeskDepth = Math.min(1.34, Math.max(0.92, fallbackSize.z * 0.24));

  STATE.room.deskMeshes = getDeskMeshes();
  STATE.room.deskBounds = box.clone();

  const analyzedSurface = analyzeDeskSurface();
  if (analyzedSurface) {
    STATE.room.deskTopY = analyzedSurface.y;
    STATE.room.deskCenter.set(
      (analyzedSurface.bounds.minX + analyzedSurface.bounds.maxX) * 0.5,
      analyzedSurface.y,
      (analyzedSurface.bounds.minZ + analyzedSurface.bounds.maxZ) * 0.5,
    );
    STATE.room.deskSurfaceBounds = analyzedSurface.bounds;
    STATE.room.deskSurfaceYTolerance = analyzedSurface.tolerance;
  } else {
    STATE.room.deskTopY = fallbackTopGuess;
    STATE.room.deskCenter.set(fallbackCenterX, STATE.room.deskTopY, fallbackBackZ + fallbackDeskDepth * 0.5);
    STATE.room.deskSurfaceBounds = {
      minX: fallbackCenterX - fallbackDeskHalfWidth,
      maxX: fallbackCenterX + fallbackDeskHalfWidth,
      minZ: fallbackBackZ + 0.16,
      maxZ: fallbackBackZ + fallbackDeskDepth,
    };
    STATE.room.deskSurfaceYTolerance = Math.max(0.08, fallbackSize.y * 0.08);
  }

  const analyzedChairSurface = analyzeChairSeatSurface();
  if (analyzedChairSurface) {
    STATE.room.chairSeatY = analyzedChairSurface.y;
    STATE.room.chairSurfaceBounds = analyzedChairSurface.bounds;
    STATE.room.chairSurfaceYTolerance = analyzedChairSurface.tolerance;
  } else {
    STATE.room.chairSeatY = Math.max(box.min.y + fallbackSize.y * 0.2, STATE.room.deskTopY - Math.max(0.54, fallbackSize.y * 0.24));
    STATE.room.chairSurfaceBounds = {
      minX: fallbackCenterX - 0.42,
      maxX: fallbackCenterX + 0.42,
      minZ: STATE.room.deskSurfaceBounds.maxZ + 0.18,
      maxZ: STATE.room.deskSurfaceBounds.maxZ + 0.68,
    };
    STATE.room.chairSurfaceYTolerance = Math.max(0.06, fallbackSize.y * 0.06);
  }

  buildStaticDecor();
}

function clearStaticDecor() {
  STATE.staticDecor.forEach((object) => STATE.scene.remove(object));
  STATE.staticDecor = [];
}


function buildStaticDecor() {
  clearStaticDecor();
}

function createAssetInstance(key) {
  const template = STATE.templates[key];
  const root = template.animations.length ? cloneSkeleton(template.root) : template.root.clone(true);
  root.userData.assetKey = key;
  applyShadowSettings(root);

  let mixer = null;
  let action = null;

  if (template.animations.length) {
    mixer = new THREE.AnimationMixer(root);
    action = mixer.clipAction(template.animations[0]);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
  }

  return { root, mixer, action };
}


function getDeskSurfaceBounds() {
  return STATE.room.deskSurfaceBounds || {
    minX: -1.55,
    maxX: 1.55,
    minZ: -5.8,
    maxZ: -4.55,
  };
}

function getChairSurfaceBounds() {
  return STATE.room.chairSurfaceBounds || {
    minX: -0.48,
    maxX: 0.48,
    minZ: -3.98,
    maxZ: -3.36,
  };
}

function slotOnChair(u, v, rotY = 0, zOffset = 0, xOffset = 0) {
  const bounds = getChairSurfaceBounds();
  return {
    x: THREE.MathUtils.lerp(bounds.minX, bounds.maxX, u) + xOffset,
    z: THREE.MathUtils.lerp(bounds.minZ, bounds.maxZ, v) + zOffset,
    rotY,
  };
}

function getChairOverflowSlots() {
  return [
    slotOnChair(0.28, 0.38, -0.08),
    slotOnChair(0.72, 0.34, 0.08),
    slotOnChair(0.5, 0.62, 0.02),
  ];
}

function slotOnDesk(u, v, rotY = 0, zOffset = 0, xOffset = 0) {
  const bounds = getDeskSurfaceBounds();
  return {
    x: THREE.MathUtils.lerp(bounds.minX, bounds.maxX, u) + DESK_TOP_ITEM_WORLD_COMP.x + xOffset,
    z: THREE.MathUtils.lerp(bounds.minZ, bounds.maxZ, v) + DESK_TOP_ITEM_WORLD_COMP.z + zOffset,
    rotY,
  };
}

function getDeskNoteSlots() {
  return [
    slotOnDesk(0.03, 0.42, -0.18, -0.40),
    slotOnDesk(0.11, 0.52, 0.12, -0.40),
    slotOnDesk(0.2, 0.36, -0.1, -0.42),
    slotOnDesk(0.29, 0.48, 0.16, -0.40),
  ];
}

function getDeskScribbleSlots() {
  return [
    slotOnDesk(0.02, 0.68, -0.26, -0.34, -0.04),
    slotOnDesk(0.08, 0.58, -0.18, -0.36, -0.02),
  ];
}

function getRecordFloorSlots() {
  return RECORD_FLOOR_SLOTS;
}

function getDeskTumblerSlots() {
  const rightShift = 0.12;
  return [
    slotOnDesk(0.44, 0.22, -0.06, -0.28, -0.16 + rightShift),
    slotOnDesk(0.57, 0.26, 0.02, -0.25, -0.06 + rightShift),
    slotOnDesk(0.74, 0.23, -0.04, -0.27, 0.08 + rightShift),
    slotOnDesk(0.50, 0.40, 0.06, -0.18, -0.12 + rightShift),
    slotOnDesk(0.70, 0.42, -0.03, -0.17, 0.10 + rightShift),
  ];
}

function getDeskOverflowPaperSlots() {
  return [
    slotOnDesk(0.34, 0.22, -0.12, -0.46),
    slotOnDesk(0.46, 0.32, 0.08, -0.42),
    slotOnDesk(0.56, 0.22, -0.08, -0.46),
    slotOnDesk(0.38, 0.54, 0.14, -0.36),
    slotOnDesk(0.54, 0.56, -0.16, -0.34),
    slotOnDesk(0.66, 0.44, 0.1, -0.38),
  ];
}

function getDeskEmotionSlots() {
  return [
    slotOnDesk(0.09, 0.28, -0.14, -0.42, -0.18),
  ];
}

function isAllowedEmotionDeskLayout(entry) {
  if (!entry || entry.placement !== 'desk') return true;
  const [slot] = getDeskEmotionSlots();
  if (!slot) return false;
  return Math.abs((entry.x ?? 0) - slot.x) <= 0.45 && Math.abs((entry.z ?? 0) - slot.z) <= 0.45;
}

function getDeskEmotionRewardSlots() {
  return DESK_EMOTION_REWARD_SLOTS.map((slot) => slotOnDesk(slot.u, slot.v, slot.rotY, slot.zOffset, slot.xOffset));
}

function isFloorPlacementSlotList(slotList) {
  return slotList === CLUTTER_SLOTS
    || slotList === RECORD_FLOOR_SLOTS
    || slotList === RECORD_SECONDARY_SPREAD_SLOTS
    || slotList === CLUTTER_SECONDARY_SPREAD_SLOTS
    || slotList === CLOTHES_SLOTS
    || slotList === EMOTION_REWARD_SLOTS;
}

function finalizePickedSlot(slotList, slot) {
  if (!slot) return slot;
  return isFloorPlacementSlotList(slotList) ? stabilizeFloorSlotCandidate({ ...slot }) : slot;
}

const FLOOR_FRONT_PRIORITY_WINDOW_RATIO = 0.42;
const FLOOR_FRONT_PRIORITY_MIN_WINDOW = 4;

function buildFrontBiasedSlotOrder(slotList, occupiedCount = 0, seedOffset = 0) {
  if (!isFloorPlacementSlotList(slotList)) {
    return Array.isArray(slotList) ? slotList : [];
  }

  return slotList
    .map((slot) => ({ slot }))
    .sort((a, b) => {
      const depthDiff = b.slot.z - a.slot.z;
      if (depthDiff !== 0) return depthDiff;

      const centerDiff = Math.abs(a.slot.x) - Math.abs(b.slot.x);
      if (centerDiff !== 0) return centerDiff;

      return a.slot.x - b.slot.x;
    })
    .map((entry) => entry.slot);
}

function buildFrontBiasedSearchIndices(total, occupiedCount = 0, seedOffset = 0) {
  if (!total) return [];
  return Array.from({ length: total }, (_, index) => index);
}

function pickDeskOrChairPlacement(options) {
  const {
    assetKey = '',
    canUseDesk = true,
    canUseChair = true,
    deskSlots = [],
    chairSlots = [],
    occupied,
    deskMinDistance = 0.72,
    chairMinDistance = 0.66,
    seedOffset = 0,
  } = options;

  const allowDesk = canUseDesk && isPlacementAllowedForAsset(assetKey, 'desk');
  const allowChair = canUseChair && isPlacementAllowedForAsset(assetKey, 'chair');

  if (allowDesk && hasAvailableSlot(deskSlots, occupied.deskInteractive, deskMinDistance)) {
    return {
      slot: pickSlot(deskSlots, occupied.deskInteractive, deskMinDistance, seedOffset),
      area: 'deskInteractive',
      placement: 'desk',
    };
  }

  if (allowChair && hasAvailableSlot(chairSlots, occupied.chairInteractive, chairMinDistance)) {
    return {
      slot: pickSlot(chairSlots, occupied.chairInteractive, chairMinDistance, seedOffset + 0.37),
      area: 'chairInteractive',
      placement: 'chair',
    };
  }

  return null;
}

function applyObjectToPlacementSurface(object, slot, placement, key) {
  if (placement === 'chair') {
    placeObjectOnChairSurface(object, slot, key);
    return;
  }

  placeObjectOnDeskSurface(object, slot, key);
}

function buildSurfaceDropIntro(enabled, placement, settledY, startedAt, duration = SURFACE_DROP_MS, height = SURFACE_DROP_HEIGHT) {
  if (!enabled) return null;
  if (placement !== 'desk' && placement !== 'chair') return null;

  return {
    startedAt,
    duration,
    fromY: settledY + height,
    toY: settledY,
  };
}

function pickSlotFromPreferredSlots(preferredSlots, slotList, occupied, minDistance, seedOffset = 0) {
  if (Array.isArray(preferredSlots) && preferredSlots.length) {
    const orderedPreferred = buildFrontBiasedSlotOrder(preferredSlots, occupied.length, seedOffset);
    const totalPreferred = orderedPreferred.length;
    const searchIndices = isFloorPlacementSlotList(preferredSlots)
      ? buildFrontBiasedSearchIndices(totalPreferred, occupied.length, seedOffset)
      : Array.from({ length: totalPreferred }, (_, index) => {
          const preferredStart = totalPreferred
            ? Math.abs(Math.floor((occupied.length * 1.73 + seedOffset * 17.0) * 1000)) % totalPreferred
            : 0;
          return (preferredStart + index) % totalPreferred;
        });

    for (let orderIndex = 0; orderIndex < searchIndices.length; orderIndex += 1) {
      const slot = orderedPreferred[searchIndices[orderIndex]];
      const ok = occupied.every((point) => distance2D(point.x, point.z, slot.x, slot.z) >= minDistance);
      if (ok) {
        const finalSlot = finalizePickedSlot(preferredSlots, slot);
        occupied.push({ x: finalSlot.x, z: finalSlot.z });
        return finalSlot;
      }
    }
  }

  return pickSlot(slotList, occupied, minDistance, seedOffset);
}

function hasAvailableSlot(slotList, occupied, minDistance) {
  if (!Array.isArray(slotList) || !slotList.length) return false;
  return slotList.some((slot) => occupied.every((point) => distance2D(point.x, point.z, slot.x, slot.z) >= minDistance));
}

function getFloorCrowdCount(occupied) {
  return (occupied?.floorInteractive?.length || 0)
    + (occupied?.clutter?.length || 0)
    + (occupied?.clothes?.length || 0);
}

function shouldUseDeskPaperOverflow(occupied, deskOverflowSlots, minDistance = 0.66) {
  return getFloorCrowdCount(occupied) >= 12
    && hasAvailableSlot(deskOverflowSlots, occupied.deskInteractive, minDistance);
}

function getEmotionAnchor(anchorList, index, tone) {
  const base = anchorList[index % anchorList.length];
  const ring = Math.floor(index / anchorList.length);
  if (!ring) return { ...base };

  const angle = (index * 1.61803398875) % (Math.PI * 2);
  const spreadX = tone === 'good' ? 1.02 : 0.86;
  const spreadZ = tone === 'good' ? 0.82 : 0.7;
  const spreadY = tone === 'good' ? 0.16 : 0.12;

  return {
    x: base.x + Math.cos(angle) * spreadX * ring,
    y: base.y + (((ring % 2) === 0 ? 1 : -1) * spreadY * Math.min(ring, 2)),
    z: base.z + Math.sin(angle) * spreadZ * ring,
  };
}


function getRecordLayoutKey(memo) {
  return `record:${memo.id}`;
}

function getClutterFreshLayoutKey(memo) {
  return `clutter-fresh:${memo.id}`;
}

function getClutterOldAnchorMemo(memos) {
  const list = (Array.isArray(memos) ? memos : [memos]).filter(Boolean);
  if (!list.length) return null;

  return list
    .slice()
    .sort((a, b) => {
      const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      return String(a.id).localeCompare(String(b.id));
    })[0];
}

function getClutterOldLayoutKey(memos) {
  const anchor = getClutterOldAnchorMemo(memos);
  return anchor ? 'clutter-old:shared' : null;
}

function getClutterOldSingleLayoutKey(memo) {
  return getClutterOldLayoutKey(memo ? [memo] : []);
}

function getClutterPileLayoutKey(memos) {
  return getClutterOldLayoutKey(memos);
}

function getRoutineLayoutKey(memo) {
  return `routine-v2-desk-avoid:${memo.id}`;
}

function isInRoutineDeskAvoidZone(slot, padX = 0.95, padZ = 0.9) {
  const deskBounds = STATE?.room?.deskBounds;
  if (!slot || !deskBounds) return false;
  if (!Number.isFinite(slot.x) || !Number.isFinite(slot.z)) return false;

  return slot.x >= (deskBounds.min.x - padX)
    && slot.x <= (deskBounds.max.x + padX)
    && slot.z >= (deskBounds.min.z - padZ)
    && slot.z <= (deskBounds.max.z + padZ);
}

function getRoutineFloorSlots() {
  const filtered = CLOTHES_SLOTS.filter((slot) => !isInRoutineDeskAvoidZone(slot));
  return filtered.length ? filtered : CLOTHES_SLOTS;
}

function getSnackLayoutKey(memo) {
  return `snack-v2:${memo.id}`;
}

function getEmotionLayoutKey(memo) {
  return `emotion-v3-left-desk-1:${memo.id}`;
}

function getEmotionRewardLayoutKey(memo) {
  return `emotion-reward-v4:${memo.id}`;
}

function shouldNormalizeFloorPlacementEntry(entry) {
  if (!entry) return false;
  return entry.area === 'floorInteractive'
    || entry.area === 'clutter'
    || entry.area === 'clothes'
    || entry.area === 'recordFloor';
}

function isPlacementAllowedForAsset(assetKey, placement) {
  if (placement === 'chair') return false;
  if (placement === 'desk' && assetKey === 'scribble') return false;
  return true;
}

function getLayoutCacheEntry(key) {
  if (!key) return null;
  const entry = STATE.layoutCache[key] || null;
  if (!entry) return null;

  if (!isPlacementAllowedForAsset(entry.assetKey, entry.placement)) {
    delete STATE.layoutCache[key];
    return null;
  }

  if (!entry.transformLocked && shouldNormalizeFloorPlacementEntry(entry)) {
    normalizeFloorPlacementSlot(entry);
    entry.transformLocked = true;
  }

  return entry;
}

function setLayoutCacheEntry(key, value) {
  if (!key) return null;
  STATE.layoutCache[key] = {
    ...(STATE.layoutCache[key] || {}),
    ...value,
    transformLocked: true,
    slotMigrationVersion: value.slotMigrationVersion || LAYOUT_CACHE_SLOT_MIGRATION_VERSION,
  };
  return STATE.layoutCache[key];
}

function applyCachedTransform(object, cachedLayout) {
  if (!object || !cachedLayout) return;
  object.position.x = cachedLayout.x;
  object.position.z = cachedLayout.z;
  object.rotation.x = Number.isFinite(cachedLayout.rotX) ? cachedLayout.rotX : (object.rotation.x || 0);
  object.rotation.y = Number.isFinite(cachedLayout.rotY) ? cachedLayout.rotY : 0;
  object.rotation.z = Number.isFinite(cachedLayout.rotZ) ? cachedLayout.rotZ : 0;
}

function syncLayoutCacheFromObject(key, object, extra = {}) {
  if (!key || !object) return null;
  const entry = {
    x: object.position.x,
    z: object.position.z,
    rotX: Number.isFinite(object.rotation.x) ? object.rotation.x : 0,
    rotY: Number.isFinite(object.rotation.y) ? object.rotation.y : 0,
    rotZ: Number.isFinite(object.rotation.z) ? object.rotation.z : 0,
    ...extra,
  };
  return setLayoutCacheEntry(key, entry);
}

function bindObjectLayoutCache(object, key, extra = {}) {
  if (!object || !key) return;
  object.userData.layoutCacheKey = key;
  object.userData.layoutCacheExtra = {
    ...(object.userData.layoutCacheExtra || {}),
    ...extra,
  };
}

function snapshotLiveVisualTransformsToLayoutCache() {
  STATE.visuals.forEach((visual) => {
    const object = visual?.object;
    const layoutKey = object?.userData?.layoutCacheKey;
    if (!object || !layoutKey) return;
    syncLayoutCacheFromObject(layoutKey, object, object.userData.layoutCacheExtra || {});
  });
}

function pruneLayoutCache(activeKeys) {
  Object.keys(STATE.layoutCache).forEach((key) => {
    if (!activeKeys.has(key)) {
      delete STATE.layoutCache[key];
    }
  });
}

function reserveOccupiedPoint(list, x, z) {
  if (!list || !Number.isFinite(x) || !Number.isFinite(z)) return;
  list.push({ x, z });
}

function reservePlacementCache(key, occupied) {
  const cache = getLayoutCacheEntry(key);
  if (!cache) return;

  if (cache.area === 'deskInteractive') {
    reserveOccupiedPoint(occupied.deskInteractive, cache.x, cache.z);
    return;
  }

  if (cache.area === 'chairInteractive') {
    reserveOccupiedPoint(occupied.chairInteractive, cache.x, cache.z);
    return;
  }

  if (cache.area === 'floorInteractive') {
    reserveOccupiedPoint(occupied.floorInteractive, cache.x, cache.z);
    return;
  }

  if (cache.area === 'clutter') {
    reserveOccupiedPoint(occupied.clutter, cache.x, cache.z);
    return;
  }

  if (cache.area === 'clothes') {
    reserveOccupiedPoint(occupied.clothes, cache.x, cache.z);
  }
}

function reservePlacementCaches(keys, occupied) {
  keys.forEach((key) => reservePlacementCache(key, occupied));
}

function buildActiveLayoutKeys({ records, clutterFresh, clutterOld, routines, snacks, emotions = [] }) {
  const keys = new Set();

  records.forEach((memo) => {
    keys.add(getRecordLayoutKey(memo));
  });

  clutterFresh.forEach((memo) => {
    keys.add(getClutterFreshLayoutKey(memo));
  });

  if (clutterOld.length) {
    const clutterOldKey = getClutterOldLayoutKey(clutterOld);
    if (clutterOldKey) keys.add(clutterOldKey);
  }

  routines.forEach((memo) => {
    keys.add(getRoutineLayoutKey(memo));
  });

  snacks.forEach((memo) => {
    if (memo.fromEmotion) keys.add(getEmotionRewardLayoutKey(memo));
    else keys.add(getSnackLayoutKey(memo));
  });

  emotions.forEach((memo) => {
    keys.add(getEmotionLayoutKey(memo));
  });

  return keys;
}

function rebuildVisuals(animateMemoId = null) {
  snapshotLiveVisualTransformsToLayoutCache();
  disposeVisuals();

  const activeMemos = STATE.memos.filter((memo) => !memo.clearedAt);
  const now = Date.now();

  const clutterFresh = [];
  const clutterOld = [];
  const records = [];
  const routines = [];
  const snacks = [];
  const emotions = [];

  activeMemos
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((memo) => {
      const ageDays = getAgeDays(memo.createdAt, now);

      if (memo.category === 'clutter') {
        if (ageDays >= CLUTTER_MERGE_DAYS) clutterOld.push(memo);
        else clutterFresh.push(memo);
        return;
      }

      if (memo.category === 'record') {
        records.push(memo);
        return;
      }

      if (memo.category === 'routine') {
        routines.push(memo);
        return;
      }

      if (memo.category === 'snack') {
        snacks.push(memo);
        return;
      }

      if (memo.category === 'emotion') {
        emotions.push(memo);
      }
    });

  const occupied = {
    desk: [],
    chair: [],
    clutter: [],
    clothes: [],
    snack: [],
    recordFloor: [],
    deskInteractive: [],
    chairInteractive: [],
    floorInteractive: [],
  };

  const deskNoteSlots = getDeskNoteSlots();
  const deskScribbleSlots = getDeskScribbleSlots();
  const deskTumblerSlots = getDeskTumblerSlots();
  const deskEmotionRewardSlots = getDeskEmotionRewardSlots();
  const deskOverflowPaperSlots = getDeskOverflowPaperSlots();
  const chairOverflowSlots = getChairOverflowSlots();
  const recordFloorSlots = getRecordFloorSlots();
  const activeLayoutKeys = buildActiveLayoutKeys({ records, clutterFresh, clutterOld, routines, snacks, emotions });

  pruneLayoutCache(activeLayoutKeys);
  reservePlacementCaches(activeLayoutKeys, occupied);

  let deskNoteCount = records.reduce((count, memo) => {
    const cache = getLayoutCacheEntry(getRecordLayoutKey(memo));
    return count + (cache?.placement === 'desk' && cache?.assetKey !== 'scribble' ? 1 : 0);
  }, 0);

  let deskScribbleCount = records.reduce((count, memo) => {
    const cache = getLayoutCacheEntry(getRecordLayoutKey(memo));
    return count + (cache?.placement === 'desk' && cache?.assetKey === 'scribble' ? 1 : 0);
  }, 0);

  let deskEmotionRewardCount = snacks.reduce((count, memo) => {
    if (!memo.fromEmotion) return count;
    const cache = getLayoutCacheEntry(getEmotionRewardLayoutKey(memo));
    return count + (cache?.placement === 'desk' ? 1 : 0);
  }, 0);

  snacks.forEach((memo) => {
    if (!memo || memo.fromEmotion) return;
    const layoutKey = getSnackLayoutKey(memo);
    const cache = getLayoutCacheEntry(layoutKey);
    if (cache?.placement === 'chair') {
      delete STATE.layoutCache[layoutKey];
    }
  });

  const maxDeskTumblerSlots = Math.min(MAX_DESK_TUMBLER_COUNT, deskTumblerSlots.length);
  const usedDeskTumblerSlotIndices = new Set();

  records.forEach((memo, index) => {
    const layoutKey = getRecordLayoutKey(memo);
    const cachedLayout = getLayoutCacheEntry(layoutKey);
    const useScribble = cachedLayout ? cachedLayout.assetKey === 'scribble' : (getMemoStableHash(memo, 'record-variant') % 3 === 2);
    const key = useScribble ? 'scribble' : 'note';
    const instance = createAssetInstance(key);
    const shouldPlayDropIntro = memo.id === animateMemoId && !cachedLayout;

    if (cachedLayout) {
      applyCachedTransform(instance.root, cachedLayout);

      if (cachedLayout.placement === 'desk' || cachedLayout.placement === 'chair') {
        applyObjectToPlacementSurface(instance.root, cachedLayout, cachedLayout.placement, key);
      } else {
        restObjectOnY(instance.root, 0.02);
        if (key === 'scribble') liftDeskObject(instance.root, 'scribble');
      }
    } else if (useScribble) {
      const surfacePlacement = pickDeskOrChairPlacement({
        assetKey: 'scribble',
        canUseDesk: deskScribbleCount < Math.min(1, deskScribbleSlots.length),
        deskSlots: deskScribbleSlots,
        chairSlots: chairOverflowSlots,
        occupied,
        deskMinDistance: 0.68,
        chairMinDistance: 0.58,
        seedOffset: getMemoStableSeedOffset(memo, 'seed-17', 9),
      });

      if (surfacePlacement) {
        const { slot, placement, area } = surfacePlacement;
        if (placement === 'desk') {
          deskScribbleCount += 1;
          occupied.desk.push({ x: slot.x, z: slot.z });
        } else {
          occupied.chair.push({ x: slot.x, z: slot.z });
        }

        instance.root.position.set(slot.x, 0, slot.z);
        instance.root.rotation.y = slot.rotY || 0;
        instance.root.rotation.z = slot.rotZ || 0;
        applyObjectToPlacementSurface(instance.root, slot, placement, 'scribble');
        syncLayoutCacheFromObject(layoutKey, instance.root, { area, placement, assetKey: 'scribble' });
      } else {
        const floorSlot = pickSlotFromPreferredSlots(RECORD_SECONDARY_SPREAD_SLOTS, recordFloorSlots, occupied.floorInteractive, 1.28, getMemoStableSeedOffset(memo, 'seed-21', 11));
        occupied.recordFloor.push({ x: floorSlot.x, z: floorSlot.z });
        instance.root.position.set(floorSlot.x, 0, floorSlot.z);
        instance.root.rotation.y = floorSlot.rotY || 0;
        instance.root.rotation.z = floorSlot.rotZ || 0;
        restObjectOnY(instance.root, 0.02);
        liftDeskObject(instance.root, 'scribble');
        syncLayoutCacheFromObject(layoutKey, instance.root, { area: 'floorInteractive', placement: 'floor', assetKey: 'scribble' });
      }
    } else {
      const surfacePlacement = pickDeskOrChairPlacement({
        assetKey: 'note',
        canUseDesk: deskNoteCount < Math.min(MAX_DESK_NOTE_COUNT, deskNoteSlots.length),
        deskSlots: deskNoteSlots,
        chairSlots: chairOverflowSlots,
        occupied,
        deskMinDistance: 0.76,
        chairMinDistance: 0.64,
        seedOffset: getMemoStableSeedOffset(memo, 'seed-19', 10),
      });

      if (surfacePlacement) {
        const { slot, placement, area } = surfacePlacement;
        if (placement === 'desk') {
          deskNoteCount += 1;
          occupied.desk.push({ x: slot.x, z: slot.z });
        } else {
          occupied.chair.push({ x: slot.x, z: slot.z });
        }

        instance.root.position.set(slot.x, 0, slot.z);
        instance.root.rotation.y = slot.rotY || 0;
        instance.root.rotation.z = slot.rotZ || 0;
        applyObjectToPlacementSurface(instance.root, slot, placement, 'note');
        syncLayoutCacheFromObject(layoutKey, instance.root, { area, placement, assetKey: 'note' });
      } else {
        const slot = pickSlot(recordFloorSlots, occupied.floorInteractive, 0.94, getMemoStableSeedOffset(memo, 'seed-19', 10));
        occupied.recordFloor.push({ x: slot.x, z: slot.z });
        instance.root.position.set(slot.x, 0, slot.z);
        instance.root.rotation.y = slot.rotY || 0;
        instance.root.rotation.z = slot.rotZ || 0;
        restObjectOnY(instance.root, 0.02);
        syncLayoutCacheFromObject(layoutKey, instance.root, { area: 'floorInteractive', placement: 'floor', assetKey: 'note' });
      }
    }

    const resolvedRecordLayout = getLayoutCacheEntry(layoutKey);
    const recordPlacement = resolvedRecordLayout?.placement || 'floor';
    const settledY = instance.root.position.y;

    if (recordPlacement === 'floor' && !cachedLayout) {
      ensureObjectStartsVisible(instance.root, FLOOR_RECORD_CLUTTER_VISIBLE_ZONE, FLOOR_VISIBILITY_NUDGES, FLOOR_RECORD_CLUTTER_CAMERA_VISIBILITY_BOUNDS);
    }

    const finalRecordExtra = {
      area: resolvedRecordLayout?.area || (recordPlacement === 'chair' ? 'chairInteractive' : recordPlacement === 'desk' ? 'deskInteractive' : 'floorInteractive'),
      placement: recordPlacement,
      assetKey: key,
    };
    syncLayoutCacheFromObject(layoutKey, instance.root, finalRecordExtra);
    bindObjectLayoutCache(instance.root, layoutKey, finalRecordExtra);
    tagMemoHoverTarget(instance.root, [memo.id]);
    STATE.scene.add(instance.root);
    const hoverProxy = createMemoHoverProxy(instance.root);

    if (instance.mixer) {
      STATE.mixers.push(instance.mixer);
    }

    if (instance.action && memo.id === animateMemoId) {
      instance.action.reset();
      instance.action.play();
    }

    STATE.visuals.push({
      kind: 'asset',
      memoIds: [memo.id],
      object: instance.root,
      mixer: instance.mixer,
      hoverProxy,
      dropIntro: buildSurfaceDropIntro(shouldPlayDropIntro, recordPlacement, settledY, now),
    });
  });

  clutterFresh.forEach((memo, index) => {
    const layoutKey = getClutterFreshLayoutKey(memo);
    const cachedLayout = getLayoutCacheEntry(layoutKey);
    const key = cachedLayout?.assetKey || (getMemoStableHash(memo, 'clutter-variant') % 2 === 0 ? 'paperSingle' : 'paperSingle2');
    const instance = createAssetInstance(key);
    const shouldPlayDropIntro = memo.id === animateMemoId;

    if (cachedLayout) {
      applyCachedTransform(instance.root, cachedLayout);

      if (cachedLayout.placement === 'desk' || cachedLayout.placement === 'chair') {
        applyObjectToPlacementSurface(instance.root, cachedLayout, cachedLayout.placement, 'note');
      } else {
        restObjectOnY(instance.root, 0.02);
      }
    } else {
      const useDeskOverflow = shouldUseDeskPaperOverflow(occupied, deskOverflowPaperSlots, 0.64);
      const surfacePlacement = useDeskOverflow ? pickDeskOrChairPlacement({
        assetKey: 'note',
        canUseDesk: true,
        deskSlots: deskOverflowPaperSlots,
        chairSlots: chairOverflowSlots,
        occupied,
        deskMinDistance: 0.64,
        chairMinDistance: 0.58,
        seedOffset: getMemoStableSeedOffset(memo, 'seed-16', 8),
      }) : null;
      const slot = surfacePlacement
        ? surfacePlacement.slot
        : key === 'paperSingle2'
          ? pickSlotFromPreferredSlots(CLUTTER_SECONDARY_SPREAD_SLOTS, CLUTTER_SLOTS, occupied.clutter, 0.98, getMemoStableSeedOffset(memo, 'seed-16', 8))
          : pickSlot(CLUTTER_SLOTS, occupied.clutter, 0.56, getMemoStableSeedOffset(memo, 'seed-16', 8));

      instance.root.position.set(slot.x, 0, slot.z);
      instance.root.rotation.y = slot.rotY || 0;
      instance.root.rotation.z = slot.rotZ || 0;

      if (surfacePlacement) {
        if (surfacePlacement.placement === 'desk') occupied.desk.push({ x: slot.x, z: slot.z });
        else occupied.chair.push({ x: slot.x, z: slot.z });
        applyObjectToPlacementSurface(instance.root, slot, surfacePlacement.placement, 'note');
        syncLayoutCacheFromObject(layoutKey, instance.root, { area: surfacePlacement.area, placement: surfacePlacement.placement, assetKey: key });
      } else {
        restObjectOnY(instance.root, 0.02);
        syncLayoutCacheFromObject(layoutKey, instance.root, { area: 'clutter', placement: 'floor', assetKey: key });
      }
    }

    const resolvedClutterLayout = getLayoutCacheEntry(layoutKey);
    const clutterPlacement = resolvedClutterLayout?.placement || 'floor';
    const clutterOnSurface = clutterPlacement === 'desk' || clutterPlacement === 'chair';
    const settledY = instance.root.position.y;
    const dropHeight = (!cachedLayout && !clutterOnSurface) ? getClutterDropHeightForSlot(resolvedClutterLayout) : 0;

    if (shouldPlayDropIntro && !cachedLayout && !clutterOnSurface) {
      instance.root.position.y = settledY + dropHeight;
    }

    if (!clutterOnSurface && !cachedLayout) {
      ensureObjectStartsVisible(instance.root, FLOOR_RECORD_CLUTTER_VISIBLE_ZONE, FLOOR_VISIBILITY_NUDGES, FLOOR_RECORD_CLUTTER_CAMERA_VISIBILITY_BOUNDS);
    }

    const finalClutterExtra = clutterOnSurface
      ? { area: resolvedClutterLayout?.area || 'deskInteractive', placement: clutterPlacement, assetKey: key }
      : { area: 'clutter', placement: 'floor', assetKey: key };
    syncLayoutCacheFromObject(layoutKey, instance.root, finalClutterExtra);
    bindObjectLayoutCache(instance.root, layoutKey, finalClutterExtra);
    tagMemoHoverTarget(instance.root, [memo.id]);
    STATE.scene.add(instance.root);
    const hoverProxy = createMemoHoverProxy(instance.root);

    STATE.visuals.push({
      kind: 'asset',
      memoIds: [memo.id],
      object: instance.root,
      mixer: null,
      hoverProxy,
      dropIntro: clutterOnSurface
        ? buildSurfaceDropIntro(shouldPlayDropIntro && !cachedLayout, clutterPlacement, settledY, now)
        : shouldPlayDropIntro && !cachedLayout
          ? { startedAt: now, duration: CLUTTER_DROP_MS, fromY: settledY + dropHeight, toY: settledY }
          : null,
    });
  });

  if (clutterOld.length) {
    if (clutterOld.length >= 2) {
      const layoutKey = getClutterPileLayoutKey(clutterOld);
      const cachedLayout = getLayoutCacheEntry(layoutKey);
      const pile = createAssetInstance('paperPile');

      if (cachedLayout) {
        applyCachedTransform(pile.root, cachedLayout);

        if (cachedLayout.placement === 'desk' || cachedLayout.placement === 'chair') applyObjectToPlacementSurface(pile.root, cachedLayout, cachedLayout.placement, 'note');
        else restObjectOnY(pile.root, 0.02);
      } else {
        const useDeskOverflow = shouldUseDeskPaperOverflow(occupied, deskOverflowPaperSlots, 0.74);
        const surfacePlacement = useDeskOverflow ? pickDeskOrChairPlacement({
          assetKey: 'note',
          canUseDesk: true,
          deskSlots: deskOverflowPaperSlots,
          chairSlots: chairOverflowSlots,
          occupied,
          deskMinDistance: 0.74,
          chairMinDistance: 0.66,
          seedOffset: 0.24,
        }) : null;
        const pileSlot = surfacePlacement ? surfacePlacement.slot : pickSlot(CLUTTER_SLOTS, occupied.clutter, 0.96, 0.24);
        pile.root.position.set(pileSlot.x, 0, pileSlot.z);
        pile.root.rotation.y = pileSlot.rotY || 0;
        pile.root.rotation.z = pileSlot.rotZ || 0;

        if (surfacePlacement) {
          if (surfacePlacement.placement === 'desk') occupied.desk.push({ x: pileSlot.x, z: pileSlot.z });
          else occupied.chair.push({ x: pileSlot.x, z: pileSlot.z });
          applyObjectToPlacementSurface(pile.root, pileSlot, surfacePlacement.placement, 'note');
          syncLayoutCacheFromObject(layoutKey, pile.root, { area: surfacePlacement.area, placement: surfacePlacement.placement, assetKey: 'paperPile' });
        } else {
          restObjectOnY(pile.root, 0.02);
          syncLayoutCacheFromObject(layoutKey, pile.root, { area: 'clutter', placement: 'floor', assetKey: 'paperPile' });
        }
      }

      const resolvedPileLayout = getLayoutCacheEntry(layoutKey);
      const pilePlacement = resolvedPileLayout?.placement || 'floor';
      const pileOnSurface = pilePlacement === 'desk' || pilePlacement === 'chair';

      if (!pileOnSurface && !cachedLayout) ensureObjectStartsVisible(pile.root, FLOOR_RECORD_CLUTTER_VISIBLE_ZONE, FLOOR_VISIBILITY_NUDGES, FLOOR_RECORD_CLUTTER_CAMERA_VISIBILITY_BOUNDS);
      const finalPileExtra = pileOnSurface
        ? { area: resolvedPileLayout?.area || 'deskInteractive', placement: pilePlacement, assetKey: 'paperPile' }
        : { area: 'clutter', placement: 'floor', assetKey: 'paperPile' };
      syncLayoutCacheFromObject(layoutKey, pile.root, finalPileExtra);
      bindObjectLayoutCache(pile.root, layoutKey, finalPileExtra);
      tagMemoHoverTarget(pile.root, clutterOld.map((memo) => memo.id));
      STATE.scene.add(pile.root);
      const hoverProxy = createMemoHoverProxy(pile.root);

      STATE.visuals.push({
        kind: 'asset',
        memoIds: clutterOld.map((memo) => memo.id),
        object: pile.root,
        mixer: null,
        hoverProxy,
      });
    } else {
      const memo = clutterOld[0];
      const layoutKey = getClutterOldSingleLayoutKey(memo);
      const cachedLayout = getLayoutCacheEntry(layoutKey);
      const instance = createAssetInstance('paperSingle2');

      if (cachedLayout) {
        applyCachedTransform(instance.root, cachedLayout);

        if (cachedLayout.placement === 'desk' || cachedLayout.placement === 'chair') applyObjectToPlacementSurface(instance.root, cachedLayout, cachedLayout.placement, 'note');
        else restObjectOnY(instance.root, 0.02);
      } else {
        const useDeskOverflow = shouldUseDeskPaperOverflow(occupied, deskOverflowPaperSlots, 0.7);
        const surfacePlacement = useDeskOverflow ? pickDeskOrChairPlacement({
          assetKey: 'note',
          canUseDesk: true,
          deskSlots: deskOverflowPaperSlots,
          chairSlots: chairOverflowSlots,
          occupied,
          deskMinDistance: 0.7,
          chairMinDistance: 0.62,
        }) : null;
        const slot = surfacePlacement ? surfacePlacement.slot : pickSlotFromPreferredSlots(CLUTTER_SECONDARY_SPREAD_SLOTS, CLUTTER_SLOTS, occupied.clutter, 1.02);
        instance.root.position.set(slot.x, 0, slot.z);
        instance.root.rotation.y = slot.rotY || 0;
        instance.root.rotation.z = slot.rotZ || 0.08;

        if (surfacePlacement) {
          if (surfacePlacement.placement === 'desk') occupied.desk.push({ x: slot.x, z: slot.z });
          else occupied.chair.push({ x: slot.x, z: slot.z });
          applyObjectToPlacementSurface(instance.root, slot, surfacePlacement.placement, 'note');
          syncLayoutCacheFromObject(layoutKey, instance.root, { area: surfacePlacement.area, placement: surfacePlacement.placement, assetKey: 'paperSingle2' });
        } else {
          restObjectOnY(instance.root, 0.02);
          syncLayoutCacheFromObject(layoutKey, instance.root, { area: 'clutter', placement: 'floor', assetKey: 'paperSingle2' });
        }
      }

      const resolvedOldSingleLayout = getLayoutCacheEntry(layoutKey);
      const oldSinglePlacement = resolvedOldSingleLayout?.placement || 'floor';
      const oldSingleOnSurface = oldSinglePlacement === 'desk' || oldSinglePlacement === 'chair';

      if (!oldSingleOnSurface && !cachedLayout) ensureObjectStartsVisible(instance.root, FLOOR_RECORD_CLUTTER_VISIBLE_ZONE, FLOOR_VISIBILITY_NUDGES, FLOOR_RECORD_CLUTTER_CAMERA_VISIBILITY_BOUNDS);
      const finalOldSingleExtra = oldSingleOnSurface
        ? { area: resolvedOldSingleLayout?.area || 'deskInteractive', placement: oldSinglePlacement, assetKey: 'paperSingle2' }
        : { area: 'clutter', placement: 'floor', assetKey: 'paperSingle2' };
      syncLayoutCacheFromObject(layoutKey, instance.root, finalOldSingleExtra);
      bindObjectLayoutCache(instance.root, layoutKey, finalOldSingleExtra);
      tagMemoHoverTarget(instance.root, [memo.id]);
      STATE.scene.add(instance.root);
      const hoverProxy = createMemoHoverProxy(instance.root);

      STATE.visuals.push({
        kind: 'asset',
        memoIds: [memo.id],
        object: instance.root,
        mixer: null,
        hoverProxy,
      });
    }
  }

  routines.forEach((memo, index) => {
    const layoutKey = getRoutineLayoutKey(memo);
    const cachedLayout = getLayoutCacheEntry(layoutKey);
    const oldEnough = getAgeDays(memo.createdAt, now) >= ROUTINE_SCATTER_DAYS;
    const key = oldEnough ? 'clothesScattered' : 'clothesFolded';
    const instance = createAssetInstance(key);
    const shouldPlayDropIntro = memo.id === animateMemoId;

    if (cachedLayout) {
      applyCachedTransform(instance.root, cachedLayout);
      restObjectOnY(instance.root, 0.02);
    } else {
      const slot = pickSlot(getRoutineFloorSlots(), occupied.clothes, 1.05, getMemoStableSeedOffset(memo, 'seed-22', 12));
      instance.root.position.set(slot.x, 0, slot.z);
      instance.root.rotation.y = slot.rotY || 0;
      restObjectOnY(instance.root, 0.02);
      syncLayoutCacheFromObject(layoutKey, instance.root, {
        area: 'clothes',
      });
    }

    const settledY = instance.root.position.y;

    if (shouldPlayDropIntro && !cachedLayout) {
      instance.root.position.y = settledY + ROUTINE_DROP_HEIGHT;
    }

    if (!cachedLayout) ensureObjectStartsVisible(instance.root);
    const finalRoutineExtra = {
      area: 'clothes',
      placement: 'floor',
      assetKey: key,
    };
    syncLayoutCacheFromObject(layoutKey, instance.root, finalRoutineExtra);
    bindObjectLayoutCache(instance.root, layoutKey, finalRoutineExtra);
    tagMemoHoverTarget(instance.root, [memo.id]);
    STATE.scene.add(instance.root);
    const hoverProxy = createMemoHoverProxy(instance.root);

    STATE.visuals.push({
      kind: 'asset',
      memoIds: [memo.id],
      object: instance.root,
      mixer: null,
      hoverProxy,
      dropIntro: shouldPlayDropIntro && !cachedLayout
        ? {
            startedAt: now,
            duration: ROUTINE_DROP_MS,
            fromY: settledY + ROUTINE_DROP_HEIGHT,
            toY: settledY,
          }
        : null,
    });
  });

  snacks.forEach((memo, index) => {
    const isEmotionSnack = Boolean(memo.fromEmotion);

    if (isEmotionSnack) {
      const layoutKey = getEmotionRewardLayoutKey(memo);
      const cachedLayout = getLayoutCacheEntry(layoutKey);
      const rewardKey = getEmotionDecayAssetKey(memo, now);
      const instance = createAssetInstance(rewardKey);
      const shouldPlayDropIntro = !STATE.playedEmotionRewardDropMemoIds.has(memo.id) && !cachedLayout;

      if (cachedLayout) {
        instance.root.position.set(cachedLayout.x, 0, cachedLayout.z);
        instance.root.rotation.y = cachedLayout.rotY || 0;
        instance.root.rotation.z = cachedLayout.rotZ || 0;

        if (cachedLayout.placement === 'desk' || cachedLayout.placement === 'chair') {
          applyObjectToPlacementSurface(instance.root, cachedLayout, cachedLayout.placement, rewardKey);
        } else {
          restObjectOnY(instance.root, 0.02);
        }
      } else {
        const surfacePlacement = pickDeskOrChairPlacement({
          assetKey: rewardKey,
          canUseDesk: deskEmotionRewardCount < Math.min(EMOTION_REWARD_DESK_LIMIT, deskEmotionRewardSlots.length),
          deskSlots: deskEmotionRewardSlots,
          chairSlots: chairOverflowSlots,
          occupied,
          deskMinDistance: 0.82,
          chairMinDistance: 0.66,
          seedOffset: getMemoStableSeedOffset(memo, 'seed-17', 9),
        });

        if (surfacePlacement) {
          const { slot, placement, area } = surfacePlacement;
          if (placement === 'desk') {
            deskEmotionRewardCount += 1;
            occupied.desk.push({ x: slot.x, z: slot.z });
          } else {
            occupied.chair.push({ x: slot.x, z: slot.z });
          }
          instance.root.position.set(slot.x, 0, slot.z);
          instance.root.rotation.y = slot.rotY || 0;
          instance.root.rotation.z = slot.rotZ || 0;
          applyObjectToPlacementSurface(instance.root, slot, placement, rewardKey);
          syncLayoutCacheFromObject(layoutKey, instance.root, { area, placement, assetKey: rewardKey });
        } else {
          const slot = pickSlot(EMOTION_REWARD_SLOTS, occupied.snack, 2.18, getMemoStableSeedOffset(memo, 'seed-19', 10));
          reserveOccupiedPoint(occupied.floorInteractive, slot.x, slot.z);
          instance.root.position.set(slot.x, 0, slot.z);
          instance.root.rotation.y = slot.rotY || 0;
          restObjectOnY(instance.root, 0.02);
          syncLayoutCacheFromObject(layoutKey, instance.root, { area: 'floorInteractive', placement: 'floor', assetKey: rewardKey });
        }
      }

      const resolvedRewardLayout = getLayoutCacheEntry(layoutKey);
      const rewardPlacement = resolvedRewardLayout?.placement || 'floor';
      const rewardOnSurface = rewardPlacement === 'desk' || rewardPlacement === 'chair';
      const settledY = instance.root.position.y;

      if (shouldPlayDropIntro) {
        instance.root.position.y = settledY + EMOTION_REWARD_DROP_HEIGHT;
        STATE.playedEmotionRewardDropMemoIds.add(memo.id);
      }

      if (!rewardOnSurface && !cachedLayout) {
        ensureObjectStartsVisible(instance.root, FLOOR_RECORD_CLUTTER_VISIBLE_ZONE, FLOOR_VISIBILITY_NUDGES, FLOOR_RECORD_CLUTTER_CAMERA_VISIBILITY_BOUNDS);
      }
      const finalRewardExtra = {
        area: resolvedRewardLayout?.area || (rewardPlacement === 'chair' ? 'chairInteractive' : rewardPlacement === 'desk' ? 'deskInteractive' : 'floorInteractive'),
        placement: rewardPlacement,
        assetKey: rewardKey,
      };
      syncLayoutCacheFromObject(layoutKey, instance.root, finalRewardExtra);
      bindObjectLayoutCache(instance.root, layoutKey, finalRewardExtra);
      tagMemoHoverTarget(instance.root, [memo.id]);
      STATE.scene.add(instance.root);
      const hoverProxy = createMemoHoverProxy(instance.root);

      if (instance.mixer) {
        STATE.mixers.push(instance.mixer);
      }

      STATE.visuals.push({
        kind: 'asset',
        memoIds: [memo.id],
        object: instance.root,
        mixer: instance.mixer,
        hoverProxy,
        dropIntro: shouldPlayDropIntro
          ? {
              startedAt: now,
              duration: EMOTION_REWARD_DROP_MS,
              fromY: settledY + EMOTION_REWARD_DROP_HEIGHT,
              toY: settledY,
            }
          : null,
      });
      return;
    }

    const layoutKey = getSnackLayoutKey(memo);
    const cachedLayout = getLayoutCacheEntry(layoutKey);
    const hasValidCachedDeskSlotIndex = Number.isInteger(cachedLayout?.slotIndex)
      && cachedLayout.slotIndex >= 0
      && cachedLayout.slotIndex < maxDeskTumblerSlots
      && !usedDeskTumblerSlotIndices.has(cachedLayout.slotIndex);
    const usableCachedLayout = cachedLayout && cachedLayout.placement !== 'chair' ? cachedLayout : null;
    const instance = createAssetInstance('tumbler');
    const shouldPlayDropIntro = memo.id === animateMemoId && !(usableCachedLayout && usableCachedLayout.placement !== 'chair');

    if (usableCachedLayout?.placement === 'desk' && hasValidCachedDeskSlotIndex) {
      const slot = deskTumblerSlots[cachedLayout.slotIndex];
      usedDeskTumblerSlotIndices.add(cachedLayout.slotIndex);
      occupied.desk.push({ x: slot.x, z: slot.z });
      applyObjectToPlacementSurface(instance.root, slot, 'desk', 'tumbler');
      syncLayoutCacheFromObject(layoutKey, instance.root, {
        area: 'deskInteractive',
        placement: 'desk',
        assetKey: 'tumbler',
        slotIndex: cachedLayout.slotIndex,
      });
    } else {
      const nextDeskSlotIndex = Array.from({ length: maxDeskTumblerSlots }, (_, slotIndex) => slotIndex)
        .find((slotIndex) => !usedDeskTumblerSlotIndices.has(slotIndex));

      if (Number.isInteger(nextDeskSlotIndex)) {
        const slot = deskTumblerSlots[nextDeskSlotIndex];
        usedDeskTumblerSlotIndices.add(nextDeskSlotIndex);
        occupied.desk.push({ x: slot.x, z: slot.z });
        applyObjectToPlacementSurface(instance.root, slot, 'desk', 'tumbler');
        syncLayoutCacheFromObject(layoutKey, instance.root, {
          area: 'deskInteractive',
          placement: 'desk',
          assetKey: 'tumbler',
          slotIndex: nextDeskSlotIndex,
        });
      } else {
        const rawSlot = pickSlotFromPreferredSlots(FLOOR_TUMBLER_PREFERRED_SLOTS, recordFloorSlots, occupied.floorInteractive, FLOOR_TUMBLER_MIN_DISTANCE, getMemoStableSeedOffset(memo, 'seed-23', 12));
        const slot = getAdjustedFloorTumblerSlot(rawSlot);
        instance.root.position.set(slot.x, 0, slot.z);
        instance.root.rotation.y = slot.rotY || 0;
        instance.root.rotation.z = slot.rotZ || 0;
        restObjectOnY(instance.root, 0.02);
        ensureObjectStartsVisible(instance.root, FLOOR_RECORD_CLUTTER_VISIBLE_ZONE, FLOOR_VISIBILITY_NUDGES, FLOOR_RECORD_CLUTTER_CAMERA_VISIBILITY_BOUNDS);
        syncLayoutCacheFromObject(layoutKey, instance.root, {
          area: 'floorInteractive',
          placement: 'floor',
          assetKey: 'tumbler',
          slotIndex: null,
        });
      }
    }

    const resolvedSnackLayout = getLayoutCacheEntry(layoutKey);
    const snackPlacement = resolvedSnackLayout?.placement || 'floor';
    const settledY = instance.root.position.y;

    if (snackPlacement === 'floor' && !usableCachedLayout) {
      ensureObjectStartsVisible(instance.root, FLOOR_RECORD_CLUTTER_VISIBLE_ZONE, FLOOR_VISIBILITY_NUDGES, FLOOR_RECORD_CLUTTER_CAMERA_VISIBILITY_BOUNDS);
    }

    const finalSnackExtra = {
      area: resolvedSnackLayout?.area || (snackPlacement === 'desk' ? 'deskInteractive' : 'floorInteractive'),
      placement: snackPlacement,
      assetKey: 'tumbler',
      slotIndex: Number.isInteger(resolvedSnackLayout?.slotIndex) ? resolvedSnackLayout.slotIndex : null,
    };
    syncLayoutCacheFromObject(layoutKey, instance.root, finalSnackExtra);
    bindObjectLayoutCache(instance.root, layoutKey, finalSnackExtra);
    tagMemoHoverTarget(instance.root, [memo.id]);
    STATE.scene.add(instance.root);
    const hoverProxy = createMemoHoverProxy(instance.root);

    STATE.visuals.push({
      kind: 'asset',
      memoIds: [memo.id],
      object: instance.root,
      mixer: null,
      hoverProxy,
      dropIntro: buildSurfaceDropIntro(shouldPlayDropIntro, snackPlacement, settledY, now),
    });
  });

  emotions.forEach((memo) => {
    createAndAttachEmotionVisual(memo, animateMemoId);
  });

  updateCounts();
  STATE.lastVisualSignature = buildVisualSignature();
}

function getEmotionRewardAssetKey(memo) {
  const seed = `${memo.id}:${memo.createdAt}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash * 31) + seed.charCodeAt(i)) >>> 0;
  }

  return hash % 2 === 0 ? 'snack' : 'strawberry';
}

function getEmotionDecayAssetKey(memo, nowMs = Date.now()) {
  const baseKey = getEmotionRewardAssetKey(memo);
  const ageDays = getAgeDays(memo.createdAt, nowMs);

  if (ageDays < EMOTION_DECAY_DAYS) {
    return baseKey;
  }

  return baseKey === 'strawberry' ? 'jar' : 'burn';
}


function getMemoStableHash(memo, salt = '') {
  const seed = `${memo?.id || ''}:${memo?.createdAt || ''}:${salt}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash * 31) + seed.charCodeAt(i)) >>> 0;
  }

  return hash >>> 0;
}

function getMemoStableSeedOffset(memo, salt = '', scale = 1) {
  const normalized = (getMemoStableHash(memo, salt) % 100000) / 100000;
  return normalized * scale;
}

function updateVisualMemoHoverBinding(visual) {
  if (!visual || visual.kind !== 'asset' || !visual.object || !Array.isArray(visual.memoIds) || !visual.memoIds.length) return;
  tagMemoHoverTarget(visual.object, visual.memoIds);
}

function getClutterDropHeightForSlot(slot) {
  if (!slot) return CLUTTER_DROP_LOW_HEIGHT;

  const zValues = CLUTTER_SLOTS.map((item) => item.z);
  const minZ = Math.min(...zValues);
  const maxZ = Math.max(...zValues);
  const range = Math.max(maxZ - minZ, 0.0001);
  const normalized = clamp((slot.z - minZ) / range, 0, 1);
  const backWeight = 1 - normalized;

  return THREE.MathUtils.lerp(CLUTTER_DROP_LOW_HEIGHT, CLUTTER_DROP_HIGH_HEIGHT, backWeight);
}

function updateAssetDropVisual(visual, now) {
  if (!visual.dropIntro || !visual.object) return true;

  const intro = visual.dropIntro;
  const progress = clamp((now - intro.startedAt) / intro.duration, 0, 1);
  const eased = 1 - Math.pow(1 - progress, 3);
  const overshoot = Math.sin(progress * Math.PI) * 0.07 * (1 - progress);

  visual.object.position.y = THREE.MathUtils.lerp(intro.fromY, intro.toY, eased) - overshoot;
  visual.object.updateMatrixWorld(true);

  if (progress >= 1) {
    visual.object.position.y = intro.toY;
    visual.object.updateMatrixWorld(true);
    visual.dropIntro = null;
  }

  return true;
}

function pickSlot(slotList, occupied, minDistance, seedOffset = 0) {
  const orderedSlots = buildFrontBiasedSlotOrder(slotList, occupied.length, seedOffset);
  const total = orderedSlots.length;
  const defaultStart = total
    ? Math.abs(Math.floor((occupied.length * 1.91 + seedOffset * 23.0) * 1000)) % total
    : 0;
  const searchIndices = isFloorPlacementSlotList(slotList)
    ? buildFrontBiasedSearchIndices(total, occupied.length, seedOffset)
    : Array.from({ length: total }, (_, index) => (defaultStart + index) % total);

  for (let orderIndex = 0; orderIndex < searchIndices.length; orderIndex += 1) {
    const slot = orderedSlots[searchIndices[orderIndex]];
    const ok = occupied.every((point) => distance2D(point.x, point.z, slot.x, slot.z) >= minDistance);
    if (ok) {
      const finalSlot = finalizePickedSlot(slotList, slot);
      occupied.push({ x: finalSlot.x, z: finalSlot.z });
      return finalSlot;
    }
  }

  const base = orderedSlots[occupied.length % Math.max(orderedSlots.length, 1)];
  const ring = Math.floor(occupied.length / Math.max(orderedSlots.length, 1)) + 1;
  const angle = occupied.length * 1.618 + seedOffset;
  const radius = (minDistance * 0.62) + ((occupied.length % 4) * minDistance * 0.22) + (ring * minDistance * 0.3);
  const slot = finalizePickedSlot(slotList, {
    ...base,
    x: base.x + Math.cos(angle) * radius,
    z: base.z + Math.sin(angle) * radius,
  });
  occupied.push({ x: slot.x, z: slot.z });
  return slot;
}

function createEmotionParticleSystem(memo, tone, anchor) {
  const count = tone === 'good' ? 84 : 70;
  const positions = new Float32Array(count * 3);
  const basePositions = new Float32Array(count * 3);
  const velocity = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const color = tone === 'good' ? 0xffcd86 : 0xcfe4ff;

  for (let i = 0; i < count; i += 1) {
    const stride = i * 3;
    const radius = tone === 'good' ? (Math.random() * 0.65 + 0.2) : (Math.random() * 0.45 + 0.12);
    const theta = Math.random() * Math.PI * 2;
    const ySpread = tone === 'good' ? (Math.random() - 0.5) * 0.85 : (Math.random() - 0.5) * 0.55;

    const px = anchor.x + Math.cos(theta) * radius;
    const py = anchor.y + ySpread;
    const pz = anchor.z + Math.sin(theta) * radius;

    positions[stride] = px;
    positions[stride + 1] = py;
    positions[stride + 2] = pz;

    basePositions[stride] = px;
    basePositions[stride + 1] = py;
    basePositions[stride + 2] = pz;

    velocity[stride] = (Math.random() - 0.5) * (tone === 'good' ? 0.02 : 0.08);
    velocity[stride + 1] = tone === 'good' ? Math.random() * 0.02 : Math.random() * 0.09 + 0.03;
    velocity[stride + 2] = (Math.random() - 0.5) * (tone === 'good' ? 0.02 : 0.08);
    seeds[i] = Math.random() * 10;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color,
    size: tone === 'good' ? 0.13 : 0.1,
    sizeAttenuation: true,
    transparent: true,
    opacity: tone === 'good' ? 0.9 : 0.78,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  return {
    kind: 'particles',
    memoIds: [memo.id],
    tone,
    points,
    geometry,
    material,
    basePositions,
    velocity,
    seeds,
  };
}

function updateParticleVisual(visual, delta, now) {
  const memo = STATE.memos.find((item) => item.id === visual.memoIds[0]);
  if (!memo) return true;

  const ageMs = now - new Date(memo.createdAt).getTime();
  const duration = getEmotionAnimationDuration(memo);
  const progress = clamp(ageMs / duration, 0, 1);
  const positions = visual.geometry.attributes.position.array;

  for (let i = 0; i < visual.seeds.length; i += 1) {
    const stride = i * 3;
    const seed = visual.seeds[i];

    if (visual.tone === 'good') {
      positions[stride] = visual.basePositions[stride] + Math.sin(now * 0.0013 + seed) * 0.04;
      positions[stride + 1] = visual.basePositions[stride + 1] + Math.cos(now * 0.0011 + seed) * 0.06;
      positions[stride + 2] = visual.basePositions[stride + 2] + Math.sin(now * 0.0012 + seed * 0.7) * 0.04;
    } else {
      positions[stride] += visual.velocity[stride] * delta * 9;
      positions[stride + 1] += visual.velocity[stride + 1] * delta * 9;
      positions[stride + 2] += visual.velocity[stride + 2] * delta * 9;
    }
  }

  visual.geometry.attributes.position.needsUpdate = true;

  if (visual.tone === 'good') {
    visual.material.opacity = 0.9 * (1 - Math.max(0, progress - 0.72) / 0.28);
  } else {
    visual.material.opacity = 0.78 * (1 - progress);
  }

  if (progress >= 1) {
    STATE.scene.remove(visual.points);
    visual.geometry.dispose();
    visual.material.dispose();

    const handledIncrementally = createAndAttachEmotionRewardVisual(memo, memo.id);
    if (!handledIncrementally) {
      STATE.pendingVisualRebuild = true;
    } else {
      updateCounts();
      STATE.lastVisualSignature = buildVisualSignature();
    }

    return false;
  }

  return true;
}

function disposeVisuals() {
  hideMemoHover();

  STATE.visuals.forEach((visual) => {
    if (visual.kind === 'particles') {
      STATE.scene.remove(visual.points);
      visual.geometry.dispose();
      visual.material.dispose();
      return;
    }

    if (visual.hoverProxy) {
      STATE.scene.remove(visual.hoverProxy);
      visual.hoverProxy.geometry?.dispose?.();
      visual.hoverProxy.material?.dispose?.();
    }

    STATE.scene.remove(visual.object);
    if (visual.mixer) {
      STATE.mixers = STATE.mixers.filter((mixer) => mixer !== visual.mixer);
    }
  });

  STATE.visuals = [];
  STATE.mixers = [];
}

function disposeSingleVisual(visual) {
  if (!visual) return;

  if (visual.kind === 'particles') {
    STATE.scene.remove(visual.points);
    visual.geometry?.dispose?.();
    visual.material?.dispose?.();
    return;
  }

  if (visual.hoverProxy) {
    STATE.scene.remove(visual.hoverProxy);
    visual.hoverProxy.geometry?.dispose?.();
    visual.hoverProxy.material?.dispose?.();
  }

  STATE.scene.remove(visual.object);
  if (visual.mixer) {
    STATE.mixers = STATE.mixers.filter((mixer) => mixer !== visual.mixer);
  }
}

function removeVisualsForMemoId(memoId) {
  hideMemoHover();
  let removed = 0;

  STATE.visuals = STATE.visuals.filter((visual) => {
    const memoIds = Array.isArray(visual?.memoIds) ? visual.memoIds : [];
    if (!memoIds.includes(memoId)) return true;
    disposeSingleVisual(visual);
    removed += 1;
    return false;
  });

  return removed;
}

function partitionActiveMemosForLayout(now = Date.now()) {
  const clutterFresh = [];
  const clutterOld = [];
  const records = [];
  const routines = [];
  const snacks = [];
  const emotions = [];

  STATE.memos
    .filter((memo) => !memo.clearedAt)
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((memo) => {
      const ageDays = getAgeDays(memo.createdAt, now);

      if (memo.category === 'clutter') {
        if (ageDays >= CLUTTER_MERGE_DAYS) clutterOld.push(memo);
        else clutterFresh.push(memo);
        return;
      }

      if (memo.category === 'record') {
        records.push(memo);
        return;
      }

      if (memo.category === 'routine') {
        routines.push(memo);
        return;
      }

      if (memo.category === 'snack') {
        snacks.push(memo);
        return;
      }

      if (memo.category === 'emotion') {
        emotions.push(memo);
      }
    });

  return { clutterFresh, clutterOld, records, routines, snacks, emotions };
}

function buildOccupiedLayoutContextForCurrentMemos(now = Date.now()) {
  const partitioned = partitionActiveMemosForLayout(now);
  const occupied = {
    desk: [],
    chair: [],
    clutter: [],
    clothes: [],
    snack: [],
    recordFloor: [],
    deskInteractive: [],
    chairInteractive: [],
    floorInteractive: [],
  };

  const activeLayoutKeys = buildActiveLayoutKeys(partitioned);
  reservePlacementCaches(activeLayoutKeys, occupied);

  return {
    ...partitioned,
    occupied,
    deskNoteSlots: getDeskNoteSlots(),
    deskScribbleSlots: getDeskScribbleSlots(),
    chairOverflowSlots: getChairOverflowSlots(),
    recordFloorSlots: getRecordFloorSlots(),
    deskNoteCount: partitioned.records.reduce((count, memo) => {
      const cache = getLayoutCacheEntry(getRecordLayoutKey(memo));
      return count + (cache?.placement === 'desk' && cache?.assetKey !== 'scribble' ? 1 : 0);
    }, 0),
    deskScribbleCount: partitioned.records.reduce((count, memo) => {
      const cache = getLayoutCacheEntry(getRecordLayoutKey(memo));
      return count + (cache?.placement === 'desk' && cache?.assetKey === 'scribble' ? 1 : 0);
    }, 0),
  };
}

function createAndAttachRecordVisual(memo, animateMemoId = null) {
  if (!memo || memo.category !== 'record') return false;

  const now = Date.now();
  const context = buildOccupiedLayoutContextForCurrentMemos(now);
  const index = context.records.findIndex((item) => item.id === memo.id);
  if (index < 0) return false;

  const layoutKey = getRecordLayoutKey(memo);
  const cachedLayout = getLayoutCacheEntry(layoutKey);
  const useScribble = cachedLayout ? cachedLayout.assetKey === 'scribble' : (getMemoStableHash(memo, 'record-variant') % 3 === 2);
  const key = useScribble ? 'scribble' : 'note';
  const instance = createAssetInstance(key);
  const shouldPlayDropIntro = memo.id === animateMemoId && !cachedLayout;
  let deskNoteCount = context.deskNoteCount;
  let deskScribbleCount = context.deskScribbleCount;

  if (cachedLayout) {
    applyCachedTransform(instance.root, cachedLayout);

    if (cachedLayout.placement === 'desk' || cachedLayout.placement === 'chair') {
      applyObjectToPlacementSurface(instance.root, cachedLayout, cachedLayout.placement, key);
    } else {
      restObjectOnY(instance.root, 0.02);
      if (key === 'scribble') liftDeskObject(instance.root, 'scribble');
    }
  } else if (useScribble) {
    const surfacePlacement = pickDeskOrChairPlacement({
      assetKey: 'scribble',
      canUseDesk: deskScribbleCount < Math.min(1, context.deskScribbleSlots.length),
      deskSlots: context.deskScribbleSlots,
      chairSlots: context.chairOverflowSlots,
      occupied: context.occupied,
      deskMinDistance: 0.68,
      chairMinDistance: 0.58,
      seedOffset: getMemoStableSeedOffset(memo, 'seed-17', 9),
    });

    if (surfacePlacement) {
      const { slot, placement, area } = surfacePlacement;
      if (placement === 'desk') {
        deskScribbleCount += 1;
        context.occupied.desk.push({ x: slot.x, z: slot.z });
      } else {
        context.occupied.chair.push({ x: slot.x, z: slot.z });
      }

      instance.root.position.set(slot.x, 0, slot.z);
      instance.root.rotation.y = slot.rotY || 0;
      instance.root.rotation.z = slot.rotZ || 0;
      applyObjectToPlacementSurface(instance.root, slot, placement, 'scribble');
      syncLayoutCacheFromObject(layoutKey, instance.root, { area, placement, assetKey: 'scribble' });
    } else {
      const floorSlot = pickSlotFromPreferredSlots(RECORD_SECONDARY_SPREAD_SLOTS, context.recordFloorSlots, context.occupied.floorInteractive, 1.28, getMemoStableSeedOffset(memo, 'seed-21', 11));
      context.occupied.recordFloor.push({ x: floorSlot.x, z: floorSlot.z });
      instance.root.position.set(floorSlot.x, 0, floorSlot.z);
      instance.root.rotation.y = floorSlot.rotY || 0;
      instance.root.rotation.z = floorSlot.rotZ || 0;
      restObjectOnY(instance.root, 0.02);
      liftDeskObject(instance.root, 'scribble');
      syncLayoutCacheFromObject(layoutKey, instance.root, { area: 'floorInteractive', placement: 'floor', assetKey: 'scribble' });
    }
  } else {
    const surfacePlacement = pickDeskOrChairPlacement({
      assetKey: 'note',
      canUseDesk: deskNoteCount < Math.min(MAX_DESK_NOTE_COUNT, context.deskNoteSlots.length),
      deskSlots: context.deskNoteSlots,
      chairSlots: context.chairOverflowSlots,
      occupied: context.occupied,
      deskMinDistance: 0.76,
      chairMinDistance: 0.64,
      seedOffset: getMemoStableSeedOffset(memo, 'seed-19', 10),
    });

    if (surfacePlacement) {
      const { slot, placement, area } = surfacePlacement;
      if (placement === 'desk') {
        deskNoteCount += 1;
        context.occupied.desk.push({ x: slot.x, z: slot.z });
      } else {
        context.occupied.chair.push({ x: slot.x, z: slot.z });
      }

      instance.root.position.set(slot.x, 0, slot.z);
      instance.root.rotation.y = slot.rotY || 0;
      instance.root.rotation.z = slot.rotZ || 0;
      applyObjectToPlacementSurface(instance.root, slot, placement, 'note');
      syncLayoutCacheFromObject(layoutKey, instance.root, { area, placement, assetKey: 'note' });
    } else {
      const slot = pickSlot(context.recordFloorSlots, context.occupied.floorInteractive, 0.94, getMemoStableSeedOffset(memo, 'seed-19', 10));
      context.occupied.recordFloor.push({ x: slot.x, z: slot.z });
      instance.root.position.set(slot.x, 0, slot.z);
      instance.root.rotation.y = slot.rotY || 0;
      instance.root.rotation.z = slot.rotZ || 0;
      restObjectOnY(instance.root, 0.02);
      syncLayoutCacheFromObject(layoutKey, instance.root, { area: 'floorInteractive', placement: 'floor', assetKey: 'note' });
    }
  }

  const resolvedRecordLayout = getLayoutCacheEntry(layoutKey);
  const recordPlacement = resolvedRecordLayout?.placement || 'floor';
  const settledY = instance.root.position.y;

  if (recordPlacement === 'floor' && !cachedLayout) {
    ensureObjectStartsVisible(instance.root, FLOOR_RECORD_CLUTTER_VISIBLE_ZONE, FLOOR_VISIBILITY_NUDGES, FLOOR_RECORD_CLUTTER_CAMERA_VISIBILITY_BOUNDS);
  }

  const finalRecordExtra = {
    area: resolvedRecordLayout?.area || (recordPlacement === 'chair' ? 'chairInteractive' : recordPlacement === 'desk' ? 'deskInteractive' : 'floorInteractive'),
    placement: recordPlacement,
    assetKey: key,
  };
  syncLayoutCacheFromObject(layoutKey, instance.root, finalRecordExtra);
  bindObjectLayoutCache(instance.root, layoutKey, finalRecordExtra);
  tagMemoHoverTarget(instance.root, [memo.id]);
  STATE.scene.add(instance.root);
  const hoverProxy = createMemoHoverProxy(instance.root);

  if (instance.mixer) {
    STATE.mixers.push(instance.mixer);
  }

  if (instance.action && memo.id === animateMemoId) {
    instance.action.reset();
    instance.action.play();
  }

  STATE.visuals.push({
    kind: 'asset',
    memoIds: [memo.id],
    object: instance.root,
    mixer: instance.mixer,
    hoverProxy,
    dropIntro: buildSurfaceDropIntro(shouldPlayDropIntro, recordPlacement, settledY, now),
  });

  updateCounts();
  STATE.lastVisualSignature = buildVisualSignature();
  return true;
}


function createAndAttachClutterVisual(memo, animateMemoId = null) {
  if (!memo || memo.category !== 'clutter') return false;
  const now = Date.now();
  if (getAgeDays(memo.createdAt, now) >= CLUTTER_MERGE_DAYS) return false;

  const context = buildOccupiedLayoutContextForCurrentMemos(now);
  const index = context.clutterFresh.findIndex((item) => item.id === memo.id);
  if (index < 0) return false;

  const layoutKey = getClutterFreshLayoutKey(memo);
  const cachedLayout = getLayoutCacheEntry(layoutKey);
  const key = cachedLayout?.assetKey || (getMemoStableHash(memo, 'clutter-variant') % 2 === 0 ? 'paperSingle' : 'paperSingle2');
  const instance = createAssetInstance(key);
  const shouldPlayDropIntro = memo.id === animateMemoId;

  if (cachedLayout) {
    applyCachedTransform(instance.root, cachedLayout);
    if (cachedLayout.placement === 'desk' || cachedLayout.placement === 'chair') {
      applyObjectToPlacementSurface(instance.root, cachedLayout, cachedLayout.placement, 'note');
    } else {
      restObjectOnY(instance.root, 0.02);
    }
  } else {
    const deskOverflowPaperSlots = getDeskOverflowPaperSlots();
    const useDeskOverflow = shouldUseDeskPaperOverflow(context.occupied, deskOverflowPaperSlots, 0.64);
    const surfacePlacement = useDeskOverflow ? pickDeskOrChairPlacement({
      assetKey: 'note',
      canUseDesk: true,
      deskSlots: deskOverflowPaperSlots,
      chairSlots: context.chairOverflowSlots,
      occupied: context.occupied,
      deskMinDistance: 0.64,
      chairMinDistance: 0.58,
      seedOffset: getMemoStableSeedOffset(memo, 'seed-16', 8),
    }) : null;
    const slot = surfacePlacement
      ? surfacePlacement.slot
      : key === 'paperSingle2'
        ? pickSlotFromPreferredSlots(CLUTTER_SECONDARY_SPREAD_SLOTS, CLUTTER_SLOTS, context.occupied.clutter, EMOTION_DECAY_FLOOR_MIN_DISTANCE, getMemoStableSeedOffset(memo, 'seed-16', 8))
        : pickSlot(CLUTTER_SLOTS, context.occupied.clutter, EMOTION_FLOOR_MIN_DISTANCE, getMemoStableSeedOffset(memo, 'seed-16', 8));

    instance.root.position.set(slot.x, 0, slot.z);
    instance.root.rotation.y = slot.rotY || 0;
    instance.root.rotation.z = slot.rotZ || 0;

    if (surfacePlacement) {
      if (surfacePlacement.placement === 'desk') context.occupied.desk.push({ x: slot.x, z: slot.z });
      else context.occupied.chair.push({ x: slot.x, z: slot.z });
      applyObjectToPlacementSurface(instance.root, slot, surfacePlacement.placement, 'note');
      syncLayoutCacheFromObject(layoutKey, instance.root, { area: surfacePlacement.area, placement: surfacePlacement.placement, assetKey: key });
    } else {
      restObjectOnY(instance.root, 0.02);
      syncLayoutCacheFromObject(layoutKey, instance.root, { area: 'clutter', placement: 'floor', assetKey: key });
    }
  }

  const resolvedClutterLayout = getLayoutCacheEntry(layoutKey);
  const clutterPlacement = resolvedClutterLayout?.placement || 'floor';
  const clutterOnSurface = clutterPlacement === 'desk' || clutterPlacement === 'chair';
  const settledY = instance.root.position.y;
  const dropHeight = (!cachedLayout && !clutterOnSurface) ? getClutterDropHeightForSlot(resolvedClutterLayout) : 0;

  if (shouldPlayDropIntro && !cachedLayout && !clutterOnSurface) {
    instance.root.position.y = settledY + dropHeight;
  }

  if (!clutterOnSurface && !cachedLayout) {
    ensureObjectStartsVisible(instance.root, FLOOR_RECORD_CLUTTER_VISIBLE_ZONE, FLOOR_VISIBILITY_NUDGES, FLOOR_RECORD_CLUTTER_CAMERA_VISIBILITY_BOUNDS);
  }

  const finalClutterExtra = clutterOnSurface
    ? { area: resolvedClutterLayout?.area || 'deskInteractive', placement: clutterPlacement, assetKey: key }
    : { area: 'clutter', placement: 'floor', assetKey: key };
  syncLayoutCacheFromObject(layoutKey, instance.root, finalClutterExtra);
  bindObjectLayoutCache(instance.root, layoutKey, finalClutterExtra);
  tagMemoHoverTarget(instance.root, [memo.id]);
  STATE.scene.add(instance.root);
  const hoverProxy = createMemoHoverProxy(instance.root);

  STATE.visuals.push({
    kind: 'asset',
    memoIds: [memo.id],
    object: instance.root,
    mixer: null,
    hoverProxy,
    dropIntro: clutterOnSurface
      ? buildSurfaceDropIntro(shouldPlayDropIntro && !cachedLayout, clutterPlacement, settledY, now)
      : shouldPlayDropIntro && !cachedLayout
        ? { startedAt: now, duration: CLUTTER_DROP_MS, fromY: settledY + dropHeight, toY: settledY }
        : null,
  });

  updateCounts();
  STATE.lastVisualSignature = buildVisualSignature();
  return true;
}

function createAndAttachRoutineVisual(memo, animateMemoId = null) {
  if (!memo || memo.category !== 'routine') return false;
  const now = Date.now();
  const context = buildOccupiedLayoutContextForCurrentMemos(now);
  const index = context.routines.findIndex((item) => item.id === memo.id);
  if (index < 0) return false;

  const layoutKey = getRoutineLayoutKey(memo);
  const cachedLayout = getLayoutCacheEntry(layoutKey);
  const oldEnough = getAgeDays(memo.createdAt, now) >= ROUTINE_SCATTER_DAYS;
  const key = oldEnough ? 'clothesScattered' : 'clothesFolded';
  const instance = createAssetInstance(key);
  const shouldPlayDropIntro = memo.id === animateMemoId;

  if (cachedLayout) {
    applyCachedTransform(instance.root, cachedLayout);
    restObjectOnY(instance.root, 0.02);
  } else {
    const slot = pickSlot(getRoutineFloorSlots(), context.occupied.clothes, 1.05, getMemoStableSeedOffset(memo, 'seed-22', 12));
    instance.root.position.set(slot.x, 0, slot.z);
    instance.root.rotation.y = slot.rotY || 0;
    restObjectOnY(instance.root, 0.02);
    syncLayoutCacheFromObject(layoutKey, instance.root, { area: 'clothes' });
  }

  const settledY = instance.root.position.y;
  if (shouldPlayDropIntro && !cachedLayout) {
    instance.root.position.y = settledY + ROUTINE_DROP_HEIGHT;
  }

  if (!cachedLayout) ensureObjectStartsVisible(instance.root);
  const finalRoutineExtra = {
    area: 'clothes',
    placement: 'floor',
    assetKey: key,
  };
  syncLayoutCacheFromObject(layoutKey, instance.root, finalRoutineExtra);
  bindObjectLayoutCache(instance.root, layoutKey, finalRoutineExtra);
  tagMemoHoverTarget(instance.root, [memo.id]);
  STATE.scene.add(instance.root);
  const hoverProxy = createMemoHoverProxy(instance.root);

  STATE.visuals.push({
    kind: 'asset',
    memoIds: [memo.id],
    object: instance.root,
    mixer: null,
    hoverProxy,
    dropIntro: shouldPlayDropIntro && !cachedLayout
      ? {
          startedAt: now,
          duration: ROUTINE_DROP_MS,
          fromY: settledY + ROUTINE_DROP_HEIGHT,
          toY: settledY,
        }
      : null,
  });

  updateCounts();
  STATE.lastVisualSignature = buildVisualSignature();
  return true;
}

function createAndAttachSnackVisual(memo, animateMemoId = null) {
  if (!memo || memo.category !== 'snack') return false;
  const now = Date.now();
  const context = buildOccupiedLayoutContextForCurrentMemos(now);
  const index = context.snacks.findIndex((item) => item.id === memo.id && !item.fromEmotion);
  if (index < 0) return false;

  const layoutKey = getSnackLayoutKey(memo);
  const cachedLayout = getLayoutCacheEntry(layoutKey);
  const deskTumblerSlots = getDeskTumblerSlots();
  const maxDeskTumblerSlots = Math.min(MAX_DESK_TUMBLER_COUNT, deskTumblerSlots.length);
  const usedDeskTumblerSlotIndices = new Set();

  context.snacks.forEach((item) => {
    if (!item || item.id === memo.id || item.fromEmotion) return;
    const itemCache = getLayoutCacheEntry(getSnackLayoutKey(item));
    if (itemCache?.placement !== 'desk') return;
    if (!Number.isInteger(itemCache.slotIndex)) return;
    if (itemCache.slotIndex < 0 || itemCache.slotIndex >= maxDeskTumblerSlots) return;
    usedDeskTumblerSlotIndices.add(itemCache.slotIndex);
  });

  const hasValidCachedDeskSlotIndex = Number.isInteger(cachedLayout?.slotIndex)
    && cachedLayout.slotIndex >= 0
    && cachedLayout.slotIndex < maxDeskTumblerSlots
    && !usedDeskTumblerSlotIndices.has(cachedLayout.slotIndex);
  const usableCachedLayout = cachedLayout && cachedLayout.placement !== 'chair' ? cachedLayout : null;
  const instance = createAssetInstance('tumbler');
  const shouldPlayDropIntro = memo.id === animateMemoId && !(usableCachedLayout && usableCachedLayout.placement !== 'chair');

  if (usableCachedLayout?.placement === 'desk' && hasValidCachedDeskSlotIndex) {
    const slot = deskTumblerSlots[cachedLayout.slotIndex];
    usedDeskTumblerSlotIndices.add(cachedLayout.slotIndex);
    context.occupied.desk.push({ x: slot.x, z: slot.z });
    applyObjectToPlacementSurface(instance.root, slot, 'desk', 'tumbler');
    syncLayoutCacheFromObject(layoutKey, instance.root, {
      area: 'deskInteractive',
      placement: 'desk',
      assetKey: 'tumbler',
      slotIndex: cachedLayout.slotIndex,
    });
  } else {
    const nextDeskSlotIndex = Array.from({ length: maxDeskTumblerSlots }, (_, slotIndex) => slotIndex)
      .find((slotIndex) => !usedDeskTumblerSlotIndices.has(slotIndex));

    if (Number.isInteger(nextDeskSlotIndex)) {
      const slot = deskTumblerSlots[nextDeskSlotIndex];
      usedDeskTumblerSlotIndices.add(nextDeskSlotIndex);
      context.occupied.desk.push({ x: slot.x, z: slot.z });
      applyObjectToPlacementSurface(instance.root, slot, 'desk', 'tumbler');
      syncLayoutCacheFromObject(layoutKey, instance.root, {
        area: 'deskInteractive',
        placement: 'desk',
        assetKey: 'tumbler',
        slotIndex: nextDeskSlotIndex,
      });
    } else {
      const rawSlot = pickSlotFromPreferredSlots(FLOOR_TUMBLER_PREFERRED_SLOTS, context.recordFloorSlots, context.occupied.floorInteractive, FLOOR_TUMBLER_MIN_DISTANCE, getMemoStableSeedOffset(memo, 'seed-23', 12));
      const slot = getAdjustedFloorTumblerSlot(rawSlot);
      instance.root.position.set(slot.x, 0, slot.z);
      instance.root.rotation.y = slot.rotY || 0;
      instance.root.rotation.z = slot.rotZ || 0;
      restObjectOnY(instance.root, 0.02);
      ensureObjectStartsVisible(instance.root, FLOOR_RECORD_CLUTTER_VISIBLE_ZONE, FLOOR_VISIBILITY_NUDGES, FLOOR_RECORD_CLUTTER_CAMERA_VISIBILITY_BOUNDS);
      syncLayoutCacheFromObject(layoutKey, instance.root, {
        area: 'floorInteractive',
        placement: 'floor',
        assetKey: 'tumbler',
        slotIndex: null,
      });
    }
  }

  const resolvedSnackLayout = getLayoutCacheEntry(layoutKey);
  const snackPlacement = resolvedSnackLayout?.placement || 'floor';
  const settledY = instance.root.position.y;
  const tumblerDropIntro = snackPlacement === 'floor'
    ? (shouldPlayDropIntro
        ? {
            startedAt: now,
            duration: FLOOR_TUMBLER_DROP_MS,
            fromY: settledY + FLOOR_TUMBLER_DROP_HEIGHT,
            toY: settledY,
          }
        : null)
    : buildSurfaceDropIntro(shouldPlayDropIntro, snackPlacement, settledY, now);

  if (snackPlacement === 'floor' && !usableCachedLayout) {
    ensureObjectStartsVisible(instance.root, FLOOR_RECORD_CLUTTER_VISIBLE_ZONE, FLOOR_VISIBILITY_NUDGES, FLOOR_RECORD_CLUTTER_CAMERA_VISIBILITY_BOUNDS);
  }

  if (tumblerDropIntro) {
    instance.root.position.y = tumblerDropIntro.fromY;
  }

  const finalSnackExtra = {
    area: resolvedSnackLayout?.area || (snackPlacement === 'desk' ? 'deskInteractive' : 'floorInteractive'),
    placement: snackPlacement,
    assetKey: 'tumbler',
    slotIndex: Number.isInteger(resolvedSnackLayout?.slotIndex) ? resolvedSnackLayout.slotIndex : null,
  };
  syncLayoutCacheFromObject(layoutKey, instance.root, finalSnackExtra);
  bindObjectLayoutCache(instance.root, layoutKey, finalSnackExtra);
  tagMemoHoverTarget(instance.root, [memo.id]);
  STATE.scene.add(instance.root);
  const hoverProxy = createMemoHoverProxy(instance.root);

  STATE.visuals.push({
    kind: 'asset',
    memoIds: [memo.id],
    object: instance.root,
    mixer: null,
    hoverProxy,
    dropIntro: tumblerDropIntro,
  });

  updateCounts();
  STATE.lastVisualSignature = buildVisualSignature();
  return true;
}

function createAndAttachEmotionRewardVisual(memo, animateMemoId = null) {
  if (!memo || memo.category !== 'emotion' || memo.clearedAt) return false;

  const existingVisual = findVisualForMemoId(memo.id);
  if (existingVisual && existingVisual.kind === 'asset') {
    return true;
  }

  const now = Date.now();
  const ageMs = now - new Date(memo.createdAt).getTime();
  if (ageMs < getEmotionAnimationDuration(memo)) return false;

  const layoutKey = getEmotionRewardLayoutKey(memo);
  const cachedLayout = getLayoutCacheEntry(layoutKey);
  const rewardKey = getEmotionRewardAssetKey(memo);
  const instance = createAssetInstance(rewardKey);
  const shouldPlayDropIntro = !STATE.playedEmotionRewardDropMemoIds.has(memo.id) && !cachedLayout;
  const context = buildOccupiedLayoutContextForCurrentMemos(now);
  const deskEmotionRewardSlots = getDeskEmotionRewardSlots();
  const deskEmotionRewardLimit = Math.min(EMOTION_REWARD_DESK_LIMIT, deskEmotionRewardSlots.length);
  const usedDeskRewardSlotIndices = new Set();
  let deskEmotionRewardCount = 0;

  context.snacks.forEach((item) => {
    if (!item || !item.fromEmotion || item.id === memo.id) return;
    const itemCache = getLayoutCacheEntry(getEmotionRewardLayoutKey(item));
    if (itemCache?.placement !== 'desk') return;
    if (!Number.isInteger(itemCache.slotIndex)) return;
    if (itemCache.slotIndex < 0 || itemCache.slotIndex >= deskEmotionRewardLimit) return;
    usedDeskRewardSlotIndices.add(itemCache.slotIndex);
    deskEmotionRewardCount += 1;
  });

  if (cachedLayout) {
    instance.root.position.set(cachedLayout.x, 0, cachedLayout.z);
    instance.root.rotation.x = cachedLayout.rotX || 0;
    instance.root.rotation.y = cachedLayout.rotY || 0;
    instance.root.rotation.z = cachedLayout.rotZ || 0;

    if (cachedLayout.placement === 'desk' || cachedLayout.placement === 'chair') {
      applyObjectToPlacementSurface(instance.root, cachedLayout, cachedLayout.placement, rewardKey);
    } else {
      restObjectOnY(instance.root, 0.02);
      ensureObjectStartsVisible(instance.root, FLOOR_RECORD_CLUTTER_VISIBLE_ZONE, FLOOR_VISIBILITY_NUDGES, FLOOR_RECORD_CLUTTER_CAMERA_VISIBILITY_BOUNDS);
    }
  } else {
    const nextDeskSlotIndex = Array.from({ length: deskEmotionRewardLimit }, (_, slotIndex) => slotIndex)
      .find((slotIndex) => !usedDeskRewardSlotIndices.has(slotIndex));

    if (Number.isInteger(nextDeskSlotIndex)) {
      const slot = deskEmotionRewardSlots[nextDeskSlotIndex];
      applyObjectToPlacementSurface(instance.root, slot, 'desk', rewardKey);
      syncLayoutCacheFromObject(layoutKey, instance.root, {
        area: 'deskInteractive',
        placement: 'desk',
        assetKey: rewardKey,
        slotIndex: nextDeskSlotIndex,
      });
    } else {
      const slot = pickSlot(EMOTION_REWARD_SLOTS, context.occupied.floorInteractive, 2.18, context.snacks.length * 0.19);
      instance.root.position.set(slot.x, 0, slot.z);
      instance.root.rotation.x = slot.rotX || 0;
      instance.root.rotation.y = slot.rotY || 0;
      instance.root.rotation.z = slot.rotZ || 0;
      restObjectOnY(instance.root, 0.02);
      ensureObjectStartsVisible(instance.root, FLOOR_RECORD_CLUTTER_VISIBLE_ZONE, FLOOR_VISIBILITY_NUDGES, FLOOR_RECORD_CLUTTER_CAMERA_VISIBILITY_BOUNDS);
      syncLayoutCacheFromObject(layoutKey, instance.root, {
        area: 'floorInteractive',
        placement: 'floor',
        assetKey: rewardKey,
        slotIndex: null,
      });
    }
  }

  const resolvedRewardLayout = getLayoutCacheEntry(layoutKey);
  const rewardPlacement = resolvedRewardLayout?.placement || 'floor';
  const settledY = instance.root.position.y;

  if (shouldPlayDropIntro) {
    instance.root.position.y = settledY + EMOTION_REWARD_DROP_HEIGHT;
    STATE.playedEmotionRewardDropMemoIds.add(memo.id);
  }

  const finalRewardExtra = {
    area: resolvedRewardLayout?.area || (rewardPlacement === 'desk' ? 'deskInteractive' : rewardPlacement === 'chair' ? 'chairInteractive' : 'floorInteractive'),
    placement: rewardPlacement,
    assetKey: rewardKey,
    slotIndex: Number.isInteger(resolvedRewardLayout?.slotIndex) ? resolvedRewardLayout.slotIndex : null,
  };
  syncLayoutCacheFromObject(layoutKey, instance.root, finalRewardExtra);
  bindObjectLayoutCache(instance.root, layoutKey, finalRewardExtra);
  tagMemoHoverTarget(instance.root, [memo.id]);
  STATE.scene.add(instance.root);
  const hoverProxy = createMemoHoverProxy(instance.root);

  if (instance.mixer) {
    STATE.mixers.push(instance.mixer);
  }

  STATE.visuals.push({
    kind: 'asset',
    memoIds: [memo.id],
    object: instance.root,
    mixer: instance.mixer,
    hoverProxy,
    dropIntro: shouldPlayDropIntro
      ? {
          startedAt: now,
          duration: EMOTION_REWARD_DROP_MS,
          fromY: settledY + EMOTION_REWARD_DROP_HEIGHT,
          toY: settledY,
        }
      : null,
  });

  updateCounts();
  STATE.lastVisualSignature = buildVisualSignature();
  return true;
}

function createAndAttachEmotionVisual(memo, animateMemoId = null) {
  if (!memo || memo.category !== 'emotion' || memo.clearedAt) return false;

  const now = Date.now();
  const context = buildOccupiedLayoutContextForCurrentMemos(now);
  const index = context.emotions.findIndex((item) => item.id === memo.id);
  if (index < 0) return false;

  const layoutKey = getEmotionLayoutKey(memo);
  let cachedLayout = getLayoutCacheEntry(layoutKey);
  const key = getEmotionDecayAssetKey(memo, now);
  const instance = createAssetInstance(key);
  const shouldPlayDropIntro = memo.id === animateMemoId;

  if (cachedLayout?.placement === 'desk' && !isAllowedEmotionDeskLayout(cachedLayout)) {
    delete STATE.layoutCache[layoutKey];
    persistMemos();
    cachedLayout = null;
  }

  if (cachedLayout) {
    applyCachedTransform(instance.root, cachedLayout);

    if (cachedLayout.placement === 'desk' || cachedLayout.placement === 'chair') {
      applyObjectToPlacementSurface(instance.root, cachedLayout, cachedLayout.placement, key);
    } else {
      restObjectOnY(instance.root, 0.02);
    }
  } else {
    const deskEmotionSlots = getDeskEmotionSlots();
    const canUseDesk = deskEmotionSlots.length > 0 && context.occupied.desk.length < 1;
    const surfacePlacement = canUseDesk ? pickDeskOrChairPlacement({
      assetKey: 'note',
      canUseDesk: true,
      deskSlots: deskEmotionSlots,
      chairSlots: [],
      occupied: context.occupied,
      deskMinDistance: 0.72,
      chairMinDistance: 0.58,
      seedOffset: getMemoStableSeedOffset(memo, 'seed-16', 8),
    }) : null;
    const slot = surfacePlacement
      ? surfacePlacement.slot
      : key === 'strawberry' || key === 'jar'
        ? pickSlotFromPreferredSlots(CLUTTER_SECONDARY_SPREAD_SLOTS, CLUTTER_SLOTS, context.occupied.clutter, 0.98, getMemoStableSeedOffset(memo, 'seed-16', 8))
        : pickSlot(CLUTTER_SLOTS, context.occupied.clutter, 0.56, getMemoStableSeedOffset(memo, 'seed-16', 8));

    instance.root.position.set(slot.x, 0, slot.z);
    instance.root.rotation.y = slot.rotY || 0;
    instance.root.rotation.z = slot.rotZ || 0;

    if (surfacePlacement) {
      if (surfacePlacement.placement === 'desk') context.occupied.desk.push({ x: slot.x, z: slot.z });
      else context.occupied.chair.push({ x: slot.x, z: slot.z });
      applyObjectToPlacementSurface(instance.root, slot, surfacePlacement.placement, key);
      syncLayoutCacheFromObject(layoutKey, instance.root, { area: surfacePlacement.area, placement: surfacePlacement.placement, assetKey: key });
    } else {
      restObjectOnY(instance.root, 0.02);
      syncLayoutCacheFromObject(layoutKey, instance.root, { area: 'clutter', placement: 'floor', assetKey: key });
    }
  }

  const resolvedEmotionLayout = getLayoutCacheEntry(layoutKey);
  const emotionPlacement = resolvedEmotionLayout?.placement || 'floor';
  const emotionOnSurface = emotionPlacement === 'desk' || emotionPlacement === 'chair';
  const settledY = instance.root.position.y;
  const dropHeight = (!cachedLayout && !emotionOnSurface) ? getClutterDropHeightForSlot(resolvedEmotionLayout) : 0;

  if (shouldPlayDropIntro && !cachedLayout && !emotionOnSurface) {
    instance.root.position.y = settledY + dropHeight;
  }

  if (!emotionOnSurface && !cachedLayout) {
    ensureObjectStartsVisible(instance.root, FLOOR_RECORD_CLUTTER_VISIBLE_ZONE, FLOOR_VISIBILITY_NUDGES, FLOOR_RECORD_CLUTTER_CAMERA_VISIBILITY_BOUNDS);
  }

  const finalEmotionExtra = emotionOnSurface
    ? { area: resolvedEmotionLayout?.area || 'deskInteractive', placement: emotionPlacement, assetKey: key }
    : { area: 'clutter', placement: 'floor', assetKey: key };
  syncLayoutCacheFromObject(layoutKey, instance.root, finalEmotionExtra);
  bindObjectLayoutCache(instance.root, layoutKey, finalEmotionExtra);
  tagMemoHoverTarget(instance.root, [memo.id]);
  STATE.scene.add(instance.root);
  const hoverProxy = createMemoHoverProxy(instance.root);

  if (instance.mixer) {
    STATE.mixers.push(instance.mixer);
  }

  STATE.visuals.push({
    kind: 'asset',
    memoIds: [memo.id],
    object: instance.root,
    mixer: instance.mixer,
    hoverProxy,
    dropIntro: emotionOnSurface
      ? buildSurfaceDropIntro(shouldPlayDropIntro && !cachedLayout, emotionPlacement, settledY, now)
      : shouldPlayDropIntro && !cachedLayout
        ? { startedAt: now, duration: CLUTTER_DROP_MS, fromY: settledY + dropHeight, toY: settledY }
        : null,
  });

  updateCounts();
  STATE.lastVisualSignature = buildVisualSignature();
  return true;
}

function createAndAttachVisualForMemo(memo, animateMemoId = null) {
  if (!memo || memo.clearedAt) return false;
  switch (memo.category) {
    case 'record':
      return createAndAttachRecordVisual(memo, animateMemoId);
    case 'clutter':
      return createAndAttachClutterVisual(memo, animateMemoId);
    case 'routine':
      return createAndAttachRoutineVisual(memo, animateMemoId);
    case 'snack':
      return createAndAttachSnackVisual(memo, animateMemoId);
    case 'emotion':
      return createAndAttachEmotionVisual(memo, animateMemoId);
    default:
      return false;
  }
}

function findVisualForMemoId(memoId) {
  return STATE.visuals.find((visual) => Array.isArray(visual?.memoIds) && visual.memoIds.includes(memoId)) || null;
}

function removeLayoutCacheForMemo(memo) {
  if (!memo) return;

  if (memo.category === 'record') {
    delete STATE.layoutCache[getRecordLayoutKey(memo)];
    return;
  }

  if (memo.category === 'clutter') {
    if (getAgeDays(memo.createdAt, Date.now()) >= CLUTTER_MERGE_DAYS) {
      delete STATE.layoutCache[getClutterOldSingleLayoutKey(memo)];
    } else {
      delete STATE.layoutCache[getClutterFreshLayoutKey(memo)];
    }
    return;
  }

  if (memo.category === 'routine') {
    delete STATE.layoutCache[getRoutineLayoutKey(memo)];
    return;
  }

  if (memo.category === 'snack') {
    delete STATE.layoutCache[getSnackLayoutKey(memo)];
    return;
  }

  if (memo.category === 'emotion') {
    delete STATE.layoutCache[getEmotionLayoutKey(memo)];
    delete STATE.layoutCache[getEmotionRewardLayoutKey(memo)];
  }
}

function canRemoveMemoIncrementally(memo) {
  if (!memo) return false;
  const visual = findVisualForMemoId(memo.id);
  if (!visual) return true;
  return true;
}

function removeMemoVisualIncrementally(memo) {
  if (!memo || !canRemoveMemoIncrementally(memo)) return false;

  const visual = findVisualForMemoId(memo.id);
  const isSharedClutterPile = memo.category === 'clutter'
    && visual
    && Array.isArray(visual.memoIds)
    && visual.memoIds.length > 1;

  if (isSharedClutterPile) {
    visual.memoIds = visual.memoIds.filter((id) => id !== memo.id);
    updateVisualMemoHoverBinding(visual);
    updateCounts();
    STATE.lastVisualSignature = buildVisualSignature();
    return true;
  }

  removeLayoutCacheForMemo(memo);
  removeVisualsForMemoId(memo.id);
  updateCounts();
  STATE.lastVisualSignature = buildVisualSignature();
  return true;
}

function updateCounts() {
  if (UI.memoCount) UI.memoCount.textContent = `${STATE.memos.length}`;
  const activeVisualMemoIds = new Set();

  STATE.visuals.forEach((visual) => {
    visual.memoIds.forEach((id) => activeVisualMemoIds.add(id));
  });

  if (UI.activeVisualCount) UI.activeVisualCount.textContent = `${activeVisualMemoIds.size}`;
}

function renderHistory() {
  UI.historyList.innerHTML = '';

  if (!STATE.memos.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-card';
    empty.innerHTML = `<strong>비어 있음</strong>`;
    UI.historyList.appendChild(empty);
    updateCounts();
    return;
  }

  STATE.memos.forEach((memo) => {
    const card = document.createElement('article');
    card.className = 'log-card';
    card.dataset.category = memo.category;
    if (memo.emotionTone) card.dataset.tone = memo.emotionTone;

    const categoryLabel = CATEGORY_INFO[memo.category]?.label || memo.category;
    const emotionLabel = memo.category === 'emotion' ? ` · ${memo.emotionTone}` : '';
    const statusChip = memo.clearedAt
      ? '<span class="log-chip log-chip-success">정리</span>'
      : '<span class="log-chip log-chip-outline">활성</span>';

    card.innerHTML = `
      <div class="log-top">
        <div class="log-title-wrap">
          <strong class="log-title">${escapeHtml(categoryLabel + emotionLabel)}</strong>
          <div class="log-chip-row">
            ${statusChip}
            <span class="log-chip">${escapeHtml(formatDate(memo.createdAt))}</span>
          </div>
        </div>
      </div>
      <p class="log-text">${escapeHtml(memo.transcript)}</p>
      <div class="log-actions">
        ${memo.clearedAt ? '' : `<button type="button" class="log-btn" data-clear-id="${memo.id}">정리</button>`}
        <button type="button" class="log-btn danger" data-delete-id="${memo.id}">삭제</button>
      </div>
    `;

    UI.historyList.appendChild(card);
  });

  UI.historyList.querySelectorAll('[data-clear-id]').forEach((button) => {
    button.addEventListener('click', () => clearMemo(button.dataset.clearId));
  });

  UI.historyList.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => deleteMemo(button.dataset.deleteId));
  });

  updateCounts();
}

function clearMemo(memoId) {
  const memo = STATE.memos.find((item) => item.id === memoId);
  if (!memo) return;

  snapshotLiveVisualTransformsToLayoutCache();
  memo.clearedAt = new Date().toISOString();
  const handledIncrementally = removeMemoVisualIncrementally(memo);
  persistStorage();
  if (!handledIncrementally) {
    rebuildVisuals();
  }
  renderHistory();
  resetDeleteStreak();
}

function deleteMemo(memoId) {
  const targetMemo = STATE.memos.find((item) => item.id === memoId);
  if (!targetMemo) return;

  snapshotLiveVisualTransformsToLayoutCache();
  STATE.memos = STATE.memos.filter((item) => item.id !== memoId);
  const handledIncrementally = removeMemoVisualIncrementally(targetMemo);

  persistStorage();
  hideMemoHover();
  if (!handledIncrementally) {
    rebuildVisuals();
  }
  renderHistory();
  registerDeleteActionForEaster();
}

function describeVisualState(memo) {
  if (memo.clearedAt) {
    return `기록은 남아 있고 시각 상태는 정리됨 (${formatDate(memo.clearedAt)})`;
  }

  const ageDays = getAgeDays(memo.createdAt, Date.now());

  if (memo.category === 'emotion') {
    const key = getEmotionDecayAssetKey(memo);
    if (key === 'jar') return '7일 이상 확인되지 않아 strawberry가 jar 상태로 바뀌어 보여';
    if (key === 'burn') return '7일 이상 확인되지 않아 snack이 burn 상태로 바뀌어 보여';
    return '감정 오브젝트가 방 안에 그대로 남아 있어';
  }

  if (memo.category === 'record') {
    return '책상 위 note 또는 scribble note 오브젝트로 표시돼';
  }

  if (memo.category === 'clutter') {
    return ageDays >= CLUTTER_MERGE_DAYS
      ? '5일 이상 확인되지 않아 paper pile 상태로 합쳐져 보여'
      : '바닥 종이 상태로 보이는 중이야';
  }

  if (memo.category === 'routine') {
    return ageDays >= ROUTINE_SCATTER_DAYS
      ? '3일 이상 확인되지 않아 흩어진 옷 상태로 바뀌어 보여'
      : '정리된 옷 상태로 남아 있어';
  }

  if (memo.category === 'snack') {
    return '다짐이 텀블러 오브젝트로 책상 위 또는 바닥에 놓여 있어';
  }

  return '시각 상태 없음';
}

function tagMemoHoverTarget(object, memoIds) {
  object.userData.memoVisual = true;
  object.userData.memoIds = [...memoIds];
}

function findMemoHoverRoot(object) {
  if (object?.userData?.hoverOwner) return object.userData.hoverOwner;
  let current = object;
  while (current && current !== STATE.scene) {
    if (current.userData?.memoVisual) return current;
    current = current.parent;
  }
  return null;
}

function updateMemoHover() {
  return;
}

function showMemoHover() {
  return;
}

function hideMemoHover() {
  STATE.hoveredRoot = null;
  STATE.hoverDebouncePendingRoot = null;
  if (STATE.hoverDebounceTimer) {
    clearTimeout(STATE.hoverDebounceTimer);
    STATE.hoverDebounceTimer = null;
  }
}

function startLoop() {
  const frame = () => {
    const delta = Math.min(STATE.clock.getDelta(), 0.033);
    const now = Date.now();

    STATE.mixers.forEach((mixer) => mixer.update(delta));
    updateCamera(delta);

    STATE.visuals = STATE.visuals.filter((visual) => {
      if (visual.kind === 'particles') {
        return updateParticleVisual(visual, delta, now);
      }

      if (visual.kind === 'asset' && visual.dropIntro) {
        return updateAssetDropVisual(visual, now);
      }

      return true;
    });

    STATE.visuals.forEach((visual) => {
      if (visual.kind !== 'asset' || !visual.hoverProxy || !visual.object) return;
      syncHoverProxyBounds(visual.hoverProxy, visual.object);
    });

    if (STATE.pendingVisualRebuild) {
      STATE.pendingVisualRebuild = false;
      rebuildVisuals();
      renderHistory();
    }

    STATE.visualCheckElapsed += delta * 1000;
    if (STATE.visualCheckElapsed >= VISUAL_CHECK_MS) {
      STATE.visualCheckElapsed = 0;
      const nextSignature = buildVisualSignature();
      if (nextSignature !== STATE.lastVisualSignature) {
        rebuildVisuals();
        renderHistory();
      } else {
        updateCounts();
      }
    }

    STATE.renderer.render(STATE.scene, STATE.camera);
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

function buildVisualSignature() {
  return STATE.memos
    .map((memo) => {
      if (memo.clearedAt) return `${memo.id}:cleared`;
      const ageDays = getAgeDays(memo.createdAt, Date.now());

      if (memo.category === 'emotion') {
        return `${memo.id}:emotion-${getEmotionDecayAssetKey(memo, Date.now())}`;
      }

      if (memo.category === 'clutter') return `${memo.id}:clutter-${ageDays >= CLUTTER_MERGE_DAYS ? 'old' : 'fresh'}`;
      if (memo.category === 'routine') return `${memo.id}:routine-${ageDays >= ROUTINE_SCATTER_DAYS ? 'scattered' : 'folded'}`;
      return `${memo.id}:active`;
    })
    .join('|');
}

function updateCamera(delta) {
  const isMobile = (window.innerWidth || 768) < 768;
  if (isMobile) {
    const baseX = -0.2;
    const baseY = 6.8;
    STATE.camera.position.x = THREE.MathUtils.lerp(STATE.camera.position.x, baseX + STATE.pointer.x * 0.35, delta * 1.2);
    STATE.camera.position.y = THREE.MathUtils.lerp(STATE.camera.position.y, baseY + STATE.pointer.y * 0.18, delta * 1.2);
    STATE.camera.lookAt(-0.2, 0.8, -2.2);
  } else {
    const targetX = -0.55 + STATE.pointer.x * 0.22;
    const targetY = 5.1 + STATE.pointer.y * 0.12;
    STATE.camera.position.x = THREE.MathUtils.lerp(STATE.camera.position.x, targetX, delta * 1.5);
    STATE.camera.position.y = THREE.MathUtils.lerp(STATE.camera.position.y, targetY, delta * 1.5);
    STATE.camera.lookAt(-0.55, 1.35, -2.35);
  }
}

function onResize() {
  if (!STATE.camera || !STATE.renderer) return;
  const width = UI.sceneRoot.clientWidth || window.innerWidth;
  const height = UI.sceneRoot.clientHeight || window.innerHeight;
  const isMobile = width < 768;
  STATE.camera.fov = isMobile ? 58 : 43;
  STATE.camera.aspect = width / height;
  STATE.camera.updateProjectionMatrix();
  STATE.renderer.setSize(width, height);
  if (isMobile) {
    STATE.camera.position.set(-0.2, 6.8, 12.5);
  }
}

function onPointerMove(event) {
  if (!STATE.renderer) return;
  // When device tilt is active, don't let pointer events override the tilt-driven values
  if (STATE.useDeviceOrientation) return;
  const rect = STATE.renderer.domElement.getBoundingClientRect();
  STATE.pointer.x = ((((event.clientX - rect.left) / rect.width) * 2) - 1) * 0.9;
  STATE.pointer.y = ((-((event.clientY - rect.top) / rect.height) * 2) + 1) * 0.9;
  STATE.pointerClient.x = event.clientX;
  STATE.pointerClient.y = event.clientY;
}

function onScenePointerDown(event) {
  if (!STATE.camera || !STATE.renderer) return;
  if (STATE.detailMemoIds) { closeDetailPanel(); return; }
  if (!UI.entryPanel.classList.contains('hidden') || !UI.historyPanel.classList.contains('hidden')) return;

  const rect = STATE.renderer.domElement.getBoundingClientRect();
  const px = (((event.clientX - rect.left) / rect.width) * 2) - 1;
  const py = -(((event.clientY - rect.top) / rect.height) * 2) + 1;
  const clickPointer = new THREE.Vector2(px, py);

  const clickRaycaster = new THREE.Raycaster();
  clickRaycaster.setFromCamera(clickPointer, STATE.camera);

  const interactiveRoots = [];
  STATE.visuals.forEach((visual) => {
    if (visual.kind !== 'asset') return;
    if (visual.hoverProxy) interactiveRoots.push(visual.hoverProxy);
    else if (visual.object) interactiveRoots.push(visual.object);
  });

  const hits = clickRaycaster.intersectObjects(interactiveRoots, true);
  const firstMemoHit = hits.find((hit) => findMemoHoverRoot(hit.object));
  if (!firstMemoHit) return;

  const root = findMemoHoverRoot(firstMemoHit.object);
  if (!root || !root.userData.memoIds || !root.userData.memoIds.length) return;

  hideMemoHover();
  openDetailPanel(root.userData.memoIds);
}

function openDetailPanel(memoIds) {
  if (!UI.memoDetailPanel || !memoIds || !memoIds.length) return;

  STATE.detailMemoIds = [...memoIds];
  const memos = memoIds
    .map((id) => STATE.memos.find((m) => m.id === id))
    .filter(Boolean);
  if (!memos.length) { closeDetailPanel(); return; }

  const firstMemo = memos[0];
  const categoryLabel = CATEGORY_INFO[firstMemo.category]?.label || firstMemo.category;
  const toneStr = firstMemo.category === 'emotion' ? ` · ${firstMemo.emotionTone}` : '';

  UI.memoDetailLabel.textContent = categoryLabel + toneStr;
  UI.memoDetailDate.textContent = formatDate(firstMemo.createdAt);

  if (UI.memoDetailDelete) {
    UI.memoDetailDelete.hidden = true;
    UI.memoDetailDelete.disabled = true;
    UI.memoDetailDelete.setAttribute('aria-hidden', 'true');
  }

  if (memos.length === 1) {
    UI.memoDetailText.textContent = firstMemo.transcript || '내용 없음';
  } else {
    UI.memoDetailText.textContent = memos
      .map((m, i) => `${i + 1}. ${m.transcript?.trim() || '내용 없음'}`)
      .join('\n');
  }

  const anyActive = memos.some((m) => !m.clearedAt);
  UI.memoDetailClear.style.display = anyActive ? '' : 'none';

  UI.memoDetailPanel.classList.remove('hidden');
  UI.memoDetailPanel.classList.add('visible');
}

function closeDetailPanel() {
  STATE.detailMemoIds = null;
  if (!UI.memoDetailPanel) return;
  UI.memoDetailPanel.classList.add('hidden');
  UI.memoDetailPanel.classList.remove('visible');
}

function getFloorOnlyScaleMultiplier(assetKey) {
  return FLOOR_ONLY_SCALE_MULTIPLIERS[assetKey] || 1;
}

function applyFloorOnlyScaleIfNeeded(object, targetY) {
  if (!object || targetY > 0.05) return;

  const assetKey = object.userData?.assetKey;
  if (!assetKey || assetKey === 'desk') return;

  const scaleMultiplier = getFloorOnlyScaleMultiplier(assetKey);
  if (!Number.isFinite(scaleMultiplier) || Math.abs(scaleMultiplier - 1) < 0.001) return;

  const appliedMultiplier = Number.isFinite(object.userData?.floorScaleApplied)
    ? object.userData.floorScaleApplied
    : 1;

  if (Math.abs(appliedMultiplier - scaleMultiplier) < 0.001) return;

  if (appliedMultiplier !== 1) {
    object.scale.multiplyScalar(1 / appliedMultiplier);
  }

  object.scale.multiplyScalar(scaleMultiplier);
  object.userData.floorScaleApplied = scaleMultiplier;
  object.updateMatrixWorld(true);
}

function restObjectOnY(object, targetY) {
  applyFloorOnlyScaleIfNeeded(object, targetY);
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  if (!Number.isFinite(box.min.y)) return;
  object.position.y += targetY - box.min.y;
  object.updateMatrixWorld(true);
}

function liftDeskObject(object, key) {
  const extraY = DESK_ASSET_Y_OFFSET[key] || 0;
  if (!extraY) return;
  object.position.y += extraY;
  object.updateMatrixWorld(true);
}

function getEmotionAnimationDuration(memo) {
  return memo?.emotionTone === 'good' ? POSITIVE_EMOTION_VISIBLE_MS : NEGATIVE_EMOTION_VISIBLE_MS;
}

function getAgeDays(isoString, nowMs = Date.now()) {
  return (nowMs - new Date(isoString).getTime()) / (1000 * 60 * 60 * 24);
}

function setMicBadge(kind, text) {
  UI.micBadge.className = `mic-badge ${kind}`;
  UI.micBadge.textContent = text;
}

function sanitizeStoredMemo(item) {
  if (!item || !item.id || !item.createdAt || !item.category) return null;

  return {
    id: item.id,
    category: item.category,
    emotionTone: item.emotionTone || null,
    transcript: item.transcript || '',
    createdAt: item.createdAt,
    clearedAt: item.clearedAt || null,
  };
}

function serializeLayoutCache() {
  const next = {};

  Object.entries(STATE.layoutCache || {}).forEach(([key, entry]) => {
    if (!entry) return;
    if (!Number.isFinite(entry.x) || !Number.isFinite(entry.z)) return;

    const serializedEntry = {
      x: entry.x,
      z: entry.z,
      rotX: Number.isFinite(entry.rotX) ? entry.rotX : 0,
      rotY: Number.isFinite(entry.rotY) ? entry.rotY : 0,
      rotZ: Number.isFinite(entry.rotZ) ? entry.rotZ : 0,
      area: entry.area || null,
      placement: entry.placement || null,
      assetKey: entry.assetKey || null,
      slotIndex: Number.isInteger(entry.slotIndex) ? entry.slotIndex : null,
      transformLocked: entry.transformLocked !== false,
      slotMigrationVersion: entry.slotMigrationVersion || LAYOUT_CACHE_SLOT_MIGRATION_VERSION,
    };

    next[key] = serializedEntry;
  });

  return next;
}

function shouldMigrateCachedNonDeskLayout(entry) {
  if (!entry) return false;
  if (entry.placement === 'desk' || entry.placement === 'chair') return false;
  return entry.area === 'floorInteractive'
    || entry.area === 'clutter'
    || entry.area === 'clothes'
    || entry.area === 'recordFloor';
}

function shouldTightenCachedRightSideRange(entry) {
  return shouldMigrateCachedNonDeskLayout(entry)
    && Number.isFinite(entry.x)
    && entry.x >= RIGHT_SIDE_RANGE_TIGHTEN_START_X;
}

function shouldInsetCachedFloorTumblerRightSide(entry) {
  return entry?.assetKey === 'tumbler'
    && entry?.placement === 'floor'
    && entry?.area === 'floorInteractive'
    && Number.isFinite(entry.x)
    && entry.x >= FLOOR_TUMBLER_RIGHT_INSET_MIN_X;
}

function pullValueTowardZero(value, amount) {
  if (!Number.isFinite(value) || !Number.isFinite(amount) || amount <= 0) return value;
  if (Math.abs(value) <= amount) return 0;
  return value > 0 ? value - amount : value + amount;
}

function shouldCenterPullFloorTumbler(entry) {
  return entry?.assetKey === 'tumbler'
    && entry?.placement === 'floor'
    && entry?.area === 'floorInteractive'
    && Number.isFinite(entry.x);
}

function shouldInsetBottomRightFloorTumblerTarget(target) {
  return Number.isFinite(target?.x)
    && Number.isFinite(target?.z)
    && target.x >= FLOOR_TUMBLER_BOTTOM_RIGHT_EXTRA_MIN_X
    && target.z >= FLOOR_TUMBLER_BOTTOM_RIGHT_EXTRA_MIN_Z;
}

function shouldHardInsetFarRightFloorTumblerTarget(target) {
  return Number.isFinite(target?.x)
    && target.x >= FLOOR_TUMBLER_FAR_RIGHT_HARD_MIN_X;
}

function getAdjustedFloorTumblerSlot(slot) {
  if (!slot) return slot;

  const originalX = Number.isFinite(slot.x) ? slot.x : null;
  const adjustedSlot = {
    ...slot,
    x: Number.isFinite(slot.x) ? pullValueTowardZero(slot.x, FLOOR_TUMBLER_CENTER_PULL_X) : slot.x,
  };

  if (Number.isFinite(originalX) && originalX >= FLOOR_TUMBLER_RIGHT_INSET_MIN_X) {
    adjustedSlot.x += FLOOR_TUMBLER_RIGHT_INSET_X;
  }

  if (shouldInsetBottomRightFloorTumblerTarget(adjustedSlot)) {
    adjustedSlot.x += FLOOR_TUMBLER_BOTTOM_RIGHT_EXTRA_INSET_X;
  }

  if (shouldHardInsetFarRightFloorTumblerTarget(adjustedSlot)) {
    adjustedSlot.x += FLOOR_TUMBLER_FAR_RIGHT_HARD_INSET_X;
  }

  return adjustedSlot;
}

function migrateCachedLayoutEntry(entry) {
  if (!entry || entry.slotMigrationVersion === LAYOUT_CACHE_SLOT_MIGRATION_VERSION) return entry;

  const isFromPreviousSlotVersion = entry.slotMigrationVersion === PREVIOUS_LAYOUT_CACHE_SLOT_MIGRATION_VERSION;

  if (!entry.slotMigrationVersion) {
    if (shouldMigrateCachedNonDeskLayout(entry) && Number.isFinite(entry.x)) {
      entry.x += NON_DESK_SLOT_BAKED_X_SHIFT;
    }

    if (shouldTightenCachedRightSideRange(entry)) {
      entry.x += RIGHT_SIDE_RANGE_TIGHTEN_X;
      if (entry.x >= RIGHT_SIDE_RANGE_TIGHTEN_EXTRA_START_X) {
        entry.x += RIGHT_SIDE_RANGE_TIGHTEN_EXTRA_X;
      }
    }

    if (shouldInsetCachedFloorTumblerRightSide(entry)) {
      entry.x += FLOOR_TUMBLER_RIGHT_INSET_X;
    }

    if (shouldInsetBottomRightFloorTumblerTarget(entry)) {
      entry.x += FLOOR_TUMBLER_BOTTOM_RIGHT_EXTRA_INSET_X;
    }

    if (shouldHardInsetFarRightFloorTumblerTarget(entry)) {
      entry.x += FLOOR_TUMBLER_FAR_RIGHT_HARD_INSET_X;
    }
  }

  if ((!entry.slotMigrationVersion || isFromPreviousSlotVersion) && shouldCenterPullFloorTumbler(entry)) {
    entry.x = pullValueTowardZero(entry.x, FLOOR_TUMBLER_CENTER_PULL_X);
  }

  entry.slotMigrationVersion = LAYOUT_CACHE_SLOT_MIGRATION_VERSION;
  return entry;
}

function hydrateLayoutCache(rawLayoutCache) {
  const next = Object.create(null);
  if (!rawLayoutCache || typeof rawLayoutCache !== 'object') return next;

  Object.entries(rawLayoutCache).forEach(([key, entry]) => {
    if (!entry || !Number.isFinite(entry.x) || !Number.isFinite(entry.z)) return;

    const hydratedEntry = {
      x: entry.x,
      z: entry.z,
      rotX: Number.isFinite(entry.rotX) ? entry.rotX : 0,
      rotY: Number.isFinite(entry.rotY) ? entry.rotY : 0,
      rotZ: Number.isFinite(entry.rotZ) ? entry.rotZ : 0,
      area: entry.area || null,
      placement: entry.placement || null,
      assetKey: entry.assetKey || null,
      slotIndex: Number.isInteger(entry.slotIndex) ? entry.slotIndex : null,
      transformLocked: entry.transformLocked !== false,
      slotMigrationVersion: entry.slotMigrationVersion || null,
    };

    migrateCachedLayoutEntry(hydratedEntry);

    if (!('transformLocked' in hydratedEntry)) {
      hydratedEntry.transformLocked = false;
    }

    next[key] = hydratedEntry;
  });

  return next;
}

function persistStorage() {
  const payload = {
    version: STORAGE_PAYLOAD_VERSION,
    memos: STATE.memos,
    layoutCache: serializeLayoutCache(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (Array.isArray(parsed)) {
      STATE.memos = parsed
        .map((item) => sanitizeStoredMemo(item))
        .filter(Boolean);
      STATE.layoutCache = Object.create(null);
      return;
    }

    const memoList = Array.isArray(parsed?.memos) ? parsed.memos : [];
    STATE.memos = memoList
      .map((item) => sanitizeStoredMemo(item))
      .filter(Boolean);
    STATE.layoutCache = hydrateLayoutCache(parsed?.layoutCache);
  } catch (error) {
    console.warn('Failed to load local storage.', error);
    STATE.memos = [];
    STATE.layoutCache = Object.create(null);
  }
}

function seedPlayedEmotionRewardDropsFromExistingMemos(nowMs = Date.now()) {
  STATE.memos.forEach((memo) => {
    if (!memo || memo.clearedAt || memo.category !== 'emotion') return;
    const ageMs = nowMs - new Date(memo.createdAt).getTime();
    if (ageMs >= getEmotionAnimationDuration(memo)) {
      STATE.playedEmotionRewardDropMemoIds.add(memo.id);
    }
  });
}

function formatDate(isoString) {
  const date = new Date(isoString);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function distance2D(ax, az, bx, bz) {
  const dx = ax - bx;
  const dz = az - bz;
  return Math.sqrt(dx * dx + dz * dz);
}

function isTooCloseToAnyOccupied(x, z, occupied, minDist) {
  const lists = [
    occupied.clutter,
    occupied.floorInteractive,
    occupied.snack,
    occupied.clothes,
  ].filter(Boolean);
  for (const list of lists) {
    for (const p of list) {
      if (distance2D(x, z, p.x, p.z) < minDist) return true;
    }
  }
  return false;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function createDeskFallback() {
  const group = new THREE.Group();

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 0.16, 1.7),
    new THREE.MeshStandardMaterial({ color: 0x6f4d37, roughness: 0.8 })
  );
  top.position.set(0, 1.48, 0);
  group.add(top);

  const drawer = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.9, 1.45),
    new THREE.MeshStandardMaterial({ color: 0x5b3d2c, roughness: 0.82 })
  );
  drawer.position.set(-1.15, 0.85, 0);
  group.add(drawer);

  const side = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 1.4, 1.45),
    new THREE.MeshStandardMaterial({ color: 0x593c2b, roughness: 0.82 })
  );
  side.position.set(1.55, 0.72, 0);
  group.add(side);

  const legGeo = new THREE.BoxGeometry(0.16, 1.42, 0.16);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x56382a, roughness: 0.82 });

  [
    [-1.72, 0.71, -0.72],
    [-1.72, 0.71, 0.72],
    [1.72, 0.71, -0.72],
    [1.72, 0.71, 0.72],
  ].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    group.add(leg);
  });

  return group;
}

function createNoteFallback() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.08, 0.52),
    new THREE.MeshStandardMaterial({ color: 0xe8ecf6, roughness: 0.96 })
  );
  group.add(base);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.09, 0.52),
    new THREE.MeshStandardMaterial({ color: 0xbfcde7, roughness: 0.9 })
  );
  stripe.position.x = -0.26;
  group.add(stripe);

  return group;
}

function createScribbleFallback() {
  const group = new THREE.Group();
  const page = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.05, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xf2eee5, roughness: 0.98 })
  );
  group.add(page);

  const mark = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.06, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 })
  );
  mark.position.set(0, 0.01, 0.04);
  group.add(mark);

  return group;
}

function createClothesFoldedFallback() {
  const group = new THREE.Group();
  const colors = [0x8a7f9b, 0xcaaea0, 0x8ea4bd];

  colors.forEach((color, index) => {
    const fold = new THREE.Mesh(
      new THREE.BoxGeometry(0.88 - index * 0.1, 0.12, 0.58),
      new THREE.MeshStandardMaterial({ color, roughness: 0.98 })
    );
    fold.position.set(0, index * 0.08, (index - 1) * 0.02);
    group.add(fold);
  });

  return group;
}

function createClothesScatteredFallback() {
  const group = new THREE.Group();
  const colors = [0x778da6, 0xd0b2a2, 0x9287a0];

  colors.forEach((color, index) => {
    const cloth = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.08, 0.56),
      new THREE.MeshStandardMaterial({ color, roughness: 0.98 })
    );
    cloth.rotation.set(0.02 * index, index * 0.45, 0.22 - index * 0.12);
    cloth.position.set((index - 1) * 0.26, index * 0.03, index * 0.11);
    group.add(cloth);
  });

  return group;
}

function createPaperFallback(color) {
  const page = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.02, 0.54),
    new THREE.MeshStandardMaterial({ color, roughness: 0.99 })
  );
  return page;
}

function createPaperPileFallback() {
  const group = new THREE.Group();
  const colors = [0xe9e0d2, 0xddd5c8, 0xd7cddd, 0xe3d9cb, 0xebe2d7];

  colors.forEach((color, index) => {
    const page = new THREE.Mesh(
      new THREE.BoxGeometry(0.88 - index * 0.03, 0.025, 0.6 - index * 0.02),
      new THREE.MeshStandardMaterial({ color, roughness: 0.99 })
    );
    page.position.set((index - 2) * 0.02, index * 0.02, (index - 2) * 0.012);
    page.rotation.y = (index - 2) * 0.06;
    group.add(page);
  });

  return group;
}

function createSnackFallback() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.84, 0.28),
    new THREE.MeshStandardMaterial({ color: 0xf0b34a, roughness: 0.74 })
  );
  body.rotation.z = -0.08;
  group.add(body);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.18, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xdb5538, roughness: 0.7 })
  );
  stripe.position.y = 0.12;
  stripe.rotation.z = -0.08;
  group.add(stripe);

  return group;
}

function createStrawberryFallback() {
  const group = new THREE.Group();

  const berry = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0xd84b5c, roughness: 0.64, metalness: 0.02 })
  );
  berry.scale.set(0.9, 1.08, 0.9);
  berry.position.y = 0.34;
  group.add(berry);

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.16, 6),
    new THREE.MeshStandardMaterial({ color: 0x4e8a48, roughness: 0.84 })
  );
  leaves.position.y = 0.67;
  leaves.rotation.y = Math.PI / 6;
  group.add(leaves);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8),
    new THREE.MeshStandardMaterial({ color: 0x5d8f42, roughness: 0.84 })
  );
  stem.position.y = 0.76;
  group.add(stem);

  return group;
}

function createJarFallback() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.3, 0.72, 24),
    new THREE.MeshStandardMaterial({
      color: 0xe7d8c6,
      roughness: 0.26,
      metalness: 0.06,
      transparent: true,
      opacity: 0.72,
    })
  );
  body.position.y = 0.36;
  group.add(body);

  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.1, 24),
    new THREE.MeshStandardMaterial({ color: 0xc7b099, roughness: 0.6 })
  );
  lid.position.y = 0.74;
  group.add(lid);

  return group;
}

function createBurnFallback() {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.3, 0.12, 18),
    new THREE.MeshStandardMaterial({ color: 0x3a312e, roughness: 0.92 })
  );
  base.position.y = 0.06;
  group.add(base);

  const ember = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.42, 12),
    new THREE.MeshStandardMaterial({ color: 0x9b4d2d, roughness: 0.78, emissive: 0x4a1608, emissiveIntensity: 0.35 })
  );
  ember.position.y = 0.29;
  ember.rotation.z = 0.08;
  group.add(ember);

  return group;
}

function createTumblerFallback() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.28, 0.78, 24),
    new THREE.MeshStandardMaterial({
      color: 0xdbc5a7,
      roughness: 0.36,
      metalness: 0.08,
      transparent: true,
      opacity: 0.92,
    })
  );
  body.position.y = 0.39;
  group.add(body);

  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.08, 24),
    new THREE.MeshStandardMaterial({ color: 0x8d6752, roughness: 0.6, metalness: 0.1 })
  );
  lid.position.y = 0.8;
  group.add(lid);

  return group;
}
