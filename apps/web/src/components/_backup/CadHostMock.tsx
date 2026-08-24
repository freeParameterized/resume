/**
 * BACKUP 2026-08-23
 * Interactive CADNAT Host mock (Dear ImGui lookalike + Three.js viewport).
 * Removed from the public resume because ML hiring managers are unlikely to
 * recognize BricsCAD / BRX / LISP hot-load chrome unless they have also
 * worked in CAD. Restore by uncommenting the CadHostMock usage in App.tsx
 * and copying this file back to ../CadHostMock.tsx.
 */
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";

const SDKS = [
  { id: "bricscad", label: "BricsCAD V25", kind: "BRX / LISP" },
  { id: "autocad", label: "AutoCAD 2025", kind: "COM / .NET" },
  { id: "civil3d", label: "Civil 3D 2025", kind: "COM / Civil API" },
] as const;

const PLUGINS = [
  { id: "lisp", label: "site-labels.lsp", kind: "LISP" },
  { id: "csharp", label: "SheetAudit.dll", kind: "C#" },
  { id: "brx", label: "GradeTools.brx", kind: "BRX" },
] as const;

function AlignmentScene() {
  const boxes = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x: (i - 3) * 1.15,
        z: Math.sin(i * 0.7) * 0.85,
        h: 0.35 + (i % 3) * 0.28,
      })),
    [],
  );

  return (
    <>
      <color attach="background" args={["#12151a"]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 8, 3]} intensity={1.1} />
      <gridHelper args={[12, 12, "#3d4a55", "#252b32"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#1a1f24" />
      </mesh>
      {boxes.map((b) => (
        <mesh key={`${b.x}-${b.z}`} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[0.7, b.h, 0.7]} />
          <meshStandardMaterial color="#6a8ea3" metalness={0.15} roughness={0.55} />
        </mesh>
      ))}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0.18]}>
        <planeGeometry args={[9.5, 0.18]} />
        <meshStandardMaterial color="#c4a574" />
      </mesh>
    </>
  );
}

type Props = {
  compact?: boolean;
};

/** Visual mock of the ImGui CAD host. Does not talk to Windows COM or a CAD product. */
export function CadHostMock({ compact = false }: Props) {
  const [sdk, setSdk] = useState<(typeof SDKS)[number]["id"]>("civil3d");
  const [loaded, setLoaded] = useState<Record<string, boolean>>({ lisp: true });
  const [log, setLog] = useState("Host online. Scanning HKLM for CAD products...");

  const connect = (id: (typeof SDKS)[number]["id"]) => {
    const found = SDKS.find((s) => s.id === id)!;
    setSdk(id);
    setLog(`COM bind: ${found.label} (${found.kind}). Runtime SDK paths resolved.`);
  };

  const togglePlugin = (id: string) => {
    const plug = PLUGINS.find((p) => p.id === id)!;
    setLoaded((prev) => {
      const next = !prev[id];
      setLog(next ? `Hot-load ${plug.label} into ${sdk}.` : `Unload ${plug.label}.`);
      return { ...prev, [id]: next };
    });
  };

  return (
    <figure className={`cad-host-mock${compact ? " is-compact" : ""}`}>
      <div className="cad-host-window" aria-label="CAD integration host mock">
        <header className="cad-host-title">
          <span>CADNAT Host</span>
          <span className="cad-host-winbtns" aria-hidden="true">
            _ □ ×
          </span>
        </header>
        <div className="cad-host-body">
          <aside className="cad-host-pane">
            <div className="cad-host-label">Discovered products</div>
            {SDKS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={sdk === item.id ? "is-on" : ""}
                onClick={() => connect(item.id)}
              >
                {item.label}
                <small>{item.kind}</small>
              </button>
            ))}
            <div className="cad-host-label">Hot-load</div>
            {PLUGINS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={loaded[item.id] ? "is-on" : ""}
                onClick={() => togglePlugin(item.id)}
              >
                {loaded[item.id] ? "Unload" : "Load"} {item.label}
              </button>
            ))}
          </aside>
          <div className="cad-host-view">
            <Canvas
              className="cad-host-canvas"
              dpr={[1, 1.5]}
              camera={{ position: [5.2, 4.2, 5.8], fov: 42 }}
              gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
            >
              <AlignmentScene />
              <OrbitControls enablePan={false} minDistance={4} maxDistance={14} />
            </Canvas>
            <pre className="cad-host-log">{log}</pre>
          </div>
        </div>
      </div>
      <figcaption>
        Interactive mock of the Dear ImGui host. The real build is C++17 on Windows and talks to installed CAD
        products through COM. This page does not launch AutoCAD, BricsCAD, or Civil 3D.
      </figcaption>
    </figure>
  );
}
