import { useEffect, useState } from "react";
import Icon, { Mark } from "./Icons";

// Standalone sticky header. Visual/navigation only: no data, no API.
export default function SiteHeader({ tab, setTab }) {
  const [section, setSection] = useState("hero");

  // Highlight the link for the part of the page you are looking at.
  useEffect(() => {
    let raf = 0;
    const calc = () => {
      raf = 0;
      const line = window.innerHeight * 0.4;
      let cur = "hero";
      for (const id of ["start", "results", "how"]) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) cur = id;
      }
      setSection(cur);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(calc);
    };
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    calc();
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  function flash(el) {
    el.classList.remove("flash");
    void el.offsetWidth; // restart the animation
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 1500);
  }

  function go(id, nextTab) {
    if (nextTab) setTab(nextTab);
    setTimeout(
      () => {
        if (id === "hero") {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        flash(el);
      },
      nextTab ? 40 : 0
    );
  }

  const active =
    section === "hero" ? "home"
    : section === "how" ? "how"
    : tab === "upload" ? "upload"
    : "patients";

  const items = [
    { key: "home", label: "Home", onClick: () => go("hero") },
    { key: "patients", label: "Patients", onClick: () => go("start", "patients") },
    { key: "upload", label: "Upload", onClick: () => go("start", "upload") },
    { key: "how", label: "How it works", onClick: () => go("how") },
  ];

  return (
    <header className="site-header">
      <div className="header-inner">
        <button type="button" className="brand" onClick={() => go("hero")} aria-label="Medico, back to top">
          <span className="brand-mark"><Mark size={20} /></span>
          <span className="brand-name">Medico</span>
        </button>

        <nav className="nav-pill" aria-label="Primary">
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              className={"nav-link" + (active === it.key ? " active" : "")}
              aria-current={active === it.key ? "page" : undefined}
              onClick={it.onClick}
            >
              {it.label}
            </button>
          ))}
        </nav>

        <div className="header-tools">
          <button type="button" className="tool-link" onClick={() => window.print()}>
            <Icon name="print" size={16} /> <span>Print</span>
          </button>
          <button type="button" className="cta" onClick={() => go("start", "patients")}>
            Try a sample <span className="circle-arrow light"><Icon name="arrow" size={14} /></span>
          </button>
        </div>
      </div>
      <span className="progress" aria-hidden="true" />
    </header>
  );
}
