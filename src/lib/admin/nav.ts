import {
  Activity,
  FileText,
  LayoutDashboard,
  Package,
  Plug,
  Rocket,
  Server,
  Target,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Editorial",
    items: [
      {
        href: "/admin/reviews",
        label: "Reviews",
        icon: FileText,
      },
      {
        href: "/admin/launch",
        label: "Launch checklist",
        icon: Rocket,
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        href: "/admin/products",
        label: "Products",
        icon: Package,
      },
      {
        href: "/admin/campaigns",
        label: "Campaigns",
        icon: Target,
      },
    ],
  },
  {
    label: "Automation",
    items: [
      {
        href: "/admin/jobs",
        label: "Job logs",
        icon: Activity,
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        href: "/admin/settings/integrations",
        label: "Integrations",
        icon: Plug,
      },
      {
        href: "/admin/settings/system",
        label: "System",
        icon: Server,
      },
    ],
  },
];

const adminPageTitles: Array<{ href: string; title: string; exact?: boolean }> =
  [
    { href: "/admin", title: "Dashboard", exact: true },
    { href: "/admin/reviews", title: "Review queue" },
    { href: "/admin/launch", title: "Launch checklist" },
    { href: "/admin/products", title: "Products" },
    { href: "/admin/campaigns", title: "Campaigns" },
    { href: "/admin/jobs", title: "Job logs" },
    { href: "/admin/account", title: "Account" },
    { href: "/admin/settings/integrations", title: "Integrations" },
    { href: "/admin/settings/system", title: "System settings" },
  ];

export function isAdminNavItemActive(
  pathname: string,
  href: string,
  exact?: boolean,
) {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getAdminPageTitle(pathname: string) {
  const match = adminPageTitles
    .filter((item) => isAdminNavItemActive(pathname, item.href, item.exact))
    .sort((a, b) => b.href.length - a.href.length)[0];

  if (match) {
    return match.title;
  }

  if (pathname.startsWith("/admin/settings")) {
    return "Settings";
  }

  return "Admin";
}
