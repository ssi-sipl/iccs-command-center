"use client";

import { useState } from "react";
import Link from "next/link";
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

const navItems = [
  { icon: Eye, label: "MAIN SCREEN", href: "/" },
  { icon: Map, label: "AREA", href: "/area" },
  { icon: Radio, label: "SENSORS", href: "/sensors" },
  { icon: Plane, label: "DRONES", href: "/drones" },
  { icon: Bell, label: "ALARM", href: "/alarm" },
  // { icon: Key, label: "LICENSE", href: "/license" },
  // { icon: FileText, label: "REPORT", href: "/report" },
  { icon: MapPin, label: "MAP", href: "/maps/manage" },
  // { icon: BookOpen, label: "USER MANUAL", href: "/manual" },
];

interface DashboardHeaderProps {
  activeItem?: string;
}

export function DashboardHeader({
  activeItem = "MAIN SCREEN",
}: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-[#333] bg-[#1a1a1a] px-3 md:px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 md:gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-[#8B0000] md:h-10 md:w-10">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-[#FFD700] md:h-6 md:w-6"
            fill="currentColor"
          >
            <path d="M12 2L8 6H4v4l-4 4 4 4v4h4l4 4 4-4h4v-4l4-4-4-4V6h-4L12 2zm0 3l2.5 2.5H17v2.5L19.5 12 17 14.5V17h-2.5L12 19.5 9.5 17H7v-2.5L4.5 12 7 9.5V7h2.5L12 5z" />
          </svg>
        </div>
        <span className="text-base font-bold tracking-wide text-white md:text-xl">
          RUDRARAKSHAK
        </span>
      </Link>

      <nav className="hidden items-center gap-1 xl:flex">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href}>
            <Button
              variant={activeItem === item.label ? "secondary" : "ghost"}
              size="sm"
              className={`gap-2 text-xs ${
                activeItem === item.label
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
          className="gap-2 text-xs text-gray-400 hover:bg-[#333] hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          LOGOUT
        </Button>
        <span className="text-xs text-gray-500">v2.2.7</span>
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
                  variant={activeItem === item.label ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    activeItem === item.label
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
            >
              <LogOut className="h-5 w-5" />
              LOGOUT
            </Button>
            <span className="mt-4 text-xs text-gray-500">v2.2.7</span>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
