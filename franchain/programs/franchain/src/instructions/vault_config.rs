use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::state::Vault;

#[derive(Accounts)]
pub struct VaultConfig<'info>{
    #[account(mut)]
    pub franchisor: Signer<'info>,

    #[account(mut)]
    pub franchisee: Signer<'info>,

    pub usdt_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds= [b"vaults",franchisor.key().as_ref(),franchisee.key().as_ref()],
        bump,
    )]
    pub vault_pda: Account<'info, Vault>,

    pub system_program: Program<'info, System>,
}


impl<'info> VaultConfig<'info>{

    pub fn pause_vault(&mut self)->Result<()>{

        if !self.franchisor.is_signer || !self.franchisee.is_signer  {
            return Ok(());
        }

        self.vault_pda.vault_status = "Terminated".to_string();

        Ok(())

    }

    pub fn restart_vault(&mut self)-> Result<()>{
        if !self.franchisor.is_signer || !self.franchisee.is_signer  {
            return Ok(());
        }

        self.vault_pda.vault_status = "Active".to_string();

        Ok(())
    }

}