![image](https://github.com/user-attachments/assets/bf35a415-639e-403c-90c0-777fc9e5a09a)

## 🚀 Introduction
Franchain is a blockchain-based solution designed to bring **trust, transparency, and timely payments** to the franchise business model. By storing agreements **on-chain** and automating payments via smart contracts, Franchain ensures that both franchisors and franchisees receive their fair share without disputes or delays.

Website Link :[franchain.xyz](https://franchain.xyz)
Contract Link: [view on explorer](https://explorer.solana.com/address/FXLMBJZHS2ZQNuYQgACjci1XuDFZTEP7JHB21Ft3Y61J?cluster=devnet)

<br/>

## 🎯 Problem Statement
In traditional franchise businesses, several issues arise:
- **Lack of Trust**: Business owners and franchisees often face disputes due to unverifiable agreements.
- **No Transparency**: Payment flows are opaque, leading to mismanagement and fraud.
- **Delayed Payments**: Franchisors and franchisees struggle with untimely revenue distribution.

  <br/>

## ✅ Solution
Franchain leverages **blockchain technology** to solve these problems:
1. **On-Chain Agreements**: Franchise contracts are stored immutably on the Solana blockchain.
2. **Automated Payments**: A **Vault PDA (Program Derived Address)** automatically distributes **USDT** to franchisors and franchisees without requiring manual signatures.
3. **Full Transparency**: Every transaction is publicly recorded on-chain, eliminating disputes and trust issues.
4. **Smart Contract-Based Revenue Sharing**: Payments are triggered via a scheduled cron job, ensuring timely payouts.

<br/>

## 🛠️ Tech Stack
- **Blockchain**: Solana
- **Smart Contracts**: Anchor Framework and Rust
- **Testing** : Mocha
- **Payments**: USDT (Solana SPL Token)

<br/>

## 🔗 How It Works
1. **Multisig creation** - Franchisor creates a multisig first which when signed by the franchisee too get executed.
2. **Agreement and vault PDA** - After the execution , it will create two PDA's (Program Derived Address) which will store the agreement data and balance respectively.
3. **Vault PDA** - The vault PDA will be responsible for the transfer of the collected money from the users to the business owners.
4. **Cron JOB** - For timely payment , we will be using cron job which will transfer their share into their wallets 

<br/>

## 🔥 Features
- **Immutable On-Chain Agreements**
- **Automated Payment Distribution**
- **No Manual Signatures Required**
- **Tamper-Proof Financial Records**

<br/>

## 📌 Roadmap
- ✅ MVP Development
- ✅ Smart Contract & PDA Implementation
- ✅ Testing & Audit
- ✅ Frontend and CRON JOB setup.


## 🤝 Contributing
Contributions are welcome! If you’d like to collaborate, please open an issue or submit a pull request.

## 📩 Contact
For any queries or collaborations, feel free to reach out:
- Twitter: [@shibu0x](https://twitter.com/shibu0x)

---

