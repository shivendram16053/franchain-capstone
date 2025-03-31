"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "@/hooks/useAuth"; // Adjust the import path as needed

const Page = () => {
  const { publicKey } = useWallet();
  const router = useRouter();
  const wallet = useWallet();
  const { setUser, setLoggedIn,user } = useUser(); // Use context methods
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    wallet: "",
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    const user = localStorage.getItem("user");
          if (user) {
              router.push("/dashboard");
          }
  }, [wallet.connected]);

  useEffect(() => {
    if (publicKey) {
      setFormData((prev) => ({ ...prev, wallet: publicKey.toString() }));
    }
  }, [publicKey]);

  const handleChange = (e: { target: { name: any; value: any; }; }) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.wallet) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!validateEmail(formData.email)) {
      toast.error("Invalid email format.");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to register. Please try again.");
      }
      
      // Update context state
      setUser(formData);
      setLoggedIn(true);

      
      toast.success("Registration successful! Redirecting...");
      localStorage.setItem("user", JSON.stringify(formData));
      localStorage.setItem("role", data.role);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      console.error("Registration error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center text-white min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="w-full max-w-md p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-semibold text-center mb-6 text-gray-200">
          Login
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300">Wallet Address</label>
            <input
              type="text"
              name="wallet"
              value={formData.wallet}
              readOnly
              placeholder="Connect your wallet"
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md cursor-not-allowed"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md"
              required
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md"
              required
            />
          </div>

          <div className="flex justify-center w-full items-center">
            <button
              type="submit"
              className="px-4 w-full py-2 bg-green-600 hover:bg-green-700 transition border border-green-500 cursor-pointer rounded-md"
            >
              Submit
            </button>
          </div>
        </form>

        <div className="mt-5 text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link href="/register" className="text-green-400 hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Page;