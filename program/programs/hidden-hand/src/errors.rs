use anchor_lang::prelude::*;

#[error_code]
pub enum HhError {
    #[msg("duration_secs must be 30..=180")]
    BadDuration,
    #[msg("wrong phase for this instruction")]
    WrongPhase,
    #[msg("all four seats are taken")]
    TableFull,
    #[msg("this wallet already holds a seat")]
    AlreadySeated,
    #[msg("the table needs four seats before the deal")]
    TableNotFull,
    #[msg("hand account does not match the seat")]
    WrongHand,
    #[msg("instruction not supported in this deal mode")]
    ModeNotSupported,
    #[msg("the bell has not rung yet")]
    BellNotRung,
    #[msg("signer does not hold a seat")]
    NotSeated,
    #[msg("lot must be 1..=5")]
    LotSize,
    #[msg("position would pass the +/-15 cap")]
    PositionCap,
    #[msg("price would leave 8.00..=120.00")]
    PriceBound,
    #[msg("side must be 0 (buy) or 1 (sell)")]
    BadSide,
    #[msg("trading is closed")]
    RoundClosed,
    #[msg("the pot is already paid")]
    AlreadyPaid,
    #[msg("no winner recorded")]
    NoWinner,
    #[msg("winner account does not match the table")]
    WrongWinner,
    #[msg("secret does not match the commitment")]
    BadCommitment,
    #[msg("this seat already revealed")]
    AlreadyRevealed,
    #[msg("arithmetic overflow")]
    MathOverflow,
}
