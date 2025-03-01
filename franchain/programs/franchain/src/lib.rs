use anchor_lang::prelude::*;

declare_id!("FXLMBJZHS2ZQNuYQgACjci1XuDFZTEP7JHB21Ft3Y61J");

mod error;
mod instructions;
mod state;

use instructions::*;
#[program]
pub mod franchain {

    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        franchisor: Pubkey,
        franchisee: Pubkey,
        initial_fee: u64,
        approved_by: Vec<Pubkey>,
        approvals: u16,
        is_signed: bool,
        threshold: u16,
        multisig_bump: u8,
    ) -> Result<()> {
        ctx.accounts.initialize(
            franchisor,
            franchisee,
            initial_fee,
            approved_by,
            approvals,
            is_signed,
            threshold,
            multisig_bump,
        )
    }

    pub fn multisig(
        ctx: Context<MultiSignature>,
        franchisor_share: u8,
        franchisee_share: u8,
        initial_fee: u64,
        contract_start: i128,
        contract_duration: u64,
        dispute_resolution: String,
        vault_bump: u8,
        agreement_bump: u8,
        vault_status: String,
    ) -> Result<()> {
        ctx.accounts.approve(
            franchisor_share,
            franchisee_share,
            initial_fee,
            contract_start,
            contract_duration,
            dispute_resolution,
            vault_bump,
            agreement_bump,
            vault_status,
        )
    }

    pub fn agreement(ctx: Context<AgreementFunc>) -> Result<()> {
        ctx.accounts.terminate_agreement()
    }

    pub fn deposit_funds_vault(ctx: Context<VaultDeposit>, amount: u64) -> Result<()> {
        ctx.accounts.deposit_funds(amount)
    }

    pub fn withdraw_funds_vault(ctx: Context<VaultWithdraw>) -> Result<()> {
        ctx.accounts.withdraw_funds()
    }

    pub fn pause_vault(ctx: Context<VaultConfig>) -> Result<()> {
        ctx.accounts.pause_vault()
    }
    pub fn restart_vault(ctx: Context<VaultConfig>) -> Result<()> {
        ctx.accounts.restart_vault()
    }
}
