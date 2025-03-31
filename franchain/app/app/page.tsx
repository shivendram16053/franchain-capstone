"use client";

import HomePage from "@/components/HomePage";
import LandingPage from "@/components/LandingPage";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const wallet = useWallet();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      if (!wallet.connected || !wallet.publicKey) return;

      try {
        const res = await fetch("/api/check-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",  // ✅ Fixed Header
          },
          body: JSON.stringify({ wallet: wallet.publicKey.toString() }),
        });

        const data = await res.json();

        const user = localStorage.getItem("user");

        if (user) {
          setLoggedIn(true);
          router.replace("/dashboard"); // ✅ Avoid multiple pushes
        } else {
          router.replace(data.data ? "/login" : "/register");
        }
      } catch (error) {
        console.error("Error checking user:", error);
      }
    };

    checkUser();
  }, [wallet.connected, wallet.publicKey, router]); // ✅ Added `router` as a dependency

  return (
    <div>
      {!loggedIn && <LandingPage />}
      {loggedIn && <HomePage/>}
    </div>
  );
}
