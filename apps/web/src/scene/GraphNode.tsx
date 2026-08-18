import { Html } from "@react-three/drei";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { GROUP_COLOR, type GraphNodeDef } from "../graph";

type Props = {
  node: GraphNodeDef;
  label: string;
  selected: boolean;
  onSelect: (id: string) => void;
};

export function GraphNode({ node, label, selected, onSelect }: Props) {
  const mesh = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = GROUP_COLOR[node.group];
  const scale = node.group === "featured" ? 1.18 : 1;

  useFrame((_, dt) => {
    if (!mesh.current) return;
    const target = (selected || hovered ? 1.28 : 1) * scale;
    const next = mesh.current.scale.x + (target - mesh.current.scale.x) * Math.min(1, dt * 8);
    mesh.current.scale.setScalar(next);
    mesh.current.rotation.y += dt * 0.25;
  });

  return (
    <group position={node.position}>
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected || hovered ? 0.55 : 0.18}
          metalness={0.35}
          roughness={0.35}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.34, 24]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.9 : 0.35} />
      </mesh>
      <Html center distanceFactor={14} zIndexRange={[10, 0]} className="node-label">
        {label}
      </Html>
    </group>
  );
}
