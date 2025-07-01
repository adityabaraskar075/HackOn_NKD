
'use client';

import { Search, Menu, ShoppingCart, MapPin, Wifi, WifiOff, LogOut, Gem } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader } from '@/components/ui/sheet';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useNetworkStatus } from '@/contexts/NetworkStatusContext';
import { useAuth } from '@/hooks/useAuth';

const primaryNavItems = [
  { href: "/amazon-pay", label: "Q-Pay" },
  { href: "/prime", label: "Q-Prime", icon: <Gem size={16} className="mr-2"/> },
  { href: "/smart-rewards", label: "Smart Rewards" },
  { href: "/budget", label: "Budget Insights" },
  { href: "/payment-simulation", label: "FraudGNN Shield" },
  { href: "/offline-manager", label: "Offline Payments" },
  { href: "/fhe-privacy", label: "FHE Privacy" },
];

export function Header() {
  const { isOnline, toggleSimulatedStatus } = useNetworkStatus();
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  const searchBar = (
    <div className="flex-grow w-full flex items-center">
      <div className="flex items-center h-10 w-full rounded-md overflow-hidden">
        <Select defaultValue="all">
          <SelectTrigger className="h-full bg-gray-200 text-gray-800 rounded-none rounded-l-md border-r border-gray-300 w-auto text-xs focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="fashion">Fashion</SelectItem>
            <SelectItem value="books">Books</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="search"
          placeholder="Search Q-SmartPay..."
          className="h-full flex-grow rounded-none border-none focus-visible:ring-0 text-black"
        />
        <Button type="submit" size="icon" className="h-full w-12 bg-secondary hover:bg-secondary/90 rounded-none rounded-r-md">
          <Search className="h-5 w-5 text-secondary-foreground" />
        </Button>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full text-sm text-primary-foreground">
      <Sheet>
        {/* Top Section */}
        <div className="bg-primary flex flex-col px-4 pt-2 pb-2 md:pb-2">
          {/* Top Bar for both mobile and desktop */}
          <div className="flex items-center justify-between gap-2">
            {/* Left part: Mobile Menu Trigger + Logo */}
            <div className="flex items-center gap-2">
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden flex-shrink-0 -ml-2">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <Link href="/" className="flex items-center text-2xl font-bold tracking-tighter border border-transparent hover:border-white rounded-sm p-1">
                Q-Smart Pay
              </Link>
            </div>

            {/* Desktop deliver to */}
            <div className="hidden lg:flex items-center gap-2 border border-transparent hover:border-white rounded-sm p-1 cursor-pointer">
              <MapPin className="h-5 w-5" />
              <div>
                <div className="text-xs text-gray-300">Deliver to</div>
                <div className="font-bold text-sm">Bhopal 462003</div>
              </div>
            </div>

            {/* Desktop search bar */}
            <div className="hidden md:flex flex-grow max-w-2xl">
              {searchBar}
            </div>

            {/* Right part: Desktop Controls + Cart for all */}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden md:flex flex-col items-start h-auto px-2 py-1 border border-transparent hover:border-white rounded-sm cursor-pointer hover:bg-primary/80">
                    {isAuthenticated ? (
                      <>
                        <span className="text-xs">Hello, {user?.name}</span>
                        <span className="font-bold text-sm">Account & Lists</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs">Hello, sign in</span>
                        <span className="font-bold text-sm">Account & Lists</span>
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  {isAuthenticated ? (
                    <>
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {primaryNavItems.map(item => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link href={item.href} className="flex items-center">
                            {item.icon} {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <div className="p-2">
                      <Button asChild className="w-full">
                        <Link href="/login">Sign in</Link>
                      </Button>
                      <p className="text-xs text-center mt-2">
                        New customer? <Link href="/login" className="text-blue-600 hover:underline">Start here.</Link>
                      </p>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="hidden md:block">
                <ConnectButton />
              </div>

              <Link href="/cart" className="flex items-end gap-1 border border-transparent hover:border-white rounded-sm p-1 cursor-pointer">
                <ShoppingCart className="h-8 w-8" />
                <span className="hidden md:inline font-bold">Cart</span>
              </Link>
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="md:hidden mt-2 w-full">
            {searchBar}
          </div>
        </div>

        {/* Bottom Navigation (Desktop only) */}
        <div className="bg-accent hidden md:flex items-center gap-2 px-4 py-1 overflow-x-auto text-sm">
          <SheetTrigger asChild>
            <Button variant="ghost" className="p-2 h-auto hover:bg-transparent hover:border-white border border-transparent">
              <Menu className="h-5 w-5 mr-1" />
              All
            </Button>
          </SheetTrigger>
          <div className="flex items-center gap-2 flex-nowrap">
            {primaryNavItems.map(item => (
              <React.Fragment key={item.href}>
                <Link href={item.href} className="px-2 py-1 whitespace-nowrap border border-transparent hover:border-white rounded-sm flex items-center">
                  {item.icon} {item.label}
                </Link>
                {item.label === "Offline Payments" && (
                  <Button
                    onClick={toggleSimulatedStatus}
                    variant="ghost"
                    className="p-2 h-auto text-xs whitespace-nowrap border border-transparent hover:border-white rounded-sm flex items-center"
                    title={isOnline ? 'You are online. Click to simulate going offline.' : 'You are offline. Click to simulate going online.'}
                  >
                    {isOnline ? (
                      <Wifi size={14} className="mr-1 text-green-400" />
                    ) : (
                      <WifiOff size={14} className="mr-1 text-amber-400" />
                    )}
                    <span>
                      Go {isOnline ? 'Offline' : 'Online'}
                    </span>
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* --- Sheet Content --- */}
        <SheetContent side="left" className="w-full max-w-xs bg-background text-foreground p-0">
            <SheetHeader className="bg-primary text-primary-foreground p-4">
              <div className="text-xl font-bold">
                {isAuthenticated ? (
                    <span>Hello, {user?.name}</span>
                ) : (
                    <Link href="/login">Hello, sign in</Link>
                )}
              </div>
            </SheetHeader>
            <div className="flex flex-col justify-between h-[calc(100%-64px)]">
                <div className="flex flex-col gap-1 p-2 mt-2">
                    {primaryNavItems.map((item) => (
                    <Button key={item.href} variant="ghost" asChild className="justify-start text-base py-3">
                        <Link href={item.href} className="flex items-center">
                          {item.icon} {item.label}
                        </Link>
                    </Button>
                    ))}
                </div>

                <div className="p-2 border-t">
                    <div className="p-2">
                      <ConnectButton />
                    </div>
                    {isAuthenticated && (
                    <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-base">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                    )}
                </div>
            </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
