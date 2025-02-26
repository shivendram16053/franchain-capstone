use anchor_lang::prelude::*;
use crate::{error::FranchainError, state::Agreement};

#[derive(Accounts)]
pub struct AgreementFunc<'info> {
    #[account(mut)]
    pub franchisor: Signer<'info>,

    #[account(mut)]
    pub franchisee: Signer<'info>,

    #[account(
        mut,
        seeds = [b"agreement", franchisor.key().as_ref(), franchisee.key().as_ref()],
        bump
    )]
    pub agreement_pda: Account<'info, Agreement>,
}

impl<'info> AgreementFunc<'info> {
    pub fn terminate_agreement(&mut self) -> Result<()> {
        let agreement = &mut self.agreement_pda;

        // Ensure only franchisor or franchisee can terminate the agreement
        require!(
            self.franchisor.key() == agreement.franchisor || self.franchisee.key() == agreement.franchisee,
            FranchainError::Unauthorized
        );

        // Update the agreement status to "terminated"
        agreement.status = "terminated".to_string();

        Ok(())
    }
}
