(() => {
  "use strict";

  const canvas = document.querySelector("#global-globe");
  const marker = document.querySelector("#globe-marker-label");
  if (!canvas) return;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const continents = [
    [[-168,70],[-145,74],[-120,75],[-95,72],[-78,64],[-59,52],[-74,40],[-80,26],[-97,18],[-117,32],[-125,52],[-150,72]],
    [[-98,22],[-86,16],[-78,8],[-80,4],[-88,13]],
    [[-81,12],[-63,5],[-44,-5],[-38,-20],[-53,-44],[-61,-55],[-69,-52],[-76,-25],[-80,-10]],
    [[-10,36],[-7,50],[14,58],[30,64],[40,58],[29,45],[14,40],[0,40]],
    [[-17,35],[10,35],[34,25],[50,3],[43,-12],[27,-34],[18,-35],[2,-18],[-16,13]],
    [[28,42],[55,60],[100,72],[145,58],[160,52],[138,35],[116,20],[105,11],[88,20],[78,29],[60,28],[42,40]],
    [[68,27],[88,23],[105,20],[111,11],[104,2],[88,14],[80,8],[75,18]],
    [[112,-11],[138,-16],[153,-34],[145,-40],[117,-34],[112,-23]],
    [[-55,60],[-30,69],[-25,78],[-40,84],[-57,82],[-68,74]],
  ];

  const cities = [
    { name: "Guayaquil", lat: -2.17, lon: -79.92, home: true },
    { name: "New York", lat: 40.71, lon: -74.01 },
    { name: "Los Angeles", lat: 34.05, lon: -118.24 },
    { name: "São Paulo", lat: -23.55, lon: -46.63 },
    { name: "London", lat: 51.51, lon: -0.13 },
    { name: "Madrid", lat: 40.42, lon: -3.7 },
    { name: "Dubai", lat: 25.2, lon: 55.27 },
    { name: "Mumbai", lat: 19.08, lon: 72.88 },
    { name: "Singapore", lat: 1.35, lon: 103.82 },
    { name: "Tokyo", lat: 35.68, lon: 139.65 },
    { name: "Sydney", lat: -33.87, lon: 151.21 },
  ];

  const connections = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[4,6],[6,7],[7,8],[8,9],[8,10]];
  const landPoints = [];
  let width = 1;
  let height = 1;
  let centerX = 0;
  let centerY = 0;
  let radius = 1;
  let rotation = -80;
  let previousTime = performance.now();
  let frameId;
  let resizeTimer;

  function inside(lon, lat, polygon) {
    let result = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      const intersects = (yi > lat) !== (yj > lat)
        && lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || 0.000001) + xi;
      if (intersects) result = !result;
    }
    return result;
  }

  function seeded(index, offset) {
    const value = Math.sin(index * 87.13 + offset * 41.71) * 43758.5453;
    return value - Math.floor(value);
  }

  function generateLand() {
    landPoints.length = 0;
    const step = window.innerWidth <= 760 ? 3.5 : 2.45;
    let index = 0;

    for (let lat = -58; lat <= 82; lat += step) {
      for (let lon = -180; lon <= 180; lon += step) {
        const pointLon = lon + (seeded(index, 1) - 0.5) * 1.35;
        const pointLat = lat + (seeded(index, 2) - 0.5) * 1.35;

        if (continents.some((polygon) => inside(pointLon, pointLat, polygon))) {
          landPoints.push({
            lon: pointLon,
            lat: pointLat,
            size: 0.7 + seeded(index, 3) * 1.2,
            alpha: 0.45 + seeded(index, 4) * 0.5,
          });
        }
        index += 1;
      }
    }
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, window.innerWidth <= 760 ? 1.35 : 2);
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    centerX = width / 2;
    centerY = height / 2;
    radius = Math.min(width, height) * 0.39;
  }

  function project(lat, lon) {
    const latitude = lat * Math.PI / 180;
    const longitude = (lon + rotation) * Math.PI / 180;
    const x = Math.cos(latitude) * Math.sin(longitude);
    const y = Math.sin(latitude);
    const z = Math.cos(latitude) * Math.cos(longitude);
    return { x: centerX + x * radius, y: centerY - y * radius, z, visible: z > 0 };
  }

  function drawSphere() {
    const glow = context.createRadialGradient(
      centerX - radius * 0.3,
      centerY - radius * 0.35,
      radius * 0.08,
      centerX,
      centerY,
      radius,
    );
    glow.addColorStop(0, "rgba(255,255,255,.11)");
    glow.addColorStop(0.6, "rgba(255,255,255,.025)");
    glow.addColorStop(1, "rgba(92,24,0,.15)");
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fillStyle = glow;
    context.fill();
    context.strokeStyle = "rgba(255,255,255,.16)";
    context.stroke();
  }

  function drawGrid() {
    context.strokeStyle = "rgba(255,255,255,.075)";
    context.lineWidth = 0.7;
    const lines = [];

    for (let lat = -60; lat <= 60; lat += 30) {
      lines.push(Array.from({ length: 121 }, (_, i) => [lat, -180 + i * 3]));
    }
    for (let lon = -150; lon <= 180; lon += 30) {
      lines.push(Array.from({ length: 61 }, (_, i) => [-90 + i * 3, lon]));
    }

    lines.forEach((line) => {
      context.beginPath();
      let drawing = false;
      line.forEach(([lat, lon]) => {
        const point = project(lat, lon);
        if (!point.visible) {
          drawing = false;
          return;
        }
        if (drawing) context.lineTo(point.x, point.y);
        else context.moveTo(point.x, point.y);
        drawing = true;
      });
      context.stroke();
    });
  }

  function drawLand() {
    landPoints.forEach((point) => {
      const projected = project(point.lat, point.lon);
      if (!projected.visible) return;
      const depth = Math.max(0, Math.min(1, projected.z));
      context.beginPath();
      context.arc(projected.x, projected.y, point.size * (0.65 + depth * 0.65), 0, Math.PI * 2);
      context.fillStyle = `rgba(255,248,235,${point.alpha * (0.22 + depth * 0.75)})`;
      context.fill();
    });
  }

  function drawConnections() {
    connections.forEach(([fromIndex, toIndex]) => {
      const from = project(cities[fromIndex].lat, cities[fromIndex].lon);
      const to = project(cities[toIndex].lat, cities[toIndex].lon);
      if (from.z <= 0.08 || to.z <= 0.08) return;

      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.quadraticCurveTo(
        (from.x + to.x) / 2,
        (from.y + to.y) / 2 - distance * 0.18,
        to.x,
        to.y,
      );
      context.strokeStyle = "rgba(255,255,255,.23)";
      context.lineWidth = 0.8;
      context.stroke();
    });
  }

  function drawCities() {
    let home;

    cities.forEach((city) => {
      const point = project(city.lat, city.lon);
      if (!point.visible) return;

      const size = city.home ? 4.1 : 2.4;
      context.beginPath();
      context.arc(point.x, point.y, size * 2.4, 0, Math.PI * 2);
      context.fillStyle = city.home ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.08)";
      context.fill();

      context.beginPath();
      context.arc(point.x, point.y, size, 0, Math.PI * 2);
      context.fillStyle = city.home ? "#fff" : "rgba(255,255,255,.76)";
      context.fill();

      if (city.home) home = point;
    });

    if (!marker) return;
    marker.style.opacity = home && home.z > 0.12 ? "1" : "0";
    if (home) {
      marker.style.left = `${home.x}px`;
      marker.style.top = `${home.y}px`;
    }
  }

  function render(time = performance.now()) {
    const elapsed = Math.min(50, time - previousTime);
    previousTime = time;
    if (!reducedMotion.matches) rotation += elapsed * 0.00315;

    context.clearRect(0, 0, width, height);
    drawSphere();
    drawGrid();
    drawConnections();
    drawLand();
    drawCities();

    if (!reducedMotion.matches && !document.hidden) {
      frameId = requestAnimationFrame(render);
    }
  }

  function initialize() {
    cancelAnimationFrame(frameId);
    resize();
    generateLand();
    previousTime = performance.now();
    render();
  }

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initialize, 120);
  }, { passive: true });

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", initialize);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frameId);
    else initialize();
  });

  window.addEventListener("pagehide", () => cancelAnimationFrame(frameId));
  initialize();
})();
