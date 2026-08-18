import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Points } from "three";
import { Grid } from "@react-three/drei";

export function SceneEnvironment({ bg = "#080a0c" }: { bg?: string }) {
  const points = useRef<Points>(null);
  const positions = useMemo(() => {
    const n = 420;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = Math.random() * 7 - 1.8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (points.current) points.current.rotation.y = clock.elapsedTime * 0.012;
  });

  return (
    <>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 10, 26]} />
      <ambientLight intensity={0.32} />
      <directionalLight position={[7, 9, 4]} intensity={0.85} color="#f0e6d0" />
      <pointLight position={[-5, 3, -2]} intensity={0.45} color="#7eb8c9" />
      <Grid
        args={[24, 24]}
        cellSize={0.5}
        cellColor="#1a222a"
        sectionSize={2.5}
        sectionColor="#3d4a3c"
        fadeDistance={22}
        fadeStrength={1.2}
        infiniteGrid
        position={[0, -2.25, 0]}
      />
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.028} color="#c4a574" transparent opacity={0.42} sizeAttenuation depthWrite={false} />
      </points>
    </>
  );
}
