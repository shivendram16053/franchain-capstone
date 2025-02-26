use anchor_lang::{accounts::signer, prelude::*};
use anchor_spl::{associated_token::AssociatedToken, token::{self, transfer, Mint, Token, TokenAccount, Transfer}};

use crate::{error::FranchainError, state::Vault};

#[derive(Accounts)]

pub struct VaultFunc<'info> {
    pub franchisor: Signer<'info>,
    pub franchisee: Signer<'info>,

    pub usdt_mint: Account<'info, Mint>,

    pub vault_pda: Account<'info, Vault>,

    pub vault_ata: Account<'info, TokenAccount>,

    pub franchisor_ata: Account<'info, TokenAccount>,

    pub franchisee_ata: Account<'info, TokenAccount>,

    pub system_program : Program<'info,System>,
    pub token_program : Program<'info,Token>,
    pub associated_token_program : Program<'info,AssociatedToken>,
}

impl<'info> VaultFunc<'info> {
    pub fn deposit_funds(&mut self, amount: u64) -> Result<()> {
        let vault = &mut self.vault_pda;

        vault.balance = vault
            .balance
            .checked_add(amount)
            .ok_or(FranchainError::Overflow)?;

        Ok(())
    }

    pub fn distribute_funds(&mut self) -> Result<()> {
        let vault_pda = &mut self.vault_pda;

        let franchisor_amount =
            (vault_pda.balance as u128 * vault_pda.franchisor_share as u128 / 100) as u64;
        let franchisee_amount = vault_pda.balance - franchisor_amount;

        let franchisee = self.franchisee.key();
        let franchisor = self.franchisor.key();
        let seeds = [b"vault",franchisor.as_ref(),franchisee.as_ref(),&[vault_pda.vault_bump]];

        let signer_seeds = &[&seeds[..]];

        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = Transfer {
            from: self.vault_ata.to_account_info(),
            to:self.franchisor_ata.to_account_info(),
            authority:vault_pda.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer_seeds);

        transfer(cpi_ctx, franchisor_amount)?;
        
        let cpi_accounts = Transfer {
            from: self.vault_ata.to_account_info(),
            to:self.franchisee_ata.to_account_info(),
            authority:vault_pda.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer(cpi_ctx, franchisee_amount)?;

        vault_pda.balance = 0;

        Ok(())
    }

    /// ✅ **3️⃣ Withdraw Funds** – Manual withdrawal by franchisor/franchisee  
    pub fn withdraw_funds(&mut self, ctx: Context<VaultFunc>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault_pda;

        require!(
            ctx.accounts.franchisor.key() == vault.franchisor
                || ctx.accounts.franchisee.key() == vault.franchisee,
            FranchainError::Unauthorized
        );

        require!(vault.balance >= amount, FranchainError::Underflow);

        let recipient_ata = if ctx.accounts.franchisor.key() == vault.franchisor {
            ctx.accounts.franchisor_ata.to_account_info()
        } else {
            ctx.accounts.franchisee_ata.to_account_info()
        };

        // Transfer USDT from Vault to Franchisor/Franchisee
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_ata.to_account_info(),
            to: recipient_ata,
            authority: ctx.accounts.vault_pda.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        vault.balance = vault
            .balance
            .checked_sub(amount)
            .ok_or(FranchainError::Underflow)?;

        Ok(())
    }

    /// ✅ **4️⃣ Close Vault** – Send remaining funds & close PDA  
    pub fn close_vault(&mut self, ctx: Context<VaultFunc>) -> Result<()> {
        let vault = &mut ctx.accounts.vault_pda;

        require!(
            ctx.accounts.franchisor.key() == vault.franchisor,
            ErrorCode::Unauthorized
        );

        let remaining_balance = vault.balance;
        if remaining_balance > 0 {
            let franchisor_amount =
                (remaining_balance as u128 * vault.franchisor_share as u128 / 100) as u64;
            let franchisee_amount = remaining_balance - franchisor_amount;

            // Transfer to Franchisor
            let cpi_accounts_franchisor = Transfer {
                from: ctx.accounts.vault_ata.to_account_info(),
                to: ctx.accounts.franchisor_ata.to_account_info(),
                authority: ctx.accounts.vault_pda.to_account_info(),
            };
            let cpi_ctx_franchisor = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts_franchisor,
            );
            token::transfer(cpi_ctx_franchisor, franchisor_amount)?;

            // Transfer to Franchisee
            let cpi_accounts_franchisee = Transfer {
                from: ctx.accounts.vault_ata.to_account_info(),
                to: ctx.accounts.franchisee_ata.to_account_info(),
                authority: ctx.accounts.vault_pda.to_account_info(),
            };
            let cpi_ctx_franchisee = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts_franchisee,
            );
            token::transfer(cpi_ctx_franchisee, franchisee_amount)?;
        }

        vault.balance = 0;
        vault.status = "closed";

        Ok(())
    }
}
