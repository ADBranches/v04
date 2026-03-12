// app/components/layout/footer.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../config/routes-config";

const footerSections = [
  {
    title: "Explore",
    links: [
      { label: "Destinations", to: ROUTES.destinations.list },
      { label: "Guides", to: ROUTES.guides.list },
      { label: "Bookings", to: ROUTES.bookings?.list || "/bookings" },
      { label: "Search", to: "/search" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Home", to: ROUTES.home || "/" },
      { label: "About Us", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Become a Guide", to: ROUTES.auth.register },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", to: "/help" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Safety & Trust", to: "/safety" },
    ],
  },
];

const socialLinks = [
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.6-1.6H16.7V4.8c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.5-4.3 4.4V11H7v3h2.8v8h3.7Z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "#",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.8-6.3L6.6 22H3.5l7.2-8.3L1 2h6.3L11.6 8 18.9 2Zm-1.1 18h1.7L6.1 3.9H4.3L17.8 20Z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 1.9A3.9 3.9 0 0 0 3.9 7.8v8.4A3.9 3.9 0 0 0 7.8 20h8.4a3.9 3.9 0 0 0 3.9-3.8V7.8A3.9 3.9 0 0 0 16.2 4H7.8Zm8.9 1.4a1.2 1.2 0 1 1 0 2.3 1.2 1.2 0 0 1 0-2.3ZM12 7a5 5 0 1 1 0 10.1A5 5 0 0 1 12 7Zm0 1.9a3.1 3.1 0 1 0 0 6.3 3.1 3.1 0 0 0 0-6.3Z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t-4 border-uganda-yellow bg-uganda-black text-white">
      {/* Decorative background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,193,7,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(227,24,55,0.18),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
      <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-uganda-yellow/10 blur-3xl" />
      <div className="absolute right-0 top-16 h-64 w-64 rounded-full bg-uganda-red/10 blur-3xl" />

      <div className="relative container mx-auto px-4 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1.7fr]">
          {/* Brand / story */}
          <div>
            <Link to={ROUTES.home || "/"} className="inline-flex items-center gap-3 group">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-uganda-yellow text-sm font-black text-uganda-black shadow-lg transition duration-300 group-hover:scale-105 group-hover:bg-white">
                JT
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/60">Explore Uganda</p>
                <p className="text-2xl font-black text-white">
                  Jumuiya<span className="text-uganda-yellow">Tours</span>
                </p>
              </div>
            </Link>

            <p className="mt-6 max-w-md text-sm leading-7 text-white/70 sm:text-base">
              Discover authentic Ugandan adventures with trusted local guides, curated destinations,
              and a booking experience built to feel bold, modern, and proudly rooted in Uganda.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur-sm">
                Pearl of Africa
              </span>
              <span className="rounded-full border border-uganda-red/20 bg-uganda-red/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur-sm">
                Trusted Guides
              </span>
            </div>

            <div className="mt-8 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition duration-300 hover:-translate-y-1 hover:border-uganda-yellow hover:bg-uganda-yellow hover:text-uganda-black"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link groups */}
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-black uppercase tracking-[0.24em] text-uganda-yellow">
                  {section.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-white/70 transition duration-300 hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Jumuiya Tours. All rights reserved.</p>
          <p className="font-medium text-white/65">
            Made with <span className="text-uganda-red">♥</span> for Uganda
          </p>
        </div>
      </div>
    </footer>
  );
}