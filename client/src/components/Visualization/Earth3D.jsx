import { useRef, useMemo, useCallback, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import Atmosphere from "./Atmosphere";
import AsteroidOrbit from "./AsteroidOrbit";
import CameraController from "./CameraController";

// ─── Real Earth Texture URLs (Three.js / NASA Blue Marble) ──────────
const TEX_BASE =
  "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r161/examples/textures/planets/";
const EARTH_DAY_URL = TEX_BASE + "earth_atmos_2048.jpg";
const EARTH_NIGHT_URL = TEX_BASE + "earth_lights_2048.png";
const EARTH_NORMAL_URL = TEX_BASE + "earth_normal_2048.jpg";
const EARTH_SPECULAR_URL = TEX_BASE + "earth_specular_2048.jpg";
const EARTH_CLOUDS_URL = TEX_BASE + "earth_clouds_1024.png";

// ─── Earth with day/night shader ─────────────────────────────────────

const earthVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vDotNL;

    uniform vec3 sunDirection;

    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        vDotNL = dot(vNormal, normalize(sunDirection));
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

const earthFragmentShader = `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform sampler2D specularMap;
    uniform vec3 sunDirection;
    uniform float time;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vDotNL;

    void main() {
        vec4 dayColor = texture2D(dayTexture, vUv);
        vec4 nightColor = texture2D(nightTexture, vUv);
        float specMask = texture2D(specularMap, vUv).r;

        vec3 sunDir = normalize(sunDirection);
        float sunDot = dot(vNormal, sunDir);

        // Day/night with smooth terminator
        float dayFactor = smoothstep(-0.15, 0.25, sunDot);

        // Specular on oceans (specular map: bright = water)
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 halfDir = normalize(sunDir + viewDir);
        float spec = pow(max(dot(vNormal, halfDir), 0.0), 64.0) * specMask;
        vec3 specular = spec * vec3(0.5, 0.6, 0.7) * dayFactor;

        // Night light twinkle
        float twinkle = 0.92 + 0.08 * sin(time * 1.5 + vUv.x * 100.0 + vUv.y * 60.0);
        vec3 night = nightColor.rgb * twinkle * 1.6;

        // Mix day & night
        vec3 color = mix(night, dayColor.rgb, dayFactor) + specular;

        // Soft atmospheric rim glow
        float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
        float rimGlow = pow(rim, 3.0);
        vec3 rimColor = vec3(0.3, 0.6, 1.0) * rimGlow * 0.35;
        color += rimColor;

        gl_FragColor = vec4(color, 1.0);
    }
`;

const Earth = () => {
  const earthRef = useRef();
  const cloudsRef = useRef();

  // Load real NASA satellite textures
  const [
    dayTexture,
    nightTexture,
    normalTexture,
    specularTexture,
    cloudsTexture,
  ] = useLoader(THREE.TextureLoader, [
    EARTH_DAY_URL,
    EARTH_NIGHT_URL,
    EARTH_NORMAL_URL,
    EARTH_SPECULAR_URL,
    EARTH_CLOUDS_URL,
  ]);

  // Configure textures
  useMemo(() => {
    [
      dayTexture,
      nightTexture,
      normalTexture,
      specularTexture,
      cloudsTexture,
    ].forEach((t) => {
      if (t) {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
      }
    });
  }, [dayTexture, nightTexture, normalTexture, specularTexture, cloudsTexture]);

  const sunDirection = useMemo(
    () => new THREE.Vector3(5, 2, 3).normalize(),
    [],
  );

  const earthUniforms = useMemo(
    () => ({
      dayTexture: { value: dayTexture },
      nightTexture: { value: nightTexture },
      specularMap: { value: specularTexture },
      sunDirection: { value: sunDirection },
      time: { value: 0 },
    }),
    [dayTexture, nightTexture, specularTexture, sunDirection],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (earthRef.current) {
      earthRef.current.rotation.y = t * 0.04;
      earthRef.current.material.uniforms.time.value = t;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = t * 0.05;
    }
  });

  return (
    <group>
      {/* Earth with day/night shader */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 128, 64]} />
        <shaderMaterial
          uniforms={earthUniforms}
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.025, 64, 64]} />
        <meshStandardMaterial
          map={cloudsTexture}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>

      {/* Atmosphere glow — softer, realistic blue */}
      <Atmosphere radius={2} color="#4da6ff" intensity={0.8} falloff={3.5} />

      {/* Inner haze */}
      <Atmosphere radius={2} color="#88ccff" intensity={0.3} falloff={5.0} />
    </group>
  );
};

// ─── Reference grid rings ────────────────────────────────────────────
const ReferenceRing = ({
  radius,
  color = "#ffffff",
  opacity = 0.08,
  dashed = false,
}) => {
  const points = useMemo(() => {
    const pts = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(theta) * radius,
          0,
          Math.sin(theta) * radius,
        ),
      );
    }
    return pts;
  }, [radius]);

  const geometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(points),
    [points],
  );

  return (
    <line geometry={geometry}>
      <lineDashedMaterial
        color={color}
        transparent
        opacity={opacity}
        dashSize={dashed ? 0.3 : 100}
        gapSize={dashed ? 0.15 : 0}
      />
    </line>
  );
};

// ─── Sun light flare ─────────────────────────────────────────────────
const SunLight = () => {
  return (
    <group>
      <directionalLight
        position={[50, 20, 30]}
        intensity={2.0}
        color="#fff5e6"
        castShadow={false}
      />
      {/* Fill light for dark side visibility */}
      <ambientLight intensity={0.08} color="#1a1a3a" />
      {/* Subtle back-rim light */}
      <pointLight
        position={[-20, -10, -15]}
        intensity={0.3}
        color="#4444aa"
        distance={60}
      />
    </group>
  );
};

// ─── Main Scene ──────────────────────────────────────────────────────
const Scene = ({
  asteroids = [],
  timeOffset = 0,
  selectedAsteroid = null,
  hoveredAsteroid = null,
  onSelectAsteroid,
  onHoverAsteroid,
  useFreeCamera = false,
}) => {
  return (
    <>
      {/* Lighting */}
      <SunLight />

      {/* Stars */}
      <Stars
        radius={200}
        depth={80}
        count={8000}
        factor={5}
        saturation={0.1}
        fade
        speed={0.5}
      />

      {/* Earth — wrapped in Suspense for texture loading */}
      <Suspense fallback={null}>
        <Earth />
      </Suspense>

      {/* Reference distance rings */}
      <ReferenceRing radius={3.5} color="#00d4ff" opacity={0.06} />
      <ReferenceRing radius={5} color="#6366f1" opacity={0.04} dashed />
      <ReferenceRing radius={7} color="#6366f1" opacity={0.03} dashed />

      {/* Asteroid orbits */}
      {asteroids.slice(0, 20).map((asteroid) => (
        <AsteroidOrbit
          key={asteroid.neo_reference_id || asteroid._id}
          asteroid={asteroid}
          timeOffset={timeOffset}
          selected={
            selectedAsteroid?.neo_reference_id === asteroid.neo_reference_id
          }
          hovered={
            hoveredAsteroid?.neo_reference_id === asteroid.neo_reference_id
          }
          onSelect={onSelectAsteroid}
          onHover={onHoverAsteroid}
          showOrbit={true}
          showLabel={asteroid.isPotentiallyHazardous}
        />
      ))}

      {/* Camera */}
      {useFreeCamera ?
        <OrbitControls
          enableZoom
          enablePan={false}
          minDistance={3.5}
          maxDistance={25}
          autoRotate={!selectedAsteroid}
          autoRotateSpeed={0.3}
          enableDamping
          dampingFactor={0.05}
        />
      : <CameraController
          targetAsteroid={selectedAsteroid}
          timeOffset={timeOffset}
          enabled={true}
        />
      }
    </>
  );
};

// ─── Main exported component ─────────────────────────────────────────
const Earth3D = ({
  asteroids = [],
  className = "",
  timeOffset = 0,
  selectedAsteroid = null,
  hoveredAsteroid = null,
  onSelectAsteroid,
  onHoverAsteroid,
  useFreeCamera = false,
}) => {
  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [0, 3, 9], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
        onPointerMissed={() => onSelectAsteroid?.(null)}
      >
        <Scene
          asteroids={asteroids}
          timeOffset={timeOffset}
          selectedAsteroid={selectedAsteroid}
          hoveredAsteroid={hoveredAsteroid}
          onSelectAsteroid={onSelectAsteroid}
          onHoverAsteroid={onHoverAsteroid}
          useFreeCamera={useFreeCamera}
        />
      </Canvas>
    </div>
  );
};

export default Earth3D;
