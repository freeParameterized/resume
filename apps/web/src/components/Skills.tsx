import type { SkillGroup } from "../types";

type Props = {
  groups: Array<SkillGroup | { label: string; items: string | string[] }>;
};

export function Skills({ groups }: Props) {
  return (
    <dl className="resume-skills">
      {groups.map((g) => {
        const items = Array.isArray(g.items) ? g.items.join(", ") : g.items;
        return (
          <div className="resume-skill" key={g.label}>
            <dt>{g.label}</dt>
            <dd>{items}</dd>
          </div>
        );
      })}
    </dl>
  );
}
