import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Vector3 } from "three";
import type { Project } from "../types";
import { GRAPH_NODES } from "../graph";
import { GraphConnections } from "./GraphConnections";
import { GraphNode } from "./GraphNode";
import { SceneEnvironment } from "./SceneEnvironment";

type Props = {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  sceneBg?: string;
  reducedMotion?: boolean;
};

function FocusRig({ selectedId }: { selectedId: string | null }) {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as unknown as { target: Vector3 } | undefined;
  const look = useRef(new Vector3(0, 0.4, 0));
  useFrame((_, dt) => {
    const node = GRAPH_NODES.find((n) => n.id === selectedId);
    const target = node ? new Vector3(...node.position) : new Vector3(0, 0.4, 0);
    look.current.lerp(target, Math.min(1, dt * 2.4));
    if (controls) {
      controls.target.lerp(look.current, Math.min(1, dt * 2.4));
    } else {
      camera.lookAt(look.current);
    }
  });
  return null;
}

export function WorkGraph({
  projects,
  selectedId,
  onSelect,
  sceneBg = "#080a0c",
  reducedMotion = false,
}: Props) {
  const labels = useMemo(() => {
    const map = new Map(projects.map((p) => [p.id, p.shortName || p.name]));
    map.set("about", "Profile");
    return map;
  }, [projects]);

  const reduceMotion =
    reducedMotion ||
    (typeof window !== "undefined" &&
      (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        document.documentElement.dataset.motion === "reduce"));

  // Phones pay for every extra pixel and sample, so drop resolution and antialiasing there.
  const small = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;

  return (
    <Canvas
      className="hero-canvas"
      camera={{ position: [0, 2.2, 8.4], fov: 42 }}
      dpr={small ? [1, 1.4] : [1, 1.75]}
      gl={{ antialias: !small, alpha: false, powerPreference: small ? "default" : "high-performance" }}
      fallback={<div className="scene-fallback">WebGL is unavailable. Use the project list below — the 3D graph is optional.</div>}
      onPointerMissed={() => onSelect("")}
      aria-hidden
    >
      <SceneEnvironment bg={sceneBg} />
      <GraphConnections />
      {GRAPH_NODES.map((node) => (
        <GraphNode
          key={node.id}
          node={node}
          label={labels.get(node.id) || node.id}
          selected={selectedId === node.id}
          onSelect={onSelect}
        />
      ))}
      <FocusRig selectedId={selectedId} />
      <OrbitControls
        makeDefault
        enableDamping
        autoRotate={!reduceMotion && !selectedId}
        autoRotateSpeed={0.35}
        minDistance={4}
        maxDistance={16}
        maxPolarAngle={Math.PI * 0.82}
      />
    </Canvas>
  );
}
