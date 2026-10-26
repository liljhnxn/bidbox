# 📦 BidBox — On-Chain Auction dApp on Botchain Mainnet

BidBox is a clean, secure, beginner-friendly Web3 auction decentralized application (dApp) built on the **Botchain Mainnet**. It enables users to bid transparently on an item using native **BOT** tokens, escrows outbid funds safely, and provides intuitive creator management controls.

---

## 🌟 Key Features

- **Native BOT Bidding**: Directly place bids using Botchain's native `BOT` cryptocurrency.
- **Pull over Push Refunds**: When outbid, your funds are safely recorded in contract storage and can be withdrawn at any time.
- **Creator Management**:
  - Cancel auction (strictly before the first bid is placed).
  - Conclude auction once the duration expires.
  - Safely withdraw final winning proceeds.
- **Bulletproof Smart Contract**:
  - Built with Solidity `^0.8.20` targeting EVM Paris compatibility.
  - Complete `nonReentrant` guard on all value transfers.
  - Strictly follows the Checks-Effects-Interactions (CEI) design pattern.
  - 25 automated tests covering all edge cases, access control, and reentrancy attempts.
- **Modern Web3 Frontend**:
  - Next.js 14 App Router, TypeScript, and Tailwind CSS.
  - Integrated with `wagmi` v2 and `viem` v2.
  - Live countdown timers, auto-refreshing contract states, and Botchain Scan explorer links.

---

## 🌐 Botchain Mainnet Network Details

| Parameter | Value |
| :--- | :--- |
| **Network Name** | Botchain Mainnet |
| **Chain ID** | `677` |
| **Currency Symbol** | `BOT` |
| **Currency Decimals** | `18` |
| **Total Supply** | 150 Million |
| **RPC URL** | [https://rpc.botchain.ai](https://rpc.botchain.ai/) |
| **Block Explorer** | [https://scan.botchain.ai](https://scan.botchain.ai/) |
| **Deployed Contract** | [`0x692250e9Ed2acb14E4ed7a5EB5857ED48E330df7`](https://scan.botchain.ai/address/0x692250e9Ed2acb14E4ed7a5EB5857ED48E330df7) |

---

## 🏗️ Project Architecture

```
BidBox/
├── contracts/
│   ├── BidBox.sol             # Core auction smart contract
│   └── mocks/
│       └── MaliciousBidder.sol# Mock attacker for reentrancy tests
├── scripts/
│   └── deploy.js              # Hardhat deployment script with auto-export
├── test/
│   └── BidBox.test.js         # Comprehensive 25-case test suite
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx     # Root layout with Web3 providers
│   │   │   ├── page.tsx       # Main auction dashboard
│   │   │   └── globals.css    # Custom dark navy & neon glow styling
│   │   ├── components/
│   │   │   ├── Header.tsx     # Wallet button & network status
│   │   │   ├── AuctionCard.tsx# Live item stats & countdown
│   │   │   ├── PlaceBid.tsx   # Bid form with real-time validation
│   │   │   ├── MyActivity.tsx # Refund withdrawal & bidder badge
│   │   │   └── CreatorControls.tsx # Creator admin panel
│   │   └── config/
│   │       ├── network.ts     # Botchain viem chain definition
│   │       ├── wagmi.ts       # Wagmi v2 client configuration
│   │       ├── contract.ts    # BidBox ABI and contract loader
│   │       └── contract-address.json # Auto-populated deployment address
│   ├── package.json
│   └── tailwind.config.js
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Root scripts
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node 20 / 25)
- **MetaMask** or any EIP-1193 Web3 browser wallet
- **BOT Mainnet Tokens**

---

### 2. Smart Contract Testing & Local Execution

Install root dependencies and run the complete test suite:

```bash
# Run tests
npm test
```

You should see 25 passing tests verifying:
- Auction initialization & parameters
- Bid increments & outbidding
- Rejecting bids that are equal to or lower than the current highest bid
- Rejecting creator bids
- Rejecting bids after duration expiration or cancellation
- Accurate refund accounting
- Safe refund withdrawals
- Creator cancellation before the first bid
- Preventing cancellation once bids exist
- Creator ending auction after duration
- Creator withdrawing winning proceeds
- Preventing double withdrawals & unauthorized calls
- Reentrancy protection

---

### 3. Deploying to Botchain Mainnet

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your deployer private key:
   ```env
   BOTCHAIN_RPC_URL="https://rpc.botchain.ai"
   PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"
   AUCTION_ITEM_NAME="BidBox Genesis Pass #002"
   AUCTION_DURATION_SECONDS="259200"
   ```

3. Run the deployment script:
   ```bash
   npm run deploy:mainnet
   ```

   The script will:
   - Deploy `BidBox.sol` to Botchain Mainnet with optimized gas settings.
   - Display the deployed contract address and explorer URL.
   - Automatically save the address to `frontend/src/config/contract-address.json`.

4. (Optional) Verify contract source code on Botchain Scan:
   ```bash
   npm run verify:mainnet <DEPLOYED_CONTRACT_ADDRESS> "<ITEM_NAME>" <DURATION_IN_SECONDS>
   ```
   *Live deployed contract:* [`0x692250e9Ed2acb14E4ed7a5EB5857ED48E330df7`](https://scan.botchain.ai/address/0x692250e9Ed2acb14E4ed7a5EB5857ED48E330df7)

---

### 4. Running the Frontend

Navigate to the frontend directory and start the development server:

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Connect your wallet.
- If your wallet is on another network, click **Switch to Botchain** to add/switch to Chain ID `677`.
- Place bids, monitor leading offers, withdraw refunds, and manage the auction.

---

## 🛡️ Security Implementation Details

1. **Pull over Push (Escrow Refunds)**:
   When bidder B outbids bidder A, bidder A's BOT is never automatically sent across the network inside `bid()`. Instead, `refunds[A] += highestBid;` is recorded. Bidder A calls `withdrawRefund()` when ready. This eliminates denial-of-service (DoS) attack vectors.

2. **Strict Checks-Effects-Interactions**:
   State variables like `refunds[msg.sender]` and `highestBid` are zeroed out **before** external ether transfer calls are made.

3. **Reentrancy Protection**:
   All state-modifying external methods utilize an embedded `nonReentrant` modifier to prevent reentrancy exploits.

4. **Creator Rules**:
   - The creator cannot bid on their own auction.
   - Cancellation is permanently disabled as soon as the first valid bid is placed.
   - Ending the auction is locked until `block.timestamp >= auctionEndTime`.
