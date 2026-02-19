# 🎓 SkillMeter.ai — Blockchain-Verified Learning on Algorand

> **RIFT 2026 Hackathon · Web3 / Blockchain Open Innovation Track · Build on Algorand**

SkillMeter.ai is an AI-powered learning platform that issues **verifiable skill credentials on the Algorand blockchain**. Every completed course earns a Certificate NFT, every passed assessment earns a Skill Badge NFT, and every learning action earns `$SKILL` tokens — all on Algorand TestNet.

---

## 🔴 Live Demo

| | URL |
|---|---|
| 🌐 **Frontend** | _[Deploy to Vercel — see setup below]_ |
| 🔧 **Backend API** | _[Deploy to Railway — see setup below]_ |
| 🎥 **LinkedIn Demo Video** | _[Paste LinkedIn video URL here after recording]_ |

---

## 📌 Problem Statement

**Original Idea: Decentralized Skill Credential Verification**

Traditional e-learning platforms issue PDFs that are easily forged and impossible to verify automatically. Employers cannot trust certificates. Learners have no portable proof of skill.

**Our solution:** SkillMeter.ai uses Algorand to mint immutable ARC-69 NFTs for every skill milestone — turning learning achievements into on-chain credentials that anyone can verify instantly via a public URL, with no login required.

---

## 🔗 Algorand Testnet Deployments

| Contract | App ID | Explorer |
|---|---|---|
| **SkillCredential** (Certificate NFT logic) | `755783876` | [View on Lora](https://lora.algokit.io/testnet/application/755783876) |
| **SkillBadge** (Assessment Badge logic) | `755783900` | [View on Lora](https://lora.algokit.io/testnet/application/755783900) |
| **$SKILL Token** (ASA) | `755783670` | [View on Lora](https://lora.algokit.io/testnet/asset/755783670) |

**Admin Wallet:** `IGKF6PEEDZXTHPT35WBBXVCWBESHGJOHYJVONSUYO4NRSSPKPENRAO6NWU`

---

## 🏗️ Architecture Overview

```
┌──────────────────────┐     ┌───────────────────────┐     ┌─────────────────────┐
│   React Frontend     │────▶│  Django REST Backend   │────▶│  Algorand TestNet   │
│  (Vite + shadcn/ui)  │     │  (DRF + AlgoKit)       │     │  (AlgoNode.cloud)   │
└──────────────────────┘     └───────────────────────┘     └─────────────────────┘
         │                            │                              │
         │  GET /api/assessments/     │  AlgorandService             │
         │  POST /api/.../submit/     │  .issue_skill_badge()        │  AssetCreateTxn
         │  GET /verify?id=<cert>     │  .issue_certificate_nft()   ──▶  ARC-69 NFT minted
         │                            │  .reward_skill_tokens()      │  ASA transfer
         │                            │                              │
         ▼                            ▼                              ▼
   Profile.jsx                 AlgorandService               Algorand Indexer
   Badge Gallery          (algokit_utils + algosdk)    testnet-idx.algonode.cloud
   $SKILL Balance                                        (live balance query)
```

### Smart Contract Interaction Flow

1. **User completes assessment** → `POST /api/assessments/<id>/submit/`
2. **Backend calls `AlgorandService.issue_skill_badge()`**
3. **`algosdk.AssetCreateTxn`** creates ARC-69 NFT on TestNet
4. **ASA ID saved** to `AssessmentResult.badge_asset_id` in PostgreSQL/SQLite
5. **Frontend reads badge** from `GET /api/assessments/results/` and displays on Profile
6. **Public verification** at `/verify?id=<cert_id>` — zero auth required

---

## 🛠️ Tech Stack

### Blockchain
| Tool | Purpose |
|---|---|
| **AlgoKit v2.10.2** | Primary Algorand development framework (`algokit init`, `algokit deploy`) |
| **algokit-utils ≥ 3.0.0** | `AlgorandClient.testnet()` for client management |
| **algosdk** | `AssetCreateTxn`, `AssetTransferTxn` transaction primitives |
| **Algopy (Python)** | Smart contract language for `SkillCredential` and `SkillBadge` contracts |
| **Algorand TestNet** | Live deployment via AlgoNode.cloud |

### Backend
| Tool | Version |
|---|---|
| **Django** | 4.2+ |
| **Django REST Framework** | 3.14+ |
| **Daphne (ASGI)** | Production server |
| **Google Gemini API** | AI course generation, notes, quiz |

### Frontend
| Tool | Purpose |
|---|---|
| **React + Vite** | SPA framework |
| **shadcn/ui + Tailwind** | Component library |
| **Framer Motion** | Animations |
| **Lora Explorer** | On-chain NFT links |

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- AlgoKit CLI: `pipx install algokit`

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Copy and fill environment variables
cp .env.example .env
# Edit .env — set ALGORAND_MNEMONIC, API keys, etc.

python manage.py migrate
python manage.py runserver 8001
```

### Frontend Setup

```bash
# From project root
npm install

# Copy and fill environment variables
cp .env.example .env
# Set VITE_API_URL=http://localhost:8001/api

npm run dev
```

### Smart Contract Setup (AlgoKit)

```bash
cd smart_contracts/projects/smart_contracts
algokit bootstrap all
algokit deploy --network testnet
```

---

## 🔑 Required Environment Variables

### Backend (`backend/.env`)

```env
SECRET_KEY=your-django-secret-key
DEBUG=False
ALLOWED_HOSTS=*

# Algorand (required for blockchain features)
ALGORAND_MNEMONIC=word1 word2 ... word25
ALGORAND_CERT_APP_ID=755783876
ALGORAND_BADGE_APP_ID=755783900
ALGORAND_SKILL_TOKEN_ID=755783670

# AI Services
GEMINI_API_KEY=your-gemini-key
YOUTUBE_API_KEY=your-youtube-key

# Email (optional — for certificate notification)
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# WhatsApp (optional)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Frontend (`.env`)

```env
VITE_API_URL=https://your-railway-url.railway.app/api
```

---

## 📖 Usage Guide

### 1. Register & Onboard
Sign up → select your skill level → the AI generates a personalized course with real YouTube videos.

### 2. Learn
Watch videos → read AI-generated notes → take quizzes. Each action earns `$SKILL` tokens.

### 3. Earn NFT Badges
Score ≥ 10% on any quiz → a **Skill Badge NFT** is automatically minted to your Algorand wallet.

### 4. Complete a Course → Certificate NFT
When you reach 100% progress → download your PDF certificate → an **ARC-69 Certificate NFT** is minted on Algorand TestNet.

### 5. Verify Credentials
Share your certificate link: `https://your-app.com/verify?id=<CERT_ID>`
Anyone can verify — no login needed. Shows on-chain NFT proof.

### 6. Connect Your Wallet
Go to **Profile → Algorand Wallet** → paste your 58-character Algorand address → click Save.
Your NFTs are minted to this address automatically.

---

## 🔍 On-Chain Verification

Every certificate and badge is verifiable on the Algorand TestNet explorer:

- **Certificate NFT:** `https://lora.algokit.io/testnet/asset/<nft_asset_id>`
- **Skill Badge NFT:** `https://lora.algokit.io/testnet/asset/<badge_asset_id>`
- **$SKILL Token:** `https://lora.algokit.io/testnet/asset/755783670`
- **SkillCredential Contract:** `https://lora.algokit.io/testnet/application/755783876`
- **SkillBadge Contract:** `https://lora.algokit.io/testnet/application/755783900`

---

## 🚀 Deployment

### Railway (Backend)

1. Connect GitHub repo to [Railway](https://railway.app)
2. Set root directory to `backend/`
3. Add all environment variables from `backend/.env`
4. Railway auto-detects `railway.json` — deploys via `daphne`

### Vercel (Frontend)

1. Connect GitHub repo to [Vercel](https://vercel.com)
2. Set root directory to project root
3. Add `VITE_API_URL` pointing to your Railway backend URL
4. Vercel auto-detects `vercel.json`

---

## ⚠️ Known Limitations

1. **Wallet opt-in required:** Users must opt-in to ASA `755783670` in Pera/Defly wallet before receiving `$SKILL` tokens. Tokens are stored as `pending_skill_tokens` until opt-in.
2. **TestNet only:** All deployments are on Algorand TestNet. MainNet deployment requires funded admin wallet.
3. **Badge threshold:** Currently set to score ≥ 10% for testing. Should be raised to ≥ 70% for production.
4. **Admin minting:** NFTs are minted from the admin wallet (custodial). A production version would use smart contract escrow or clawback.
5. **Video API quota:** YouTube Data API v3 has daily quota limits. Fallback to YouTube search URLs when quota exceeded.

---

## 👥 Team

| Name | Role |
|---|---|
| **[Your Name]** | Full-Stack Developer, Algorand Integration |

---

## 📁 Project Structure

```
AiBoomiSkillMeter/
├── backend/                    # Django REST API
│   ├── api/
│   │   ├── models.py           # Data models (with Algorand fields)
│   │   ├── views.py            # API views + Algorand hooks
│   │   ├── services.py         # AlgorandService (AlgoKit + algosdk)
│   │   ├── serializers.py      # DRF serializers
│   │   ├── badge_generator.py  # Pillow badge PNG generator
│   │   └── urls.py             # URL routing
│   ├── railway.json            # Railway deployment config
│   └── requirements.txt
├── smart_contracts/            # AlgoKit project
│   └── projects/smart_contracts/
│       ├── skill_credential/
│       │   └── contract.py     # ARC-4 SkillCredential contract (Algopy)
│       └── skill_badge/
│           └── contract.py     # ARC-4 SkillBadge contract (Algopy)
├── src/                        # React frontend
│   ├── pages/
│   │   ├── Learn.jsx           # Learning + quiz + badge minting
│   │   ├── Profile.jsx         # Badge gallery + wallet + $SKILL
│   │   ├── Dashboard.jsx       # Live $SKILL balance from Indexer
│   │   └── VerifyCertificate.jsx  # Public on-chain cert verification
│   └── contexts/
│       ├── AuthContext.jsx
│       └── LearningContext.jsx
├── scripts/
│   ├── verify_testnet.py       # Verify TestNet deployments
│   └── check_wallet.py         # Check admin wallet balance
├── vercel.json                 # Vercel deployment config
└── README.md                   # This file
```

---

## 📜 License

MIT License — built for RIFT 2026 Hackathon.
