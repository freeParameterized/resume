type Props = {
  kicker: string;
  title: string;
  subtitle: string;
  metrics?: string[];
};

export function HeroCopy({ kicker, title, subtitle, metrics }: Props) {
  return (
    <div className="hero-overlay">
      <div className="hero-kicker">{kicker}</div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {metrics?.length ? (
        <ul className="hero-metrics">
          {metrics.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
