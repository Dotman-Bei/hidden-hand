# Spike result

- run: 2026-11-26T20:46:16.447Z
- program: HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb

(a) FAIL — TEE auth-token read of a permissioned account (owner reads, stranger cannot): owner read returned null
(b) PASS — VRF request + callback served inside the TEE ER (DEFAULT_EPHEMERAL_QUEUE): callback_deal landed inside the TEE; phase = trading
(c) PASS — reveal of private state at settlement (reveal_hands flips every hand public): cards [9,13,3,1,5,10,1,13], hidden sum 55; hand 0 now public
(f) PASS — informational: VRF request + callback on devnet-as (the fallback path): VRF deal landed on devnet-as

TEE path eligible: no — switch to manifest-fallback.json

## Informational

- validator tee: 4.2.2 / core=2.0.5, feature-set=565236538, git-commit=380360a
- validator devnet-as: 4.2.2 / core=2.0.5, feature-set=565236538, git-commit=380360a
- cu tee open_table OpenTable: 48110 (of 200000; tx total 48110)
- cu tee fund seats: 600 (tx total)
- cu tee join_table seat 0 JoinTable: 57833 (of 200000; tx total 57833)
- cu tee join_table seat 1 JoinTable: 56335 (of 200000; tx total 56335)
- cu tee join_table seat 2 JoinTable: 56343 (of 200000; tx total 56343)
- cu tee join_table seat 3 JoinTable: 56351 (of 200000; tx total 56351)
- cu tee delegate table DelegatePda: 38041 (of 200000; tx total 38041)
- cu tee delegate hand 0 DelegatePda: 50975 (of 200000; tx total 50975)
- cu tee delegate hand 1 DelegatePda: 34475 (of 200000; tx total 34475)
- cu tee delegate hand 2 DelegatePda: 37475 (of 200000; tx total 37475)
- cu tee delegate hand 3 DelegatePda: 34475 (of 200000; tx total 34475)
- cu tee create permissions CreateTablePermission: 54182 (of 1000000; tx total 152302)
- cu tee create permissions CreateHandPermission: 23405 (of 945818; tx total 152302)
- cu tee create permissions CreateHandPermission: 23405 (of 922413; tx total 152302)
- cu tee create permissions CreateHandPermission: 27905 (of 899008; tx total 152302)
- cu tee create permissions CreateHandPermission: 23405 (of 871103; tx total 152302)
- cu tee request_deal RequestDeal: 90515 (of 200000; tx total 90515)
- cu tee reveal_hands RevealHands: 84061 (of 200000; tx total 84061)
- cu tee callback_deal (oracle) CallbackDeal: 49058 (of 260473; tx total 89304)
- cu as open_table OpenTable: 48110 (of 200000; tx total 48110)
- cu as fund seats: 600 (tx total)
- cu as join_table seat 0 JoinTable: 56326 (of 200000; tx total 56326)
- cu as join_table seat 1 JoinTable: 54835 (of 200000; tx total 54835)
- cu as join_table seat 2 JoinTable: 54843 (of 200000; tx total 54843)
- cu as join_table seat 3 JoinTable: 54851 (of 200000; tx total 54851)
- cu as delegate table DelegatePda: 69541 (of 200000; tx total 69541)
- cu as delegate hand 0 DelegatePda: 46475 (of 200000; tx total 46475)
- cu as delegate hand 1 DelegatePda: 49475 (of 200000; tx total 49475)
- cu as delegate hand 2 DelegatePda: 46475 (of 200000; tx total 46475)
- cu as delegate hand 3 DelegatePda: 46475 (of 200000; tx total 46475)
- cu as request_deal RequestDeal: 90515 (of 200000; tx total 90515)
- cu as callback_deal (oracle) CallbackDeal: 49058 (of 272988; tx total 76789)
