/**
 * Moteur zoom/pan réutilisable pour les stages carte/sous-carte.
 * @module zoom-pan
 */

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

/**
 * Crée un contrôleur zoom/pan pour un stage.
 * @param {Object} options - Options de configuration
 * @param {string} options.wrapId - ID du conteneur visible
 * @param {string} options.stageId - ID du stage transformé
 * @param {Function} [options.getLimits] - Retourne {min,max,step}
 * @param {Function} [options.onChange] - Callback à chaque changement
 * @returns {Object} API contrôleur
 */
export function createZoomPanController(options) {
  const wrap = document.getElementById(options.wrapId);
  const stage = document.getElementById(options.stageId);
  if (!wrap || !stage) {
    return null;
  }

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pointerIdForPan = null;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let startTx = 0;
  let startTy = 0;
  let pinch = null;
  const pointers = new Map();

  stage.classList.add("zoomable-stage");
  stage.style.transformOrigin = "0 0";

  function getLimits() {
    const candidate = options.getLimits?.() || {};
    const min = Number.isFinite(candidate.min) ? candidate.min : 1;
    const max = Number.isFinite(candidate.max) ? candidate.max : 4;
    const step = Number.isFinite(candidate.step) ? candidate.step : 0.2;
    return {
      min: Math.max(0.5, Math.min(min, max)),
      max: Math.max(min, max),
      step: Math.max(0.05, step),
    };
  }

  function clampTranslation() {
    const wrapRect = wrap.getBoundingClientRect();
    const baseW = stage.offsetWidth;
    const baseH = stage.offsetHeight;
    const scaledW = baseW * scale;
    const scaledH = baseH * scale;

    const minTx = Math.min(0, wrapRect.width - scaledW);
    const minTy = Math.min(0, wrapRect.height - scaledH);
    tx = clamp(tx, minTx, 0);
    ty = clamp(ty, minTy, 0);
  }

  function notifyChange() {
    options.onChange?.({ scale, tx, ty });
  }

  function applyTransform() {
    stage.style.transform = `matrix(${scale},0,0,${scale},${tx},${ty})`;
    stage.style.setProperty("--poi-scale", (1 / scale).toFixed(6));
    notifyChange();
    options.onScaleChange?.({ scale, limits: getLimits() });
  }

  function updateScale(nextScale, anchorX, anchorY) {
    const limits = getLimits();
    const clampedScale = clamp(nextScale, limits.min, limits.max);
    if (!Number.isFinite(clampedScale) || clampedScale <= 0) {
      return;
    }

    const contentX = (anchorX - tx) / scale;
    const contentY = (anchorY - ty) / scale;
    scale = clampedScale;
    tx = anchorX - contentX * scale;
    ty = anchorY - contentY * scale;
    clampTranslation();
    applyTransform();
  }

  function getAnchorFromWrapCenter() {
    const rect = wrap.getBoundingClientRect();
    return { x: rect.width / 2, y: rect.height / 2 };
  }

  function getPointInWrap(clientX, clientY) {
    const rect = wrap.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function isInteractiveChild(target) {
    if (!(target instanceof Element)) {
      return false;
    }
    return Boolean(target.closest(".poi, .btn, a, button, input, select, textarea"));
  }

  function reset() {
    const limits = getLimits();
    scale = limits.min;
    tx = 0;
    ty = 0;
    clampTranslation();
    stage.classList.add("is-resetting");
    applyTransform();
    const onTransitionEnd = () => {
      stage.classList.remove("is-resetting");
      stage.removeEventListener("transitionend", onTransitionEnd);
    };
    stage.addEventListener("transitionend", onTransitionEnd);
    setTimeout(() => stage.classList.remove("is-resetting"), 400);
  }

  function zoomBy(delta, anchor) {
    const limits = getLimits();
    updateScale(scale + delta * limits.step, anchor.x, anchor.y);
  }

  function zoomIn() {
    zoomBy(1, getAnchorFromWrapCenter());
  }

  function zoomOut() {
    zoomBy(-1, getAnchorFromWrapCenter());
  }

  function onWheel(event) {
    event.preventDefault();
    const anchor = getPointInWrap(event.clientX, event.clientY);
    const direction = event.deltaY > 0 ? -1 : 1;
    const limits = getLimits();
    updateScale(scale + direction * limits.step, anchor.x, anchor.y);
  }

  function startPan(pointerId, point) {
    pointerIdForPan = pointerId;
    isPanning = true;
    panStartX = point.x;
    panStartY = point.y;
    startTx = tx;
    startTy = ty;
    stage.classList.add("is-panning");
  }

  function stopPan() {
    isPanning = false;
    pointerIdForPan = null;
    stage.classList.remove("is-panning");
  }

  function onPointerDown(event) {
    const point = getPointInWrap(event.clientX, event.clientY);
    pointers.set(event.pointerId, point);

    if (event.pointerType === "mouse") {
      if (event.button !== 0 || isInteractiveChild(event.target)) {
        return;
      }
      if (scale <= getLimits().min + 0.001) {
        return;
      }
      startPan(event.pointerId, point);
      event.preventDefault();
      return;
    }

    if (pointers.size === 2) {
      const pts = Array.from(pointers.values());
      pinch = {
        startDistance: distance(pts[0], pts[1]),
        startCenter: midpoint(pts[0], pts[1]),
        startScale: scale,
        startTx: tx,
        startTy: ty,
      };
      stopPan();
      return;
    }

    if (pointers.size === 1 && scale > getLimits().min + 0.001) {
      startPan(event.pointerId, point);
    }
  }

  function onPointerMove(event) {
    if (!pointers.has(event.pointerId)) {
      return;
    }

    const point = getPointInWrap(event.clientX, event.clientY);
    pointers.set(event.pointerId, point);

    if (pinch && pointers.size >= 2) {
      const pts = Array.from(pointers.values());
      const currentCenter = midpoint(pts[0], pts[1]);
      const currentDistance = distance(pts[0], pts[1]);
      if (pinch.startDistance <= 0) {
        return;
      }

      const nextScale = pinch.startScale * (currentDistance / pinch.startDistance);
      const limits = getLimits();
      const clampedScale = clamp(nextScale, limits.min, limits.max);

      const anchorX = pinch.startCenter.x;
      const anchorY = pinch.startCenter.y;
      const contentX = (anchorX - pinch.startTx) / pinch.startScale;
      const contentY = (anchorY - pinch.startTy) / pinch.startScale;

      scale = clampedScale;
      tx = anchorX - contentX * scale + (currentCenter.x - pinch.startCenter.x);
      ty = anchorY - contentY * scale + (currentCenter.y - pinch.startCenter.y);
      clampTranslation();
      applyTransform();
      event.preventDefault();
      return;
    }

    if (isPanning && pointerIdForPan === event.pointerId) {
      tx = startTx + (point.x - panStartX);
      ty = startTy + (point.y - panStartY);
      clampTranslation();
      applyTransform();
      event.preventDefault();
    }
  }

  function onPointerEnd(event) {
    pointers.delete(event.pointerId);
    if (pointerIdForPan === event.pointerId) {
      stopPan();
    }
    if (pointers.size < 2) {
      pinch = null;
    }
  }

  function refresh() {
    clampTranslation();
    applyTransform();
  }

  stage.addEventListener("wheel", onWheel, { passive: false });
  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", onPointerEnd);
  stage.addEventListener("pointercancel", onPointerEnd);
  stage.addEventListener("pointerleave", onPointerEnd);

  reset();

  return {
    refresh,
    reset,
    zoomIn,
    zoomOut,
    getScale: () => scale,
    getLimits,
    getViewport: () => ({ scale, tx, ty }),
    restoreViewport({ scale: s, tx: x, ty: y }) {
      const limits = getLimits();
      scale = Math.min(limits.max, Math.max(limits.min, s));
      tx = x;
      ty = y;
      clampTranslation();
      applyTransform();
    },
    destroy() {
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", onPointerEnd);
      stage.removeEventListener("pointercancel", onPointerEnd);
      stage.removeEventListener("pointerleave", onPointerEnd);
      stage.classList.remove("zoomable-stage", "is-panning");
      stage.style.transform = "";
      stage.style.transformOrigin = "";
    },
  };
}
