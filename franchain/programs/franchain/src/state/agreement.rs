use anchor_lang::prelude::*;


#[account]
#[derive(InitSpace)]
pub struct Agreement {
    pub franchisor: Pubkey, 
    pub franchisee: Pubkey,  
    pub vault : Pubkey,
    pub multisig:Pubkey,             
    pub initial_fee: u64,       
    pub contract_start: i128,       
    pub contract_duration: u64,
    pub franchisor_share: u8,
    pub franchisee_share: u8,
    #[max_len(400)]       
    pub dispute_resolution: String,
    #[max_len(10)]
    pub status: String,
    pub agreement_bump: u8,              
}
