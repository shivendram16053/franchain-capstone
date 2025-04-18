use crate::state::{Agreement, Vault};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, close_account, transfer, CloseAccount, Token, TokenAccount, Transfer},
};

#[error_code]
pub enum ErrorCode {
    Unauthorized,
}

#[derive(Accounts)]
pub struct AgreementFunc<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: This is the franchisor account, and we assume it's correct because it is used to initialize the multisig.
    pub franchisor : AccountInfo<'info>,
    /// CHECK: This is the franchisor account, and we assume it's correct because it is used to initialize the multisig.
    pub franchisee : AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"agreement", franchisor.key().as_ref(), franchisee.key().as_ref()],
        bump = agreement.agreement_bump
    )]
    pub agreement: Account<'info, Agreement>,

    #[account(
        mut,
        seeds = [b"vaults", franchisor.key().as_ref(), franchisee.key().as_ref()],
        bump = vault.vault_bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        associated_token::mint = usdt_mint,
        associated_token::authority = vault
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
        let agreement = &mut self.agreement;
        let signer_key = self.signer.key();

        if signer_key == agreement.franchisor {
            agreement.franchisor_approved = true;
            msg!("Franchisor approved termination");
        } else if signer_key == agreement.franchisee {
            agreement.franchisee_approved = true;
            msg!("Franchisee approved termination");
        } else {
            return Err(error!(ErrorCode::Unauthorized));
        }

        if agreement.franchisor_approved && agreement.franchisee_approved {
            msg!("Both approved, terminating agreement");

            agreement.status = "terminated".to_string();

            let seeds = &[
                b"vaults",
                agreement.franchisor.as_ref(),
                agreement.franchisee.as_ref(),
                &[self.vault.vault_bump],
            ];
            let signer_seeds = &[&seeds[..]];

            if self.vault_ata.amount > 0 {
                let cpi_ctx = CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    Transfer {
                        from: self.vault_ata.to_account_info(),
                        to: self.franchisee_ata.to_account_info(),
                        authority: self.vault.to_account_info(),
                    },
                    signer_seeds,
                );
                transfer(cpi_ctx, self.vault_ata.amount)?;
            }

            let cpi_ctx = CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                CloseAccount {
                    account: self.vault_ata.to_account_info(),
                    destination: self.signer.to_account_info(),
                    authority: self.vault.to_account_info(),
                },
                signer_seeds,
            );
            close_account(cpi_ctx)?;

            self.vault.balance = 0;
            self.vault.vault_status = "Terminated".to_string();
        }

        Ok(())
    }
}
