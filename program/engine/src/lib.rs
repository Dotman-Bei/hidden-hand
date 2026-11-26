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
}
