import type { Project } from "../types";

type Props = {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ProjectList({ projects, selectedId, onSelect }: Props) {
  return (
    <div className="project-grid">
      {projects.map((p) => (
        <button
          type="button"
          key={p.id}
          className={`project-card${selectedId === p.id ? " is-active" : ""}`}
          onClick={() => onSelect(p.id)}
        >
          <div className="status">
            {p.featured ? "Featured · " : ""}
            {p.visibility}
          </div>
          <h3>{p.name}</h3>
          <p>{p.summary}</p>
        </button>
      ))}
    </div>
  );
}
