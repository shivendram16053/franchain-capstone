use anchor_lang::prelude::*;
use crate::state::MultiSig;

#[derive(Accounts)]
pub struct Initialize<'info>{
    #[account(mut)]
    pub franchisor : Signer<'info>,

    ///CHECK : This is the franchisee account, and we assume it's correct because it will be passed by the franchisor from the frontend.
    pub franchisee : AccountInfo<'info>,

    #[account(
        init,
        payer = franchisor,
        space = 8 + MultiSig::INIT_SPACE,
        seeds = [b"multisig",franchisor.key().as_ref(),franchisee.key().as_ref()],
        bump,
    )]
    pub multisig_pda: Account<'info,MultiSig>,

    pub system_program : Program<'info,System>,

}

impl<'info> Initialize<'info> {

    pub fn initialize(&mut self,franchisor:Pubkey,franchisee:Pubkey,initial_fee:u64,mut approved_by:Vec<Pubkey>,approvals:u16,is_signed:bool,threshold:u16,bump:u8)-> Result<()>{

        if !approved_by.contains(&franchisor) {
            approved_by.push(franchisor);
        }

        self.multisig_pda.set_inner(
            MultiSig {
                franchisor,
                franchisee,
                initial_fee,
                threshold,
                approved_by,
                approvals: approvals + 1,
                is_signed,
                multisig_bump: bump,
            }
        );
        Ok(())
    }
    
}