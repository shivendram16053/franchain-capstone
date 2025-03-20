import React from "react";
import { Button } from "@/components/ui/button";
import { Rocket, Wallet } from "lucide-react";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center px-6 py-4  text-white">
      {/* Logo */}
      <div className="text-2xl font-bold">Franchain</div>

      {/* Navigation Links */}
      <ul className="hidden md:flex space-x-6 text-lg font-medium">
        <li className="cursor-pointer hover:underline">Home</li>
        <li className="cursor-pointer hover:underline">Explore</li>
        <li className="cursor-pointer hover:underline">Dashboard</li>
      </ul>

      <Link href={"/register"}>
        <Button
          variant="outline"
          className="flex items-center gap-2 hover:cursor-pointer "
        >
          <Rocket size={20} />
          Get Started
        </Button>
      </Link>
    </nav>
  );
};

export default Navbar;
