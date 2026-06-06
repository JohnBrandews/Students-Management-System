"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Layers,
  BookOpen,
  ClipboardList,
  PenTool,
  FileBarChart,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Students", href: "/students", icon: Users },
  { name: "Class Streams", href: "/class-streams", icon: Layers },
  { name: "Subjects", href: "/subjects", icon: BookOpen },
  { name: "Assessments", href: "/assessments", icon: ClipboardList },
  { name: "Score Entry", href: "/scores", icon: PenTool },
  { name: "Reports", href: "/reports", icon: FileBarChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication Guard
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <GraduationCap className="h-10 w-10 animate-bounce text-indigo-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading your academic portal...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  // Generate breadcrumbs based on pathname
  const pathSegments = pathname.split("/").filter((x) => x);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const isLast = index === pathSegments.length - 1;
    const name = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    return { name, href, isLast };
  });

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="fixed bottom-0 top-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:block">
        <div className="flex flex-col h-full">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 dark:text-white">Ikonex Academy</span>
              <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">SMS Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-8 flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info and Logout */}
          <div className="border-t border-slate-200 pt-6 dark:border-slate-800">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {session?.user?.name || "Academic User"}
                </span>
                <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {session?.user?.email}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-all"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile Drawer */}
      <aside
        className={`fixed bottom-0 top-0 left-0 z-50 w-64 bg-white p-6 shadow-2xl transition-transform duration-300 dark:bg-slate-900 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 dark:text-white">Ikonex</span>
                <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">SMS Portal</span>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-500 dark:text-slate-400">
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="mt-8 flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 pt-6 dark:border-slate-800">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {session?.user?.name || "Academic User"}
                </span>
                <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {session?.user?.email}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Header bar */}
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-4">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Breadcrumbs (Desktop) */}
            <nav className="hidden items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 md:flex">
              <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-white">
                SMS Portal
              </Link>
              {breadcrumbs.length > 0 && <ChevronRight className="h-4 w-4 text-slate-400" />}
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.href}>
                  {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-400" />}
                  {crumb.isLast ? (
                    <span className="font-semibold text-slate-900 dark:text-white">{crumb.name}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-slate-900 dark:hover:text-white">
                      {crumb.name}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {((session?.user) as any)?.role || "Staff"}
            </span>
          </div>
        </header>

        {/* Content body */}
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
