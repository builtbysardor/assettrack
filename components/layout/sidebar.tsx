"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Tag,
  MapPin,
  LogOut,
  Users,
  UserPlus,
  UserMinus,
  Building2,
} from "lucide-react";

interface SidebarUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SidebarProps {
  user: SidebarUser;
}

const navItems = [
  { label: "Dashboard",   href: "/dashboard",   icon: LayoutDashboard, section: "main" },
  { label: "Assets",      href: "/assets",       icon: Package,         section: "assets" },
  { label: "Categories",  href: "/categories",   icon: Tag,             section: "assets" },
  { label: "Locations",   href: "/locations",    icon: MapPin,          section: "assets" },
  { label: "Employees",   href: "/employees",    icon: Users,           section: "hr" },
  { label: "Onboarding",  href: "/onboarding",   icon: UserPlus,        section: "hr" },
  { label: "Offboarding", href: "/offboarding",  icon: UserMinus,       section: "hr" },
  { label: "Departments", href: "/departments",  icon: Building2,       section: "hr" },
] as const;

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("at-theme");
      if (saved === "dark") {
        setDark(true);
        document.documentElement.setAttribute("data-theme", "dark");
      }
    } catch { /* noop */ }
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try { localStorage.setItem("at-theme", next ? "dark" : "light"); } catch { /* noop */ }
  }

  return { dark, toggleDark };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { dark, toggleDark } = useTheme();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    await signOut({ callbackUrl: "/login" });
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0 h-full"
      style={{
        width: 220,
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--bg-surface)", fontWeight: 700 }}>A</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>AssetTrack</div>
            <div style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 1 }}>IT Asset Manager</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }} aria-label="Main navigation">
        {navItems.map((item, idx) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const prevSection = idx > 0 ? navItems[idx - 1].section : item.section;
          const showSectionLabel = item.section !== "main" && item.section !== prevSection;

          return (
            <div key={item.href}>
              {showSectionLabel && (
                <div style={{ padding: "12px 10px 4px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)" }}>
                  {item.section === "hr" ? "HR" : "Assets"}
                </div>
              )}
              <SidebarItem href={item.href} label={item.label} icon={Icon} active={active} />
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {/* Theme toggle */}
        <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-subtle)" }}>
          <button
            onClick={toggleDark}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "6px 8px", borderRadius: 6,
              background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
              cursor: "pointer", transition: "all 0.12s",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
              {dark ? "☀️ Light mode" : "🌙 Dark mode"}
            </span>
            <div style={{
              width: 32, height: 17, borderRadius: 9,
              background: dark ? "var(--accent)" : "var(--border-default)",
              position: "relative", transition: "background 0.2s",
            }}>
              <div style={{
                position: "absolute", top: 2,
                left: dark ? 14 : 2,
                width: 13, height: 13, borderRadius: "50%",
                background: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 0.2s",
              }} />
            </div>
          </button>
        </div>

        {/* User info */}
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-secondary)", fontWeight: 700 }}>{initials}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </span>
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: "0.08em",
                  color: "var(--text-tertiary)",
                  background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                  borderRadius: 2, padding: "1px 4px", flexShrink: 0,
                }}>
                  {user.role}
                </span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              width: "100%", padding: "6px 8px", borderRadius: 5,
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 12, color: "var(--text-tertiary)",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(220,38,38,0.07)";
              e.currentTarget.style.color = "var(--danger)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-tertiary)";
            }}
          >
            <LogOut size={13} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({
  href, label, icon: Icon, active,
}: {
  href: string; label: string; icon: React.ElementType; active: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-current={active ? "page" : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        width: "100%", padding: "7px 10px", marginBottom: 1,
        borderRadius: 6, textDecoration: "none",
        transition: "all 0.12s",
        background: active ? "rgba(0,0,0,0.06)" : hov ? "var(--bg-elevated)" : "transparent",
        boxShadow: active ? "inset 2px 0 0 var(--accent)" : "none",
        color: active ? "var(--accent)" : hov ? "var(--text-primary)" : "var(--text-secondary)",
        fontSize: 13, fontWeight: active ? 500 : 400,
        paddingLeft: active ? 12 : 10,
      }}
    >
      <Icon size={15} aria-hidden="true" style={{ flexShrink: 0, opacity: active ? 1 : 0.6 }} />
      {label}
    </Link>
  );
}
