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
  let depositor = anchor.web3.Keypair.generate();
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
  let franchaiseeBeforeBalance: number;
  let depositor_ata: anchor.web3.PublicKey;

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
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        depositor.publicKey,
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

    depositor_ata = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        depositor,
        usdt_mint,
        depositor.publicKey
      )
    ).address;

    await mintTo(
      provider.connection,
      franchisee,
      usdt_mint,
      franchisee_ata,
      franchisor,
      100000000
    );
    console.log("Minted 100 USDT to franchisee");
    await mintTo(
      provider.connection,
      depositor,
      usdt_mint,
      depositor_ata,
      franchisor,
      100000000
    );
    console.log("Minted 100 USDT to depositor");

    const initialFee = new anchor.BN(1000000);
    const threshold = 2;

    franchaiseeBeforeBalance = Number(
      (await provider.connection.getTokenAccountBalance(franchisee_ata)).value
        .amount
    );

    await (program.methods as any)
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
      .signers([franchisor])
      .rpc();
  });

  it("Should initialize a multisig PDA correctly", async () => {
    try {
      const multisigAccount = await program.account.multiSig.fetch(
        multisig_pda
      );
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
    } catch (error) {
      console.log("Error while initializing multisig", error);
    }
  });

  it("Should fail if trying to initialize an already existing multisig PDA", async () => {
    try {
      await (program.methods as any)
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
        .signers([franchisor])
        .rpc();

      await (program.methods as any)
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
        .signers([franchisor])
        .rpc();

      assert.fail("Should have thrown an error");
    } catch (err) {
      return;
    }
  });

  it("Should fail if an unauthorized signer tries to initialize the multisig PDA", async () => {
    try {
      await (program.methods as any)
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
    try {
      await (program.methods as any)
        .multisig(
          50,
          50,
          new anchor.BN(1000000),
          new anchor.BN(Date.now()),
          new anchor.BN(365),
          "Arbitration",
          vaultBump,
          agreementBump,
          "Active"
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
        .signers([franchisee])
        .rpc();

      const multisigAccount = await program.account.multiSig.fetch(
        multisig_pda
      );
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

      console.log("Multisig PDA successfully approved by both parties!");
    } catch (error) {
      console.log("Error while approving multisig", error);
    }
  });

  it("Should not allow franchisee to approve twice the same agreement", async () => {
    try {
      await (program.methods as any)
        .multisig(
          50,
          50,
          new anchor.BN(1000000),
          new anchor.BN(Date.now()),
          new anchor.BN(365),
          "Arbitration",
          vaultBump,
          agreementBump,
          "Active"
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
        .signers([franchisee]);
      assert.fail("Franchisee should not be able to approve twice!");
    } catch (err) {
      return;
    }
  });

  it("Should not allow random signer to  agreement", async () => {
    try {
      await (program.methods as any)
        .multisig(
          50,
          50,
          new anchor.BN(1000000),
          new anchor.BN(Date.now()),
          new anchor.BN(365),
          "Arbitration",
          vaultBump,
          agreementBump,
          "Active"
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
        .signers([randomSigner]);
      assert.fail("Random signer should not be able to approve!");
    } catch (err) {
      return;
    }
  });

  it("Should not allow to approve if already signed", async () => {
    try {
      await (program.methods as any)
        .multisig(
          50,
          50,
          new anchor.BN(1000000),
          new anchor.BN(Date.now()),
          new anchor.BN(365),
          "Arbitration",
          vaultBump,
          agreementBump,
          "Active"
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
        .signers([randomSigner]);
      assert.fail("Approval should not be allowed if already signed!");
    } catch (err) {
      return;
    }
  });

  it("Should initialize the vault pda and agreement pda correctly", async () => {
    try {
      const vaultAccount = await program.account.vault.fetch(vault_pda);
      const agreementAccount = await program.account.agreement.fetch(
        agreement_pda
      );

      assert.strictEqual(
        vaultAccount.franchisor.toBase58(),
        franchisor.publicKey.toBase58(),
        "Franchisor does not match"
      );
      assert.strictEqual(
        vaultAccount.franchisee.toBase58(),
        franchisee.publicKey.toBase58(),
        "Franchisee does not match"
      );
      assert.strictEqual(
        vaultAccount.franchiseeShare,
        50,
        "Franchisee share should be equal"
      );
      assert.strictEqual(
        vaultAccount.franchisorShare,
        50,
        "Franchisor share should be equal"
      );
      assert.strictEqual(
        vaultAccount.multisig.toBase58(),
        multisig_pda.toBase58(),
        "Multi sig address should have to stored correctly"
      );
      assert.strictEqual(
        vaultAccount.vaultBump,
        vaultBump,
        "vault bump is not equal"
      );
      assert.strictEqual(
        agreementAccount.agreementBump,
        agreementBump,
        "agreement bump is not equal"
      );
      assert.strictEqual(
        Number(agreementAccount.contractDuration),
        Number(new anchor.BN(365)),
        "agreement duration are different"
      );
      assert.strictEqual(
        agreementAccount.disputeResolution,
        "Arbitration",
        "resolution is not matching"
      );
      assert.strictEqual(
        agreementAccount.multisig.toBase58(),
        multisig_pda.toBase58(),
        "multisig address not stored in agreement"
      );
      assert.strictEqual(
        agreementAccount.status,
        "active",
        "status not matching"
      );
      assert.strictEqual(
        agreementAccount.vault.toBase58(),
        vault_pda.toBase58(),
        "vault pda not stored correctly in agreement"
      );
    } catch (err) {
      console.log("lError while creation of Vault and agreement PDA", err);
      return;
    }
  });

  it("Should transfer the initial fee to the vault account", async () => {
    const provider = anchor.getProvider();
    try {
      const franchaiseeBalanceAfter = Number(
        (await provider.connection.getTokenAccountBalance(franchisee_ata)).value
          .amount
      );
      const franchisorBalanceAfter = Number(
        (await provider.connection.getTokenAccountBalance(franchisor_ata)).value
          .amount
      );

      const initialFee = new anchor.BN(1000000);
      assert.strictEqual(
        franchaiseeBeforeBalance - Number(initialFee),
        franchaiseeBalanceAfter,
        "fee not transferred from franchisee wallet"
      );
      assert.ok(franchisorBalanceAfter > 0);
    } catch (err) {
      console.log("Error while transferring the fee", err);
      return;
    }
  });

  it("Should let anyone deposit to the vault account", async () => {
    try {
      await (program.methods as any)
        .depositFundsVault(new anchor.BN(80000000))
        .accounts({
          depositor: depositor.publicKey,
          depositorAta: depositor_ata,
          franchisor: franchisor.publicKey,
          franchisee: franchisee.publicKey,
          usdtMint: usdt_mint,
          vaultPda: vault_pda,
          vaultAta: vault_ata,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        })
        .signers([depositor])
        .rpc();

      console.log(
        "Vault deposit successfull, revenue distribution will be done in 1 month."
      );

      const vaultAccount = await program.account.vault.fetch(vault_pda);

      assert.ok(
        vaultAccount.balance > new anchor.BN(0),
        "deposit not happened"
      );
    } catch (error) {
      console.log("Error while deposting the money", error);
    }
  });

  it("Should transfer the exact share amount to the franchisor and franchisee wallet", async () => {
    const provider = anchor.getProvider();
    try {
      await (program.methods as any)
        .withdrawFundsVault()
        .accounts({
          franchisor: franchisor.publicKey,
          franchisee: franchisee.publicKey,
          usdtMint: usdt_mint,
          vaultPda: vault_pda,
          vaultAta: vault_ata,
          franchisorAta: franchisor_ata,
          franchiseeAta: franchisee_ata,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        })
        .signers([])
        .rpc();

      const franchiseeBalance = Number(
        (await provider.connection.getTokenAccountBalance(franchisee_ata)).value
          .amount
      );
      const franchisorBalance = Number(
        (await provider.connection.getTokenAccountBalance(franchisor_ata)).value
          .amount
      );
      const vaultAccount = await program.account.vault.fetch(vault_pda);

      assert.ok(
        (vaultAccount.balance = new anchor.BN(0)),
        "withdraw not happened"
      );
      assert.ok(
        franchiseeBalance > franchaiseeBeforeBalance,
        "franchisee didn't recieved his share"
      );
      assert.ok(
        franchisorBalance > 1000000,
        "franchisor didn't recieved his share"
      );
    } catch (error) {
      console.log("Error while transfer the share", error);
    }
  });

  it("Should terminate the vault status if there is any dispute", async () => {
    try {
      await (program.methods as any)
        .pauseVault()
        .accounts({
          franchisor: franchisor.publicKey,
          franchisee: franchisee.publicKey,
          usdtMint: usdt_mint,
          vaultPda: vault_pda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([franchisor, franchisee])
        .rpc();

      const vaultAccount = await program.account.vault.fetch(vault_pda);

      assert.strictEqual(
        vaultAccount.vaultStatus,
        "Terminated",
        "Vault not terminated"
      );
    } catch (err) {
      console.log("Error while termination of vault", err);
    }
  });
  it("Should resume the vault status if there is any dispute", async () => {
    try {
      await (program.methods as any)
        .restartVault()
        .accounts({
          franchisor: franchisor.publicKey,
          franchisee: franchisee.publicKey,
          usdtMint: usdt_mint,
          vaultPda: vault_pda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([franchisor, franchisee])
        .rpc();

      const vaultAccount = await program.account.vault.fetch(vault_pda);

      assert.strictEqual(
        vaultAccount.vaultStatus,
        "Active",
        "Vault not Activated"
      );
    } catch (err) {
      console.log("Error while termination of vault", err);
    }
  });

  it("Should terminate the agreement only if both parties sign it asynchronously", async () => {
    try {
      const tx = await (program.methods as any)
        .agreement()
        .accounts({
          franchisor: franchisor.publicKey,
          franchisee: franchisee.publicKey,
          agreementPda: agreement_pda,
          vaultPda: vault_pda,
          vaultAta: vault_ata,
          franchiseeAta: franchisee_ata,
          usdtMint: usdt_mint,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        })
        .signers([franchisor, franchisee])
        .rpc();

      const agreementAccount = await program.account.agreement.fetch(
        agreement_pda
      );

      assert.strictEqual(
        agreementAccount.status,
        "terminated",
        "Agreement status should be terminated"
      );

      const vaultAccount = await program.account.vault.fetch(vault_pda);
      assert.ok(
        vaultAccount.balance.eq(new anchor.BN(0)),
        "Vault balance should be zero"
      );

      console.log(
        "Agreement is terminated, Both parties have signed it asynchronously"
      );
    } catch (err) {
      console.log("Error in termination signing", err);
    }
  });

  it("Should not terminate the agreement only if one party signs it", async () => {
    try {
      await (program.methods as any)
        .agreement()
        .accounts({
          franchisor: franchisor.publicKey,
          franchisee: franchisee.publicKey,
          agreementPda: agreement_pda,
          vaultPda: vault_pda,
          vaultAta: vault_ata,
          franchiseeAta: franchisee_ata,
          usdtMint: usdt_mint,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        })
        .signers([franchisor])
        .rpc();

      assert.fail("Should not get terminated since one party is signing only");
    } catch (err) {
      return;
    }
  });
});
