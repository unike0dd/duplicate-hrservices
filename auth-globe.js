(() => {
  "use strict";

  const canvas = document.querySelector("#global-globe");
  const stage = document.querySelector(".globe-stage");
  const panel = document.querySelector(".global-side");
  const marker = document.querySelector("#globe-marker-label");

  if (!canvas || !stage || !panel) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /*
   * Keep the existing auth page markup and messaging intact.  The overrides
   * below only replace the right-side illustration layer so the live page
   * keeps the established Gabo Services palette and responsive structure.
   */
  const style = document.createElement("style");
  style.textContent = `
    .auth-page-globe .global-side {
      background:
        radial-gradient(circle at 72% 30%, rgba(40, 104, 90, .28), transparent 36%),
        linear-gradient(145deg, #0b463d 0%, #0a3d35 55%, #072d29 100%);
    }
    .auth-page-globe .global-side::before,
    .auth-page-globe .global-side::after {
      display: none !important;
    }
    .auth-page-globe .global-atmosphere {
      z-index: 0;
      opacity: .72;
      background:
        radial-gradient(circle at 76% 22%, rgba(214, 161, 60, .12), transparent 28%),
        radial-gradient(circle at 70% 76%, rgba(220, 235, 241, .08), transparent 38%),
        linear-gradient(180deg, rgba(255,255,255,.015), rgba(4,35,31,.14));
    }
    .auth-page-globe .globe-stage {
      inset: 0;
      width: 100%;
      height: 100%;
      aspect-ratio: auto;
      z-index: 2;
    }
    .auth-page-globe #global-globe {
      width: 100%;
      height: 100%;
    }
    .auth-page-globe .global-message,
    .auth-page-globe .global-status {
      text-shadow: 0 1px 14px rgba(1, 28, 24, .18);
    }
    .auth-page-globe .globe-marker-label {
      z-index: 30;
    }
    @media (max-width: 760px) {
      .auth-page-globe .globe-stage {
        inset: 0;
        width: 100%;
        height: 100%;
      }
    }
  `;
  document.head.appendChild(style);

  import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js")
    .then((THREE) => initializeGlobe(THREE))
    .catch((error) => {
      console.error("Unable to load the Gabo Services globe visual.", error);
    });

  function initializeGlobe(THREE) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const EARTH_RADIUS = 5;
    const EARTH_POSITION = new THREE.Vector3(2.05, -2.72, 0);
    const SUN_POSITION = new THREE.Vector3(6.45, 2.0, -5.35);
    const EARTH_ROTATION_SPEED = 0.035;
    const CLOUD_ROTATION_SPEED = 0.043;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "anonymous";

    const earthTexture = textureLoader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg"
    );
    const earthNormalTexture = textureLoader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg"
    );
    const earthSpecularTexture = textureLoader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg"
    );
    const earthNightTexture = textureLoader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png"
    );
    const cloudTexture = textureLoader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png"
    );

    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthNightTexture.colorSpace = THREE.SRGBColorSpace;

    const earthSystem = new THREE.Group();
    earthSystem.position.copy(EARTH_POSITION);
    earthSystem.rotation.z = THREE.MathUtils.degToRad(-23.4);
    scene.add(earthSystem);

    const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 128, 128);
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      normalMap: earthNormalTexture,
      normalScale: new THREE.Vector2(0.42, 0.42),
      specularMap: earthSpecularTexture,
      specular: new THREE.Color(0x496661),
      shininess: 20,
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthSystem.add(earth);

    const nightEarth = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS + 0.012, 128, 128),
      new THREE.MeshBasicMaterial({
        map: earthNightTexture,
        transparent: true,
        opacity: 0.46,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    earth.add(nightEarth);

    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS + 0.055, 128, 128),
      new THREE.MeshPhongMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      })
    );
    earthSystem.add(clouds);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS * 1.035, 128, 128),
      new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          void main() {
            vNormal = normalize(mat3(modelMatrix) * normal);
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          void main() {
            vec3 N = normalize(vNormal);
            vec3 V = normalize(cameraPosition - vWorldPosition);
            float rim = pow(1.0 - max(dot(N, V), 0.0), 3.2);
            vec3 color = vec3(0.28, 0.66, 0.60);
            float alpha = rim * 0.17;
            gl_FragColor = vec4(color * alpha, alpha);
          }
        `,
      })
    );
    earthSystem.add(atmosphere);

    const sunriseMaterial = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        sunWorldPosition: { value: SUN_POSITION.clone() },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vNormal = normalize(mat3(modelMatrix) * normal);
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 sunWorldPosition;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(cameraPosition - vWorldPosition);
          vec3 L = normalize(sunWorldPosition - vWorldPosition);
          float rim = pow(1.0 - max(dot(N, V), 0.0), 3.65);
          float sunFacing = max(dot(N, L), 0.0);
          float localized = smoothstep(0.34, 0.90, sunFacing);
          localized = pow(localized, 3.15);
          float shine = rim * localized;
          float hotCenter = pow(localized, 4.0);
          vec3 amber = vec3(0.96, 0.55, 0.16);
          vec3 whiteGold = vec3(1.0, 0.97, 0.80);
          vec3 shineColor = mix(amber, whiteGold, hotCenter);
          float alpha = shine * (0.34 + hotCenter * 2.25);
          gl_FragColor = vec4(shineColor * alpha, alpha);
        }
      `,
    });

    const sunriseAtmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS * 1.020, 128, 128),
      sunriseMaterial
    );
    earthSystem.add(sunriseAtmosphere);

    const ambientLight = new THREE.AmbientLight(0x244640, 0.68);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffe7ad, 3.4);
    sunLight.position.copy(SUN_POSITION);
    sunLight.target.position.copy(EARTH_POSITION);
    scene.add(sunLight);
    scene.add(sunLight.target);

    const nightFill = new THREE.DirectionalLight(0x235367, 0.36);
    nightFill.position.set(-8, -1, -4);
    scene.add(nightFill);

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.50, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0xfff1bc })
    );
    sun.position.copy(SUN_POSITION);
    scene.add(sun);

    function createSunGlowTexture() {
      const size = 512;
      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = size;
      glowCanvas.height = size;
      const context = glowCanvas.getContext("2d");
      const gradient = context.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2
      );
      gradient.addColorStop(0, "rgba(255,255,245,1)");
      gradient.addColorStop(0.08, "rgba(255,244,195,.96)");
      gradient.addColorStop(0.23, "rgba(255,202,100,.68)");
      gradient.addColorStop(0.50, "rgba(230,169,75,.20)");
      gradient.addColorStop(1, "rgba(230,169,75,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(glowCanvas);
    }

    const sunGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createSunGlowTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
      })
    );
    sunGlow.position.copy(SUN_POSITION);
    sunGlow.scale.set(4.25, 4.25, 1);
    scene.add(sunGlow);

    const networkGroup = new THREE.Group();
    earth.add(networkGroup);

    const cityData = [
      { name: "Guayaquil", lat: -2.17, lon: -79.92, home: true },
      { name: "New York", lat: 40.71, lon: -74.01 },
      { name: "Los Angeles", lat: 34.05, lon: -118.24 },
      { name: "São Paulo", lat: -23.55, lon: -46.63 },
      { name: "London", lat: 51.51, lon: -0.13 },
      { name: "Madrid", lat: 40.42, lon: -3.70 },
      { name: "Dubai", lat: 25.20, lon: 55.27 },
      { name: "Mumbai", lat: 19.08, lon: 72.88 },
      { name: "Singapore", lat: 1.35, lon: 103.82 },
      { name: "Tokyo", lat: 35.68, lon: 139.65 },
      { name: "Sydney", lat: -33.87, lon: 151.21 },
    ];

    const connectionPairs = [
      [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
      [4, 6], [6, 7], [7, 8], [8, 9], [8, 10],
    ];

    function latLonToVector3(lat, lon, radius = EARTH_RADIUS) {
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon + 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    const cityPositions = cityData.map((city) => latLonToVector3(city.lat, city.lon, EARTH_RADIUS + 0.08));

    cityData.forEach((city, index) => {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(city.home ? 0.065 : 0.043, 12, 12),
        new THREE.MeshBasicMaterial({
          color: city.home ? 0xf2c96f : 0xf7efe0,
          transparent: true,
          opacity: city.home ? 1 : 0.78,
        })
      );
      dot.position.copy(cityPositions[index]);
      networkGroup.add(dot);

      if (city.home) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.095, 0.12, 28),
          new THREE.MeshBasicMaterial({
            color: 0xf2c96f,
            transparent: true,
            opacity: 0.55,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        ring.position.copy(cityPositions[index]).multiplyScalar((EARTH_RADIUS + 0.09) / (EARTH_RADIUS + 0.08));
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        networkGroup.add(ring);
      }
    });

    connectionPairs.forEach(([fromIndex, toIndex]) => {
      const from = cityPositions[fromIndex].clone().normalize();
      const to = cityPositions[toIndex].clone().normalize();
      const angle = from.angleTo(to);
      const lift = Math.min(0.95, 0.22 + angle * 0.34);
      const points = [];

      for (let i = 0; i <= 48; i += 1) {
        const t = i / 48;
        const direction = from.clone().lerp(to, t).normalize();
        const arcLift = Math.sin(Math.PI * t) * lift;
        points.push(direction.multiplyScalar(EARTH_RADIUS + 0.085 + arcLift));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xe9efe6,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      });
      networkGroup.add(new THREE.Line(geometry, material));
    });

    const homeAnchor = new THREE.Object3D();
    homeAnchor.position.copy(cityPositions[0]);
    earth.add(homeAnchor);

    const starCount = 1000;
    const starPositions = new Float32Array(starCount * 3);
    for (let index = 0; index < starCount; index += 1) {
      const starRadius = 55 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[index * 3] = starRadius * Math.sin(phi) * Math.cos(theta);
      starPositions[index * 3 + 1] = starRadius * Math.cos(phi);
      starPositions[index * 3 + 2] = starRadius * Math.sin(phi) * Math.sin(theta);
    }

    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    scene.add(
      new THREE.Points(
        starsGeometry,
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.045,
          transparent: true,
          opacity: 0.34,
          depthWrite: false,
        })
      )
    );

    camera.position.set(0, 0.35, 15.5);
    camera.lookAt(1.6, -1.4, 0);

    function resize() {
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;

      if (width <= 760) {
        camera.position.set(0, 1.15, 18.2);
        earthSystem.position.set(2.55, -3.35, 0);
      } else {
        camera.position.set(0, 0.35, 15.5);
        earthSystem.position.copy(EARTH_POSITION);
      }

      camera.lookAt(width <= 760 ? 1.8 : 1.6, width <= 760 ? -1.6 : -1.4, 0);
      camera.updateProjectionMatrix();
      sunLight.target.position.copy(earthSystem.position);
    }

    const projected = new THREE.Vector3();
    const worldHome = new THREE.Vector3();
    const worldEarthCenter = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const toCamera = new THREE.Vector3();

    function updateMarker() {
      if (!marker) return;

      homeAnchor.getWorldPosition(worldHome);
      earthSystem.getWorldPosition(worldEarthCenter);
      normal.copy(worldHome).sub(worldEarthCenter).normalize();
      toCamera.copy(camera.position).sub(worldHome).normalize();
      const visible = normal.dot(toCamera) > 0.06;

      projected.copy(worldHome).project(camera);
      const x = (projected.x * 0.5 + 0.5) * stage.clientWidth;
      const y = (-projected.y * 0.5 + 0.5) * stage.clientHeight;

      marker.style.left = `${x}px`;
      marker.style.top = `${y}px`;
      marker.style.opacity = visible ? "1" : "0";
    }

    const clock = new THREE.Clock();
    let frameId = 0;

    function animate() {
      const delta = Math.min(clock.getDelta(), 0.05);

      if (!reducedMotion.matches) {
        earth.rotation.y += delta * EARTH_ROTATION_SPEED;
        clouds.rotation.y += delta * CLOUD_ROTATION_SPEED;
      }

      sunriseMaterial.uniforms.sunWorldPosition.value.copy(sun.position);
      updateMarker();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }

    function handleVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(frameId);
      } else {
        clock.getDelta();
        animate();
      }
    }

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", () => cancelAnimationFrame(frameId), { once: true });

    resize();
    animate();
  }
})();
