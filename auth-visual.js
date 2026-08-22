document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.querySelector("#auth-particles");
  if (!canvas) return;

  const context = canvas.getContext("2d", { alpha: true });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compact = window.matchMedia("(max-width: 760px)");
  let width = 0;
  let height = 0;
  let particles = [];
  let frameId;
  let startTime = performance.now();

  const seeded = (index, offset = 0) => {
    const value = Math.sin(index * 91.731 + offset * 47.113) * 43758.5453;
    return value - Math.floor(value);
  };

  function formation(index, phase) {
    const angle = seeded(index, 1) * Math.PI * 2;
    const spread = Math.sqrt(seeded(index, 2));
    const wave = seeded(index, 3) * Math.PI * 2;
    if (phase === 0) return { x: 0.72 + Math.cos(angle) * spread * 0.25, y: 0.48 + Math.sin(angle) * spread * 0.34 };
    if (phase === 1) return { x: 0.72 + Math.cos(angle) * 0.27, y: 0.5 + Math.sin(angle) * 0.29 * (0.55 + spread * 0.45) };
    return { x: 0.48 + spread * 0.48, y: 0.52 + Math.sin(wave + spread * 5) * 0.16 + (spread - 0.5) * 0.3 };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, compact.matches ? 1.25 : 1.75);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = compact.matches ? 48 : Math.min(180, Math.round((width * height) / 4300));
    particles = Array.from({ length: count }, (_, index) => ({
      index,
      radius: 0.7 + seeded(index, 4) * 1.45,
      alpha: 0.2 + seeded(index, 5) * 0.62,
      drift: seeded(index, 6) * Math.PI * 2,
    }));
  }

  function draw(now = startTime) {
    context.clearRect(0, 0, width, height);
    const elapsed = reducedMotion.matches ? 9000 : (now - startTime) % 30000;
    const segment = elapsed / 10000;
    const current = Math.floor(segment) % 3;
    const next = (current + 1) % 3;
    const rawProgress = segment - Math.floor(segment);
    const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);

    particles.forEach((particle) => {
      const from = formation(particle.index, current);
      const to = formation(particle.index, next);
      const drift = reducedMotion.matches ? 0 : Math.sin(now / 4800 + particle.drift) * 4;
      const x = (from.x + (to.x - from.x) * progress) * width + drift;
      const y = (from.y + (to.y - from.y) * progress) * height + drift * 0.45;
      context.beginPath();
      context.fillStyle = `rgba(250, 239, 201, ${particle.alpha})`;
      context.arc(x, y, particle.radius, 0, Math.PI * 2);
      context.fill();
    });
    if (!reducedMotion.matches && !document.hidden) frameId = requestAnimationFrame(draw);
  }

  function restart() {
    cancelAnimationFrame(frameId);
    startTime = performance.now();
    resize();
    draw();
  }

  window.addEventListener("resize", restart, { passive: true });
  reducedMotion.addEventListener("change", restart);
  document.addEventListener("visibilitychange", () => document.hidden ? cancelAnimationFrame(frameId) : restart());
  restart();
});
