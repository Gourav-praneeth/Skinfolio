"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/routine", label: "Routine", icon: RoutineIcon },
  { href: "/journal", label: "Journal", icon: JournalIcon },
  { href: "/chat", label: "Chat", icon: ChatIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[rgba(255,250,245,0.92)] backdrop-blur-md md:inset-y-0 md:left-0 md:right-auto md:w-20 md:border-r md:border-t-0"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2 md:h-full md:max-w-none md:flex-col md:justify-center md:gap-4 md:px-0">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1 md:flex-none">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[0.7rem] font-semibold transition md:px-3 ${
                  active
                    ? "text-[var(--brand)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-2xl ${
                    active ? "bg-[var(--brand-soft)]" : "bg-transparent"
                  }`}
                >
                  <Icon active={active} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RoutineIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinecap="round"
      />
    </svg>
  );
}

function JournalIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
      />
      <path d="M9 8h8M9 12h8M9 16h5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H10l-4 3.5V6.5Z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinejoin="round"
      />
    </svg>
  );
}
