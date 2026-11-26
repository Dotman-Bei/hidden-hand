//! Hidden Hand engine: pure integer math shared by the program and mirrored by client/src/engine.ts.

pub const SEATS: usize = 4;
pub const CARDS_PER_SEAT: usize = 2;
pub const CARD_COUNT: usize = SEATS * CARDS_PER_SEAT;
pub const CARD_MAX: u8 = 15;
pub const START_PRICE_C: u32 = 6400;

/// Card i = 1 + (randomness[i] % 15), i in 0..8. Seat s holds cards 2s and 2s+1.
pub fn cards_from_randomness(randomness: &[u8; 32]) -> [u8; CARD_COUNT] {
    let mut cards = [0u8; CARD_COUNT];
    for i in 0..CARD_COUNT {
        cards[i] = 1 + randomness[i] % CARD_MAX;
    }
    cards
}

pub fn hidden_sum(cards: &[u8; CARD_COUNT]) -> u16 {
    cards.iter().map(|c| *c as u16).sum()
}

pub const STEP_C: u32 = 100;
pub const MAX_LOT: u8 = 5;
pub const POS_CAP: i32 = 15;
pub const MIN_PRICE_C: u32 = 800;
pub const MAX_PRICE_C: u32 = 12000;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Side {
    Buy,
    Sell,
}

impl Side {
    pub fn from_u8(v: u8) -> Option<Side> {
        match v {
            0 => Some(Side::Buy),
            1 => Some(Side::Sell),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TradeError {
    LotSize,
    PositionCap,
    PriceBound,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Fill {
    pub price_after_c: u32,
    pub cash_delta_c: i64,
    pub pos_delta: i32,
}

/// Linear-impact market maker: one contract moves the price STEP_C cents; a lot fills at the midpoint of its move.
pub fn quote(price_c: u32, pos: i32, side: Side, qty: u8) -> Result<Fill, TradeError> {
    if qty < 1 || qty > MAX_LOT {
        return Err(TradeError::LotSize);
    }
    let q = qty as i64;
    let p = price_c as i64;
    let impact = (STEP_C as i64) * q * q / 2;
    match side {
        Side::Buy => {
            if pos + qty as i32 > POS_CAP {
                return Err(TradeError::PositionCap);
            }
            let after = p + STEP_C as i64 * q;
            if after > MAX_PRICE_C as i64 {
                return Err(TradeError::PriceBound);
            }
            Ok(Fill { price_after_c: after as u32, cash_delta_c: -(q * p + impact), pos_delta: qty as i32 })
        }
        Side::Sell => {
            if pos - (qty as i32) < -POS_CAP {
                return Err(TradeError::PositionCap);
            }
            let after = p - STEP_C as i64 * q;
            if after < MIN_PRICE_C as i64 {
                return Err(TradeError::PriceBound);
            }
            Ok(Fill { price_after_c: after as u32, cash_delta_c: q * p - impact, pos_delta: -(qty as i32) })
        }
    }
}

pub fn pnl_c(cash_c: i64, pos: i32, hidden_sum: u16) -> i64 {
    cash_c + pos as i64 * hidden_sum as i64 * 100
}

/// Highest P&L wins; ties go to the lowest seat.
pub fn winner(pnls: &[i64; SEATS]) -> u8 {
    let mut best = 0usize;
    for i in 1..SEATS {
        if pnls[i] > pnls[best] {
            best = i;
        }
    }
    best as u8
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cards_come_from_the_first_eight_bytes() {
        let mut r = [0u8; 32];
        for (i, b) in r.iter_mut().enumerate() {
            *b = i as u8;
        }
        assert_eq!(cards_from_randomness(&r), [1, 2, 3, 4, 5, 6, 7, 8]);
        assert_eq!(hidden_sum(&[1, 2, 3, 4, 5, 6, 7, 8]), 36);
    }

    #[test]
    fn cards_stay_in_one_to_fifteen() {
        assert_eq!(cards_from_randomness(&[14u8; 32]), [15u8; 8]);
        assert_eq!(cards_from_randomness(&[15u8; 32]), [1u8; 8]);
        assert_eq!(cards_from_randomness(&[255u8; 32]), [1u8; 8]);
        assert_eq!(hidden_sum(&[15u8; 8]), 120);
    }

    use serde::Deserialize;

    #[derive(Deserialize)]
    struct Vectors {
        randomness: Vec<RandCase>,
        cases: Vec<Case>,
    }
    #[derive(Deserialize)]
    struct RandCase {
        bytes: Vec<u8>,
        cards: Vec<u8>,
        #[serde(rename = "hiddenSum")]
        hidden_sum: u16,
    }
    #[derive(Deserialize)]
    struct Step {
        seat: usize,
        side: String,
        qty: u8,
        expect: String,
    }
    #[derive(Deserialize)]
    struct Final {
        #[serde(rename = "priceC")]
        price_c: u32,
        #[serde(rename = "cashC")]
        cash_c: Vec<i64>,
        pos: Vec<i32>,
        #[serde(rename = "pnlC")]
        pnl_c: Vec<i64>,
        winner: u8,
    }
    #[derive(Deserialize)]
    struct Case {
        name: String,
        #[serde(rename = "hiddenSum")]
        hidden_sum: u16,
        trades: Vec<Step>,
        #[serde(rename = "final")]
        fin: Final,
    }

    const VECTORS: &str = include_str!("../../engine-vectors.json");

    #[test]
    fn golden_vectors() {
        let v: Vectors = serde_json::from_str(VECTORS).expect("engine-vectors.json parses");
        for r in &v.randomness {
            let mut bytes = [0u8; 32];
            bytes.copy_from_slice(&r.bytes);
            let cards = cards_from_randomness(&bytes);
            assert_eq!(cards.to_vec(), r.cards);
            assert_eq!(hidden_sum(&cards), r.hidden_sum);
        }
        for c in &v.cases {
            let mut price = START_PRICE_C;
            let mut cash = [0i64; SEATS];
            let mut pos = [0i32; SEATS];
            for (k, t) in c.trades.iter().enumerate() {
                let side = if t.side == "buy" { Side::Buy } else { Side::Sell };
                match quote(price, pos[t.seat], side, t.qty) {
                    Ok(f) => {
                        assert_eq!(t.expect, "ok", "{} trade {}", c.name, k);
                        price = f.price_after_c;
                        cash[t.seat] += f.cash_delta_c;
                        pos[t.seat] += f.pos_delta;
                    }
                    Err(e) => assert_eq!(format!("{:?}", e), t.expect, "{} trade {}", c.name, k),
                }
            }
            assert_eq!(price, c.fin.price_c, "{} price", c.name);
            assert_eq!(cash.to_vec(), c.fin.cash_c, "{} cash", c.name);
            assert_eq!(pos.to_vec(), c.fin.pos, "{} pos", c.name);
            let mut pnls = [0i64; SEATS];
            for i in 0..SEATS {
                pnls[i] = pnl_c(cash[i], pos[i], c.hidden_sum);
            }
            assert_eq!(pnls.to_vec(), c.fin.pnl_c, "{} pnl", c.name);
            assert_eq!(winner(&pnls), c.fin.winner, "{} winner", c.name);
        }
    }
}
