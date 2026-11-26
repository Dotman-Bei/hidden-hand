# Spike result

- run: 2026-11-26T21:38:36.439Z
- program: HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb

(a) FAIL — TEE auth-token read of a permissioned account (owner reads, stranger cannot): owner read returned null
(b) PASS — VRF request + callback served inside the TEE ER (DEFAULT_EPHEMERAL_QUEUE): callback_deal landed inside the TEE; phase = trading
(c) PASS — reveal of private state at settlement (reveal_hands flips every hand public): cards [10,2,13,13,9,4,6,2], hidden sum 59; hand 0 now public
(f) PASS — informational: VRF request + callback on devnet-as (the fallback path): VRF deal landed on devnet-as

TEE path eligible: no — switch to manifest-fallback.json

## Informational

- validator tee: 4.2.2 / core=2.0.5, feature-set=565236538, git-commit=380360a
- validator devnet-as: 4.2.2 / core=2.0.5, feature-set=565236538, git-commit=380360a
- cu tee open_table OpenTable: 51110 (of 200000; tx total 51110)
- cu tee fund seats: 600 (tx total)
- cu tee join_table seat 0 JoinTable: 71333 (of 200000; tx total 71333)
- cu tee join_table seat 1 JoinTable: 72835 (of 200000; tx total 72835)
- cu tee join_table seat 2 JoinTable: 72843 (of 200000; tx total 72843)
- cu tee join_table seat 3 JoinTable: 72851 (of 200000; tx total 72851)
- cu tee delegate table DelegatePda: 47041 (of 200000; tx total 47041)
- cu tee delegate hand 0 DelegatePda: 37475 (of 200000; tx total 37475)
- cu tee delegate hand 1 DelegatePda: 55475 (of 200000; tx total 55475)
- cu tee delegate hand 2 DelegatePda: 58475 (of 200000; tx total 58475)
- cu tee delegate hand 3 DelegatePda: 43475 (of 200000; tx total 43475)
- cu tee create permissions CreateTablePermission: 52682 (of 1000000; tx total 161302)
- cu tee create permissions CreateHandPermission: 26405 (of 947318; tx total 161302)
- cu tee create permissions CreateHandPermission: 27905 (of 920913; tx total 161302)
- cu tee create permissions CreateHandPermission: 26405 (of 893008; tx total 161302)
- cu tee create permissions CreateHandPermission: 27905 (of 866603; tx total 161302)
- cu tee request_deal RequestDeal: 93515 (of 200000; tx total 93515)
- cu tee reveal_hands RevealHands: 90061 (of 200000; tx total 90061)
- cu tee callback_deal (oracle) CallbackDeal: 49058 (of 271632; tx total 78145)
- cu as open_table OpenTable: 51110 (of 200000; tx total 51110)
- cu as fund seats: 600 (tx total)
- cu as join_table seat 0 JoinTable: 59326 (of 200000; tx total 59326)
- cu as join_table seat 1 JoinTable: 57835 (of 200000; tx total 57835)
- cu as join_table seat 2 JoinTable: 57843 (of 200000; tx total 57843)
- cu as join_table seat 3 JoinTable: 57851 (of 200000; tx total 57851)
- cu as delegate table DelegatePda: 47041 (of 200000; tx total 47041)
- cu as delegate hand 0 DelegatePda: 46475 (of 200000; tx total 46475)
- cu as delegate hand 1 DelegatePda: 37475 (of 200000; tx total 37475)
- cu as delegate hand 2 DelegatePda: 43475 (of 200000; tx total 43475)
- cu as delegate hand 3 DelegatePda: 34475 (of 200000; tx total 34475)
- cu as request_deal RequestDeal: 93515 (of 200000; tx total 93515)
- cu as callback_deal (oracle) CallbackDeal: 49058 (of 267573; tx total 82204)

## (a) diagnostics

- pre-deal owner read (confirmed): lamports=1036320 owner=HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb len=76 head=33386598c4c768f252db84b42edd3d08 dealt=undecodable
- pre-deal stranger read (confirmed): null
- hand pda: CypBwFmwkeCCrjtZQ7FJYoiPjTw3xuo3aMWLkGAYx4an = PDA(["hand", table 6aSaKDLnm39KJZqCWbdYjqwgAvT52WR423ar4BRjXPuH, owner 12xYX44Lcaq1yJgnhn6LpXTNXz4Hnkpp8C9B53cRuij6], HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb)
- hand permission pda: 5Nm1R4dvMtChSJhvEDBEoB1Y3v4caBgevpFV9d7zqM3k
- token owner: issued for 12xYX44Lcaq1yJgnhn6LpXTNXz4Hnkpp8C9B53cRuij6, expiresAt 1798321005055 (2026-12-26T21:36:45.055Z)
- token stranger: issued for CXYvk793EAdzeDroXSiHhu6bUhrDff86pLcPhBhtyAfy, expiresAt 1798321005669 (2026-12-26T21:36:45.669Z)
- token payer: issued for BT9TYK3HL5Bc7rZfTNrPiGkjGXDKeDpdEPgWBqAks1Bs, expiresAt 1798321006296 (2026-12-26T21:36:46.296Z)
- control: public table via owner connection: lamports=13436600 owner=HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb len=2517 head=22648a61ec81e6706390c919a2010000; phase=trading; owner seat found, seat.hand == hand pda
- permission via payer connection: null
- permission via owner connection: lamports=0 owner=ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1 len=101 head=01feb1fe70108b2c7813491badb56dc9; owner (token pubkey) as permission member: member found at byte 69, flags=0x03 (AUTHORITY|TX_LOGS)
- owner read (confirmed, 400 ms / 20 s poll) #1-29 (t+316..20624 ms) x29: lamports=1036320 owner=HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb len=76 head=33386598c4c768f252db84b42edd3d08 dealt=undecodable
- owner read (processed): lamports=1036320 owner=HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb len=76 head=33386598c4c768f252db84b42edd3d08 dealt=undecodable
- owner getMultipleAccountsInfo (confirmed): lamports=1036320 owner=HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb len=76 head=33386598c4c768f252db84b42edd3d08
- stranger read (confirmed): null
- payer read (confirmed, non-member): null
- no-token read (confirmed): null
