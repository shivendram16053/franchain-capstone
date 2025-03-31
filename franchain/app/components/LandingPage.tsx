"use client"

import { useEffect, useState } from "react"
import { FileText, Shield, Layers, ArrowRight, Pencil, ShieldCheck, Layers3, ExternalLink, Globe, ArrowBigDown } from "lucide-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { motion } from "framer-motion"
import Link from "next/link"
import { useWallet } from "@solana/wallet-adapter-react"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const Landing = () => {
  const { loggedIn, setUser } = useUser()
  const wallet = useWallet()
  const router = useRouter()
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    if (wallet.publicKey) {
      const publicKeyStr = wallet.publicKey.toString()

      // Check if the user has already signed
      const signedBefore = localStorage.getItem(`signed_${publicKeyStr}`)
      if (!signedBefore) {
        signMessage(publicKeyStr)
      } else {
        setIsVerified(true)
      }
    }
  }, [wallet.publicKey])

  const signMessage = async (publicKey: string) => {
    if (!wallet.signMessage) return

    try {
      const message = `Signing this message to verify ownership of wallet: ${publicKey}`
      const encodedMessage = new TextEncoder().encode(message)
      const signature = await wallet.signMessage(encodedMessage)

      // Store in localStorage to prevent repeated signing
      localStorage.setItem(`signed_${publicKey}`, JSON.stringify(signature))
      setIsVerified(true)
    } catch (error) {
      console.error("Signature error:", error)
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      if (wallet.connected && wallet.publicKey) {
        const res = await fetch("/api/check-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet: wallet.publicKey.toString(),
          }),
        })

        const data = await res.json()

        const user = localStorage.getItem("user")

        if (user) {
          setUser(JSON.parse(user))
          router.push("/dashboard")
        } else {
          if (data.data) {
            router.push("/login")
          } else {
            router.push("/register")
          }
        }
      }
    }

    checkUser()
  }, [wallet.connected, wallet.publicKey, router, setUser])

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex justify-center items-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-green-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl flex justify-center flex-col items-center mx-auto text-center">
            <Badge className="mb-6 bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/50">
              Powered by Solana Blockchain
            </Badge>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 leading-tight">
              Franchise Agreements on Solana
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl">
              Create, sign, and manage franchise agreements securely on the Solana blockchain with multi-signature
              capabilities.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="wallet-adapter-button-container">
                <WalletMultiButton />
              </div>

              {loggedIn && (
                <Button
                  asChild
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  <Link href="/dashboard">
                    Explore Agreements
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              )}
            </div>

            <div className="mt-16 flex items-center gap-2">
              <ArrowBigDown className="animate-bounce w-10 h-10 text-green-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/0 via-gray-900/80 to-gray-900/0 pointer-events-none"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/50">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Why Choose Franchain?</h2>
            <div className="mt-4 h-1 w-20 bg-gradient-to-r from-green-400 to-emerald-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:border-green-500/50 transition-all duration-300"
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6 border border-green-500/20">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl text-green-400 font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="howitworks" className="py-24 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/50">
              Process
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white">How It Works</h2>
            <div className="mt-4 h-1 w-20 bg-gradient-to-r from-green-400 to-emerald-600 mx-auto rounded-full"></div>
          </div>

          <div className="flex flex-col space-y-8 items-center max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="w-full"
              >
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:border-green-500/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      <div className="flex-shrink-0 bg-green-500/10 p-4 rounded-full border border-green-500/20">
                        {step.icon}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-green-500/50 text-green-400">
                            Step {index + 1}
                          </Badge>
                          <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                        </div>
                        <p className="text-gray-300 mt-2">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/0 via-green-900/10 to-gray-900/0 pointer-events-none"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Card className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-gray-700 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="max-w-3xl mx-auto text-center">
                <Badge className="mb-6 bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/50">
                  Get Started Today
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to Transform Your Franchise Agreements?
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Join the blockchain revolution and bring transparency, security, and efficiency to your franchise
                  operations.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <div className="wallet-adapter-button-container">
                    <WalletMultiButton />
                  </div>
                  <Button
                    variant="outline"
                    className="border-green-500 text-green-400 hover:bg-green-500/10"
                    onClick={() => window.open("https://solana.com", "_blank")}
                  >
                    Learn About Solana
                    <ExternalLink className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black/50 backdrop-blur-sm border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <Globe className="w-6 h-6 text-green-400 mr-2" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                Franchain
              </span>
            </div>

            <div className="flex gap-8 text-gray-400">
              <Link href="#features" className="hover:text-green-400 transition-colors">
                Features
              </Link>
              <Link href="#howitworks" className="hover:text-green-400 transition-colors">
                How It Works
              </Link>
              <Link href="#" className="hover:text-green-400 transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-green-400 transition-colors">
                Terms
              </Link>
            </div>

            <div className="mt-6 md:mt-0 text-gray-500">© {new Date().getFullYear()} Franchain Agreement System</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing

const features = [
  {
    title: "Easy Creation",
    description:
      "Create franchise agreements with our intuitive interface in minutes. Customize terms to fit your business needs.",
    icon: <FileText className="w-8 h-8 text-green-400" />,
  },
  {
    title: "Secure Signing",
    description:
      "Multi-signature capabilities ensure all parties must sign off before any agreement is finalized and stored on-chain.",
    icon: <Shield className="w-8 h-8 text-green-400" />,
  },
  {
    title: "Blockchain Storage",
    description:
      "All agreements are securely stored on the Solana blockchain, providing immutability and transparency.",
    icon: <Layers className="w-8 h-8 text-green-400" />,
  },
]

const steps = [
  {
    title: "Create Agreement",
    description: "Set up your franchise agreement with clear terms using our guided interface.",
    icon: <Pencil className="w-8 h-8 text-green-400" />,
  },
  {
    title: "Sign Securely",
    description: "Use multi-signature verification to ensure all parties sign before proceeding.",
    icon: <ShieldCheck className="w-8 h-8 text-green-400" />,
  },
  {
    title: "Store on Blockchain",
    description: "Agreements are permanently stored on Solana for transparency and security.",
    icon: <Layers3 className="w-8 h-8 text-green-400" />,
  },
  {
    title: "Track & Manage",
    description: "Monitor agreements, manage updates, and execute payments effortlessly.",
    icon: <FileText className="w-8 h-8 text-green-400" />,
  },
]

