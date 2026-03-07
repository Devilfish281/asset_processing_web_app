// src/components/SidebarNav.tsx
import React from "react";
import { Button } from "./ui/button";
import Link from "next/dist/client/link";
import { Home, LayoutDashboard, Settings } from "lucide-react";
import { usePathname } from "next/dist/client/components/navigation";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  isCollapsed: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isActive: (pathname: string) => boolean;
}

function SidebarNav({ isCollapsed }: SidebarNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: "/projects",
      label: "Projects",
      icon: Home,
      isActive: (pathname) =>
        pathname === "/projects" || pathname.startsWith("/project/"),
    },
    {
      href: "/templates",
      label: "Templates",
      icon: LayoutDashboard,
      isActive: (pathname) =>
        pathname === "/templates" || pathname.startsWith("/template/"),
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      isActive: (pathname) => pathname === "/settings",
    },
    {
      href: "/todo",
      label: "Todo",
      icon: Settings,
      isActive: (pathname) => pathname === "/todo",
    },
  ];

  return (
    <div className="space-y-4 overflow-hidden mb-auto">
      {navItems.map((item) => (
        <Button
          variant="ghost"
          asChild
          key={item.href}
          className={cn(
            "w-full justify-start hover:text-main hover:bg-gray-200 flex items-center text-lg font-medium",
            isCollapsed && "lg:justify-center lg:p-2",
            item.isActive(pathname) && "bg-gray-200 text-main",
          )}
        >
          <Link href={item.href}>
            {/* DESKTOP */}
            <item.icon className="h-5.5 w-5.5" />
            {!isCollapsed && (
              <span className="ml-3 hidden lg:inline">{item.label}</span>
            )}

            {/* MOBILE */}
            <span className="ml-3 lg:hidden">{item.label}</span>
          </Link>
        </Button>
      ))}
    </div>
  );
}

export default SidebarNav;
