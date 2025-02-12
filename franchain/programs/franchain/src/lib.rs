use anchor_lang::prelude::*;

declare_id!("FXLMBJZHS2ZQNuYQgACjci1XuDFZTEP7JHB21Ft3Y61J");

#[program]
pub mod franchain {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
