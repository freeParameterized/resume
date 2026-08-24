export type LanguageRow = {
  name: string;
  strength: string;
  professionalYears: number;
  personalYears: number;
};

type SkillGroup = { label: string; items: string };

type Props = {
  languages: LanguageRow[];
  ai: LanguageRow[];
  spanish: string;
  yearsNote: string;
  groups: SkillGroup[];
};

function YearsTable({
  caption,
  nameHeading,
  rows,
}: {
  caption: string;
  nameHeading: string;
  rows: LanguageRow[];
}) {
  return (
    <table className="lang-table">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{nameHeading}</th>
          <th scope="col">Strength</th>
          <th scope="col">Professional years</th>
          <th scope="col">Personal / passion years</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <th scope="row">{row.name}</th>
            <td>{row.strength}</td>
            <td>{row.professionalYears}</td>
            <td>{row.personalYears}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Skills({ languages, ai, spanish, yearsNote, groups }: Props) {
  return (
    <div className="skills-block">
      <YearsTable caption="Languages" nameHeading="Language" rows={languages} />
      <YearsTable caption="AI and related tools" nameHeading="Tool" rows={ai} />
      <p className="spanish-callout">
        <strong>Spanish.</strong> {spanish}
      </p>
      <p className="years-note">{yearsNote}</p>
      {groups.length > 0 ? (
        <dl className="resume-skills">
          {groups.map((g) => (
            <div className="resume-skill" key={g.label}>
              <dt>{g.label}</dt>
              <dd>{g.items}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
