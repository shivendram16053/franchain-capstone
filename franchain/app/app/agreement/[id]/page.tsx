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
  Check,
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
import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js"
import * as anchor from "@coral-xyz/anchor"
import { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "@/idl/franchain.json";
import * as spltoken from "@solana/spl-token";
import { toast } from "sonner" // Update the path to the correct location

const idl_string = JSON.stringify(idl);
const idl_object: anchor.Idl = JSON.parse(idl_string);
const programId = new PublicKey(idl.address);


interface Agreement {
  franchisor_termination: boolean,
  franchisee_termination: boolean
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
  const usdt_mint = new PublicKey("FwaBLXJPVsCYKJLbD1rz3tPWBnL129M2yRqM1Pe1KfQ")


  // Button states
  const [createMultisigLoading, setCreateMultisigLoading] = useState(false)
  const [createMultisigSuccess, setCreateMultisigSuccess] = useState(false)
  const [approveMultisigLoading, setApproveMultisigLoading] = useState(false)
  const [approveMultisigSuccess, setApproveMultisigSuccess] = useState(false)
  const [getTokenLoading, setGetTokenLoading] = useState(false)
  const [getTokenSuccess, setGetTokenSuccess] = useState(false)
  const [getTokenTxId, setGetTokenTxId] = useState("")


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

  if (!provider) return;

  const program = new anchor.Program(idl_object, provider)

  const handleCreateMultisig = async () => {
    if (!agreement || !wallet.publicKey || !walletAddress || !program) return;

    try {
      setCreateMultisigLoading(true);
      setCreateMultisigSuccess(false);

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

      if (confirmation) {
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
      }

      setCreateMultisigSuccess(true);

      toast("Multisig created successfully. Transaction ID: " + txId, {
        description: "You can view the transaction on Solscan.",
        action: {
          label: "Copy TX",
          onClick: () => navigator.clipboard.writeText(txId),
        },
      })

      // Redirect after a short delay to show success state
      setTimeout(() => {
        router.push("/profile");
      }, 2000);

    } catch (err: any) {
      setError('Failed to create multisig: ' + err.message);
      console.error(err);
      toast("Failed to create multisig", {
        description: err.message,
      })
    } finally {
      setCreateMultisigLoading(false);
    }
  };

  const handleApproveMultisig = async () => {
    if (!agreement || !wallet.publicKey || !program) return;

    try {
      setApproveMultisigLoading(true);
      setApproveMultisigSuccess(false);

      // 1. Prepare accounts and parameters
      const franchisor = new PublicKey(agreement.franchisor);
      const franchisee = wallet.publicKey;

      const franchisor_share = Number(agreement.franchisor_share); // u8
      const franchisee_share = Number(100 - Number(agreement.franchisor_share)); // u8
      const initial_fee = new anchor.BN(agreement.initial_fee); // u64
      const contract_start = new anchor.BN(Math.floor(Date.now() / 1000)); // i128 (Unix Timestamp)
      const contract_duration = new anchor.BN(agreement.contract_duration); // u64
      const dispute_resolution = agreement.dispute_resolution.toString(); // String
      const vault_status = "active"; // String

      const [multisigPda, multisigBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("multisig"), franchisor.toBuffer(), franchisee.toBuffer()],
        program.programId
      );

      const [vault_pda, vault_bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("vaults"), franchisor.toBuffer(), franchisee.toBuffer()],
        program.programId
      );

      const [agreement_pda, agreement_bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("agreement"), franchisor.toBuffer(), franchisee.toBuffer()],
        program.programId
      );

      const transaction = new Transaction();

      async function getOrCreateATA(owner: PublicKey) {
        const isPDA = PublicKey.isOnCurve(owner.toBuffer()) === false;

        const ata = await spltoken.getAssociatedTokenAddress(
          usdt_mint,
          owner,
          isPDA,
          spltoken.TOKEN_PROGRAM_ID // 👈 Pass explicitly
        );

        const accountInfo = await connectioncli.getAccountInfo(ata);

        if (!accountInfo) {
          console.log(`Creating ATA for: ${owner.toBase58()}`);
          transaction.add(
            spltoken.createAssociatedTokenAccountInstruction(
              wallet.publicKey!,
              ata,
              owner,
              usdt_mint,
              spltoken.TOKEN_PROGRAM_ID // 👈 Must also be passed here!
            )
          );
        }

        return ata;
      }


      // 1. Create ATAs if they don't exist
      if (!wallet.publicKey) {
        throw new Error("Wallet public key is null");
      }
      const franchiseeAta = await getOrCreateATA(franchisee);
      const franchisorAta = await getOrCreateATA(franchisor);
      const vaultAta = await getOrCreateATA(vault_pda); // Vault also needs an ATA

      // 2. Create multisig instruction
      const multisigIx = await program.methods
        .multisig(
          franchisor_share,
          franchisee_share,
          initial_fee,
          contract_start,
          contract_duration,
          dispute_resolution,
          vault_bump,
          agreement_bump,
          vault_status
        )
        .accounts({
          franchisor,
          franchisee,
          usdtMint: usdt_mint,
          multisigPda,
          vaultPda: vault_pda,
          agreementPda: agreement_pda,
          vaultAta: vaultAta,
          franchisorAta: franchisorAta,
          franchiseeAta: franchiseeAta,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        })
        .instruction();

      transaction.add(multisigIx);

      // 3. Get latest blockhash
      const { blockhash } = await connectioncli.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // 4. Sign and send transaction
      if (!wallet.signTransaction) {
        throw new Error("Wallet does not support signing transactions");
      }
      const signedTx = await wallet.signTransaction(transaction);
      const txId = await connectioncli.sendRawTransaction(signedTx.serialize());

      // 5. Confirm transaction
      await connectioncli.confirmTransaction({
        signature: txId,
        blockhash,
        lastValidBlockHeight: (await connectioncli.getBlockHeight()) + 150, // ~1 minute timeout
      });

      console.log("Transaction Sent:", txId);
      // 7. Update backend
      const response = await fetch("/api/update-draft-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
        }),
      });

      if (!response.ok) throw new Error("Failed to update DB");

      setApproveMultisigSuccess(true);
      toast("Agreement approved!", {
        description: "Transaction ID: " + txId,
        action: {
          label: "Copy TX",
          onClick: () => navigator.clipboard.writeText(txId),
        },
      })

      // Redirect after a short delay to show success state
      setTimeout(() => {
        router.push("/profile");
      }, 2000);

    } catch (err: any) {
      setError('Failed to approve multisig: ' + err.message);
      console.error(err);
      toast("Failed to approve multisig", {
        description: err.message,
      })

    } finally {
      setApproveMultisigLoading(false);
    }
  }

  const getToken = async () => {
    try {
      setGetTokenLoading(true);
      setGetTokenSuccess(false);

      if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      const response = await fetch("/api/send-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: wallet.publicKey.toBase58(), // send recipient wallet address
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong");
      }

      setGetTokenSuccess(true);
      setGetTokenTxId(result.txid);
      console.log("Token sent! Transaction ID:", result.txid);
      toast("1000 USDT sent to your wallet!", {
        description: "Transaction ID: " + result.txid,
        action: {
          label: "Copy TX",
          onClick: () => navigator.clipboard.writeText(result.txid),
        },
      })
    } catch (error: any) {
      console.error("Token transfer failed:", error);
      toast("Token transfer failed", {
        description: error.message,
      })
    } finally {
      setGetTokenLoading(false);
    }
  };

  const terminate = async () => {

    if (!agreement || !wallet.publicKey || !program) return;

    try {

      const transaction = new Transaction();

      async function getOrCreateATA(owner: PublicKey) {
        const isPDA = PublicKey.isOnCurve(owner.toBuffer()) === false;

        const ata = await spltoken.getAssociatedTokenAddress(
          usdt_mint,
          owner,
          isPDA,
          spltoken.TOKEN_PROGRAM_ID // 👈 Pass explicitly
        );

        const accountInfo = await connectioncli.getAccountInfo(ata);

        if (!accountInfo) {
          console.log(`Creating ATA for: ${owner.toBase58()}`);
          transaction.add(
            spltoken.createAssociatedTokenAccountInstruction(
              wallet.publicKey!,
              ata,
              owner,
              usdt_mint,
              spltoken.TOKEN_PROGRAM_ID
            )
          );
        }

        return ata;
      }



      const franchisor = new PublicKey(agreement.franchisor);
      const franchisee = new PublicKey(agreement.franchisee);


      const [vault_pda, vault_bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("vaults"), franchisor.toBuffer(), franchisee.toBuffer()],
        program.programId
      );

      const [agreement_pda, agreement_bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("agreement"), franchisor.toBuffer(), franchisee.toBuffer()],
        program.programId
      );


      const franchiseeAta = await getOrCreateATA(franchisee);
      const vaultAta = await getOrCreateATA(vault_pda); // Vault also needs an ATA

      const terminateIx = await program.methods
        .agreement()
        .accounts({
          franchisor,
          franchisee,
          agreementPda: agreement_pda,
          vaultPda: vault_pda,
          vaultAta: vaultAta,
          franchiseeAta: franchiseeAta,
          usdtMint: usdt_mint,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        })
        .instruction();

      transaction.add(terminateIx);

      // 3. Get latest blockhash
      const { blockhash } = await connectioncli.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // 4. Sign and send transaction
      if (!wallet.signTransaction) {
        throw new Error("Wallet does not support signing transactions");
      }
      const signedTx = await wallet.signTransaction(transaction);
      const txId = await connectioncli.sendRawTransaction(signedTx.serialize());

      // 5. Confirm transaction
      await connectioncli.confirmTransaction({
        signature: txId,
        blockhash,
        lastValidBlockHeight: (await connectioncli.getBlockHeight()) + 150, // ~1 minute timeout
      });

      console.log("Transaction Sent:", txId);


      const response = await fetch("/api/terminate-agreement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          wallet: wallet.publicKey.toBase58(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong");
      }

      toast("Agreement terminated!", {
        description: result.message, // 👈 Show who terminated
        action: {
          label: "Copy TX",
          onClick: () => navigator.clipboard.writeText(result.txid ?? ""),
        },
      });
    } catch (err: any) {
      console.error("Termination failed:", err);
      toast("Termination failed", {
        description: err.message,
      })
    }
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
                    <p className="text-white">Initial Fee: {agreement.initial_fee} USDC</p>
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
            {agreement.status === "draft" && agreement.franchisor === wallet.publicKey?.toString() && (
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
                      <Button
                        onClick={handleCreateMultisig}
                        className="bg-green-600 hover:bg-green-700 text-white w-full relative"
                        disabled={createMultisigLoading}
                      >
                        {createMultisigLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Multisig...
                          </>
                        ) : createMultisigSuccess ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Multisig Created!
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Create Multisig
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {agreement.status === "pending" && agreement.franchisee === wallet.publicKey?.toString() && (
              <>
                <Button
                  onClick={getToken}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white relative"
                  disabled={getTokenLoading || getTokenSuccess}
                >
                  {getTokenLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting tokens...
                    </>
                  ) : getTokenSuccess ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Tokens Received!
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Get 1k devnet USDT
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleApproveMultisig}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  disabled={approveMultisigLoading || approveMultisigSuccess}
                >
                  {approveMultisigLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : approveMultisigSuccess ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Approved!
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve Multisig
                    </>
                  )}
                </Button>
              </>
            )}

            {agreement.status === "active" &&
              !agreement.franchisee_termination &&
              !agreement.franchisor_termination &&
              (agreement.franchisee === wallet.publicKey?.toString() || agreement.franchisor === wallet.publicKey?.toString()) && (
                <Button
                  onClick={terminate} // make sure your function is here
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Terminate
                </Button>
              )}

          </div>
        </div>

        {/* Success/Result Notifications */}
        {getTokenSuccess && getTokenTxId && (
          <div className="mt-6 bg-green-500/20 border border-green-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-500 rounded-full p-1 mt-0.5">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-green-300">Token Transfer Successful!</h4>
                <p className="text-sm text-green-200 mt-1">
                  You have received 1,000 devnet USDT tokens. You can now proceed with approving the multisig.
                </p>
                <p className="text-xs text-green-300 mt-2">
                  Transaction ID: {getTokenTxId.slice(0, 8)}...{getTokenTxId.slice(-8)}
                </p>
              </div>
            </div>
          </div>
        )}

        {createMultisigSuccess && (
          <div className="mt-6 bg-green-500/20 border border-green-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-500 rounded-full p-1 mt-0.5">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-green-300">Multisig Created Successfully!</h4>
                <p className="text-sm text-green-200 mt-1">
                  The multisig has been created and the franchisee has been notified. Redirecting to your profile...
                </p>
              </div>
            </div>
          </div>
        )}

        {approveMultisigSuccess && (
          <div className="mt-6 bg-green-500/20 border border-green-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-500 rounded-full p-1 mt-0.5">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-green-300">Agreement Approved!</h4>
                <p className="text-sm text-green-200 mt-1">
                  You have successfully approved the franchise agreement. Redirecting to your profile...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}