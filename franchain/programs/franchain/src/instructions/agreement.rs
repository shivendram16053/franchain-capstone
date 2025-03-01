use crate::state::{Agreement, Vault};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, close_account, transfer, CloseAccount, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
pub struct AgreementFunc<'info> {
    #[account(mut)]
    pub franchisor: Signer<'info>,

    #[account(mut)]
    pub franchisee: Signer<'info>,

    #[account(
        mut,
        seeds = [b"agreement", franchisor.key().as_ref(), franchisee.key().as_ref()],
        bump =agreement_pda.agreement_bump
    )]
    pub agreement_pda: Account<'info, Agreement>,

    #[account(
        mut,
        seeds = [b"vaults", franchisor.key().as_ref(), franchisee.key().as_ref()],
        bump=vault_pda.vault_bump
    )]
    pub vault_pda: Account<'info, Vault>,

    #[account(
        mut,
        associated_token::mint = usdt_mint,
        associated_token::authority = vault_pda
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = usdt_mint,
        associated_token::authority = franchisee
    )]
    pub franchisee_ata: Account<'info, TokenAccount>,

    pub usdt_mint: Account<'info, token::Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}


impl<'info> AgreementFunc<'info> {
    pub fn terminate_agreement(&mut self) -> Result<()> {
        let agreement = &mut self.agreement_pda;
        let vault_balance = self.vault_ata.amount;

        if self.franchisor.is_signer && self.franchisor.key() == agreement.franchisor {
            agreement.franchisor_approved = true;
            msg!("Franchisor has approved termination");
        }

        if self.franchisee.is_signer && self.franchisee.key() == agreement.franchisee {
            agreement.franchisee_approved = true;
            msg!("Franchisee has approved termination");
        }

        if agreement.franchisor_approved && agreement.franchisee_approved {
            msg!("Both parties approved - Terminating Agreement!");

            agreement.status = "terminated".to_string();

            let cpi_program = self.token_program.to_account_info();
            let franchisor_key = self.franchisor.key();
            let franchisee_key = self.franchisee.key();

            let seeds = &[
                b"vaults",
                franchisor_key.as_ref(),
                franchisee_key.as_ref(),
                &[self.vault_pda.vault_bump],
            ];

            let signer_seeds = &[&seeds[..]];

            if vault_balance > 0 {
                let cpi_accounts = Transfer {
                    from: self.vault_ata.to_account_info(),
                    to: self.franchisee_ata.to_account_info(),
                    authority: self.vault_pda.to_account_info(),
                };

                let cpi_ctx =
                    CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer_seeds);

                transfer(cpi_ctx, vault_balance)?;
            }

            let cpi_account = CloseAccount {
                account: self.vault_ata.to_account_info(),
                destination: self.franchisee.to_account_info(),
                authority: self.vault_pda.to_account_info(),
            };

            let cpi_ctx =
                CpiContext::new_with_signer(cpi_program.clone(), cpi_account, signer_seeds);

            close_account(cpi_ctx)?;

            self.vault_pda.balance = 0;
            self.vault_pda.vault_status = "Terminated".to_string();
        } else {
            msg!("Waiting for the other party's approval before terminating.");
        }

        Ok(())
    }
}