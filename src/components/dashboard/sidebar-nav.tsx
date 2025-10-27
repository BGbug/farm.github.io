
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar"
import { CircleDollarSign, LayoutDashboard, Leaf, Map, Sprout, Users, User, Settings, Wand2, Drumstick, Egg, BarChart, Tractor } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import React from "react"

const navItems = [
  { href: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard" },
  { href: "/dashboard/crops", icon: <Sprout />, label: "Crops" },
  { href: "/dashboard/harvests", icon: <Tractor />, label: "Harvests" },
  { href: "/dashboard/resources", icon: <Leaf />, label: "Resources" },
  { href: "/dashboard/reports", icon: <BarChart />, label: "Reports" },
]

const aiNavItems = [
  { href: "/dashboard/ai/suggest-crops", icon: <Wand2 />, label: "Suggest Crops" },
  { href: "/dashboard/ai/diagnose-plant", icon: <Wand2 />, label: "Diagnose Plant" },
]

const secondaryNavItems = [
    { href: "/dashboard/profile", icon: <User />, label: "My Profile" },
    { href: "/dashboard/settings", icon: <Settings />, label: "Settings" },
]

export function SidebarNav() {
  const pathname = usePathname()

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }
  
  const isFieldsActive = pathname.startsWith('/dashboard/fields') || pathname.startsWith('/dashboard/ai');

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton isActive={isActive(item.href, true)} tooltip={item.label}>
              {item.icon}
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
      <Collapsible asChild defaultOpen={isActive('/dashboard/finances')}>
        <SidebarMenuItem>
            <CollapsibleTrigger asChild>
                <SidebarMenuButton isActive={isActive('/dashboard/finances')} tooltip="Finances">
                    <CircleDollarSign/>
                    <span>Finances</span>
                </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent asChild>
                <SidebarMenuSub>
                    <SidebarMenuSubItem>
                        <Link href="/dashboard/finances">
                            <SidebarMenuSubButton isActive={pathname === '/dashboard/finances'}>
                                Overview
                            </SidebarMenuSubButton>
                        </Link>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <Link href="/dashboard/finances/view">
                            <SidebarMenuSubButton isActive={pathname === '/dashboard/finances/view'}>
                                View Transactions
                            </SidebarMenuSubButton>
                        </Link>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <Link href="/dashboard/finances/analyze-invoice">
                            <SidebarMenuSubButton isActive={pathname === '/dashboard/finances/analyze-invoice'}>
                                Analyze Invoice
                            </SidebarMenuSubButton>
                        </Link>
                    </SidebarMenuSubItem>
                </SidebarMenuSub>
            </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
      <Collapsible asChild defaultOpen={isActive('/dashboard/livestock')}>
        <SidebarMenuItem>
            <CollapsibleTrigger asChild>
                <SidebarMenuButton isActive={isActive('/dashboard/livestock')} tooltip="Livestock">
                    <Drumstick/>
                    <span>Livestock</span>
                </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent asChild>
                <SidebarMenuSub>
                    <SidebarMenuSubItem>
                        <Link href="/dashboard/livestock">
                            <SidebarMenuSubButton isActive={pathname === '/dashboard/livestock'}>
                                View All Livestock
                            </SidebarMenuSubButton>
                        </Link>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <Link href="/dashboard/livestock/egg-log">
                            <SidebarMenuSubButton isActive={pathname === '/dashboard/livestock/egg-log'}>
                                Egg Log
                            </SidebarMenuSubButton>
                        </Link>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <Link href="/dashboard/livestock/analyze">
                            <SidebarMenuSubButton isActive={pathname === '/dashboard/livestock/analyze'}>
                                Live Health Analysis
                            </SidebarMenuSubButton>
                        </Link>
                    </SidebarMenuSubItem>
                </SidebarMenuSub>
            </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
      <Collapsible asChild defaultOpen={isFieldsActive}>
        <SidebarMenuItem>
            <CollapsibleTrigger asChild>
                <SidebarMenuButton isActive={isFieldsActive} tooltip="Fields">
                    <Map/>
                    <span>Fields</span>
                </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent asChild>
                <SidebarMenuSub>
                    <SidebarMenuSubItem>
                        <Link href="/dashboard/fields">
                            <SidebarMenuSubButton isActive={pathname === '/dashboard/fields'}>
                                View All Fields
                            </SidebarMenuSubButton>
                        </Link>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <Link href="/dashboard/ai/suggest-crops">
                            <SidebarMenuSubButton isActive={pathname === '/dashboard/ai/suggest-crops'}>
                                Suggest Crops
                            </SidebarMenuSubButton>
                        </Link>
                    </SidebarMenuSubItem>
                     <SidebarMenuSubItem>
                        <Link href="/dashboard/ai/diagnose-plant">
                            <SidebarMenuSubButton isActive={pathname === '/dashboard/ai/diagnose-plant'}>
                                Diagnose Plant
                            </SidebarMenuSubButton>
                        </Link>
                    </SidebarMenuSubItem>
                </SidebarMenuSub>
            </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
      
      <div className="mt-auto"></div>
      {secondaryNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton isActive={isActive(item.href, true)} tooltip={item.label}>
              {item.icon}
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
