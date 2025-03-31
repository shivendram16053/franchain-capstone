"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "@/hooks/useAuth";

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [walletAddress, setWalletAddress] = useState("");
  const { setUser, setLoggedIn, user } = useUser();
  const [isVerified, setIsVerified] = useState(false);
  const wallet = useWallet();
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    role: "",
    name: "",
    email: "",
    phone: "",
    description: "",
    wallet: "",
  });

  const [usernameAvailable, setUsernameAvailable] = useState<null | boolean>(
    null
  );
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user]);

  useEffect(() => {
    if (wallet.publicKey) {
      const publicKeyStr = wallet.publicKey.toString();
      setWalletAddress(publicKeyStr);
      setFormData((prev) => ({ ...prev, wallet: publicKeyStr }));

      const signedBefore = localStorage.getItem(`signed_${publicKeyStr}`);
      if (!signedBefore) {
        signMessage(publicKeyStr);
      } else {
        setIsVerified(true);
      }
    }
  }, [wallet.publicKey]);

  const signMessage = async (publicKey: string) => {
    if (!wallet.signMessage) return;

    try {
      const message = `Signing this message to verify ownership of wallet: ${publicKey}`;
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await wallet.signMessage(encodedMessage);

      localStorage.setItem(`signed_${publicKey}`, JSON.stringify(signature));
      setIsVerified(true);
    } catch (error) {
      console.error("Signature error:", error);
      toast.error("Failed to verify wallet. Please try again.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === "username") {
      setUsernameAvailable(null); // Reset availability check when user is typing
    }
  };

  const checkUsernameAvailability = async () => {
    if (!formData.username.trim()) return;

    setCheckingUsername(true);

    try {
      const response = await fetch(
        `/api/check-username`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: formData.username }),
      }
      );
      const data = await response.json();

      setUsernameAvailable(data.available);
    } catch (error) {
      console.error("Username check error:", error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.role || !formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (usernameAvailable === false) {
      toast.error("Username is already taken. Choose another one.");
      return;
    }

    try {
      const response = await fetch("/api/register", {
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

      toast.success("Registration successful!");
      localStorage.setItem("user", JSON.stringify(formData));
      setUser(formData);
      setLoggedIn(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      console.error("Registration error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen text-white">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="w-full max-w-md p-8">
        <h2 className="text-3xl font-semibold text-center mb-6 text-gray-200">Register</h2>

        {/* Step 1: Username & Role Selection */}
        {step === 1 && (
          <>

            <div className="mb-5">

              {/* Wallet Address (Auto-filled) */}
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
              <label className="block text-sm font-medium text-gray-300">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onBlur={checkUsernameAvailability}
                placeholder="Enter your username"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md"
              />
              {checkingUsername && (
                <p className="text-yellow-400 text-sm mt-1">Checking...</p>
              )}
              {usernameAvailable === true && (
                <p className="text-green-400 text-sm mt-1">
                  ✅ Username is available!
                </p>
              )}
              {usernameAvailable === false && (
                <p className="text-red-400 text-sm mt-1">
                  ❌ Username is already taken.
                </p>
              )}            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md"
              >
                <option value="">Select Role</option>
                <option value="franchisee">Franchisee</option>
                <option value="franchisor">Franchisor</option>
              </select>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={
                !wallet.publicKey ||
                !isVerified ||
                !formData.username ||
                !formData.role ||
                usernameAvailable !== true  // Ensure username is available
              }
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 transition border border-green-500 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </>
        )}

        {/* Step 2: Personal Info */}
        {step === 2 && (
          <>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md"
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
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                pattern="\d{10}"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md"
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 transition border border-gray-600 rounded-md"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.name || !formData.email || !formData.phone}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 transition border border-green-500 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Step 3: Business Info */}
        {step === 3 && (
          <>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-200">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter about yourself"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md"
                rows={3}
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 transition border border-gray-600 rounded-md"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 transition border border-green-500 rounded-md"
              >
                Submit
              </button>
            </div>
          </>
        )}

        <div className="mt-5 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-green-400 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
