/* ═══════════════════════════════════════════════════════════════
   멤모하기 main.js — Upgrade Patch v2
   
   이 파일의 각 섹션을 원본 main.js에 적용하세요.
   각 변경사항은 [FIND] → [REPLACE] 형태로 정리되어 있습니다.
   ═══════════════════════════════════════════════════════════════ */


// ═══════════════════════════════════════════════════════════════
// PATCH 1: 텀블러 크기 일관성 — 바닥에서 커지지 않도록
// ═══════════════════════════════════════════════════════════════

// [FIND] TARGET_MAX_DIMENSION 객체에서 tumbler 값 변경:
//   tumbler: 1.18,
// [REPLACE WITH]:
//   tumbler: 1.72,

// [FIND] FLOOR_ONLY_SCALE_MULTIPLIERS 에서 tumbler 행 제거:
//   tumbler: 1.5,
// [REPLACE WITH]:
//   (해당 줄 삭제)


// ═══════════════════════════════════════════════════════════════
// PATCH 2: 물리 엔진 튜닝 — 더 부드러운 움직임
// ═══════════════════════════════════════════════════════════════

// [FIND]:
//   const PHYSICS_FRICTION_RECENT = 0.992;
// [REPLACE WITH]:
//   const PHYSICS_FRICTION_RECENT = 0.994;

// [FIND]:
//   const PHYSICS_TILT_SMOOTHING = 0.22;
// [REPLACE WITH]:
//   const PHYSICS_TILT_SMOOTHING = 0.18;

// [FIND]:
//   const PHYSICS_REST_THRESHOLD = 0.0008;
// [REPLACE WITH]:
//   const PHYSICS_REST_THRESHOLD = 0.0006;

// [FIND]:
//   const PHYSICS_THROW_MULTIPLIER = 0.032;
// [REPLACE WITH]:
//   const PHYSICS_THROW_MULTIPLIER = 0.028;

// [FIND]:
//   const PHYSICS_BOUNCE_FACTOR = 0.45;
// [REPLACE WITH]:
//   const PHYSICS_BOUNCE_FACTOR = 0.38;

// [FIND]:
//   const PHYSICS_SEPARATION_FORCE = 0.03;
// [REPLACE WITH]:
//   const PHYSICS_SEPARATION_FORCE = 0.025;

// [FIND]:
//   const DRAG_LERP = 0.55;
// [REPLACE WITH]:
//   const DRAG_LERP = 0.42;

// [FIND]:
//   const PHYSICS_AIR_GRAVITY = 0.018;
// [REPLACE WITH]:
//   const PHYSICS_AIR_GRAVITY = 0.016;

// [FIND]:
//   const PHYSICS_THROW_UPWARD = 0.14;
// [REPLACE WITH]:
//   const PHYSICS_THROW_UPWARD = 0.12;

// [FIND]:
//   const PHYSICS_DESK_EDGE_FALL_SPEED = -0.035;
// [REPLACE WITH]:
//   const PHYSICS_DESK_EDGE_FALL_SPEED = -0.028;

// [FIND]:
//   const VELOCITY_HISTORY_SIZE = 6;
// [REPLACE WITH]:
//   const VELOCITY_HISTORY_SIZE = 8;


// ═══════════════════════════════════════════════════════════════
// PATCH 3: 드롭 애니메이션 — 스프링 바운스 이징
// ═══════════════════════════════════════════════════════════════

// [FIND] updateAssetDropVisual 함수 전체를 아래로 교체:

function updateAssetDropVisual(visual, now) {
  if (!visual.dropIntro || !visual.object) return true;

  const intro = visual.dropIntro;
  const rawProgress = clamp((now - intro.startedAt) / intro.duration, 0, 1);

  // Spring-bounce easing for natural feel
  const springEased = rawProgress < 1
    ? 1 - Math.pow(2, -10 * rawProgress) * Math.cos((rawProgress * 10 - 0.75) * ((2 * Math.PI) / 3))
    : 1;

  const progress = clamp(springEased, 0, 1.08);

  visual.object.position.y = THREE.MathUtils.lerp(intro.fromY, intro.toY, Math.min(progress, 1));
  visual.object.updateMatrixWorld(true);

  if (rawProgress >= 1) {
    visual.object.position.y = intro.toY;
    visual.object.updateMatrixWorld(true);
    visual.dropIntro = null;
  }

  return true;
}


// ═══════════════════════════════════════════════════════════════
// PATCH 4: 카메라 움직임 — 더 부드러운 패럴랙스
// ═══════════════════════════════════════════════════════════════

// [FIND] updateCamera 함수 전체를 아래로 교체:

function updateCamera(delta) {
  const isMobile = (window.innerWidth || 768) < 768;
  const smoothFactor = 1 - Math.pow(0.08, delta); // frame-rate independent smoothing

  if (isMobile) {
    const baseX = -0.2;
    const baseY = 7.2;
    const targetX = baseX + STATE.pointer.x * 0.08;
    const targetY = baseY + STATE.pointer.y * 0.04;
    STATE.camera.position.x += (targetX - STATE.camera.position.x) * smoothFactor;
    STATE.camera.position.y += (targetY - STATE.camera.position.y) * smoothFactor;
    STATE.camera.lookAt(-0.2, 1.0, -2.2);
  } else {
    const targetX = -0.55 + STATE.pointer.x * 0.18;
    const targetY = 5.1 + STATE.pointer.y * 0.1;
    STATE.camera.position.x += (targetX - STATE.camera.position.x) * smoothFactor;
    STATE.camera.position.y += (targetY - STATE.camera.position.y) * smoothFactor;
    STATE.camera.lookAt(-0.55, 1.35, -2.35);
  }
}


// ═══════════════════════════════════════════════════════════════
// PATCH 5: 파티클 시스템 — 더 풍부한 이펙트
// ═══════════════════════════════════════════════════════════════

// [FIND] createEmotionParticleSystem 함수에서 count 값 변경:
//   const count = tone === 'good' ? 84 : 70;
// [REPLACE WITH]:
//   const count = tone === 'good' ? 120 : 96;

// [FIND] 파티클 size 변경:
//   size: tone === 'good' ? 0.13 : 0.1,
// [REPLACE WITH]:
//   size: tone === 'good' ? 0.11 : 0.08,

// [FIND] updateParticleVisual에서 good 파티클 움직임 변경:
//       positions[stride] = visual.basePositions[stride] + Math.sin(now * 0.0013 + seed) * 0.04;
//       positions[stride + 1] = visual.basePositions[stride + 1] + Math.cos(now * 0.0011 + seed) * 0.06;
//       positions[stride + 2] = visual.basePositions[stride + 2] + Math.sin(now * 0.0012 + seed * 0.7) * 0.04;
// [REPLACE WITH]:
//       const orbitSpeed = 0.0008 + seed * 0.00012;
//       positions[stride] = visual.basePositions[stride] + Math.sin(now * orbitSpeed + seed) * 0.06;
//       positions[stride + 1] = visual.basePositions[stride + 1] + Math.cos(now * (orbitSpeed * 0.85) + seed) * 0.08 + Math.sin(now * 0.0005 + seed * 1.3) * 0.03;
//       positions[stride + 2] = visual.basePositions[stride + 2] + Math.sin(now * (orbitSpeed * 0.92) + seed * 0.7) * 0.06;


// ═══════════════════════════════════════════════════════════════
// PATCH 6: 패널 전환 — CSS 기반 부드러운 애니메이션
// ═══════════════════════════════════════════════════════════════

// [FIND] openEntryPanel 함수를 아래로 교체:

function openEntryPanel() {
  closeDetailPanel();
  // CSS transition handles animation (opacity + transform in style.css)
  UI.historyPanel.classList.add('hidden');
  // Small delay to allow CSS to detect state change
  requestAnimationFrame(() => {
    UI.entryPanel.classList.remove('hidden');
  });
}

// [FIND] closeEntryPanel 함수를 아래로 교체:

function closeEntryPanel() {
  UI.entryPanel.classList.add('hidden');
}

// [FIND] openHistoryPanel 함수를 아래로 교체:

function openHistoryPanel() {
  closeDetailPanel();
  UI.entryPanel.classList.add('hidden');
  requestAnimationFrame(() => {
    UI.historyPanel.classList.remove('hidden');
  });
}


// ═══════════════════════════════════════════════════════════════
// PATCH 7: 드래그 인터랙션 — 더 부드러운 조작감
// ═══════════════════════════════════════════════════════════════

// [FIND] setupInteraction 내 onPointerDown에서 liftY 계산:
//       liftY: Math.max(visual.object.position.y + 0.9, 1.2),
// [REPLACE WITH]:
//       liftY: Math.max(visual.object.position.y + 0.7, 1.0),

// [FIND] onPointerMove에서 lerp 부분:
//       visual.object.position.x = THREE.MathUtils.lerp(visual.object.position.x, targetX, DRAG_LERP);
//       visual.object.position.z = THREE.MathUtils.lerp(visual.object.position.z, targetZ, DRAG_LERP);
//       visual.object.position.y = THREE.MathUtils.lerp(visual.object.position.y, gs.liftY, DRAG_LERP);
// [REPLACE WITH]:
//       const frameLerp = 1 - Math.pow(1 - DRAG_LERP, 1);
//       visual.object.position.x = THREE.MathUtils.lerp(visual.object.position.x, targetX, frameLerp);
//       visual.object.position.z = THREE.MathUtils.lerp(visual.object.position.z, targetZ, frameLerp);
//       visual.object.position.y = THREE.MathUtils.lerp(visual.object.position.y, gs.liftY, frameLerp * 0.8);

// [FIND] onPointerUp에서 throw velocity 계산 후 upward 변경:
//     visual.phys.vy = Math.min(PHYSICS_THROW_UPWARD + horizontalSpeed * 0.12, 0.24);
// [REPLACE WITH]:
//     visual.phys.vy = Math.min(PHYSICS_THROW_UPWARD + horizontalSpeed * 0.08, 0.2);


// ═══════════════════════════════════════════════════════════════
// PATCH 8: 레이아웃 캐시 마이그레이션 버전 업데이트
// ═══════════════════════════════════════════════════════════════

// [FIND]:
//   const LAYOUT_CACHE_SLOT_MIGRATION_VERSION = 'non-desk-slot-baked-left-v2-right-tighten-floor-tumbler-inset-v7-floor-front-priority-v1-floor-tumbler-right-hard-inset-v2';
// [REPLACE WITH]:
//   const LAYOUT_CACHE_SLOT_MIGRATION_VERSION = 'non-desk-slot-baked-left-v2-right-tighten-floor-tumbler-inset-v7-floor-front-priority-v1-floor-tumbler-right-hard-inset-v2-tumbler-size-v2';


// ═══════════════════════════════════════════════════════════════
// PATCH 9: 조명 개선 — 더 따뜻하고 깊이감 있는 장면
// ═══════════════════════════════════════════════════════════════

// [FIND] setupScene에서 조명 설정:
//   const hemi = new THREE.HemisphereLight(0xfffbf4, 0xe9dfd3, 1.7);
// [REPLACE WITH]:
//   const hemi = new THREE.HemisphereLight(0xfffbf4, 0xe9dfd3, 1.85);

// [FIND]:
//   const key = new THREE.DirectionalLight(0xffe2c6, 1.9);
// [REPLACE WITH]:
//   const key = new THREE.DirectionalLight(0xffe2c6, 2.05);

// [FIND]:
//   const fill = new THREE.PointLight(0xfff0e0, 12, 30, 2.0);
// [REPLACE WITH]:
//   const fill = new THREE.PointLight(0xfff0e0, 14, 32, 2.0);

// [FIND]:
//   const backGlow = new THREE.PointLight(0xfff8ef, 8.5, 24, 2.0);
// [REPLACE WITH]:
//   const backGlow = new THREE.PointLight(0xfff8ef, 10, 26, 2.0);


// ═══════════════════════════════════════════════════════════════
// PATCH 10: 파일 끝 오타 수정
// ═══════════════════════════════════════════════════════════════

// [FIND] 파일 맨 끝:
//   return group;
// }v
// [REPLACE WITH]:
//   return group;
// }


// ═══════════════════════════════════════════════════════════════
// PATCH 11: 바닥 구름 마찰 개선
// ═══════════════════════════════════════════════════════════════

// [FIND]:
//   const PHYSICS_FLOOR_ROLL_FRICTION = 0.965;
// [REPLACE WITH]:
//   const PHYSICS_FLOOR_ROLL_FRICTION = 0.96;


// ═══════════════════════════════════════════════════════════════
// PATCH 12: 렌더러 품질 개선
// ═══════════════════════════════════════════════════════════════

// [FIND]:
//   STATE.renderer.toneMappingExposure = 1.08;
// [REPLACE WITH]:
//   STATE.renderer.toneMapping = THREE.ACESFilmicToneMapping;
//   STATE.renderer.toneMappingExposure = 1.12;


// ═══════════════════════════════════════════════════════════════
// PATCH 13: 히스토리 카드 — 시각 상태 설명 개선
// ═══════════════════════════════════════════════════════════════

// [FIND] renderHistory에서 카드 HTML 개선 — card.innerHTML 부분:
//     card.innerHTML = `
//       <div class="log-top">
//         <div class="log-title-wrap">
//           <strong class="log-title">${escapeHtml(categoryLabel + emotionLabel)}</strong>
//           <div class="log-chip-row">
//             ${statusChip}
//             <span class="log-chip">${escapeHtml(formatDate(memo.createdAt))}</span>
//           </div>
//         </div>
//       </div>
//       <p class="log-text">${escapeHtml(memo.transcript)}</p>
//       <div class="log-actions">
//         ${memo.clearedAt ? '' : `<button type="button" class="log-btn" data-clear-id="${memo.id}">정리</button>`}
//         <button type="button" class="log-btn danger" data-delete-id="${memo.id}">삭제</button>
//       </div>
//     `;

// [REPLACE WITH]:
//     const ageDays = getAgeDays(memo.createdAt, Date.now());
//     const ageLabel = ageDays < 1 ? '오늘' : ageDays < 2 ? '어제' : `${Math.floor(ageDays)}일 전`;
//     card.innerHTML = `
//       <div class="log-top">
//         <div class="log-title-wrap">
//           <strong class="log-title">${escapeHtml(categoryLabel + emotionLabel)}</strong>
//           <div class="log-chip-row">
//             ${statusChip}
//             <span class="log-chip">${escapeHtml(ageLabel)}</span>
//             <span class="log-chip">${escapeHtml(formatDate(memo.createdAt))}</span>
//           </div>
//         </div>
//       </div>
//       <p class="log-text">${escapeHtml(memo.transcript)}</p>
//       <div class="log-actions">
//         ${memo.clearedAt ? '' : `<button type="button" class="log-btn" data-clear-id="${memo.id}">정리</button>`}
//         <button type="button" class="log-btn danger" data-delete-id="${memo.id}">삭제</button>
//       </div>
//     `;
