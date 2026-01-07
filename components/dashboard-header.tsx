"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Add this import
import {
  Eye,
  Map,
  Radio,
  Plane,
  Bell,
  Key,
  FileText,
  MapPin,
  BookOpen,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";

import { logout } from "@/lib/api/auth";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const navItems = [
  { icon: Eye, label: "MAIN SCREEN", href: "/" },
  { icon: Map, label: "AREA", href: "/area" },
  { icon: Radio, label: "SENSORS", href: "/sensors" },
  { icon: Plane, label: "DRONES", href: "/drones" },
  { icon: FileText, label: "REPORT", href: "/report" },
  { icon: MapPin, label: "MAP", href: "/maps/manage" },
];

export function DashboardHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname
  const { refreshUser } = useAuth();

  // Function to determine if a nav item is active
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Function to get the active label
  const getActiveLabel = () => {
    const activeNav = navItems.find((item) => isActive(item.href));
    return activeNav?.label || "MAIN SCREEN";
  };

  async function handleLogout() {
    await logout();
    await refreshUser();
    router.push("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-[#333] bg-[#1a1a1a] px-3 md:px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center justify-center">
          <Image
            src="/icon.svg"
            alt="Rudrarakshak Logo"
            width={24}
            height={24}
            className="h-10 w-10 md:h-10 md:w-10 object-contain"
          />
        </div>

        <span className="text-base font-bold tracking-wide text-white md:text-xl">
          RUDRARAKSHAK 2.0
        </span>
      </Link>

      <nav className="hidden items-center gap-1 xl:flex">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href}>
            <Button
              variant={isActive(item.href) ? "secondary" : "ghost"}
              size="sm"
              className={`gap-2 text-xs ${
                isActive(item.href)
                  ? "bg-[#333] text-white hover:bg-[#444]"
                  : "text-gray-400 hover:bg-[#333] hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>

      <div className="hidden items-center gap-4 xl:flex">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-xs text-gray-400 hover:bg-[#333] hover:text-white hover:cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          LOGOUT
        </Button>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden text-white hover:bg-[#333]"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-72 border-[#333] bg-[#1a1a1a] p-0"
        >
          <div className="flex h-14 items-center justify-between border-b border-[#333] px-4">
            <span className="text-lg font-bold text-white">Menu</span>
          </div>
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href}>
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    isActive(item.href)
                      ? "bg-[#333] text-white hover:bg-[#444]"
                      : "text-gray-400 hover:bg-[#333] hover:text-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            ))}
            <div className="my-4 border-t border-[#333]" />
            <Button
              variant="ghost"
              className="justify-start gap-3 text-gray-400 hover:bg-[#333] hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              LOGOUT
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
