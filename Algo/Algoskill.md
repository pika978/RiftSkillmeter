# 🧠 AlgoSkill — Algorand Development Reference

> **Purpose:** A comprehensive reference for building on the Algorand blockchain. Use this document while developing smart contracts, dApps, and integrations with Algorand.

---

## Table of Contents

1. [Algorand Fundamentals](#1-algorand-fundamentals)
2. [Algorand Virtual Machine (AVM)](#2-algorand-virtual-machine-avm)
3. [Smart Contracts Overview](#3-smart-contracts-overview)
4. [Algorand Python](#4-algorand-python)
5. [Algorand TypeScript](#5-algorand-typescript)
6. [AlgoKit — Developer Toolkit](#6-algokit--developer-toolkit)
7. [Transactions](#7-transactions)
8. [Algorand Standard Assets (ASAs) & NFTs](#8-algorand-standard-assets-asas--nfts)
9. [Tooling & SDKs](#9-tooling--sdks)
10. [VibeKit — AI Agentic Stack](#10-vibekit--ai-agentic-stack)
11. [Hackathon QuickStart Template](#11-hackathon-quickstart-template)
12. [Best Practices](#12-best-practices)
13. [Resource Links](#13-resource-links)

---

## 1. Algorand Fundamentals

### What is Algorand?
Algorand is a **Layer-1 blockchain** that uses **Pure Proof of Stake (PPoS)** consensus. It provides:

- **Instant finality** — Transactions are final in ~3.3 seconds
- **No forking** — The chain never forks
- **Low fees** — Minimum fee is **1000 microAlgo (0.001 ALGO)**
- **Carbon negative** — Environmentally sustainable
- **Decentralized** — Anyone can run a validator node on commodity hardware

### Core Concepts

| Concept | Description |
|---------|-------------|
| **ALGO** | Native cryptocurrency of the Algorand blockchain |
| **Accounts** | Ed25519 public/private key pairs; 58-char base32 addresses |
| **Blocks** | Batch of transactions; each block has a round number, timestamp, and txn data |
| **Consensus** | Pure Proof of Stake — random block proposers/validators selected by stake weight |
| **Rekeying** | Change the authoritative private key for an account without changing its address |
| **Multisig** | Multi-signature accounts requiring M-of-N signers |

### Networks

| Network | Purpose | API Endpoint |
|---------|---------|--------------|
| **MainNet** | Production (real money) | `https://mainnet-api.algonode.cloud` |
| **TestNet** | Testing (free test ALGO) | `https://testnet-api.algonode.cloud` |
| **LocalNet** | Local development via Docker | `http://localhost:4001` |

---

## 2. Algorand Virtual Machine (AVM)

The AVM is a **bytecode-based stack interpreter** that executes programs (TEAL) associated with Algorand transactions. Current version: **v12**.

### Architecture

```
┌─────────────────────────────────────────┐
│              AVM Program                │
│                                         │
│   ┌──────────┐  ┌───────────────────┐   │
│   │  Stack   │  │  Scratch Space    │   │
│   │ (max     │  │  (256 slots)      │   │
│   │  1000    │  │  uint64 or bytes  │   │
│   │  depth)  │  │                   │   │
│   └──────────┘  └───────────────────┘   │
│                                         │
│   Stack Types: uint64 | bytes (≤4096B)  │
└─────────────────────────────────────────┘
```

### Key AVM Properties

- **Stack-based**: Operations pop arguments and push results
- **Two basic types**: `uint64` (64-bit unsigned integer) and `bytes[]` (max 4096 bytes)
- **Max stack depth**: 1000
- **Scratch space**: 256 slots for temporary storage
- **Program approval**: Stack must end with a single non-zero `uint64`

### Two Execution Modes

| Mode | Use Case | Properties |
|------|----------|------------|
| **LogicSig** (stateless) | Validate transactions | Limited access; no state; included in transaction |
| **Application** (stateful) | Smart Contracts / dApps | Global/local/box state; inner transactions; application calls |

### What AVM Programs **Cannot** Do

- Access information from previous blocks
- Access other transactions outside their atomic group
- Know the exact commit round or time
- Make indirect jumps
- Access floating-point numbers

---

## 3. Smart Contracts Overview

Algorand Smart Contracts (ASC1) come in two categories:

### Applications (Stateful Smart Contracts)

- Deployed with a unique **Application ID**
- Interacted with via **Application Call** transactions
- Can store:
  - **Global state** — shared across all users (max 64 key-value pairs)
  - **Local state** — per-account (max 16 key-value pairs per account)
  - **Box storage** — arbitrary per-application data
- Have an **Application Account** that can hold ALGO and ASAs (on-chain escrow)
- Can execute **inner transactions** (call other applications)
- Expose API via **ABI (ARC-4 / ARC-56)** standard

### Logic Signatures (Stateless)

- Programs included in transactions that validate spending conditions
- Two uses:
  1. **Contract accounts** — release funds only when conditions are met
  2. **Delegated signatures** — allow another account to act on your behalf
- Limited access to globals and transaction properties

### Smart Contract Languages

| Language | Compiler | File Extension |
|----------|----------|----------------|
| Algorand Python | **PuyaPy** | `.py` |
| Algorand TypeScript | **PuyaTs** | `.algo.ts` |
| TEAL (assembly) | Direct | `.teal` |

All high-level languages compile to **TEAL** → **AVM bytecode**.

---

## 4. Algorand Python

Algorand Python is a **partial Python implementation** for the AVM. It uses familiar Python syntax with static typing.

### Quick Start

```bash
# Initialize a project
algokit init -t python

# Or from scratch:
pip install algorand-python
```

### Hello World Contract

```python
from algopy import ARC4Contract, arc4

class HelloWorldContract(ARC4Contract):
    @arc4.abimethod
    def hello(self, name: arc4.String) -> arc4.String:
        return "Hello, " + name
```

### Compile & Deploy

```bash
# Compile to TEAL
algokit compile py contract.py

# Output files:
# - HelloWorldContract.approval.teal
# - HelloWorldContract.clear.teal
# - HelloWorldContract.arc56.json (ABI spec)

# Generate typed client
algokit generate client HelloWorldContract.arc56.json --output client.py
```

### AVM Types ↔ Python Equivalents

| AVM Type | Algorand Python | Notes |
|----------|----------------|-------|
| `uint64` | `UInt64` | 64-bit unsigned integer |
| `bytes[]` | `Bytes` | Max 4096 bytes |
| `bigint` | `BigUInt` | Up to 512-bit, backed by bytes |

### Supported Python Primitives

| Primitive | Supported? | Notes |
|-----------|------------|-------|
| `bool` | ✅ Full | |
| `tuple` | ✅ | Arguments, locals, return types |
| `NamedTuple` | ✅ | Via `typing.NamedTuple` |
| `None` | ⚠️ | Only as return type annotation |
| `int`, `str`, `bytes` | ⚠️ | Module-level constants/literals only |
| `float` | ❌ | Not supported |
| Nested tuples | ❌ | Not supported |

### Key Differences from Standard Python

1. **Static typing is mandatory** — Always specify types
2. **No `async`/`await`** — Doesn't make sense on AVM
3. `int` is unsigned & unbounded in Python but `UInt64` is 64-bit unsigned on AVM
4. `bytes` max length is 4096 on AVM (vs. unlimited in Python)

### Testing

```bash
pip install algorand-python-testing
```

The `algorand-python-testing` package allows offline unit testing with AVM behavior emulation.

### VS Code Extension (Beta)

Install: [Algorand Python VS Code Extension](https://marketplace.visualstudio.com/items?itemName=AlgorandFoundation.algorand-python-vscode)

---

## 5. Algorand TypeScript

Algorand TypeScript is a **partial TypeScript implementation** for the AVM, compiled by **PuyaTs**.

### Hello World Contract

```typescript
import { Contract } from '@algorandfoundation/tealscript';

export class HelloWorld extends Contract {
  hello(name: string): string {
    return 'Hello, ' + name;
  }
}
```

### Key Differences from Standard TypeScript

1. **Types affect behavior** — `1` compiles to `int 1` in TEAL, but `1 as uint8` becomes `byte 0x01`
2. **Numbers can be bigger** — Up to 2^512 with proper type casting
3. **Types may be required** — Must define types for methods and arrays (unlike standard TS)

### Number Types

```typescript
// Unsigned 64-bit integer (native AVM, best performance)
const n1: UInt<64> = 1;

// Unsigned 8-bit integer
const n2: UInt<8> = 1;

// Fixed-point decimal
const price: UFixed<64, 2> = 1.23;
```

### Math Operations

```typescript
// Must explicitly type results
const sum = Uint64(x + y);
// OR
const sum: uint64 = x + y;

// For smaller types, use uint64 intermediates for performance
const a: uint64 = 255;
const b: uint64 = 255;
const c: uint64 = a + b;
return UintN8(c - 255); // Convert at the end
```

### Arrays

```typescript
// Static arrays (fixed length, most efficient)
const arr: StaticArray<uint64, 3> = [1, 2, 3];

// Dynamic arrays
const dyn: uint64[] = [1, 2, 3];
// Supported: pop, push, splice, length

// Iteration (use for...of, NOT forEach)
for (const v of arr) { sum += v; }

// Clone to pass by value
const copy = clone(arr);
```

### Objects

```typescript
type MyType = { foo: uint64, bar: uint8 };
const x: MyType = { foo: 1, bar: 2 };
// Under the hood, objects are tuples
```

### Limitations

- `forEach` → **Not supported**, use `for...of`
- Nested dynamic arrays extremely inefficient (`uint64[][]`)
- No Object methods
- `splice` is expensive in opcode cost
- Functions cannot mutate arrays passed as arguments
- Number type errors may only appear at compilation (not in IDE)

### Testing

```bash
npm install algorand-typescript-testing
```

### VS Code Extension (Beta)

Install: [Algorand TypeScript VS Code Extension](https://marketplace.visualstudio.com/items?itemName=AlgorandFoundation.algorand-typescript-vscode)

### Documentation

- [Language Guide](https://algorandfoundation.github.io/puya-ts/documents/Algorand_TypeScript_Language_Guide.html)
- [API Docs](https://algorandfoundation.github.io/puya-ts/modules.html)
- [CLI Guide](https://algorandfoundation.github.io/puya-ts/documents/Compiler_CLI_Guide.html)

---

## 6. AlgoKit — Developer Toolkit

AlgoKit is Algorand's **one-stop developer toolkit** for building and deploying dApps.

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Python | 3.12+ |
| PipX | Latest |
| Git | Latest |
| Docker | Latest (for LocalNet) |
| VS Code | Recommended |
| Node.js | 18+ (for TypeScript) |

### Installation (Windows)

```powershell
# 1. Install Python
winget install python.python.3.12

# 2. Install pipx
pip install --user pipx
python -m pipx ensurepath

# 3. Install AlgoKit
pipx install algokit

# 4. Verify
algokit --version
```

### Workflow

```bash
# Start local blockchain
algokit localnet start

# Create new project (interactive menu)
algokit init

# Build smart contracts
algokit project run build

# Deploy to LocalNet
algokit project deploy localnet

# Or hit F5 in VS Code (auto: build → deploy → call)
```

### Project Structure (TypeScript Starter)

```
hello-algorand/
├── smart_contracts/
│   └── hello_world/
│       ├── contract.algo.ts    ← Smart contract code
│       └── deploy_config.ts    ← Deployment script
├── artifacts/
│   ├── HelloWorld.approval.teal
│   ├── HelloWorld.clear.teal
│   └── HelloWorld.arc56.json   ← ABI specification
├── .algokit.toml
└── package.json
```

### Template Presets

| Preset | Purpose |
|--------|---------|
| **Starter** | Quick feature testing and prototyping |
| **Production** | Production-ready with CI/CD, testing, etc. |

### Key AlgoKit Components

| Component | Purpose |
|-----------|---------|
| **AlgoKit CLI** | Project scaffolding, build, deploy, localnet management |
| **AlgoKit Utils (Python)** | Python utilities for interacting with Algorand |
| **AlgoKit Utils (TypeScript)** | TypeScript utilities for interacting with Algorand |
| **Typed Clients** | Auto-generated type-safe contract clients from ARC-56 |
| **LocalNet** | Docker-based local Algorand blockchain |
| **Lora** | Web-based blockchain explorer for LocalNet |

---

## 7. Transactions

Transactions are **cryptographically signed instructions** that modify the blockchain state.

### Transaction Lifecycle

```
Create → Sign (private key) → Submit → Block Inclusion → Execution
```

### 8 Transaction Types

| Type | Purpose |
|------|---------|
| **Payment** | Transfer ALGO between accounts |
| **Key Registration** | Register/deregister for consensus participation |
| **Asset Configuration** | Create, modify, or destroy ASAs |
| **Asset Freeze** | Freeze/unfreeze an asset in an account |
| **Asset Transfer** | Transfer ASAs between accounts; opt-in |
| **Application Call** | Create, update, delete, or call smart contracts |
| **State Proof** | Prove Algorand state to external systems |
| **Heartbeat** | Node liveness signal |

### Transaction Fees

- **Minimum fee**: 1000 microAlgo (0.001 ALGO) when network is not congested
- **Fee pooling**: One transaction in an atomic group can cover fees for others

### Signing Methods

| Method | Description |
|--------|-------------|
| **Single Signature** | Standard Ed25519 signature |
| **Multisignature** | M-of-N threshold signatures |
| **Logic Signature** | Programmatic validation |

### Atomic Transaction Groups

- Group up to **16 transactions** for simultaneous execution
- **All succeed or all fail** — no partial execution
- Use cases:
  - Circular trades
  - Decentralized exchanges
  - Distributed payments
  - Pooled transaction fees
  - Op-up (extra opcode budget)

### Leases

A `(Sender, Lease)` pair prevents duplicate transactions during the same validity period. Useful for:
- Preventing replay attacks
- Safeguarding against duplicate spending

---

## 8. Algorand Standard Assets (ASAs) & NFTs

### ASAs (Fungible Tokens)

Create fungible tokens natively on Algorand using `Asset Configuration` transactions:

```typescript
// Using AlgoKit Utils
algorand.send.assetCreate({
  sender: account.addr,
  total: 1_000_000,
  decimals: 6,
  assetName: "MyToken",
  unitName: "MTK",
  // ...
});
```

### NFTs (Non-Fungible Tokens)

Algorand NFTs follow **ARC standards** (ARC-3, ARC-19, ARC-69):

1. **Upload media** to IPFS (via Pinata)
2. **Upload metadata JSON** to IPFS
3. **Mint** as ASA with `total: 1`, `decimals: 0`

### NFT with Pinata (IPFS)

```
1. Get Pinata JWT from https://app.pinata.cloud/developers/api-keys
2. Set VITE_PINATA_JWT in .env
3. Use pinFileToIPFS → upload media
4. Use pinJSONToIPFS → upload metadata
5. Mint ASA pointing to IPFS metadata CID
```

---

## 9. Tooling & SDKs

### Official SDKs

| SDK | Language | Package |
|-----|----------|---------|
| `algosdk` | JavaScript/TypeScript | `npm install algosdk` |
| `py-algorand-sdk` | Python | `pip install py-algorand-sdk` |
| `algorand-go` | Go | Go module |
| `algorand-java` | Java | Maven |

### TxnLab Ecosystem

| Tool | Description |
|------|-------------|
| **use-wallet** | Algorand wallet integration library with ready-to-use UI components |
| **batch-asset-send** | Mass airdrop tool for Algorand assets |
| **NFDomains** | .algo domain name protocol |
| **Haystack Router** | Order router / liquidity aggregator |
| **Réti Pooling** | Staking pool protocol |

### Indexer

The Algorand Indexer provides search and read access to blockchain data:

```
TestNet: https://testnet-idx.algonode.cloud
MainNet: https://mainnet-idx.algonode.cloud
```

### Key Environment Variables (for dApps)

```env
# Algod (node connection)
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_ALGOD_PORT=
VITE_ALGOD_TOKEN=
VITE_ALGOD_NETWORK=testnet

# Indexer
VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud
VITE_INDEXER_PORT=
VITE_INDEXER_TOKEN=

# KMD (local wallet - for development)
VITE_KMD_SERVER=http://localhost
VITE_KMD_PORT=4002
VITE_KMD_TOKEN=a-super-secret-token

# Pinata (IPFS for NFTs)
VITE_PINATA_JWT=your_jwt_here
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs
```

---

## 10. VibeKit — AI Agentic Stack

VibeKit is Algorand's **CLI tool for AI-powered blockchain development**. It integrates AI coding agents (Claude Code, OpenCode, Cursor) into the Algorand development lifecycle.

### Components

| Component | Description |
|-----------|-------------|
| **Agent Skills** | Structured markdown files instructing AI on smart contract development |
| **Documentation MCPs** | Multi-Chain Providers enabling AI agents to look up Algorand docs |
| **Development MCPs** | Allow AI agents to interact directly with the blockchain (deploy, call, transfer) |

### Key Features

- **Private key isolation** — Keys remain separate from the language model
- **Full lifecycle** — From writing smart contracts to mainnet deployment
- **Vibe coding** — Use natural language prompts to generate Algorand code

> ⚠️ **Important**: Smart contracts generated by AI still require **human review** due to potential technical debt.

---

## 11. Hackathon QuickStart Template

**Repo**: [github.com/marotipatre/Hackathon-QuickStart-template](https://github.com/marotipatre/Hackathon-QuickStart-template)

### Project Structure

```
project-root/
├── projects/
│   ├── contracts/
│   │   └── smart_contracts/    ← Smart contract source
│   └── frontend/
│       ├── src/
│       │   ├── Home.tsx                           ← Landing page
│       │   ├── components/
│       │   │   ├── Transact.tsx                   ← ALGO payments
│       │   │   ├── Bank.tsx                       ← Contract + Indexer demo
│       │   │   ├── CreateASA.tsx                  ← Mint fungible tokens
│       │   │   ├── MintNFT.tsx                    ← NFT with IPFS
│       │   │   └── AppCalls.tsx                   ← App call wiring
│       │   ├── contracts/                         ← Generated typed clients
│       │   └── utils/
│       │       ├── pinata.ts                      ← IPFS utilities
│       │       └── network/getAlgoClientConfigs.ts ← Network config
│       └── .env
└── .algokit.toml
```

### Setup

```bash
git clone https://github.com/marotipatre/Hackseries-2-QuickStart-template.git
cd Hackseries-2-QuickStart-template

algokit project bootstrap all
algokit project run build

cd projects/frontend
npm install
npm run dev
```

### Prebuilt Cards (Demo Patterns)

| Card | Pattern | Key Code |
|------|---------|----------|
| **Counter** | Simple app call | State/handler/contract calls |
| **Bank** | Complex contract + Indexer reads | Deposit, withdraw, statements |
| **Payments** | Send ALGO and ASA | `Transact.tsx` |
| **Create ASA** | Mint fungible token | `algorand.send.assetCreate` |
| **Mint NFT** | IPFS upload + ARC NFT mint | Pinata + ARC NFT |

---

## 12. Best Practices

### Smart Contract Development

1. **Always use static typing** — Specify all variable types, parameters, return values
2. **Prefer `UInt64`** for numeric ops — It's the AVM's native type
3. **Use `for...of`** loops (not `forEach`) for iteration
4. **Avoid nested dynamic arrays** — `uint64[][]` is extremely inefficient
5. **Be aware of AVM constraints** — Opcode budgets, stack depth, bytes limits
6. **Use immutable patterns** — `[...array, newValue]` instead of mutating
7. **Use `clone()`** when you need pass-by-value semantics
8. **Type cast at the end** — Use `uint64` for intermediate calculations

### Architecture

9. **Test on LocalNet first** → TestNet → MainNet
10. **Use ARC-56 app specs** for typed client generation
11. **Use Atomic Transaction Groups** for multi-step operations
12. **Leverage inner transactions** for composability between applications
13. **Use the ABI standard (ARC-4)** for interoperable smart contracts

### Security

14. **Never expose private keys** in code or environment variables in production
15. **Review AI-generated smart contracts** before deployment
16. **Use leases** to prevent replay attacks
17. **Test edge cases** — Programs with bugs can lock assets permanently

---

## 13. Resource Links

### 📚 Official Documentation
- [Developer Portal](https://dev.algorand.co/)
- [Smart Contracts Overview](https://dev.algorand.co/concepts/smart-contracts/overview)
- [Transactions Overview](https://dev.algorand.co/concepts/transactions/overview)
- [AVM Documentation](https://dev.algorand.co/concepts/smart-contracts/avm)
- [AlgoKit Quick Start](https://dev.algorand.co/getting-started/algokit-quick-start)

### 🐍 Algorand Python
- [Dev Portal — Python Docs](https://dev.algorand.co/concepts/smart-contracts/languages/python/)
- [PuyaPy Compiler Docs](https://algorandfoundation.github.io/puya/)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=AlgorandFoundation.algorand-python-vscode)

### 📘 Algorand TypeScript
- [Dev Portal — TypeScript Docs](https://dev.algorand.co/concepts/smart-contracts/languages/typescript/)
- [PuyaTs GitHub](https://github.com/algorandfoundation/puya-ts)
- [Language Guide](https://algorandfoundation.github.io/puya-ts/documents/Algorand_TypeScript_Language_Guide.html)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=AlgorandFoundation.algorand-typescript-vscode)

### 🛠️ Tools & SDKs
- [AlgoKit Installation](https://algorand.co/algokit)
- [TxnLab SDK](https://www.txnlab.dev/)
- [VibeKit Blog](https://algorand.co/blog/vibekit-the-agentic-stack-for-algorand-builders)
- [Hackathon QuickStart Template](https://github.com/marotipatre/Hackathon-QuickStart-template)

### 🎓 Learning Resources
- [AlgoKit Code Tutorials](https://tutorials.dev.algorand.co)
- [Example Gallery](https://examples.dev.algorand.co)
- [YouTube — Algorand Fundamentals Playlist](https://www.youtube.com/watch?v=4JVaRvN7n6I&list=PLwRyHoehE4356E8tPKxC2XJtFEyLOHHEB)
- [YouTube — AlgoDevs Channel](https://www.youtube.com/@algodevs)
- [Nasscom Algorand Developer Course](https://www.futureskillsprime.in/pathways/algorand-blockchain-application-developer-by-algorand-and-ssc-nasscom-assessment/)
- [Web3 MasterClasses (Google Drive)](https://drive.google.com/drive/folders/1xxqEMHUgdeKd3InD4Zuf2Hmf8hWw-AyP)

### 🏆 Hackathons
- [AlgoBharat Hack Series 3.0](https://algobharat.in/hack-series3/)
- [Notion Technical Cheatsheet](https://quickest-reaction-568.notion.site/Algorand-Technical-Resources-2fea260a8fdc8096b969f2248a96617d)

### 💬 Community
- [Discord](https://discord.gg/algorand)
- [X / Twitter — @algodevs](https://x.com/algodevs)
- [GitHub — Algorand Foundation](https://github.com/algorandfoundation)
- [Contact the Foundation](https://algorand.co/algorand-foundation/contact)

---

> 💡 **Tip**: Bookmark this file. Whenever you start a new Algorand feature, refer back here for the correct types, patterns, and commands.
