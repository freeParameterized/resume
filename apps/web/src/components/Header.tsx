import { useEffect, useId, useState, type MouseEvent } from "react";
import type { Health } from "../types";
import type { ThemeId } from "../theme";
import { onResumePdfClick, resumePdfLinkProps } from "../resumeDownload";

type Props = {
  name: string;
  theme: ThemeId;
  onToggleTheme: () => void;
  health: Health | null;
};

export function Header({ name, theme, onToggleTheme, health }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const live = Boolean(health?.ok);
  const printUrl = `${import.meta.env.BASE_URL}?resume=1`;

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("nav-menu-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("nav-menu-open");
    };
  }, [menuOpen]);

  const onPdfClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onResumePdfClick(e);
    closeMenu();
  };

  const onThemeClick = () => {
    onToggleTheme();
    closeMenu();
  };

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <strong>{name}</strong>
          <span>Free Parameter LLC · Chesterfield / St. Louis</span>
        </div>

        <nav className="nav nav-desktop" aria-label="Sections">
          <a href="#summary">Summary</a>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
          <a href="#education">Education</a>
          <a href="#deep-dive">Deep dive</a>
          <a className="ask-launch" {...resumePdfLinkProps} onClick={onResumePdfClick}>
            Download resume
          </a>
          <a href={printUrl}>Print view</a>
          <button type="button" className="ask-launch" onClick={onToggleTheme}>
            {theme === "light" ? "Dark theme" : "Light theme"}
          </button>
          <a className="ask-launch" href="mailto:pal@cadpal.net">
            Contact
          </a>
        </nav>

        <div className="header-mobile-bar">
          <a className="ask-launch ask-launch-mobile" {...resumePdfLinkProps} onClick={onPdfClick}>
            PDF
          </a>
          <button
            type="button"
            className="nav-menu-btn"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        <span className="visually-hidden">{live ? "API connected" : "Static corpus mode"}</span>
      </header>

      {menuOpen ? (
        <>
          <button type="button" className="drawer-backdrop nav-menu-backdrop" aria-label="Close menu" onClick={closeMenu} />
          <nav id={menuId} className="mobile-nav-panel fade-in" aria-label="Mobile sections">
            <a href="#summary" onClick={closeMenu}>
              Summary
            </a>
            <a href="#experience" onClick={closeMenu}>
              Experience
            </a>
            <a href="#projects" onClick={closeMenu}>
              Projects
            </a>
            <a href="#education" onClick={closeMenu}>
              Education
            </a>
            <a href="#deep-dive" onClick={closeMenu}>
              Deep dive
            </a>
            <a className="mobile-nav-primary" {...resumePdfLinkProps} onClick={onPdfClick}>
              Download resume PDF
            </a>
            <a href={printUrl} onClick={closeMenu}>
              Print view
            </a>
            <button type="button" className="mobile-nav-action" onClick={onThemeClick}>
              {theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            </button>
            <a className="mobile-nav-primary" href="mailto:pal@cadpal.net" onClick={closeMenu}>
              Contact
            </a>
          </nav>
        </>
      ) : null}
    </>
  );
}
