use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub franchisor: Pubkey,
    pub franchisee: Pubkey,
    pub balance: u64,
    pub franchisor_share: u8,
    pub franchisee_share: u8,
    pub multisig: Pubkey,
    pub vault_bump :u8,
}

