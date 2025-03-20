"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [walletAddress, setWalletAddress] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const wallet = useWallet();

  const [formData, setFormData] = useState({
    username: "",
    role: "",
    name: "",
    email: "",
    phone: "",
    description: "",
    wallet: "", // Store wallet address in formData
  });

  useEffect(() => {
    if (wallet.publicKey) {
      const publicKeyStr = wallet.publicKey.toString();
      setWalletAddress(publicKeyStr);
      setFormData((prev) => ({ ...prev, wallet: publicKeyStr }));

      // Check if the user has already signed
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

      // Store in localStorage to prevent repeated signing
      localStorage.setItem(`signed_${publicKey}`, JSON.stringify(signature));
      setIsVerified(true);
    } catch (error) {
      console.error("Signature error:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log("Form Submitted:", formData);
    
  };

  return (
    <div className="flex justify-center items-center mt-20 text-white">
      <div className="w-full max-w-md p-8 rounded-lg shadow-lg border border-gray-700 bg-gray-900">
        <h2 className="text-3xl font-semibold text-center mb-6 text-gray-200">
          Register
        </h2>

        {/* Wallet Connect */}
        <div className="mb-5 flex justify-center">
          <WalletMultiButton />
        </div>

        {step === 1 && (
          <>
            {/* Username Input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md"
              />
            </div>

            {/* Role Dropdown */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300">
                Role
              </label>
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

            {/* Next Button */}
            <button
              onClick={() => setStep(2)}
              disabled={
                !wallet.publicKey ||
                !isVerified ||
                !formData.username ||
                !formData.role
              }
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 transition border border-blue-500 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {/* Name Input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md"
              />
            </div>

            {/* Email Input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md"
              />
            </div>

            {/* Phone Input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300">
                Phone
              </label>
              <input
                type="text"
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
                disabled={
                  !formData.name ||
                  !formData.email ||
                  !formData.phone
                }
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 transition border border-blue-500 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {/* Description Input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter details about your business"
                className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md"
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 transition border border-gray-600 rounded-md"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 transition border border-blue-500 rounded-md"
              >
                Submit
              </button>
            </div>
          </>
        )}

        {/* Login Link */}
        <div className="mt-5 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
