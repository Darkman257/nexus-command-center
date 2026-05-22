import { Suspense, useRef, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

interface Props {
  online: boolean;
}

function PlasmaSphere({ online }: Props) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const innerRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.1;
      meshRef.current.rotation.x = Math.sin(t * 0.08) * 0.1;
      const pulse = 1 + Math.sin(t * 0.5) * 0.025;
      meshRef.current.scale.setScalar(pulse);
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.15;
      innerRef.current.rotation.z = t * 0.08;
    }
  });

  const coreColor = online ? '#00d2ff' : '#ff4444';
  const glowColor = online ? '#7b61ff' : '#880000';

  return (
    <>
      {/* Inner crystal core */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.55, 2]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={1.5}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Plasma outer shell */}
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color={glowColor}
          emissive={coreColor}
          emissiveIntensity={0.5}
          distort={0.25}
          speed={1.0}
          roughness={0.1}
          metalness={0.2}
          transparent
          opacity={0.45}
        />
      </Sphere>

      {/* Outer halo ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.45, 0.012, 8, 80]} />
        <meshStandardMaterial color={coreColor} emissive={coreColor} emissiveIntensity={2} />
      </mesh>
      <mesh rotation={[Math.PI / 3, 0.5, 0]}>
        <torusGeometry args={[1.6, 0.006, 8, 80]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.2} transparent opacity={0.4}/>
      </mesh>

      {/* Core point light */}
      <pointLight color={coreColor} intensity={online ? 5 : 2} distance={8} />
      <pointLight color={glowColor} intensity={2} distance={6} position={[1, 1, 1]} />
    </>
  );
}

export const NovaCore3D = memo(function NovaCore3D({ online }: Props) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 4], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.1} />
          <Environment preset="night" />

          <PlasmaSphere online={online} />

          <EffectComposer>
            <Bloom
              intensity={1.2}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        </Canvas>
      </Suspense>
    </div>
  );
});
