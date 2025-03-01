use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{transfer, Mint, Token, TokenAccount, Transfer}};

use crate::{error::FranchainError, state::Vault};

#[derive(Accounts)]

pub struct VaultDeposit<'info> {

    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = usdt_mint,
        associated_token::authority = depositor,
    )]
    pub depositor_ata : Account<'info,TokenAccount>,
    ///CHECK
    #[account(mut)]
    pub franchisor: AccountInfo<'info>,

    ///CHECK
    #[account(mut)]
    pub franchisee: AccountInfo<'info>,

    pub usdt_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds= [b"vaults",franchisor.key().as_ref(),franchisee.key().as_ref()],
        bump =vault_pda.vault_bump,
    )]
    pub vault_pda: Account<'info, Vault>,

    #[account(
        mut,
        associated_token::mint=usdt_mint,
        associated_token::authority = vault_pda,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    pub system_program : Program<'info,System>,
    pub token_program : Program<'info,Token>,
    pub associated_token_program : Program<'info,AssociatedToken>,
}

impl<'info> VaultDeposit<'info> {
    pub fn deposit_funds(&mut self, amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: self.depositor_ata.to_account_info(),
            to: self.vault_ata.to_account_info(),
            authority: self.depositor.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        
        transfer(cpi_ctx, amount)?;

        // Update vault balance
        self.vault_pda.balance = self.vault_pda.balance.checked_add(amount).ok_or(FranchainError::Overflow)?;

        Ok(())
    }
}
