import { useTranslation } from "@repo/i18n";
import { Button } from "@repo/ui/components/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from "@repo/ui/components/sidebar";
import { toast } from "@repo/ui/components/sonner";
import { Link, useLocation } from "@tanstack/react-router";
import { FolderKanbanIcon, LockKeyholeIcon, ShieldCheckIcon, UsersRoundIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useLockMutation } from "../auth/hooks/use-auth";
import { GlobalCommandMenu } from "./global-command-menu";

const blackSidebarStyle = {
  "--sidebar": "var(--primary)",
  "--sidebar-foreground": "var(--primary-foreground)",
  "--sidebar-ring": "var(--highlight)",
} as CSSProperties;

export function PlatformAppShell({
  children,
  fullWidth = false,
}: {
  children: ReactNode;
  fullWidth?: boolean;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const lockMutation = useLockMutation();
  const navItems = [
    { icon: FolderKanbanIcon, label: t("nav.projects"), to: "/projects" },
    { icon: UsersRoundIcon, label: t("nav.customers"), to: "/customers" },
  ] as const;

  function handleLock() {
    lockMutation.mutate(undefined, {
      onError: () => toast.error(t("auth.lock.fallbackError")),
    });
  }

  return (
    <SidebarProvider>
      <Sidebar
        collapsible="none"
        style={blackSidebarStyle}
        className="sticky top-0 h-svh border-r border-white/15"
      >
        <SidebarHeader className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                tooltip={t("nav.brand")}
                className="h-14 rounded-lg px-2.5"
              >
                <Link to="/projects">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-base font-bold text-foreground">
                    C
                  </span>
                  <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
                    {t("nav.brand")}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="pt-5">
            <SidebarGroupLabel className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-white/55">
              {t("sidebar.workspace")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.startsWith(item.to)}
                      tooltip={item.label}
                      className="h-11 rounded-lg px-3 text-[15px] font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white data-[active=true]:border data-[active=true]:border-white/60 data-[active=true]:bg-highlight data-[active=true]:font-semibold data-[active=true]:text-highlight-foreground data-[active=true]:shadow-none data-[active=true]:hover:bg-highlight"
                    >
                      <Link to={item.to}>
                        <item.icon className="size-[18px]" strokeWidth={2.4} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator className="bg-white/15" />
        <SidebarFooter className="gap-3 p-3">
          <GlobalCommandMenu />
          <div className="rounded-lg border border-white/15 bg-white/10 p-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-highlight text-highlight-foreground">
                <ShieldCheckIcon className="size-4" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{t("sidebar.privateTitle")}</p>
                <p className="truncate text-xs font-medium text-white/65">
                  {t("sidebar.privateDescription")}
                </p>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full justify-start px-3 text-white/75 hover:bg-white/10 hover:text-white"
            disabled={lockMutation.isPending}
            onClick={handleLock}
          >
            <LockKeyholeIcon className="size-4" />
            {t("auth.lock.submit")}
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div
          className={
            fullWidth
              ? "flex w-full flex-1 flex-col"
              : "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8 lg:px-8"
          }
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
