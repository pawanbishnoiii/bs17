import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Menu, Search, X, type LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: number | string;
  shortcut?: string;
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

export type DashboardSidebarProps = {
  groups: DashboardNavGroup[];
  pathname: string;
  /** Brand block. */
  title?: string;
  subtitle?: string;
  logo?: ReactNode;
  /** Sticky block at the bottom (progress card, user chip…). */
  footer?: ReactNode;
  /** Link shown under the nav; pass null to hide it. */
  backTo?: { to: string; label: string } | null;
  searchable?: boolean;
  /** Floating button that opens the drawer on phones. */
  showMobileTrigger?: boolean;
  ariaLabel?: string;
  className?: string;
};

function SidebarBody({
  groups,
  pathname,
  collapsed,
  onCollapse,
  onNavigate,
  title,
  subtitle,
  logo,
  footer,
  backTo,
  searchable,
  ariaLabel,
}: DashboardSidebarProps & { collapsed: boolean; onCollapse?: () => void; onNavigate?: () => void }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;
    return groups
      .map((group) => ({ ...group, items: group.items.filter((item) => item.label.toLowerCase().includes(needle)) }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  return (
    <div className="flex h-full flex-col bg-panel p-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-1 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-sm">
            {logo ?? "B"}
          </span>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-bold">{title ?? "Bnoy Study"}</p>
              <p className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                {subtitle ?? "Study OS"}
              </p>
            </div>
          ) : null}
        </div>
        {onCollapse ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="size-9 min-h-9"
          >
            <ChevronLeft className={cn("transition-transform", collapsed && "rotate-180")} />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={onNavigate} aria-label="Close menu" className="size-9 min-h-9">
            <X />
          </Button>
        )}
      </div>

      {searchable && !collapsed ? (
        <label className="mt-3 flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search…"
            aria-label="Search navigation"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
      ) : null}

      <nav aria-label={ariaLabel ?? "Sidebar"} className="mt-4 min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain">
        {visible.map((group) => (
          <div key={group.label}>
            {!collapsed && group.label ? (
              <p className="mb-1 px-3 text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                {group.label}
              </p>
            ) : null}
            <div className="space-y-1">
              {group.items.map(({ to, label, icon: Icon, exact, badge, shortcut }) => {
                const active = exact ? pathname === to : pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={onNavigate}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="dashboard-sidebar-active"
                        className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-yellow"
                      />
                    ) : null}
                    <Icon className="size-4 shrink-0" />
                    {!collapsed ? (
                      <>
                        <span className="truncate">{label}</span>
                        {badge !== undefined ? (
                          <span className="num ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
                            {badge}
                          </span>
                        ) : shortcut ? (
                          <span className="ml-auto font-mono text-[10px] text-muted-foreground">{shortcut}</span>
                        ) : null}
                      </>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {visible.length === 0 ? (
          <p className="px-3 text-xs text-muted-foreground">Kuch nahi mila</p>
        ) : null}
      </nav>

      {footer && !collapsed ? <div className="mt-4">{footer}</div> : null}

      {backTo !== null ? (
        <Link
          to={backTo?.to ?? "/today"}
          onClick={onNavigate}
          className={cn(
            "mt-3 flex min-h-11 items-center justify-center rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-secondary",
            collapsed && "px-0",
          )}
        >
          {collapsed ? "←" : (backTo?.label ?? "Back to study")}
        </Link>
      ) : null}
    </div>
  );
}

export function DashboardSidebar(props: DashboardSidebarProps) {
  const { showMobileTrigger = true, className } = props;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside
        className={cn(
          "sticky top-4 hidden h-[calc(100svh-2rem)] shrink-0 self-start overflow-hidden rounded-2xl border border-border shadow-sm transition-[width] duration-300 lg:block",
          collapsed ? "w-16" : "w-64",
          className,
        )}
      >
        <SidebarBody {...props} collapsed={collapsed} onCollapse={() => setCollapsed((value) => !value)} />
      </aside>

      {showMobileTrigger ? (
        <Button
          onClick={() => setMobileOpen(true)}
          size="icon"
          className="fixed bottom-5 left-4 z-40 shadow-xl lg:hidden"
          aria-label="Open menu"
        >
          <Menu />
        </Button>
      ) : null}

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-[90] bg-overlay lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              className="h-full w-[min(84vw,19rem)] border-r border-border"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              onClick={(event) => event.stopPropagation()}
            >
              <SidebarBody {...props} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
