# Spike result

- run: 2026-11-27T02:35:35.995Z
- program: HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb

(a) FAIL — TEE auth-token read of a permissioned account (owner reads, stranger cannot): owner read returned null
(b) PASS — VRF request + callback served inside the TEE ER (DEFAULT_EPHEMERAL_QUEUE): callback_deal landed inside the TEE; phase = trading
(c) PASS — reveal of private state at settlement (reveal_hands flips every hand public): cards [7,8,5,8,15,11,3,10], hidden sum 67; hand 0 now public
(f) PASS — informational: VRF request + callback on devnet-as (the fallback path): VRF deal landed on devnet-as

TEE path eligible: no — switch to manifest-fallback.json

## Informational

- validator tee: 4.2.2 / core=2.0.5, feature-set=565236538, git-commit=380360a
- validator devnet-as: 4.2.2 / core=2.0.5, feature-set=565236538, git-commit=380360a
- cu tee open_table OpenTable: 49610 (of 200000; tx total 49610)
- cu tee fund seats: 600 (tx total)
- cu tee join_table seat 0 JoinTable: 59333 (of 200000; tx total 59333)
- cu tee join_table seat 1 JoinTable: 62335 (of 200000; tx total 62335)
- cu tee join_table seat 2 JoinTable: 59343 (of 200000; tx total 59343)
- cu tee join_table seat 3 JoinTable: 62351 (of 200000; tx total 62351)
- cu tee delegate table DelegatePda: 44041 (of 200000; tx total 44041)
- cu tee delegate hand 0 DelegatePda: 53975 (of 200000; tx total 53975)
- cu tee delegate hand 1 DelegatePda: 43475 (of 200000; tx total 43475)
- cu tee delegate hand 2 DelegatePda: 50975 (of 200000; tx total 50975)
- cu tee delegate hand 3 DelegatePda: 55475 (of 200000; tx total 55475)
- cu tee create permissions CreateTablePermission: 52682 (of 1000000; tx total 152302)
- cu tee create permissions CreateHandPermission: 23405 (of 947318; tx total 152302)
- cu tee create permissions CreateHandPermission: 26405 (of 923913; tx total 152302)
- cu tee create permissions CreateHandPermission: 23405 (of 897508; tx total 152302)
- cu tee create permissions CreateHandPermission: 26405 (of 874103; tx total 152302)
- cu tee request_deal RequestDeal: 92019 (of 200000; tx total 92019)
- cu tee reveal_hands RevealHands: 90061 (of 200000; tx total 90061)
- cu tee callback_deal (oracle) CallbackDeal: 49058 (of 268924; tx total 80853)
- cu as open_table OpenTable: 48110 (of 200000; tx total 48110)
- cu as fund seats: 600 (tx total)
- cu as join_table seat 0 JoinTable: 59326 (of 200000; tx total 59326)
- cu as join_table seat 1 JoinTable: 62335 (of 200000; tx total 62335)
- cu as join_table seat 2 JoinTable: 62343 (of 200000; tx total 62343)
- cu as join_table seat 3 JoinTable: 60851 (of 200000; tx total 60851)
- cu as delegate table DelegatePda: 48541 (of 200000; tx total 48541)
- cu as delegate hand 0 DelegatePda: 41975 (of 200000; tx total 41975)
- cu as delegate hand 1 DelegatePda: 61475 (of 200000; tx total 61475)
- cu as delegate hand 2 DelegatePda: 53975 (of 200000; tx total 53975)
- cu as delegate hand 3 DelegatePda: 40475 (of 200000; tx total 40475)
- cu as request_deal RequestDeal: 90523 (of 200000; tx total 90523)
- cu as callback_deal (oracle) CallbackDeal: 49058 (of 268255; tx total 81522)

## (a) diagnostics

- pre-deal owner read (confirmed): lamports=1036320 owner=HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb len=76 head=33386598c4c768f29adcd689d487a1b5 dealt=undecodable
- pre-deal stranger read (confirmed): null
- hand pda: FAWTzWzFj5nEjHdpf7q1P95xeWC5Xx7TunAUTVheai7f = PDA(["hand", table BRX6Z4cE1bc8BhbhxqyRLBExerGmoXsYangaaL2Lx8CP, owner 12xYX44Lcaq1yJgnhn6LpXTNXz4Hnkpp8C9B53cRuij6], HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb)
- hand permission pda: AUjcuZRSLNBBBFxBWtcEVZfJhNAepWnSvHop7snbhiXN
- token owner: issued for 12xYX44Lcaq1yJgnhn6LpXTNXz4Hnkpp8C9B53cRuij6, expiresAt 1798338823457 (2026-12-27T02:33:43.457Z)
- token stranger: issued for CXYvk793EAdzeDroXSiHhu6bUhrDff86pLcPhBhtyAfy, expiresAt 1798338824095 (2026-12-27T02:33:44.095Z)
- token payer: issued for BT9TYK3HL5Bc7rZfTNrPiGkjGXDKeDpdEPgWBqAks1Bs, expiresAt 1798338824786 (2026-12-27T02:33:44.786Z)
- control: public table via owner connection: lamports=13436600 owner=HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb len=2517 head=22648a61ec81e670e583d91aa2010000; phase=trading; owner seat found, seat.hand == hand pda
- permission via payer connection: null
- permission via owner connection: lamports=0 owner=ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1 len=101 head=01ffd273292dc83b5c8ed4b5beb66bf2; owner (token pubkey) as permission member: member found at byte 69, flags=0x1f (AUTHORITY|TX_LOGS|TX_BALANCES|TX_MESSAGE|ACCOUNT_SIGNATURES)
- owner read (confirmed, 400 ms / 20 s poll) #1-27 (t+305..20151 ms) x27: lamports=1036320 owner=HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb len=76 head=33386598c4c768f29adcd689d487a1b5 dealt=undecodable
- owner read (processed): lamports=1036320 owner=HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb len=76 head=33386598c4c768f29adcd689d487a1b5 dealt=undecodable
- owner getMultipleAccountsInfo (confirmed): lamports=1036320 owner=HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb len=76 head=33386598c4c768f29adcd689d487a1b5
- stranger read (confirmed): null
- payer read (confirmed, non-member): null
- no-token read (confirmed): null
- owner hand full data (len=76): 33386598c4c768f29adcd689d487a1b59445ac3e5b90ae7ad9d12c3d1dfa56e12896a90947e0ff380080624a8f71cb3b98e3dac8903cecebfadf481c6633b0cf7d97aea8eba4474d00070801
- owner hand decode error: Account not found: Hand
- stranger hand full data: null
