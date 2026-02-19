---
name: algorand-dev
description: Algorand blockchain development skill — smart contracts, AlgoKit, AVM, Python/TypeScript, ASAs, NFTs, transactions, and tooling reference for building dApps on Algorand.
---

# Algorand Development Skill

Use this skill whenever the task involves **Algorand blockchain development** — writing smart contracts, deploying dApps, interacting with the AVM, creating ASAs/NFTs, or using AlgoKit.

## When to Use This Skill

- Writing or modifying **Algorand smart contracts** (Python or TypeScript)
- Setting up **AlgoKit projects** or running LocalNet
- Creating **ASAs** (fungible tokens) or **NFTs** (with IPFS/Pinata)
- Working with **transactions**, atomic groups, or application calls
- Configuring **environment variables** for Algorand dApps
- Using `algosdk`, `use-wallet`, or any Algorand SDK
- Deploying contracts to **LocalNet / TestNet / MainNet**

## Quick Reference

### Smart Contract Languages

| Language | Compiler | Extension | Init Command |
|----------|----------|-----------|--------------|
| Algorand Python | PuyaPy | `.py` | `algokit init -t python` |
| Algorand TypeScript | PuyaTs | `.algo.ts` | `algokit init` → TypeScript |
| TEAL (assembly) | Direct | `.teal` | N/A |

### Hello World — Python

```python
from algopy import ARC4Contract, arc4

class HelloWorldContract(ARC4Contract):
    @arc4.abimethod
    def hello(self, name: arc4.String) -> arc4.String:
        return "Hello, " + name
```

### Hello World — TypeScript

```typescript
import { Contract } from '@algorandfoundation/tealscript';

export class HelloWorld extends Contract {
  hello(name: string): string {
    return 'Hello, ' + name;
  }
}
```

### AVM Types

| AVM Type | Python | TypeScript | Notes |
|----------|--------|------------|-------|
| `uint64` | `UInt64` | `uint64` / `UInt<64>` | Native, most efficient |
| `bytes[]` | `Bytes` | `bytes` | Max 4096 bytes |
| `bigint` | `BigUInt` | `uint512` | Up to 512-bit |

### Essential AlgoKit Commands

```bash
# Install AlgoKit
pipx install algokit

# Start local blockchain
algokit localnet start

# Create project (interactive)
algokit init

# Build contracts
algokit project run build

# Deploy to LocalNet
algokit project deploy localnet

# Compile Python contract
algokit compile py contract.py

# Generate typed client
algokit generate client Contract.arc56.json --output client.py
```

### Environment Variables (Vite dApp)

```env
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_ALGOD_NETWORK=testnet
VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud
VITE_PINATA_JWT=your_jwt_here
```

### Transaction Basics

- **Min fee**: 1000 microAlgo (0.001 ALGO)
- **Atomic groups**: Up to 16 transactions, all-or-nothing
- **8 types**: Payment, Key Registration, Asset Config, Asset Freeze, Asset Transfer, Application Call, State Proof, Heartbeat

### TypeScript Gotchas

- Use `for...of` (NOT `forEach`) for iteration
- Always define types for arrays and objects
- Nested dynamic arrays (`uint64[][]`) are extremely inefficient
- Functions cannot mutate arrays passed as arguments
- Use `clone()` for pass-by-value
- Number type errors may only appear at compile time

### Python Gotchas

- Static typing is mandatory (unlike standard Python)
- `float` is NOT supported
- `int`/`str`/`bytes` only as module-level constants
- No `async`/`await`
- `UInt64` is 64-bit unsigned (not Python's unbounded `int`)

## Detailed Reference

For the full comprehensive reference including architecture diagrams, detailed type tables, all best practices, hackathon template structure, VibeKit details, and complete resource links, see:

📄 **[Algoskill.md](file:///d:/rift/AiBoomiSkillMeter/Algo/Algoskill.md)**

## Key Resources

- [Developer Portal](https://dev.algorand.co/)
- [AlgoKit Quick Start](https://dev.algorand.co/getting-started/algokit-quick-start)
- [Algorand Python Docs](https://algorandfoundation.github.io/puya/)
- [Algorand TypeScript Docs](https://algorandfoundation.github.io/puya-ts/)
- [Hackathon Template](https://github.com/marotipatre/Hackathon-QuickStart-template)
- [Discord](https://discord.gg/algorand)
