"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  FileText,
  Wallet,
  Calendar,
  DollarSign,
  Clock,
  Shield,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Scale,
  FileTerminal,
  CreditCard,
  Mail,
  Share2,
  Pen,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import Link from "next/link"
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js"
import * as anchor from "@coral-xyz/anchor"
import { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "@/idl/franchain.json";

const idl_string = JSON.stringify(idl);
const idl_object: anchor.Idl = JSON.parse(idl_string);
const programId = new PublicKey(idl.address);


interface Agreement {
  title: string
  description: string
  terms_conditions: string
  payment_terms: string
  termination_clause: string
  franchisor: string
  initial_fee: string
  franchisee: string
  contract_duration: string
  franchisor_share: string
  dispute_resolution: string
  status: string
  email: string
}


const connectioncli = new Connection(clusterApiUrl("devnet"), "confirmed");

export default function AgreementPage() {
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { id } = useParams()
  const router = useRouter()
  const wallet = useWallet();
  const [walletAddress, setWalletAddress] = useState("")
  const [email, setEmail] = useState("")
  const connection = useConnection();

  useEffect(() => {
    if (!id) return

    const fetchAgreement = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/fetch-by-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch agreement data")
        }

        setAgreement(result.data[0])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAgreement()
  }, [id])


  const provider = wallet.wallet && wallet.publicKey && wallet.signTransaction && wallet.signAllTransactions
    ? new anchor.AnchorProvider(
      connection.connection,
      wallet as AnchorWallet,
      anchor.AnchorProvider.defaultOptions()
    )
    : null;

    if(!provider)return;

  const program = new anchor.Program(idl_object,provider)

  const handleCreateMultisig = async () => {
    if (!agreement || !wallet.publicKey || !walletAddress || !program) return;
  
    try {
      setLoading(true);
  
      // 1. Prepare accounts and parameters
      const franchisor = wallet.publicKey;
      const franchisee = new PublicKey(walletAddress);
      const initialFee = new anchor.BN(Math.round(parseFloat(agreement.initial_fee) * 1e9)); // Convert to lamports
      const threshold = 2;
  
      // 2. Generate PDA
      const seeds = [
        anchor.utils.bytes.utf8.encode('multisig'),
        franchisor.toBuffer(),
        franchisee.toBuffer(),
      ];
      const [multisigPda, multisigBump] = await PublicKey.findProgramAddress(seeds, program.programId);
  
      // 3. Build the instruction
      const tx = await program.methods
        .initialize(
          franchisor,
          franchisee,
          initialFee,
          [franchisor],
          1,
          false,
          threshold,
          multisigBump
        )
        .accounts({
          franchisor,
          franchisee,
          multisigPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .transaction();
  
      // 4. Get recent blockhash and set it on the transaction
      const { blockhash } = await connectioncli.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;
  
      // 5. Sign and send the transaction
      if (!wallet.signTransaction) {
        throw new Error("Wallet does not support signing transactions");
      }
      const signedTx = await wallet.signTransaction(tx);
      const rawTransaction = signedTx.serialize();
      const txId = await connectioncli.sendRawTransaction(rawTransaction);
  
      // 6. Confirm transaction
      const confirmation = await connectioncli.confirmTransaction({
        signature: txId,
        blockhash,
        lastValidBlockHeight: (await connectioncli.getBlockHeight()) + 150, // ~1 minute timeout
      });
  
      if (confirmation.value.err) {
        throw new Error("Transaction failed");
      }
  
      // 7. Update backend
      const response = await fetch("/api/update-franchisee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          franchisee: franchisee.toBase58(),
          franchisee_email: email 
        }),
      });
  
      if (!response.ok) throw new Error("Failed to update DB");
      
      router.push("/profile");
    } catch (err: any) {
      setError('Failed to create multisig: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMultisif = async ()=>{
    
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>
      case "expired":
        return <Badge className="bg-gray-500 hover:bg-gray-600">Expired</Badge>
      default:
        return <Badge className="bg-blue-500 hover:bg-blue-600">{status}</Badge>
    }
  }

  const truncateAddress = (address: string) => {
    if (!address) return "N/A"
    return `${address.slice(0, 8)}...${address.slice(-8)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <Skeleton className="h-8 w-3/4 bg-gray-700 mb-2" />
              <Skeleton className="h-4 w-1/2 bg-gray-700" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-full bg-gray-700" />
                <Skeleton className="h-4 w-full bg-gray-700" />
                <Skeleton className="h-4 w-3/4 bg-gray-700" />
              </div>
              <Separator className="bg-gray-700" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-20 w-full bg-gray-700" />
                <Skeleton className="h-20 w-full bg-gray-700" />
                <Skeleton className="h-20 w-full bg-gray-700" />
                <Skeleton className="h-20 w-full bg-gray-700" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm p-8 text-center">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">Error Loading Agreement</h2>
              <p className="text-gray-300 max-w-md mb-6">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-green-500 text-green-400 hover:bg-green-500/10"
              >
                <Loader2 className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (!agreement) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm p-8 text-center">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">Agreement Not Found</h2>
              <p className="text-gray-300 max-w-md mb-6">
                The agreement you're looking for doesn't exist or has been removed.
              </p>
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                View All Agreements
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm mb-8">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-white">{agreement.title}</CardTitle>
                <CardDescription className="text-gray-400 mt-1">Agreement ID: {id as string}</CardDescription>
              </div>
              <div className="flex items-center gap-3">{getStatusBadge(agreement.status)}</div>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
              <p className="text-gray-200">{agreement.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="h-5 w-5 text-green-400" />
                  <h3 className="text-sm font-medium text-gray-300">Franchisor</h3>
                </div>
                <p className="text-white break-all">{truncateAddress(agreement.franchisor)}</p>
                <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>{agreement.email}</span>
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-green-400" />
                  <h3 className="text-sm font-medium text-gray-300">Contract Duration</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="text-white">{agreement.contract_duration} months</p>
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <h3 className="text-sm font-medium text-gray-300">Financial Terms</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <p className="text-white">Initial Fee: {agreement.initial_fee} SOL</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-gray-400" />
                    <p className="text-white">Franchisor Share: {agreement.franchisor_share}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-green-400" />
                  <h3 className="text-sm font-medium text-gray-300">Dispute Resolution</h3>
                </div>
                <p className="text-white">{agreement.dispute_resolution}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="grid grid-cols-3 bg-gray-800/50 border border-gray-700">
            <TabsTrigger value="terms" className="data-[state=active]:bg-gray-700">
              <FileTerminal className="h-4 w-4 mr-2" />
              Terms & Conditions
            </TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-gray-700">
              <DollarSign className="h-4 w-4 mr-2" />
              Payment Terms
            </TabsTrigger>
            <TabsTrigger value="termination" className="data-[state=active]:bg-gray-700">
              <Scale className="h-4 w-4 mr-2" />
              Termination Clause
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <FileTerminal className="h-5 w-5 text-green-400" />
                  Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line text-gray-200">{agreement.terms_conditions}</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  Payment Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line text-gray-200">{agreement.payment_terms}</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="termination">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Scale className="h-5 w-5 text-green-400" />
                  Termination Clause
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line text-gray-200">{agreement.termination_clause}</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agreements
          </Button>

          <div className="flex gap-3">
            {agreement.status === "pending" && agreement.franchisor === wallet.publicKey?.toString() && (
              <>
                <Link href={`/edit/${id}`}>
                  <Button variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10">
                    <Pen className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>

                {/* Create Multisig Modal Trigger */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-green-500 text-green-400 hover:bg-green-500/10">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Create Multisig
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border border-gray-700 text-white p-6 rounded-lg">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold">Create Multisig</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="text"
                        placeholder="Enter Franchisee Wallet Address"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="border-gray-600 bg-gray-800 text-white"
                      />
                      <Input
                        type="email"
                        placeholder="Enter Franchisee Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-gray-600 bg-gray-800 text-white"
                      />
                      <Button onClick={handleCreateMultisig} className="bg-green-600 hover:bg-green-700 text-white w-full">
                        Create Multisig
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {agreement.status === "draft" && agreement.franchisee === wallet.publicKey?.toString() && (
              <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-emerald-700 text-white">
                <Wallet className="mr-2 h-4 w-4" />
                Approve Multisig
              </Button>
            )}

            {agreement.status === "active" && agreement.franchisee == wallet.publicKey?.toString() || agreement.status === "active" && agreement.franchisor === wallet.publicKey?.toString() && (
              <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-emerald-700 text-white">
                <Wallet className="mr-2 h-4 w-4" />
                Terminate
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

