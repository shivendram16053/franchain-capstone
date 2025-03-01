use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};

use crate::{error::FranchainError, state::Agreement, state::Vault};

#[derive(Accounts)]

pub struct VaultWithdraw<'info> {
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
        bump = vault_pda.vault_bump,
    )]
    pub vault_pda: Account<'info, Vault>,

    #[account(
        mut,
        seeds =[b"agreement",franchisor.key().as_ref(),franchisee.key().as_ref()],
        bump = agreement_pda.agreement_bump
    )]
    pub agreement_pda :Account<'info,Agreement>,

    #[account(
        mut,
        associated_token::mint=usdt_mint,
        associated_token::authority = vault_pda,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = usdt_mint,
        associated_token::authority = franchisor,
    )]
    pub franchisor_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = usdt_mint,
        associated_token::authority = franchisee
    )]
    pub franchisee_ata: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> VaultWithdraw<'info> {
    pub fn withdraw_funds(&mut self) -> Result<()> {

        if self.vault_pda.vault_status == "Terminated"{
            return Ok(())
        }

        if self.agreement_pda.status == "terminated"{
            return  Ok(())
        }

        let vault_balance = self.vault_ata.amount;

        let franchisor_share = vault_balance
            .checked_mul((self.vault_pda.franchisor_share).into())
            .ok_or(FranchainError::Overflow)?
            / 100;

        let franchisee_share = vault_balance
            .checked_mul((self.vault_pda.franchisee_share).into())
            .ok_or(FranchainError::Overflow)?
            / 100;

        let cpi_accounts_franchisor = Transfer {
            from: self.vault_ata.to_account_info(),
            to: self.franchisor_ata.to_account_info(),
            authority: self.vault_pda.to_account_info(),
        };

        let franchisor_key = self.franchisor.key();
        let franchisee_key = self.franchisee.key();
        let seeds = &[
            b"vaults",
            franchisor_key.as_ref(),
            franchisee_key.as_ref(),
            &[self.vault_pda.vault_bump],
        ];

        let signer_seeds = &[&seeds[..]];

        let cpi_ctx_franchisor = CpiContext::new_with_signer(
            self.token_program.to_account_info().clone(),
            cpi_accounts_franchisor,
            signer_seeds,
        );

        transfer(cpi_ctx_franchisor, franchisor_share)?;

        let cpi_accounts_franchisee = Transfer {
            from: self.vault_ata.to_account_info(),
            to: self.franchisee_ata.to_account_info(),
            authority: self.vault_pda.to_account_info(),
        };

        let cpi_ctx_franchisee = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts_franchisee,
            signer_seeds,
        );

        transfer(cpi_ctx_franchisee, franchisee_share)?;

        Ok(())
    }
}
