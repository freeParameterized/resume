import type { SkillGroup } from "../types";

export function Skills({ groups }: { groups: SkillGroup[] }) {
  return (
    <div className="skill-grid">
      {groups.map((g) => (
        <article key={g.id} className="skill-card">
          <h3>{g.label}</h3>
          <ul>
            {g.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
