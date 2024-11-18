"use client";

import { Button } from "@/components/ui/button";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircle, LogOut } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const handleSignOut = () => {
    // Add your sign out logic here
    console.log("Signing out...");
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/goals" className="font-semibold">
            Logo
          </Link>
          
          <Menubar className="border-none">
            <MenubarMenu>
              <MenubarTrigger className={pathname === "/dashboard" ? "bg-accent" : ""}>
                <Link href="/dashboard">Dashboard</Link>
              </MenubarTrigger>
            </MenubarMenu>
            
            <MenubarMenu>
              <MenubarTrigger className={pathname === "/goals" ? "bg-accent" : ""}>
                <Link href="/goals">Goals</Link>
              </MenubarTrigger>
            </MenubarMenu>

            <MenubarMenu>
              <MenubarTrigger className={pathname === "/timeline" ? "bg-accent" : ""}>
                <Link href="/timeline">Timeline</Link>
              </MenubarTrigger>
            </MenubarMenu>
          </Menubar>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserCircle className="h-4 w-4" />
                Profile
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Link href="/profile" className="flex items-center w-full">
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}