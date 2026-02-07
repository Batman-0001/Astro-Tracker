import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Earth component with atmosphere
const Earth = () => {
    const earthRef = useRef();
    const cloudsRef = useRef();
    const atmosphereRef = useRef();

    // Create textures programmatically (since we don't have actual textures)
    const earthTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Ocean base
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#1a365d');
        gradient.addColorStop(0.3, '#2563eb');
        gradient.addColorStop(0.7, '#1d4ed8');
        gradient.addColorStop(1, '#1e3a5f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 256);

        // Add some land masses (simplified)
        ctx.fillStyle = '#166534';
        // North America
        ctx.beginPath();
        ctx.ellipse(100, 80, 50, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        // South America
        ctx.beginPath();
        ctx.ellipse(130, 160, 25, 50, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Europe/Africa
        ctx.beginPath();
        ctx.ellipse(270, 100, 30, 60, 0.1, 0, Math.PI * 2);
        ctx.fill();
        // Asia
        ctx.beginPath();
        ctx.ellipse(380, 80, 70, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        // Australia
        ctx.beginPath();
        ctx.ellipse(430, 170, 25, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ice caps
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 15);
        ctx.fillRect(0, 241, 512, 15);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        return texture;
    }, []);

    // Clouds texture
    const cloudsTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 512, 256);

        // Random cloud patches
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 256;
            const r = Math.random() * 30 + 10;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        return texture;
    }, []);

    useFrame(({ clock }) => {
        const elapsed = clock.getElapsedTime();

        if (earthRef.current) {
            earthRef.current.rotation.y = elapsed * 0.05;
        }
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y = elapsed * 0.06;
        }
        if (atmosphereRef.current) {
            atmosphereRef.current.rotation.y = elapsed * 0.03;
        }
    });

    return (
        <group>
            {/* Earth */}
            <mesh ref={earthRef}>
                <sphereGeometry args={[2, 64, 64]} />
                <meshStandardMaterial
                    map={earthTexture}
                    roughness={0.8}
                    metalness={0.1}
                />
            </mesh>

            {/* Clouds */}
            <mesh ref={cloudsRef}>
                <sphereGeometry args={[2.02, 64, 64]} />
                <meshStandardMaterial
                    map={cloudsTexture}
                    transparent
                    opacity={0.4}
                    depthWrite={false}
                />
            </mesh>

            {/* Atmosphere glow */}
            <mesh ref={atmosphereRef} scale={1.15}>
                <sphereGeometry args={[2, 64, 64]} />
                <shaderMaterial
                    transparent
                    side={THREE.BackSide}
                    uniforms={{
                        glowColor: { value: new THREE.Color('#00d4ff') },
                    }}
                    vertexShader={`
                        varying vec3 vNormal;
                        void main() {
                            vNormal = normalize(normalMatrix * normal);
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `}
                    fragmentShader={`
                        uniform vec3 glowColor;
                        varying vec3 vNormal;
                        void main() {
                            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                            gl_FragColor = vec4(glowColor, intensity * 0.5);
                        }
                    `}
                />
            </mesh>
        </group>
    );
};

// Asteroid visualization
const AsteroidMarker = ({ position, size = 0.1, color = '#ef4444', name }) => {
    const meshRef = useRef();

    useFrame(({ clock }) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = clock.getElapsedTime() * 2;
            meshRef.current.rotation.y = clock.getElapsedTime() * 1.5;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <dodecahedronGeometry args={[size, 0]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.5}
                roughness={0.3}
            />
        </mesh>
    );
};

// Orbit ring
const OrbitRing = ({ radius, color = '#ffffff', opacity = 0.2 }) => {
    return (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 0.02, radius + 0.02, 64]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

// Main Scene
const Scene = ({ asteroids = [] }) => {
    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 3, 5]} intensity={1.5} />
            <pointLight position={[-5, -3, -5]} intensity={0.5} color="#ffd700" />

            {/* Stars background */}
            <Stars
                radius={100}
                depth={50}
                count={5000}
                factor={4}
                saturation={0}
                fade
                speed={1}
            />

            {/* Earth */}
            <Earth />

            {/* Orbit rings */}
            <OrbitRing radius={3} color="#00d4ff" opacity={0.1} />
            <OrbitRing radius={4} color="#6366f1" opacity={0.1} />
            <OrbitRing radius={5} color="#f59e0b" opacity={0.1} />

            {/* Asteroid markers (sample positions) */}
            {asteroids.slice(0, 10).map((asteroid, i) => {
                const angle = (i / 10) * Math.PI * 2;
                const distance = 3 + (asteroid.missDistanceLunar || 1) * 0.5;
                const x = Math.cos(angle) * distance;
                const z = Math.sin(angle) * distance;
                const y = (Math.random() - 0.5) * 0.5;

                const color = asteroid.riskCategory === 'high' ? '#ef4444' :
                    asteroid.riskCategory === 'moderate' ? '#f59e0b' :
                        asteroid.riskCategory === 'low' ? '#eab308' : '#22c55e';

                return (
                    <AsteroidMarker
                        key={asteroid.neo_reference_id || i}
                        position={[x, y, z]}
                        size={0.05 + (asteroid.estimatedDiameterMax || 100) / 5000}
                        color={color}
                        name={asteroid.name}
                    />
                );
            })}

            {/* Camera controls */}
            <OrbitControls
                enableZoom={true}
                enablePan={false}
                minDistance={4}
                maxDistance={15}
                autoRotate
                autoRotateSpeed={0.5}
            />
        </>
    );
};

// Main component
const Earth3D = ({ asteroids = [], className = '' }) => {
    return (
        <div className={`relative ${className}`}>
            <Canvas
                camera={{ position: [0, 2, 6], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <Scene asteroids={asteroids} />
            </Canvas>

            {/* Overlay info */}
            <div className="absolute bottom-4 left-4 glass px-4 py-2 text-sm">
                <p className="text-white/70">🌍 Drag to rotate • Scroll to zoom</p>
            </div>
        </div>
    );
};

export default Earth3D;
