"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import {
  FileText,
  Wallet,
  Calendar,
  DollarSign,
  Clock,
  Shield,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateAgreement = () => {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState("")
  const [email, setEmail] = useState("")
  const wallet = useWallet()
  const [walletAddress, setWalletAddress] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    terms_conditions: "",
    payment_terms: "",
    termination_clause: "",
    franchisor: "",
    initial_fee: "",
    contract_duration: "",
    franchisor_share: "",
    dispute_resolution: "",
    email: "",
    status: "draft",
  })

  useEffect(() => {
    const userRole = localStorage.getItem("role")
    const user = localStorage.getItem("user")
    const parsedUser = user ? JSON.parse(user) : null

    setRole(userRole || "")
    setEmail(parsedUser?.email || "")
    if (wallet.publicKey) {
      const publicKeyStr = wallet.publicKey.toString()
      setWalletAddress(publicKeyStr)
      setFormData((prev) => ({ ...prev, franchisor: publicKeyStr,email:parsedUser?.email }))
    }
  }, [wallet.publicKey])

  const handleChange = (e: { target: { name: any; value: any } }) => {
    
    setFormData({ ...formData, [e.target.name]: e.target.value })
    
  }

  const validateCurrentStep = () => {
    switch (step) {
      case 1:
        return formData.title && formData.description
      case 2:
        return formData.terms_conditions && formData.payment_terms && formData.termination_clause
      case 3:
        return formData.franchisor && formData.initial_fee  && formData.contract_duration
      case 4:
        return formData.franchisor_share && formData.dispute_resolution
      default:
        return true
    }
  }

  const handleNext = () => {
    if (!validateCurrentStep()) {
      toast.error("Missing fields")
      return
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      toast.error("Missing information")
      return
    }

    try {
      const response = await fetch("/api/create-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to create agreement. Please try again.")
      }

      toast.success("Agreement created successfully !")
      setTimeout(() => router.push("/profile"), 2000)
    } catch (err: any) {
      toast.error("error creating agreement")
    }
  }

  const getStepIcon = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return FileText
      case 2:
        return Shield
      case 3:
        return Wallet
      case 4:
        return DollarSign
      default:
        return FileText
    }
  }

  const StepIcon = getStepIcon(step)

  return (
    <div className="min-h-screen mt-14 bg-gradient-to-b from-black to-gray-900 text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
            Create Draft Agreement
          </h1>
          <p className="text-gray-400 mt-2">Define the terms of your blockchain-based agreement</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step === num
                      ? "bg-green-500 text-white"
                      : step > num
                        ? "bg-green-900 text-green-400"
                        : "bg-gray-800 text-gray-500"
                  }`}
                >
                  {step > num ? <CheckCircle2 className="h-5 w-5" /> : num}
                </div>
                <span
                  className={`text-xs mt-2 ${
                    step === num ? "text-green-400" : step > num ? "text-green-700" : "text-gray-500"
                  }`}
                >
                  {num === 1 ? "Basics" : num === 2 ? "Terms" : num === 3 ? "Contract" : "Finalize"}
                </span>
              </div>
            ))}
          </div>
          <div className="relative mt-3">
            <div className="absolute h-1 bg-gray-700 w-full rounded-full"></div>
            <div
              className="absolute h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${(step - 1) * 33.33}%` }}
            ></div>
          </div>
        </div>

        <Card className="bg-gray-800 bg-opacity-50 border-gray-700 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-full">
                <StepIcon className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-white mb-0.5">
                  {step === 1
                    ? "Agreement Basics"
                    : step === 2
                      ? "Legal Terms"
                      : step === 3
                        ? "Contract Details"
                        : "Financial Terms"}
                </CardTitle>
                <CardDescription>
                  {step === 1
                    ? "Define the basic information about your agreement"
                    : step === 2
                      ? "Specify the legal terms and conditions"
                      : step === 3
                        ? "Set the contract duration and initial parameters"
                        : "Define financial terms and dispute resolution"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-300">
                    Agreement Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter agreement title"
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">
                    Agreement Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the purpose of this agreement"
                    className="bg-gray-900 border-gray-700 text-white min-h-[120px]"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="terms_conditions" className="text-gray-300">
                    Terms and Conditions
                  </Label>
                  <Textarea
                    id="terms_conditions"
                    name="terms_conditions"
                    value={formData.terms_conditions}
                    onChange={handleChange}
                    placeholder="Specify the terms and conditions"
                    className="bg-gray-900 border-gray-700 text-white min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_terms" className="text-gray-300">
                    Payment Terms
                  </Label>
                  <Textarea
                    id="payment_terms"
                    name="payment_terms"
                    value={formData.payment_terms}
                    onChange={handleChange}
                    placeholder="Define payment terms and schedule"
                    className="bg-gray-900 border-gray-700 text-white min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termination_clause" className="text-gray-300">
                    Termination Clause
                  </Label>
                  <Textarea
                    id="termination_clause"
                    name="termination_clause"
                    value={formData.termination_clause}
                    onChange={handleChange}
                    placeholder="Specify conditions for contract termination"
                    className="bg-gray-900 border-gray-700 text-white min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Wallet Address ({role})</Label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md">
                    <Wallet className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-300 truncate">
                      {wallet.publicKey ? wallet.publicKey.toString() : "Connect your wallet"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">This address will be used to sign the smart contract</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initial_fee" className="text-gray-300">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <span>Initial Fee (USDC)</span>
                    </div>
                  </Label>
                  <Input
                    id="initial_fee"
                    name="initial_fee"
                    type="number"
                    value={formData.initial_fee}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="space-y-2">
                    <Label htmlFor="contract_duration" className="text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-400" />
                        <span>Duration (months)</span>
                      </div>
                    </Label>
                    <Input
                      id="contract_duration"
                      name="contract_duration"
                      type="number"
                      value={formData.contract_duration}
                      onChange={handleChange}
                      placeholder="12"
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="franchisor_share" className="text-gray-300">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <span>Your Share (%)</span>
                    </div>
                  </Label>
                  <Input
                    id="franchisor_share"
                    name="franchisor_share"
                    type="number"
                    value={formData.franchisor_share}
                    onChange={handleChange}
                    placeholder="50"
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Percentage of revenue you will receive</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dispute_resolution" className="text-gray-300">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-400" />
                      <span>Dispute Resolution</span>
                    </div>
                  </Label>
                  <Textarea
                    id="dispute_resolution"
                    name="dispute_resolution"
                    value={formData.dispute_resolution}
                    onChange={handleChange}
                    placeholder="Define how disputes will be resolved"
                    className="bg-gray-900 border-gray-700 text-white min-h-[120px]"
                  />
                </div>

                <div className="mt-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
                  <h3 className="text-green-400 font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Important Note</span>
                  </h3>
                  <p className="text-sm text-gray-300 mt-2">
                    By submitting this agreement, you are creating a draft agreement and this will be stored in db once someone finds it then he will contact you after that it will go onchain.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t border-gray-700 pt-4">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => router.push("/profile")}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </Button>
            )}

            {step < 4 ? (
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Submit Agreement
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default CreateAgreement

