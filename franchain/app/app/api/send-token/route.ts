// pages/api/send-usdt.ts

import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    Transaction,
  } from "@solana/web3.js";
  import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  } from "@solana/spl-token";
  import bs58 from "bs58";
  import { NextRequest, NextResponse } from "next/server";
  
  const connection = new Connection("https://api.devnet.solana.com");
  
  const secretKey = process.env.WALLET_PRIVATE_KEY;
  if (!secretKey) {
    throw new Error("WALLET_PRIVATE_KEY is not defined in environment variables");
  }
  
  const sender = Keypair.fromSecretKey(bs58.decode(secretKey));
  
  const usdtMint = new PublicKey("FwaBLXJPVsCYKJLbD1rz3tPWBnL129M2yRqM1Pe1KfQ");
  
  export async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      const { recipient } = body;
      const recipientPubkey = new PublicKey(recipient);
  
      const senderAta = await getAssociatedTokenAddress(
        usdtMint,
        sender.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
  
      const recipientAta = await getAssociatedTokenAddress(
        usdtMint,
        recipientPubkey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
  
      const tx = new Transaction();
  
      const recipientAtaInfo = await connection.getAccountInfo(recipientAta);
      if (!recipientAtaInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            sender.publicKey,
            recipientAta,
            recipientPubkey,
            usdtMint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }
  
      // Add transfer instruction (10 USDT with 6 decimals = 10_000_000)
      tx.add(
        createTransferInstruction(
          senderAta,
          recipientAta,
          sender.publicKey,
          1000 *LAMPORTS_PER_SOL,
          [],
          TOKEN_PROGRAM_ID
        )
      );
  
      tx.feePayer = sender.publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
  
      const sig = await connection.sendTransaction(tx, [sender]);
      await connection.confirmTransaction(sig, "confirmed");
  
      return NextResponse.json({ success: true, txid: sig }, { status: 200 });
    } catch (err: any) {
      console.error("Failed to send token:", err);
      return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
    }
  }
  