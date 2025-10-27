
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import Link from "next/link"
import { LogOut, Settings, User, Bell, CircleDollarSign, Sprout, Drumstick, Leaf } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import useSWR from 'swr';
import { formatDistanceToNow } from "date-fns";

const fetcher = (url: string) => fetch(url).then(res => res.json());

type Alert = {
  id: string;
  timestamp: string;
  module: string;
  message: string;
  read: boolean;
  link: string;
}

const getModuleIcon = (module: string) => {
    switch (module) {
        case 'Livestock': return <Drumstick className="h-4 w-4 text-muted-foreground" />;
        case 'Finances': return <CircleDollarSign className="h-4 w-4 text-muted-foreground" />;
        case 'Crops': return <Sprout className="h-4 w-4 text-muted-foreground" />;
        case 'Resources': return <Leaf className="h-4 w-4 text-muted-foreground" />;
        default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
}


export function DashboardHeader() {
  const { data: alerts = [], error } = useSWR<Alert[]>('/api/alerts', fetcher);
  const userAvatar = PlaceHolderImages.find(p => p.id === 'avatar-1');
  const user = {
    name: "Alice Farmer",
    role: "Admin",
  }

  const unreadAlerts = alerts.filter(alert => !alert.read);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card/50 px-4 lg:h-[60px] lg:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="w-full flex-1">
        {/* Can add a global search here if needed */}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell />
            {unreadAlerts.length > 0 && <span className="absolute top-0 right-0 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span></span>}
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[350px]">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {error && <DropdownMenuItem>Error loading alerts.</DropdownMenuItem>}
            {unreadAlerts.length > 0 ? (
                unreadAlerts.slice(0, 5).map(alert => (
                    <DropdownMenuItem key={alert.id} asChild className="cursor-pointer">
                        <Link href={alert.link}>
                            <div className="flex items-start gap-3">
                                {getModuleIcon(alert.module)}
                                <div className="flex-1">
                                    <p className="text-sm font-medium leading-none">{alert.module} Alert</p>
                                    <p className="text-sm text-muted-foreground whitespace-normal">{alert.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</p>
                                </div>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                ))
            ) : (
                <div className="text-center text-sm text-muted-foreground p-4">No new notifications.</div>
            )}
             <DropdownMenuSeparator />
             <DropdownMenuItem className="justify-center text-sm text-primary">View all notifications</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar>
              {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt={userAvatar.description} data-ai-hint={userAvatar.imageHint} />}
              <AvatarFallback>AF</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.role}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile"><User className="mr-2 h-4 w-4" /><span>Profile</span></Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings"><Settings className="mr-2 h-4 w-4" /><span>Settings</span></Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
             <Link href="/login"><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
