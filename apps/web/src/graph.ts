export type GraphGroup = "featured" | "cad" | "fullstack" | "systems" | "ml";

export type GraphNodeDef = {
  id: string;
  position: [number, number, number];
  group: GraphGroup;
};

export const GRAPH_NODES: GraphNodeDef[] = [
  { id: "about", position: [0, -0.15, 2.35], group: "fullstack" },
  { id: "digital-twin-pro", position: [0, 1.35, 0], group: "featured" },
  { id: "cadnat-bridge", position: [-3.15, 0.85, -1.05], group: "cad" },
  { id: "runoff-hydrology", position: [-4.35, -0.15, 0.55], group: "cad" },
  { id: "ctb-standards-diff", position: [-3.55, -1.35, 1.75], group: "cad" },
  { id: "offline-cad-voice", position: [-2.05, -0.75, -2.15], group: "ml" },
  { id: "hatchcalc", position: [-1.25, -1.7, 0.35], group: "cad" },
  { id: "property-set", position: [-2.45, -1.95, -0.65], group: "cad" },
  { id: "maintenance-tracker", position: [3.35, 0.7, -0.75], group: "fullstack" },
  { id: "backup-deduper", position: [3.75, -0.55, 1.35], group: "systems" },
  { id: "local-llm", position: [0.55, 2.55, -1.7], group: "ml" },
  { id: "circle-visualizer", position: [2.15, 2.05, 1.15], group: "systems" },
  { id: "photogrammetry", position: [-1.35, 1.95, 1.55], group: "ml" },
  { id: "cbp-ocr", position: [1.75, -1.55, -1.45], group: "ml" },
];

export const GRAPH_EDGES: [string, string][] = [
  ["about", "digital-twin-pro"],
  ["about", "local-llm"],
  ["digital-twin-pro", "local-llm"],
  ["digital-twin-pro", "maintenance-tracker"],
  ["digital-twin-pro", "backup-deduper"],
  ["cadnat-bridge", "runoff-hydrology"],
  ["cadnat-bridge", "offline-cad-voice"],
  ["cadnat-bridge", "property-set"],
  ["runoff-hydrology", "ctb-standards-diff"],
  ["runoff-hydrology", "property-set"],
  ["runoff-hydrology", "cbp-ocr"],
  ["local-llm", "offline-cad-voice"],
  ["local-llm", "cbp-ocr"],
  ["local-llm", "photogrammetry"],
  ["hatchcalc", "cadnat-bridge"],
  ["circle-visualizer", "digital-twin-pro"],
];

export const GROUP_COLOR: Record<GraphGroup, string> = {
  featured: "#c4a574",
  cad: "#8fb3c0",
  fullstack: "#9bb59a",
  systems: "#b8a089",
  ml: "#7ea4c9",
};
