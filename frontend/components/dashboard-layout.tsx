"use client"

import type React from "react"

import Link from "next/link"
import { LogOut, MapPin, Settings, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-10 items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-base font-bold tracking-tight text-teal-500">Subitis</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs md:flex">
              <MapPin className="h-3 w-3 text-teal-500" />
              <span className="font-medium">Live: 37.7749° N, 122.4194° W</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                  <User className="h-4 w-4" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-medium">Alex Johnson</p>
                    <p className="text-xs text-muted-foreground">Paramedic</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs">
                  <User className="mr-2 h-3 w-3" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs">
                  <Settings className="mr-2 h-3 w-3" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs">
                  <LogOut className="mr-2 h-3 w-3" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
