// ============================================
// Sidebar - Navegación Principal
// ============================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useAllRequests } from "@/hooks/use-requests";
import {
  Home,
  PlusCircle,
  ListChecks,
  CheckCircle2,
  CalendarDays,
  LogOut,
} from "lucide-react";

const baseNav = [
  { href: "/solicitudes", label: "Inicio", icon: Home },
  { href: "/solicitar", label: "Solicitar", icon: PlusCircle },
  { href: "/solicitudes", label: "Mis Solicitudes", icon: ListChecks },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
];

const approverNav = {
  href: "/aprobaciones",
  label: "Aprobaciones",
  icon: CheckCircle2,
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, isApprover, logout } = useAuth();
  const { data: allRequests } = useAllRequests();

  const navItems = isApprover
    ? [...baseNav.slice(0, 3), approverNav, baseNav[3]]
    : baseNav;

  const pendingCount = isApprover
    ? (allRequests ?? []).filter(
        (r) => r.status === "pending" && r.approverEmail?.toLowerCase() === user?.email?.toLowerCase()
      ).length
    : 0;

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col bg-gradient-to-b from-seidor-500 to-[#2A3890] shadow-[4px_0_24px_rgba(26,34,64,0.15)]">
      {/* ── Logo ── */}
      <div className="border-b border-white/[0.08] px-7 pb-5 pt-7">
        <div className="flex items-center gap-3">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-gradient-to-br from-seidor-200 to-seidor-400 text-xl shadow-[0_2px_8px_rgba(68,100,226,0.4)]">
            🌴
          </div>
          <div>
            <div className="font-display text-lg font-bold tracking-wide text-white">
              SEIDOR
            </div>
            <div className="text-[11px] font-medium uppercase tracking-[1px] text-white/50">
              Vacaciones
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          const showBadge =
            item.href === "/aprobaciones" && pendingCount > 0;

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`sidebar-link ${active ? "active" : ""}`}
            >
              <Icon size={18} className={active ? "opacity-100" : "opacity-70"} />
              <span>{item.label}</span>
              {showBadge && (
                <span className="ml-auto min-w-[20px] rounded-full bg-seidor-200 px-2 py-0.5 text-center text-[11px] font-bold text-seidor-500">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User card ── */}
      <div className="border-t border-white/[0.08] p-4">
        <div className="flex items-center gap-2.5 rounded-[10px] bg-white/[0.06] px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-seidor-200 to-seidor-300 text-sm font-bold text-white">
            {user?.displayName
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-white">
              {user?.displayName}
            </div>
            <div className="text-[11px] capitalize text-white/45">
              {isApprover ? "Aprobador" : "Usuario"}
            </div>
          </div>
          <button
            onClick={logout}
            className="flex rounded-md p-1 text-white/40 transition-colors hover:text-white/80"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}