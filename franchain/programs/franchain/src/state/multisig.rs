use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct MultiSig {
    pub franchisor:Pubkey,
    pub franchisee:Pubkey,
    pub initial_fee:u64,
    pub threshold : u16,
    #[max_len(2)]
    pub approved_by: Vec<Pubkey>,
    pub approvals:u16,
    pub is_signed:bool,
    pub multisig_bump:u8,
}
