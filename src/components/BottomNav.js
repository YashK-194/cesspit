"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const hiddenOn =
    pathname?.startsWith("/login") || pathname?.startsWith("/signup");
  if (hiddenOn) return null;

  const items = [
    {
      href: "/",
      label: "Home",
      icon: (isActive) => (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 3l9 7v11h-6v-6H9v6H3V10l9-7z"
            fill={isActive ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },

    {
      href: "/new",
      label: "New",
      icon: (isActive) => (
        <div
          className={`p-2 rounded-full ${
            isActive ? "bg-white text-black" : "bg-white/10 text-white"
          } transition-all`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4.5v15m7.5-7.5h-15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ),
    },
    {
      href: "/bookmarks",
      label: "Bookmarks",
      icon: (isActive) => (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill={isActive ? "currentColor" : "none"}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      href: "/profile",
      label: "Profile",
      icon: (isActive) => (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill={isActive ? "currentColor" : "none"}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/95 backdrop-blur-xl supports-[backdrop-filter]:bg-black/80">
      <div className="max-w-2xl mx-auto">
        <ul className="flex h-16 items-center justify-around text-white px-4">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} className="flex-1 flex justify-center">
                <Link
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium py-2 px-4 rounded-xl hover:bg-white/5 transition-all min-w-0"
                >
                  <span
                    className={`${
                      isActive ? "text-white" : "text-white/60"
                    } transition-colors`}
                  >
                    {item.icon(isActive)}
                  </span>
                  <span
                    className={`${
                      isActive ? "text-white" : "text-white/60"
                    } transition-colors truncate`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
