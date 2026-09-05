import type { ReactNode } from "react";

type Props = {
  id: string;
  index: string;
  title: string;
  children: ReactNode;
};

export function Section({ id, index, title, children }: Props) {
  return (
    <section className="section" id={id}>
      <div className="section-head">
        {index ? <span className="idx">{index}</span> : null}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
