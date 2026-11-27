# Deploy log

| UTC | program id | deploy signature |
|---|---|---|
| 2026-11-26T20:15:29Z | HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb | 52uTwHf4i3WxiNGSEtFF4T4qJxiRHH4eCAANNBSd868W5bqfWURFK8ZRe1ZM87hrbh9dL4goqnBggZd1TRc6ZuRQ |
| 2026-11-26T20:43:34Z | HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb | 1wwnYePEYGAwZV6u7AFDV8iizVmcLULbE4nUMc4CkqN8mLK9XURdAHuVuKgop9mh9uHxtY1sZH9qXVNg32B1NNM |
| 2026-11-27T02:30:37Z | HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb | 2pbjpPQFR2juuhrV3Th8gwKXe9iwoPKnVWbJMTVP3NWP5bpJhUeNm7VizZvJHNQ4bCkQiXi8y8GegH3F97VmNidK |

## Final-deploy verification (gates:16, verify-only, 2026-11-27T03:00:02Z)

No redeploy: the program source has not changed since the deployed build. `solana program dump HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb` (devnet) vs `target/deploy/hidden_hand.so` built at `d63f828`: built 518496 bytes, sha256 `4eec2d24ec87841e2cf7b945233f2ea0a8bf6ea2196d0a9a5b98908e2ce7b60f`; deployed first 518496 bytes, same sha256; no non-zero bytes after the build length. **EQUAL.**
