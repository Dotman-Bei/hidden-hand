/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/hidden_hand.json`.
 */
export type HiddenHand = {
  "address": "HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb",
  "metadata": {
    "name": "hiddenHand",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Hidden Hand: a sealed-signal trading pit on MagicBlock Ephemeral Rollups"
  },
  "instructions": [
    {
      "name": "callbackDeal",
      "docs": [
        "ER (VRF callback, TEE mode). Two cards into each private hand; the clock starts."
      ],
      "discriminator": [
        180,
        17,
        166,
        178,
        30,
        59,
        141,
        223
      ],
      "accounts": [
        {
          "name": "vrfProgramIdentity",
          "docs": [
            "Scoped VRF identity PDA, bound to this program. Its presence as a signer proves",
            "the callback was issued by the VRF program for this program."
          ],
          "signer": true,
          "address": "6t74YQGsCu8sv8SX28jBkwwzHoiAym8pu1zDtiPCyKJ9"
        },
        {
          "name": "table",
          "writable": true
        },
        {
          "name": "hand0",
          "writable": true
        },
        {
          "name": "hand1",
          "writable": true
        },
        {
          "name": "hand2",
          "writable": true
        },
        {
          "name": "hand3",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "randomness",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "claimPot",
      "docs": [
        "Base layer, after the undelegation lands. The whole vault goes to the recorded winner, once."
      ],
      "discriminator": [
        210,
        85,
        35,
        217,
        204,
        65,
        38,
        17
      ],
      "accounts": [
        {
          "name": "table",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  98,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "table.round_id",
                "account": "table"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "table"
              }
            ]
          }
        },
        {
          "name": "winner",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createHandPermission",
      "docs": [
        "ER (TEE). Make one hand private to its owner. Members come from the account, never from args. Idempotent."
      ],
      "discriminator": [
        76,
        209,
        67,
        221,
        27,
        0,
        113,
        95
      ],
      "accounts": [
        {
          "name": "table",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  98,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "table.round_id",
                "account": "table"
              }
            ]
          }
        },
        {
          "name": "hand",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  97,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "table"
              },
              {
                "kind": "arg",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "permission",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "permissionProgram",
          "address": "ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1"
        },
        {
          "name": "ephemeralVault",
          "writable": true,
          "address": "MagicVau1t999999999999999999999999999999999"
        },
        {
          "name": "magicProgram",
          "address": "Magic11111111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "owner",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "createTablePermission",
      "docs": [
        "ER (TEE). Make the table readable by anyone holding a TEE auth token. Idempotent."
      ],
      "discriminator": [
        194,
        38,
        119,
        36,
        146,
        11,
        104,
        110
      ],
      "accounts": [
        {
          "name": "table",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  98,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "table.round_id",
                "account": "table"
              }
            ]
          }
        },
        {
          "name": "permission",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "permissionProgram",
          "address": "ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1"
        },
        {
          "name": "ephemeralVault",
          "writable": true,
          "address": "MagicVau1t999999999999999999999999999999999"
        },
        {
          "name": "magicProgram",
          "address": "Magic11111111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "delegatePda",
      "docs": [
        "Base layer. Delegate the table or a hand to the ER validator passed as `validator`."
      ],
      "discriminator": [
        248,
        217,
        193,
        46,
        124,
        191,
        64,
        135
      ],
      "accounts": [
        {
          "name": "bufferPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "pda"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                246,
                23,
                48,
                23,
                7,
                8,
                214,
                161,
                248,
                10,
                134,
                69,
                196,
                235,
                71,
                55,
                137,
                179,
                136,
                20,
                139,
                150,
                74,
                42,
                125,
                226,
                205,
                141,
                26,
                191,
                109,
                182
              ]
            }
          }
        },
        {
          "name": "delegationRecordPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "pda"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "pda"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "pda",
          "writable": true
        },
        {
          "name": "payer",
          "signer": true
        },
        {
          "name": "validator",
          "optional": true
        },
        {
          "name": "ownerProgram",
          "address": "HZdoTuj1N8u1EBsVB6Bd6cgXDVnswb1cX1nFkX4miRFb"
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "target",
          "type": {
            "defined": {
              "name": "delegateTarget"
            }
          }
        }
      ]
    },
    {
      "name": "joinTable",
      "docs": [
        "Base layer. Take the next seat: pay the entry into the vault, create the hand."
      ],
      "discriminator": [
        14,
        117,
        84,
        51,
        95,
        146,
        171,
        70
      ],
      "accounts": [
        {
          "name": "table",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  98,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "table.round_id",
                "account": "table"
              }
            ]
          }
        },
        {
          "name": "hand",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  97,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "table"
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "table"
              }
            ]
          }
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "commitment",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "openTable",
      "docs": [
        "Base layer. Create a table; TEE tables pre-fund the rent of their public permission."
      ],
      "discriminator": [
        251,
        98,
        127,
        54,
        103,
        12,
        106,
        246
      ],
      "accounts": [
        {
          "name": "table",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  98,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "roundId"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "roundId",
          "type": "u64"
        },
        {
          "name": "mode",
          "type": {
            "defined": {
              "name": "dealMode"
            }
          }
        },
        {
          "name": "durationSecs",
          "type": "u16"
        },
        {
          "name": "entryLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "processUndelegation",
      "discriminator": [
        196,
        28,
        41,
        206,
        48,
        37,
        51,
        167
      ],
      "accounts": [
        {
          "name": "baseAccount",
          "writable": true
        },
        {
          "name": "buffer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  110,
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  101,
                  45,
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "baseAccount"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                181,
                183,
                0,
                225,
                242,
                87,
                58,
                192,
                204,
                6,
                34,
                1,
                52,
                74,
                207,
                151,
                184,
                53,
                6,
                235,
                140,
                229,
                25,
                152,
                204,
                98,
                126,
                24,
                147,
                128,
                167,
                62
              ]
            }
          }
        },
        {
          "name": "payer",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "accountSeeds",
          "type": {
            "vec": "bytes"
          }
        }
      ]
    },
    {
      "name": "requestDeal",
      "docs": [
        "ER. One VRF request deals every seat (queue: DEFAULT_EPHEMERAL_QUEUE)."
      ],
      "discriminator": [
        33,
        8,
        55,
        83,
        144,
        145,
        124,
        236
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "table",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  98,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "table.round_id",
                "account": "table"
              }
            ]
          }
        },
        {
          "name": "oracleQueue",
          "writable": true,
          "address": "5hBR571xnXppuCPveTrctfTU7tJLSN94nq7kv7FRK5Tc"
        },
        {
          "name": "programIdentity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "vrfProgram",
          "address": "Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz"
        },
        {
          "name": "slotHashes",
          "address": "SysvarS1otHashes111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "clientSeed",
          "type": "u8"
        }
      ]
    },
    {
      "name": "revealHands",
      "docs": [
        "ER (TEE). After the bell: copy every hand to the table and flip every hand permission public."
      ],
      "discriminator": [
        110,
        74,
        64,
        180,
        131,
        91,
        81,
        51
      ],
      "accounts": [
        {
          "name": "table",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  98,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "table.round_id",
                "account": "table"
              }
            ]
          }
        },
        {
          "name": "hand0",
          "writable": true
        },
        {
          "name": "hand1",
          "writable": true
        },
        {
          "name": "hand2",
          "writable": true
        },
        {
          "name": "hand3",
          "writable": true
        },
        {
          "name": "permission0",
          "writable": true
        },
        {
          "name": "permission1",
          "writable": true
        },
        {
          "name": "permission2",
          "writable": true
        },
        {
          "name": "permission3",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "permissionProgram",
          "address": "ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1"
        },
        {
          "name": "ephemeralVault",
          "writable": true,
          "address": "MagicVau1t999999999999999999999999999999999"
        },
        {
          "name": "magicProgram",
          "address": "Magic11111111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "settleRound",
      "docs": [
        "ER. After the reveal: P&L per seat, the winner, then commit + undelegate the table and the four hands."
      ],
      "discriminator": [
        40,
        101,
        18,
        1,
        31,
        129,
        52,
        77
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "table",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  98,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "table.round_id",
                "account": "table"
              }
            ]
          }
        },
        {
          "name": "hand0",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  97,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "table"
              },
              {
                "kind": "account",
                "path": "table.seats [0].owner",
                "account": "table"
              }
            ]
          }
        },
        {
          "name": "hand1",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  97,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "table"
              },
              {
                "kind": "account",
                "path": "table.seats [1].owner",
                "account": "table"
              }
            ]
          }
        },
        {
          "name": "hand2",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  97,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "table"
              },
              {
                "kind": "account",
                "path": "table.seats [2].owner",
                "account": "table"
              }
            ]
          }
        },
        {
          "name": "hand3",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  97,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "table"
              },
              {
                "kind": "account",
                "path": "table.seats [3].owner",
                "account": "table"
              }
            ]
          }
        },
        {
          "name": "magicProgram",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magicContext",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "trade",
      "docs": [
        "ER. Trade against the market maker. No wallet prompt: the seat's own key signs, zero fee on the ER."
      ],
      "discriminator": [
        178,
        144,
        26,
        216,
        241,
        187,
        206,
        130
      ],
      "accounts": [
        {
          "name": "table",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  97,
                  98,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "table.round_id",
                "account": "table"
              }
            ]
          }
        },
        {
          "name": "trader",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "side",
          "type": "u8"
        },
        {
          "name": "qty",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "hand",
      "discriminator": [
        51,
        56,
        101,
        152,
        196,
        199,
        104,
        242
      ]
    },
    {
      "name": "table",
      "discriminator": [
        34,
        100,
        138,
        97,
        236,
        129,
        230,
        112
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "badDuration",
      "msg": "duration_secs must be 30..=180"
    },
    {
      "code": 6001,
      "name": "wrongPhase",
      "msg": "wrong phase for this instruction"
    },
    {
      "code": 6002,
      "name": "tableFull",
      "msg": "all four seats are taken"
    },
    {
      "code": 6003,
      "name": "alreadySeated",
      "msg": "this wallet already holds a seat"
    },
    {
      "code": 6004,
      "name": "tableNotFull",
      "msg": "the table needs four seats before the deal"
    },
    {
      "code": 6005,
      "name": "wrongHand",
      "msg": "hand account does not match the seat"
    },
    {
      "code": 6006,
      "name": "modeNotSupported",
      "msg": "instruction not supported in this deal mode"
    },
    {
      "code": 6007,
      "name": "bellNotRung",
      "msg": "the bell has not rung yet"
    },
    {
      "code": 6008,
      "name": "notSeated",
      "msg": "signer does not hold a seat"
    },
    {
      "code": 6009,
      "name": "lotSize",
      "msg": "lot must be 1..=5"
    },
    {
      "code": 6010,
      "name": "positionCap",
      "msg": "position would pass the +/-15 cap"
    },
    {
      "code": 6011,
      "name": "priceBound",
      "msg": "price would leave 8.00..=120.00"
    },
    {
      "code": 6012,
      "name": "badSide",
      "msg": "side must be 0 (buy) or 1 (sell)"
    },
    {
      "code": 6013,
      "name": "roundClosed",
      "msg": "trading is closed"
    },
    {
      "code": 6014,
      "name": "alreadyPaid",
      "msg": "the pot is already paid"
    },
    {
      "code": 6015,
      "name": "noWinner",
      "msg": "no winner recorded"
    },
    {
      "code": 6016,
      "name": "wrongWinner",
      "msg": "winner account does not match the table"
    },
    {
      "code": 6017,
      "name": "badCommitment",
      "msg": "secret does not match the commitment"
    },
    {
      "code": 6018,
      "name": "alreadyRevealed",
      "msg": "this seat already revealed"
    },
    {
      "code": 6019,
      "name": "mathOverflow",
      "msg": "arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "dealMode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "tee"
          },
          {
            "name": "commitReveal"
          }
        ]
      }
    },
    {
      "name": "delegateTarget",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "table",
            "fields": [
              {
                "name": "roundId",
                "type": "u64"
              }
            ]
          },
          {
            "name": "hand",
            "fields": [
              {
                "name": "table",
                "type": "pubkey"
              },
              {
                "name": "owner",
                "type": "pubkey"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "hand",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "table",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "seat",
            "type": "u8"
          },
          {
            "name": "cards",
            "type": {
              "array": [
                "u8",
                2
              ]
            }
          },
          {
            "name": "dealt",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "phase",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open"
          },
          {
            "name": "dealing"
          },
          {
            "name": "trading"
          },
          {
            "name": "revealed"
          },
          {
            "name": "settled"
          }
        ]
      }
    },
    {
      "name": "seat",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "hand",
            "type": "pubkey"
          },
          {
            "name": "cashC",
            "type": "i64"
          },
          {
            "name": "pos",
            "type": "i32"
          },
          {
            "name": "commitment",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "revealed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "table",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "roundId",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "mode",
            "type": {
              "defined": {
                "name": "dealMode"
              }
            }
          },
          {
            "name": "phase",
            "type": {
              "defined": {
                "name": "phase"
              }
            }
          },
          {
            "name": "durationSecs",
            "type": "u16"
          },
          {
            "name": "entryLamports",
            "type": "u64"
          },
          {
            "name": "seatCount",
            "type": "u8"
          },
          {
            "name": "seats",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "seat"
                  }
                },
                4
              ]
            }
          },
          {
            "name": "priceC",
            "type": "u32"
          },
          {
            "name": "startTs",
            "type": "i64"
          },
          {
            "name": "endTs",
            "type": "i64"
          },
          {
            "name": "seed",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "cards",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          },
          {
            "name": "hiddenSum",
            "type": "u16"
          },
          {
            "name": "winner",
            "type": "u8"
          },
          {
            "name": "pnlC",
            "type": {
              "array": [
                "i64",
                4
              ]
            }
          },
          {
            "name": "paid",
            "type": "bool"
          },
          {
            "name": "tradeCount",
            "type": "u32"
          },
          {
            "name": "trades",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "tradeEntry"
                  }
                },
                128
              ]
            }
          }
        ]
      }
    },
    {
      "name": "tradeEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seat",
            "type": "u8"
          },
          {
            "name": "side",
            "type": "u8"
          },
          {
            "name": "qty",
            "type": "u8"
          },
          {
            "name": "priceAfterC",
            "type": "u32"
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
