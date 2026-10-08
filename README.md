# BloodChain 🩸
**Blockchain-Based Blood Supply Chain Traceability & Intelligent Inventory Management System**

---

## 🌟 Overview & "Blood Unit Passport"

**BloodChain** addresses fragmentation, counterfeit risks, and shelf-life wastage in blood supply networks by attaching an immutable digital identity—the **Blood Unit Passport**—to every physical blood bag. 

Each blood bag moves through an on-chain verifiable state machine deployed on **Ethereum Sepolia**, backed by **OpenZeppelin Role-Based Access Control (RBAC)**, native **MetaMask** authorization, off-chain **SHA-256** medical document integrity proofs, and **Machine Learning** decision support for demand forecasting.

---

## 🏗️ Architecture & Stack

```
                              React.js + Vite (Tailwind CSS, Lucide, Recharts)
                                                      │
                            ┌─────────────────────────┴────────────────────────┐
                            ▼                                                  ▼
                 Ethereum Sepolia Testnet                            FastAPI REST API
           (Solidity ^0.8.20 + OpenZeppelin)                 (SQLite/PostgreSQL + Python 3.14)
           - BloodUnit State Machine & RBAC                  - Indian Blood Bank Directory Data
           - Cryptographic Metadata Hashes                   - Off-Chain Patient Privacy Records
           - Immutable Event Audit Trail                     - SHA-256 Document Verification Tool
                            ▲                                                  ▲
                            │                                                  │
                            └─────────────────────────┬────────────────────────┘
                                                      ▼
                                           Machine Learning Module
                                        (Pandas + Scikit-Learn RF)
                                     - 7-Day & 14-Day Demand Forecast
                                     - Lifecycle Anomaly Detector
```

---

## 🚀 Quick Start Guide

### 1. Launch Backend API
```powershell
# Double-click start_backend.bat or run:
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Launch React Frontend
```powershell
# Double-click start_frontend.bat or run:
cd frontend
npm.cmd run dev
```
Web Application will be accessible at: [http://localhost:5173](http://localhost:5173)

### 3. Deploy Smart Contract to Ethereum Sepolia via Remix
1. Open **[Remix IDE](https://remix.ethereum.org)**.
2. Open [`contracts/BloodChain_Remix_Flat.sol`](contracts/BloodChain_Remix_Flat.sol).
3. Compile with Solidity `0.8.20` or higher.
4. Under Environment, select **Injected Provider - MetaMask** and switch your MetaMask network to **Sepolia**.
5. Deploy `BloodChain` and copy the contract address.
6. Detailed walkthrough: [`contracts/REMIX_DEPLOYMENT_GUIDE.md`](contracts/REMIX_DEPLOYMENT_GUIDE.md).

---

## 🧪 Automated End-to-End Demo Scenario

Run the automated 15-step demonstration scenario from PRD v3.0 Section 25:
```powershell
python demo/test_end_to_end_scenario.py
```
This tests and outputs:
1. Ingesting Indian blood bank directory information
2. Registering donation and minting Blood Unit Passport
3. Generating physical bag QR code
4. Laboratory infectious screening and approval
5. Cold-chain storage in blood bank inventory
6. Inter-facility dispatch in transit to hospital
7. Destination hospital receipt and custody verification
8. Cryptographic SHA-256 document tamper detection
9. Crossmatch and issuance for patient transfusion
10. Lifecycle completion
11. Querying 7/14-day ML demand predictions ($R^2 = 0.75$)
12. Security interception of illegal re-transfer attempts (HTTP 403 Forbidden)

---

## 🎯 Viva & Defense Pitch (PRD Section 30)

> *"BloodChain creates a blockchain-backed digital passport for every blood unit. Using Solidity, Ethereum Sepolia, MetaMask, Remix, and ethers.js, authorized collection centers, laboratories, blood banks, and hospitals record and verify each lifecycle step. Sensitive documents remain off-chain while SHA-256 hashes provide integrity verification. QR-based passports, inventory analytics, expiry monitoring, demand forecasting, and anomaly detection extend the system beyond basic blockchain tracking."*
