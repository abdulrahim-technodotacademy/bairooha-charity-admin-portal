
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  HandCoins,
  LayoutDashboard,
  Users,
  Rocket,
  ClipboardList,
  LogOut,
  Menu,
  HandHeart,
  Siren,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { staff as initialStaff, Staff } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: Rocket },
  { href: "/dashboard/emergency", label: "Emergency", icon: Siren },
  { href: "/dashboard/payments", label: "Transactions", icon: ClipboardList },
  { href: "/dashboard/donors", label: "Donors", icon: HandHeart },
  { href: "/dashboard/staff", label: "Staff", icon: Users },
];

export function DashboardNav() {
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<Staff | undefined>(
    initialStaff.find((s) => s.role === "Admin")
  );

  useEffect(() => {
    try {
      const storedStaff = sessionStorage.getItem("staff");
      if (storedStaff) {
        const staffList: Staff[] = JSON.parse(storedStaff);
        const admin = staffList.find((s) => s.role === "Admin");
        setAdminUser(admin);
      }
    } catch (error) {
      console.error("Failed to parse staff from sessionStorage for nav", error);
      setAdminUser(initialStaff.find((s) => s.role === "Admin"));
    }
  }, [pathname]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  const adminInitials = adminUser ? getInitials(adminUser.name) : "AU";
  const adminName = adminUser ? adminUser.name : "Admin User";
  const adminEmail = adminUser ? adminUser.email : "admin@bairoohafoundation.com";
  const adminAvatar = adminUser
    ? adminUser.avatar
    : "https://placehold.co/100x100.png";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-muted">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <HandCoins className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Bairooha Foundation</span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:text-foreground",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] flex flex-col">
                <nav className="grid gap-6 text-lg font-medium mt-6">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                  >
                    <HandCoins className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">Bairooha Foundation</span>
                  </Link>
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-4 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                        pathname === item.href && "bg-muted text-primary"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto border-t pt-4">
                  <Link
                    href="/login"
                    className="flex items-center gap-4 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Log out</span>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={adminAvatar}
                    data-ai-hint="person"
                    alt={adminName}
                  />
                  <AvatarFallback>{adminInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {adminName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {adminEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/login">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
