import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Franchain } from "../target/types/franchain";
import { assert } from "chai";
import {
  createMint,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

describe("franchain", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Franchain as Program<Franchain>;

  let randomSigner = anchor.web3.Keypair.generate();
  let multisig_pda: anchor.web3.PublicKey;
  let multisigBump: number;
  let franchisor = anchor.web3.Keypair.generate();
  let franchisee = anchor.web3.Keypair.generate();
  let usdt_mint: anchor.web3.PublicKey;
  let vault_pda: anchor.web3.PublicKey;
  let vaultBump: number;
  let agreement_pda: anchor.web3.PublicKey;
  let agreementBump: number;
  let vault_ata: anchor.web3.PublicKey;
  let token_program = anchor.utils.token.TOKEN_PROGRAM_ID;
  let franchisee_ata: anchor.web3.PublicKey;
  let franchisor_ata: anchor.web3.PublicKey;

  before(async () => {
    const provider = anchor.getProvider();

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        franchisor.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      ),
      "confirmed"
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        franchisee.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      ),
      "confirmed"
    );

    [multisig_pda, multisigBump] =
      await anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("multisig"),
          franchisor.publicKey.toBuffer(),
          franchisee.publicKey.toBuffer(),
        ],
        program.programId
      );
    [vault_pda, vaultBump] = await anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vaults"),
        franchisor.publicKey.toBuffer(),
        franchisee.publicKey.toBuffer(),
      ],
      program.programId
    );
    [agreement_pda, agreementBump] =
      await anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("agreement"),
          franchisor.publicKey.toBuffer(),
          franchisee.publicKey.toBuffer(),
        ],
        program.programId
      );

    usdt_mint = await createMint(
      provider.connection,
      franchisor,
      franchisor.publicKey,
      null,
      6
    );
    vault_ata = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        franchisor,
        usdt_mint,
        vault_pda,
        true
      )
    ).address;

    franchisee_ata = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        franchisee,
        usdt_mint,
        franchisee.publicKey
      )
    ).address;
    franchisor_ata = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        franchisor,
        usdt_mint,
        franchisor.publicKey
      )
    ).address;

    await mintTo(
      provider.connection,
      franchisor,
      usdt_mint,
      franchisee_ata,
      franchisor,
      100000000
    );
    console.log("Minted 100 USDT to franchisee");

    const initialFee = new anchor.BN(1000000);
    const threshold = 2;

    await program.methods
      .initialize(
        franchisor.publicKey,
        franchisee.publicKey,
        initialFee,
        [],
        0,
        false,
        threshold,
        multisigBump
      )
      .accounts({
        franchisor: franchisor.publicKey,
        franchisee: franchisee.publicKey,
        multisigPda: multisig_pda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([franchisor, franchisee])
      .rpc();
  });

  it("Should initialize a multisig PDA correctly", async () => {
    const multisigAccount = await program.account.multiSig.fetch(multisig_pda);
    assert.strictEqual(
      multisigAccount.franchisor.toBase58(),
      franchisor.publicKey.toBase58(),
      "Franchisor does not match"
    );
    assert.strictEqual(
      multisigAccount.franchisee.toBase58(),
      franchisee.publicKey.toBase58(),
      "Franchisee does not match"
    );
    assert.strictEqual(
      multisigAccount.initialFee.toString(),
      "1000000",
      "Initial Fee does not match"
    );
    assert.strictEqual(
      multisigAccount.threshold,
      2,
      "Threshold does not match"
    );
    assert.strictEqual(
      multisigAccount.approvals,
      1,
      "Approvals count should be 1 initially"
    );
    assert.strictEqual(
      multisigAccount.isSigned,
      false,
      "isSigned flag should be false initially"
    );

    console.log("Multisig PDA successfully initialized with correct values!");
  });

  it("Should fail if trying to initialize an already existing multisig PDA", async () => {
    try {
      await program.methods
        .initialize(
          franchisor.publicKey,
          franchisee.publicKey,
          new anchor.BN(1000),
          [],
          0,
          false,
          2,
          255
        )
        .accounts({
          franchisor: franchisor.publicKey,
          franchisee: franchisee.publicKey,
          multisigPda: multisig_pda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([franchisor, franchisee])
        .rpc();

      await program.methods
        .initialize(
          franchisor.publicKey,
          franchisee.publicKey,
          new anchor.BN(1000),
          [],
          0,
          false,
          2,
          255
        )
        .accounts({
          franchisor: franchisor.publicKey,
          franchisee: franchisee.publicKey,
          multisigPda: multisig_pda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([franchisor, franchisee])
        .rpc();

      assert.fail("Should have thrown an error");
    } catch (err) {
      return;
    }
  });

  it("Should fail if an unauthorized signer tries to initialize the multisig PDA", async () => {
    try {
      await program.methods
        .initialize(
          franchisor.publicKey,
          franchisee.publicKey,
          new anchor.BN(1000),
          [],
          0,
          false,
          2,
          multisigBump
        )
        .accounts({
          franchisor: franchisor.publicKey,
          franchisee: franchisee.publicKey,
          multisigPda: multisig_pda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([randomSigner])
        .rpc();

      assert.fail("Should have thrown an error");
    } catch (err) {
      return;
    }
  });

  it("Should allow valid approvals from both franchisor and franchisee", async () => {
    await program.methods
      .multisig(
        50,
        50,
        new anchor.BN(100000),
        new anchor.BN(Date.now()),
        new anchor.BN(365),
        "Arbitration",
        "active",
        vaultBump,
        agreementBump
      )
      .accounts({
        franchisor: franchisor.publicKey,
        franchisee: franchisee.publicKey,
        usdtMint: usdt_mint,
        multisigPda: multisig_pda,
        vaultPda: vault_pda,
        agreementPda: agreement_pda,
        vaultAta: vault_ata,
        franchisorAta: franchisor_ata,
        franchiseeAta: franchisee_ata,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      })
      .signers([franchisor, franchisee])
      .rpc();

    const multisigAccount = await program.account.multiSig.fetch(multisig_pda);
    assert.strictEqual(
      multisigAccount.approvals,
      2,
      "Approvals count should have to be incresed"
    );
    assert.strictEqual(
      multisigAccount.isSigned,
      true,
      "is signed should have to be true"
    );
    assert.strictEqual(
      multisigAccount.approvedBy.length,
      2,
      "There should be two publickey in the"
    );
  });
  it("Should allow valid approvals from both franchisor and franchisee", async () => {
    await program.methods
      .multisig(
        50,
        50,
        new anchor.BN(100000),
        new anchor.BN(Date.now()),
        new anchor.BN(365),
        "Arbitration",
        "active",
        vaultBump,
        agreementBump
      )
      .accounts({
        franchisor: franchisor.publicKey,
        franchisee: franchisee.publicKey,
        usdtMint: usdt_mint,
        multisigPda: multisig_pda,
        vaultPda: vault_pda,
        agreementPda: agreement_pda,
        vaultAta: vault_ata,
        franchisorAta: franchisor_ata,
        franchiseeAta: franchisee_ata,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      })
      .signers([franchisor, franchisee])
      .rpc();

    const multisigAccount = await program.account.multiSig.fetch(multisig_pda);
    assert.strictEqual(
      multisigAccount.approvals,
      2,
      "Approvals count should have to be incresed"
    );
    assert.strictEqual(
      multisigAccount.isSigned,
      true,
      "is signed should have to be true"
    );
    assert.strictEqual(
      multisigAccount.approvedBy.length,
      2,
      "There should be two publickey in the"
    );
  });
});
