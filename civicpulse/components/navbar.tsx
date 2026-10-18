"use client";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { label: "How it works", href: "/civic#how-it-works" },
  { label: "The Map", href: "/civic/map" },
  { label: "Dashboard", href: "/civic/dashboard" },
  { label: "For Cities", href: "/civic/for-cities" },
  { label: "About", href: "/civic/about" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler(); // initial check
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full">
      <nav className={`transition-all duration-300 mx-auto flex h-16 max-w-6xl items-center justify-between px-5
        ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-[#E8E4DB]/60 shadow-sm' : 'bg-white/40 backdrop-blur-sm border-transparent'}`}>
        <a href="/civic" className="iridescent-text font-display text-2xl font-medium tracking-tight">
          CivicPulse
        </a>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="font-sans text-sm font-semibold text-[#1A1208] hover:text-[#5BBFBF] transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href="/civic#upload"
            className="shimmer-btn rounded-full px-5 py-2 font-sans text-sm font-medium shadow-sm"
          >
            Report an Issue
          </a>

          {/* Hamburger — mobile only */}
          <button
            className="flex flex-col gap-1.5 md:hidden p-1"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-5 bg-[#1A1208] transition-all duration-200 ${open ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 w-5 bg-[#1A1208] transition-all duration-200 ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-[#1A1208] transition-all duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-[#E8E4DB] px-5 py-4 space-y-4 shadow-md">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block font-sans text-sm font-semibold text-[#1A1208] hover:text-[#5BBFBF] transition-colors"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
