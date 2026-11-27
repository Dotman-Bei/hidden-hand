# Spike result

- run: 2026-11-27T02:55:55.419Z
- program: HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb

(a) PASS — TEE auth-token read of a permissioned account (owner reads, stranger cannot): owner read [5,2]; stranger got nothing (null)
(b) PASS — VRF request + callback served inside the TEE ER (DEFAULT_EPHEMERAL_QUEUE): callback_deal landed inside the TEE; phase = trading
(c) PASS — reveal of private state at settlement (reveal_hands flips every hand public): cards [5,2,13,5,1,1,15,13], hidden sum 55; hand 0 now public
(f) PASS — informational: VRF request + callback on devnet-as (the fallback path): VRF deal landed on devnet-as

TEE path eligible: yes — keep manifest.json

## Informational

- validator tee: 4.2.2 / core=2.0.5, feature-set=565236538, git-commit=380360a
- validator devnet-as: 4.2.2 / core=2.0.5, feature-set=565236538, git-commit=380360a
- cu tee open_table OpenTable: 49610 (of 200000; tx total 49610)
- cu tee fund seats: 600 (tx total)
- cu tee join_table seat 0 JoinTable: 56333 (of 200000; tx total 56333)
- cu tee join_table seat 1 JoinTable: 56335 (of 200000; tx total 56335)
- cu tee join_table seat 2 JoinTable: 56343 (of 200000; tx total 56343)
- cu tee join_table seat 3 JoinTable: 56351 (of 200000; tx total 56351)
- cu tee delegate table DelegatePda: 48541 (of 200000; tx total 48541)
- cu tee delegate hand 0 DelegatePda: 47975 (of 200000; tx total 47975)
- cu tee delegate hand 1 DelegatePda: 43475 (of 200000; tx total 43475)
- cu tee delegate hand 2 DelegatePda: 40475 (of 200000; tx total 40475)
- cu tee delegate hand 3 DelegatePda: 50975 (of 200000; tx total 50975)
- cu tee create permissions CreateTablePermission: 51182 (of 1000000; tx total 158302)
- cu tee create permissions CreateHandPermission: 24905 (of 948818; tx total 158302)
- cu tee create permissions CreateHandPermission: 27905 (of 923913; tx total 158302)
- cu tee create permissions CreateHandPermission: 23405 (of 896008; tx total 158302)
- cu tee create permissions CreateHandPermission: 30905 (of 872603; tx total 158302)
- cu tee request_deal RequestDeal: 92023 (of 200000; tx total 92023)
- cu tee reveal_hands RevealHands: 84061 (of 200000; tx total 84061)
- cu tee callback_deal (oracle) CallbackDeal: 49058 (of 271293; tx total 78484)
- cu as open_table OpenTable: 49610 (of 200000; tx total 49610)
- cu as fund seats: 600 (tx total)
- cu as join_table seat 0 JoinTable: 59326 (of 200000; tx total 59326)
- cu as join_table seat 1 JoinTable: 56335 (of 200000; tx total 56335)
- cu as join_table seat 2 JoinTable: 59343 (of 200000; tx total 59343)
- cu as join_table seat 3 JoinTable: 60851 (of 200000; tx total 60851)
- cu as delegate table DelegatePda: 66541 (of 200000; tx total 66541)
- cu as delegate hand 0 DelegatePda: 49475 (of 200000; tx total 49475)
- cu as delegate hand 1 DelegatePda: 73475 (of 200000; tx total 73475)
- cu as delegate hand 2 DelegatePda: 55475 (of 200000; tx total 55475)
- cu as delegate hand 3 DelegatePda: 47975 (of 200000; tx total 47975)
- cu as request_deal RequestDeal: 92019 (of 200000; tx total 92019)
- cu as callback_deal (oracle) CallbackDeal: 49058 (of 271970; tx total 77807)

## (a) diagnostics

- pre-deal owner read (confirmed): lamports=1036320 owner=HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb len=76 head=33386598c4c768f2aaf3097b1914ae41 dealt=false
- pre-deal stranger read (confirmed): null
- hand pda: J8mzhzFH9P4LHjyY4abGv8iFiqiRUqzXsytTWjywuLwg = PDA(["hand", table CWKFc59SoaSKoj17w61vcRaeQFd2gMG63BnbDZ24H4JT, owner 12xYX44Lcaq1yJgnhn6LpXTNXz4Hnkpp8C9B53cRuij6], HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb)
- hand permission pda: 6LWnY6rhUkRz3V684JYcCw3mE6DhwPjit1DQAW1yUGkf
- token owner: issued for 12xYX44Lcaq1yJgnhn6LpXTNXz4Hnkpp8C9B53cRuij6, expiresAt 1798340057654 (2026-12-27T02:54:17.654Z)
- token stranger: issued for CXYvk793EAdzeDroXSiHhu6bUhrDff86pLcPhBhtyAfy, expiresAt 1798340058283 (2026-12-27T02:54:18.283Z)
- token payer: issued for BT9TYK3HL5Bc7rZfTNrPiGkjGXDKeDpdEPgWBqAks1Bs, expiresAt 1798340058955 (2026-12-27T02:54:18.955Z)
- control: public table via owner connection: lamports=13436600 owner=HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb len=2517 head=22648a61ec81e6700442ec1aa2010000; phase=trading; owner seat found, seat.hand == hand pda
- permission via payer connection: null
- permission via owner connection: lamports=0 owner=ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1 len=101 head=01fefe949e8e1256de467a671fc3b29c; owner (token pubkey) as permission member: member found at byte 69, flags=0x1f (AUTHORITY|TX_LOGS|TX_BALANCES|TX_MESSAGE|ACCOUNT_SIGNATURES)
- owner read (confirmed, 400 ms / 20 s poll) #1 (t+324 ms) x1: lamports=1036320 owner=HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb len=76 head=33386598c4c768f2aaf3097b1914ae41 dealt=true
- owner read (processed): lamports=1036320 owner=HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb len=76 head=33386598c4c768f2aaf3097b1914ae41 dealt=true
- owner getMultipleAccountsInfo (confirmed): lamports=1036320 owner=HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb len=76 head=33386598c4c768f2aaf3097b1914ae41
- stranger read (confirmed): null
- payer read (confirmed, non-member): null
- no-token read (confirmed): null
- owner hand full data (len=76): 33386598c4c768f2aaf3097b1914ae41bf66721e7301022b1cc15a1fed7d70dda636cce188c68cb00080624a8f71cb3b98e3dac8903cecebfadf481c6633b0cf7d97aea8eba4474d00050201
- owner hand decode: ok
- stranger hand full data: null

## Addendum (orchestrator, 2026-11-27 02:58Z)

- **(a) PASS after client fix.** The Private ER read worked all along; our client decoded the Hand under the wrong coder account name ("Hand" instead of anchor 0.32.1's camelCased "hand"), fixed in 00a9765 (fixture test on the captured 76-byte owner read). This run: owner decodes [5,2] dealt=true; stranger, payer and no-token read null. (b)(c)(f) PASS.
- **Spike decision:** the TEE path is eligible. The manifest stays the merged commit-reveal fallback DAG (statuses preserved, program:20 and client:21 built and kept as a switchable fallback), and the shipped DEFAULT deal mode is `tee` (HH_DEAL_MODE / `--mode` switch to commit-reveal).
- gates:15 real TEE-mode round: check-proof `PROOF: PASS`; wsl-deploy.sh check `HH-DEPLOY: PASS HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb`.
