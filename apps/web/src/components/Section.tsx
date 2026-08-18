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
        <span className="idx">{index}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
