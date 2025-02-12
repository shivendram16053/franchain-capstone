import LoginPage from "@/components/LoginPage";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import React from "react";

const page = () => {
  const { connected } = useWallet();

  if (connected) {
    return <LoginPage />;
  }

  return (
    <div className="flex justify-center items-center flex-col">
      <nav className="bg-slate-900 text-white p-4 w-full">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl pl-10 font-bold">FranChain</h1>
          <WalletMultiButton />
        </div>
      </nav>

      <div className="bg-slate-800 h-[90.5vh] w-full flex justify-evenly items-center">
        <div className="text-justify w-96">
          <h1 className="text-7xl font-extrabold text-gray-50 mb-4">
            Revolutionizing Franchise Management
          </h1>
          <h2 className="text-xl w-full text-gray-500 ">
            Seamlessly connect franchisors and franchisees with secure on-chain
            storage, automated fund sharing, and transparent collaboration.
          </h2>
        </div>

        <div className="relative">
          {/* Shadow Background */}
          <div className="absolute inset-0 bg-gradient-to-br shadow-2xl shadow-gray-50 rounded-lg -z-10"></div>

          {/* Features Section */}
          <div className="container mx-auto px-4 relative z-10">
            <div className=" text-center">
              {/* Smart Contracts */}
              <div className="relative group m-2">
                {/* Point Image */}

                <div className=" p-4 rounded-lg shadow-sm shadow-gray-50">
                  <h3 className="text-2xl font-semibold">Smart Contracts</h3>
                  <p className="text-gray-500">
                    Automated agreement management
                  </p>
                </div>
              </div>

              {/* Secure Storage */}
              <div className="relative group m-2">
                {/* Point Image */}

                <div className=" p-4 rounded-lg shadow-sm shadow-gray-50">
                  <h3 className="text-2xl font-semibold">Secure Storage</h3>
                  <p className="text-gray-500">On-chain data protection</p>
                </div>
              </div>

              {/* Real-time Tracking */}
              <div className="relative group m-2 ">
                {/* Point Image */}

                <div className=" p-4 rounded-lg shadow-sm shadow-gray-50">
                  <h3 className="text-2xl font-semibold ">
                    Real-time Tracking
                  </h3>
                  <p className="text-gray-500">Instant compliance monitoring</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
