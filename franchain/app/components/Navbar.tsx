"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, User, Wallet, Menu, X, Globe, FileText, ChevronRight, LayoutDashboard } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const Navbar = () => {
  const { loggedIn, user, handleLogout, setLoggedIn } = useUser();
  const wallet = useWallet();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!wallet.connected) {
      setLoggedIn(false);
    }
  }, [wallet.connected, user, setLoggedIn]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.querySelector(id) as HTMLElement;
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 px-4 py-3 transition-all duration-300 ${
      scrolled ? "py-2" : "py-4"
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className={`border border-gray-700 rounded-2xl backdrop-blur-md ${
          scrolled ? "bg-black/60" : "bg-black/40"
        } shadow-lg px-4 sm:px-6 py-3 flex justify-between items-center transition-all duration-300`}>
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="logo" className="h-10" />
            </Link>
          </div>

          <div className="flex justify-center items-center gap-4">
            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex space-x-6">
              {loggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-300 hover:text-green-400 transition-colors duration-300 flex items-center gap-1"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/create"
                    className="text-gray-300 hover:text-green-400 transition-colors duration-300 flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Create Agreement</span>
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => scrollToSection("#features")}
                    className="text-gray-300 hover:text-green-400 transition-colors duration-300"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => scrollToSection("#howitworks")}
                    className="text-gray-300 hover:text-green-400 transition-colors duration-300"
                  >
                    How It Works
                  </button>
                </>
              )}
            </div>

            {/* Wallet Connection & Profile */}
            <div className="flex items-center gap-2">
              {wallet.connected && (
                <Badge 
                  variant="outline" 
                  className="hidden sm:flex border-green-500/50 text-green-400 gap-1 items-center"
                >
                  <Wallet className="h-3 w-3" />
                  <span>{truncateAddress(wallet.publicKey?.toString() || "")}</span>
                </Badge>
              )}
              
              {!loggedIn ? (
                <div className="wallet-adapter-button-container">
                  <WalletMultiButton />
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline"
                      className="border-green-500/50 text-green-400 hover:bg-green-500/10 rounded-lg flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <span className="hidden sm:inline">Profile</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-900 border border-gray-700 text-white rounded-lg w-56">
                    <DropdownMenuLabel className="text-gray-400">My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <Link href="/profile">
                      <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer flex gap-2 text-gray-200">
                        <User size={16} className="text-green-400" />
                        Profile
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/dashboard">
                      <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer flex gap-2 text-gray-200">
                        <LayoutDashboard size={16} className="text-green-400" />
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem
                      className="text-red-400 hover:bg-gray-800 cursor-pointer flex gap-2"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-gray-900 border-gray-700 text-white p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-gray-700">
                      <div className="flex items-center gap-2 mb-6">
                        <Globe className="h-6 w-6 text-green-400" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 text-xl font-bold">
                          FranChain
                        </span>
                      </div>
                      
                      {wallet.connected && (
                        <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-3 mb-4">
                          <div className="p-2 bg-green-500/20 rounded-full">
                            <Wallet className="h-5 w-5 text-green-400" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs text-gray-400">Connected Wallet</p>
                            <p className="text-sm text-gray-200 truncate">
                              {wallet.publicKey?.toString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-auto py-6 px-4">
                      <div className="space-y-1">
                        {loggedIn ? (
                          <>
                            <Link href="/profile">
                              <Button 
                                variant="ghost" 
                                className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-800"
                              >
                                <User className="mr-2 h-5 w-5 text-green-400" />
                                Profile
                              </Button>
                            </Link>
                            <Link href="/dashboard">
                              <Button 
                                variant="ghost" 
                                className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-800"
                              >
                                <LayoutDashboard className="mr-2 h-5 w-5 text-green-400" />
                                Dashboard
                              </Button>
                            </Link>
                            <Link href="/create">
                              <Button 
                                variant="ghost" 
                                className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-800"
                              >
                                <FileText className="mr-2 h-5 w-5 text-green-400" />
                                Create Agreement
                              </Button>
                            </Link>
                          </>
                        ) : (
                          <>
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-800"
                              onClick={() => {
                                scrollToSection("#features");
                                document.querySelector('[data-state="open"]')?.setAttribute('data-state', 'closed');
                              }}
                            >
                              Features
                            </Button>
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start text-gray-200 hover:text-white hover:bg-gray-800"
                              onClick={() => {
                                scrollToSection("#howitworks");
                                document.querySelector('[data-state="open"]')?.setAttribute('data-state', 'closed');
                              }}
                            >
                              How It Works
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 border-t border-gray-700">
                      {!wallet.connected ? (
                        <div className="wallet-adapter-button-container">
                          <WalletMultiButton />
                        </div>
                      ) : loggedIn ? (
                        <Button 
                          variant="destructive" 
                          className="w-full"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      ) : (
                        <div className="wallet-adapter-button-container">
                          <WalletMultiButton />
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
