(() => {
  "use strict";

  const root = document.documentElement;
  const breakpoints = Object.freeze({ mobile: 600, tablet: 1024, wide: 1440 });
  const media = {
    coarse: window.matchMedia("(pointer: coarse)"),
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)"),
    dark: window.matchMedia("(prefers-color-scheme: dark)")
  };
  let frame = 0;

  function viewportSize() {
    const viewport = window.visualViewport;
    return {
      width: Math.round(viewport?.width || window.innerWidth || root.clientWidth),
      height: Math.round(viewport?.height || window.innerHeight || root.clientHeight),
      scale: Number((viewport?.scale || 1).toFixed(2))
    };
  }

  function screenLayout(width) {
    if (width < breakpoints.mobile) return "mobile";
    if (width < breakpoints.tablet) return "tablet";
    if (width < breakpoints.wide) return "laptop";
    return "wide";
  }

  function applyAdaptiveState() {
    frame = 0;
    const { width, height, scale } = viewportSize();
    const layout = screenLayout(width);

    root.dataset.layout = layout;
    root.dataset.orientation = width >= height ? "landscape" : "portrait";
    root.dataset.input = media.coarse.matches ? "touch" : "pointer";
    root.dataset.motion = media.reducedMotion.matches ? "reduced" : "full";
    root.dataset.colorScheme = media.dark.matches ? "dark" : "light";
    root.style.setProperty("--gs-viewport-width", `${width}px`);
    root.style.setProperty("--gs-available-height", `${height}px`);
    root.style.setProperty("--gs-viewport-scale", scale);

    window.dispatchEvent(new CustomEvent("gabo:layoutchange", {
      detail: { layout, width, height, scale }
    }));
  }

  function scheduleAdaptiveState() {
    if (frame) return;
    frame = window.requestAnimationFrame(applyAdaptiveState);
  }

  Object.values(media).forEach(query => query.addEventListener?.("change", scheduleAdaptiveState));
  window.addEventListener("resize", scheduleAdaptiveState, { passive: true });
  window.addEventListener("orientationchange", scheduleAdaptiveState, { passive: true });
  window.visualViewport?.addEventListener("resize", scheduleAdaptiveState, { passive: true });
  window.visualViewport?.addEventListener("scroll", scheduleAdaptiveState, { passive: true });
  document.fonts?.ready.then(scheduleAdaptiveState).catch(() => {});
  applyAdaptiveState();
})();
