import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

interface UserContextType {
  loggedIn: boolean;
  user: any;
  setUser: (user: any) => void;
  handleLogout: () => Promise<void>;
  setLoggedIn: (loggedIn: boolean) => void;
}

export const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const wallet = useWallet();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Check for user in localStorage first
        if (typeof window !== "undefined") {
          const sessionUser = localStorage.getItem("user");
          
          if (sessionUser) {
            setLoggedIn(true);
            setUser(JSON.parse(sessionUser));
            setLoading(false);
            return; // Exit early if we have a user in localStorage
          }
        }
        
        // Only attempt to check the API if we have a connected wallet
        if (wallet.connected && wallet.publicKey) {
          try {
            const res = await fetch("/api/check-user", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ wallet: wallet.publicKey.toString() }),
            });
            
            // Set a timeout to ensure we don't get stuck
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Request timeout")), 5000)
            );
            
            const data = await Promise.race([res.json(), timeoutPromise]);
            
            if (data.data) {
              setLoggedIn(false);
              router.push("/login");
            } else {
              setLoggedIn(false);
              router.push("/register");
            }
          } catch (error) {
            console.error("Error checking user:", error);
            // In case of API error, just redirect to login
            router.push("/login");
          }
        } else {
          // No wallet connected, so the user can't be logged in
          setLoggedIn(false);
        }
      } catch (error) {
        console.error("Error in user check process:", error);
      } finally {
        // Always set loading to false to prevent UI from freezing
        setLoading(false);
      }
    };

    // Start the check process
    checkUser();
    
    // Add a safety timeout to ensure loading state never gets stuck
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Safety timeout triggered for loading state");
        setLoading(false);
      }
    }, 8000);
    
    return () => clearTimeout(safetyTimeout);
  }, [wallet.connected, wallet.publicKey, router, loading]);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }

    setLoggedIn(false);
    setUser(null);

    try {
      if (wallet.connected) {
        await wallet.disconnect();
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }

    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ loggedIn, user, setUser, handleLogout, setLoggedIn }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};