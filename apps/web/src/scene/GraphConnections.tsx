import { Line } from "@react-three/drei";
import { GRAPH_EDGES, GRAPH_NODES } from "../graph";

export function GraphConnections() {
  const byId = new Map(GRAPH_NODES.map((n) => [n.id, n.position]));
  return (
    <>
      {GRAPH_EDGES.map(([a, b]) => {
        const pa = byId.get(a);
        const pb = byId.get(b);
        if (!pa || !pb) return null;
        return (
          <Line
            key={`${a}-${b}`}
            points={[pa, pb]}
            color="#6d8b96"
            lineWidth={1}
            transparent
            opacity={0.38}
          />
        );
      })}
    </>
  );
}
