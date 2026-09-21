"use client";

import { useId, useState, type ReactNode } from "react";
import type { CategoryProgress } from "../lib/types";

export function DocumentGroup({ name, categories, collapsible = false, children }: {
  name: string;
  categories: CategoryProgress[];
  collapsible?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const complete = categories.length > 0 && categories.every(category => category.satisfied);
  // Set the default only on arrival. Uploads/removals must not override the
  // user's choice or suddenly hide upload feedback and retry controls.
  const [expanded, setExpanded] = useState(() => !complete);
  const open = !collapsible || expanded;
  const progress = `${categories.filter(category => category.documents.length > 0).length} de ${categories.length} com arquivos`;

  return <section className="document-group" aria-labelledby={`${id}-heading`}>
    <header className={`document-group-head${collapsible ? " document-group-head-collapsible" : ""}`}>
      <h3 id={`${id}-heading`}>
        {collapsible ? <button type="button" className="document-group-toggle"
          aria-expanded={open} aria-controls={`${id}-content`} onClick={() => setExpanded(current => !current)}>
          <span className="document-group-name">{name}</span>
          <span className={`document-group-progress${complete ? " is-complete" : ""}`}>{progress}</span>
          <span className="document-group-arrow" aria-hidden="true">▸</span>
        </button> : name}
      </h3>
      {!collapsible && <span>{progress}</span>}
    </header>
    {collapsible ? <div id={`${id}-content`} className={`document-group-content${open ? " is-open" : ""}`}
      aria-hidden={!open} inert={!open}>
      <div className="document-group-content-inner"><div className="category-list">{children}</div></div>
    </div> : <div className="category-list">{children}</div>}
  </section>;
}
