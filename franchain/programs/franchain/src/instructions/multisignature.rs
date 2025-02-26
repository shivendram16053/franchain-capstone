use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{transfer, Mint, Token, TokenAccount, Transfer}};
use crate::{error::FranchainError, state::{ Agreement, MultiSig, Vault}};


#[derive(Accounts)]
pub struct MultiSignature<'info>{
    #[account(mut)]
    pub franchisor : Signer<'info>,

    #[account(mut)]
    pub franchisee : Signer<'info>,

    pub usdt_mint : Account<'info,Mint>,
    
    #[account(
        mut,
        seeds = [b"multisig",franchisor.key().as_ref(),franchisee.key().as_ref()],
        bump 
    )]
    pub multisig_pda : Account<'info,MultiSig>,

    #[account(
        init,
        payer = franchisor,
        space = 8+Vault::INIT_SPACE,
        seeds = [b"vaults",franchisor.key().as_ref(),franchisee.key().as_ref()],
        bump
    )]
    pub vault_pda : Account<'info,Vault>,

    #[account(
        init,
        payer = franchisor,
        space = 8+Agreement::INIT_SPACE,
        seeds = [b"agreement",franchisor.key().as_ref(),franchisee.key().as_ref()],
        bump
    )]
    pub agreement_pda : Account<'info,Agreement>,


    #[account(
        mut,
        associated_token::mint = usdt_mint,
        associated_token::authority = vault_pda,
    )]
    pub vault_ata : Account<'info,TokenAccount>,

    #[account(
        mut,
        associated_token::mint = usdt_mint,
        associated_token::authority = franchisor,
    )]
    pub franchisor_ata : Account<'info,TokenAccount>,

    #[account(
        mut,
        associated_token::mint = usdt_mint,
        associated_token::authority = franchisee,
    )]
    pub franchisee_ata : Account<'info,TokenAccount>,

    pub system_program : Program<'info,System>,
    pub token_program : Program<'info,Token>,
    pub associated_token_program : Program<'info,AssociatedToken>,
}

impl<'info> MultiSignature<'info>{
    pub fn approve(&mut self,
    
        franchisor_share:u8, 
        franchisee_share:u8, 
        initial_fee:u64, 
        contract_start:i128, 
        contract_duration:u64, 
        dispute_resolution:String, 
        status:String, 
        vault_bump:u8,
        agreement_bump:u8   
    
    )-> Result<()>{

        let multisig_pda = &mut self.multisig_pda;
        let franchisee = self.franchisee.key();

        if multisig_pda.approved_by.contains(&franchisee) {
            return Err(error!(FranchainError::AlreadyApproved));
        }

        multisig_pda.approved_by.push(franchisee);
        multisig_pda.approvals+=1;

        if multisig_pda.approvals == multisig_pda.threshold {
            self.execute_multisig(
                franchisor_share, 
                franchisee_share, 
                initial_fee, 
                contract_start, 
                contract_duration, 
                dispute_resolution, 
                status, 
                vault_bump,
                agreement_bump
            )?;
        }        
        Ok(())
    }

    pub fn execute_multisig(
        &mut self,
        franchisor_share:u8,
        franchisee_share:u8,
        initial_fee:u64,
        contract_start:i128,
        contract_duration:u64,
        dispute_resolution:String,
        status:String,
        vault_bump:u8,
        agreement_bump:u8,
    
    )-> Result<()>{

        let multisig_pda = &mut self.multisig_pda;

        multisig_pda.is_signed=true;

        self.vault_pda.set_inner(Vault { 
            franchisor: self.franchisor.key(), 
            franchisee: self.franchisee.key(), 
            balance: 0, 
            franchisor_share, 
            franchisee_share,
            multisig: self.multisig_pda.key(),
            vault_bump
        });


        self.agreement_pda.set_inner(Agreement { franchisor: self.franchisor.key(), 
            franchisee: self.franchisee.key(),  
            vault : self.vault_ata.key(),
            multisig:self.multisig_pda.key(),         
            initial_fee ,        
            contract_start,       
            contract_duration,
            franchisor_share,
            franchisee_share,     
            dispute_resolution,
            status,
            agreement_bump,
        });

        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = Transfer{
            from:self.franchisee_ata.to_account_info(),
            to:self.franchisor_ata.to_account_info(),
            authority:self.franchisee.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);


        transfer(cpi_ctx, initial_fee)?;

        Ok(())
    }
}