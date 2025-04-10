use anchor_lang::error_code;

#[error_code]
pub enum FranchainError {
    #[msg("You have already approved this multisig.")]
    AlreadyApproved,
    #[msg("Unauthorized operation.")]
    UnauthorizedOperation,
    #[msg("Insufficient balance.")]
    InsufficientBalance,
    #[msg("Mathematical overflow.")]
    Overflow,
    #[msg("Mathematical underflow.")]
    Underflow,
    #[msg("Multisig already signed.")]
    AlreadySigned,
    #[msg("You are not authorized to terminate this agreement.")]
    UnauthorizedTermination,
}