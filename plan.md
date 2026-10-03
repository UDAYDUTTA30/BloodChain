# BloodChain: Implementation Plan & Project Blueprint
**Blockchain-Based Blood Supply Chain Traceability & Intelligent Inventory Management System**
*Aligned with Product Requirements Document (PRD Version 3.0)*

---

## 1. Executive Summary & Core Concept

**BloodChain** is a decentralized, privacy-preserving blood supply-chain traceability platform. It introduces the **"Blood Unit Passport"**—a verifiable digital identity for each unit of donated blood that tracks its complete lifecycle from collection and laboratory testing through approval, cold storage, inter-facility transfer, hospital receipt, patient issuance, and lifecycle completion.

### The "Blood Unit Passport" Paradigm
Inspired by vehicle-history provenance systems (such as AutoTrust), BloodChain maps physical blood bags to immutable digital passports:

| Provenance Concept | BloodChain Implementation | Purpose |
| :--- | :--- | :--- |
| **Asset Identity** | Blood Unit Bag (`bloodUnitId`) | Globally unique bag identifier with QR code link |
| **Asset Passport** | Blood Unit Passport | Interactive timeline of testing, custody, and status |
| **Registration** | Blood Unit Registration | Donor intake and initial bag metadata creation |
| **Service Record** | Laboratory Analysis Record | Infectious disease screening (HIV, HBV, HCV, Syphilis, Malaria) |
| **Ownership Handshake**| Custody Transfer Protocol | Multi-sig handshake between Blood Bank and Hospital wallets |
| **Authorized Entity** | Role-Bound Wallets | MetaMask wallets with on-chain OpenZeppelin RBAC |
| **Document Hash** | SHA-256 Medical Verification | Off-chain test reports verified against on-chain hash |
| **Anomaly Detection** | State Machine & Rules Engine | Blocks expired/rejected issuance, duplicate transfers, unauthorized calls |

---

## 2. System Architecture & Tech Stack

```
                                  USER INTERFACE
                   React.js + Vite | Tailwind CSS | Lucide React
                        Framer Motion | Recharts | ethers.js
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
          ON-CHAIN LAYER                                OFF-CHAIN LAYER
    (Ethereum Sepolia / Remix)                     (FastAPI / SQLite / PostgreSQL)
  • BloodChain.sol (State Machine)               • Indian Blood Bank Directory
  • OpenZeppelin AccessControl (RBAC)            • Facility & Hospital Master DB
  • SHA-256 Document Reference Hashes            • Donor / Patient Privacy Records
  • Event Logs & Immutable Audit Trail           • Offline Verification Endpoints
                 ▲                                             ▲
                 │                                             │
                 └──────────────────────┬──────────────────────┘
                                        ▼
                            ANALYTICS & ML ENGINE
                         Python | Pandas | Scikit-Learn
  • 7-Day & 14-Day Blood Group Demand Forecasting (Ridge/RandomForest/LightGBM)
  • Real-Time Supply Chain Anomaly Detector (State Violations & Mismatch Detection)
```

### Technology Matrix
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Lucide-React, Recharts, `html5-qrcode` / `qrcode.react`, ethers.js v6.
- **Blockchain / Smart Contract**: Solidity `^0.8.20`, OpenZeppelin Contracts v5, Hardhat / Remix IDE, Ethereum Sepolia Testnet.
- **Backend API & Data**: Python FastAPI, SQLite / PostgreSQL, SQLAlchemy, Pydantic.
- **ML / Data Science**: Python 3.14+, Pandas, NumPy, Scikit-learn (demand forecasting & anomaly scoring).
- **Integrity & Security**: SHA-256 cryptographic hashing, MetaMask wallet-based signatures, strict on-chain state machine guards.

---

## 3. Reference Baselines & Dataset Strategy

BloodChain extends and attributes existing open-source baselines rather than claiming reinvention:

### Reference Repositories (Cloned in `/references`)
1. **`Blockchain-Blood-Bank-Management-System-Project`** (`Projects-Developer`):
   - *Baseline*: Basic blockchain blood bank concept with donation and transfusion records.
   - *BloodChain Upgrade*: Replaces flat records with a full 8-stage state machine, OpenZeppelin RBAC, Sepolia testnet support, and the Blood Unit Passport.
2. **`Blood_Bank_DB_system`** (`ahmed-mo505`):
   - *Baseline*: SQL Server relational schema with donors, donations, bags, hospital supply, and BI reporting views (`bi_reporting_views.sql`).
   - *BloodChain Upgrade*: Adapts the normalized operational schema and analytics queries into our off-chain database and dashboard layer.
3. **`BloodLink-Blood-Bank-Management-System`** (`aniruddhochat`):
   - *Baseline*: Flask/MySQL application using the Kaggle "Blood Bank Directory - India" dataset.
   - *BloodChain Upgrade*: Integrates Indian blood bank locations as the foundational facility registry.
4. **`BloodCenterOS`** (`Sadu-Consultancy-Services`):
   - *Baseline*: Comprehensive Indian blood center PostgreSQL schema with hospital masters, camp organizers, and stock reception.

### Active Datasets (Ready in `/data`)
- **`indian_blood_bank_directory.json / .csv`**: 10 major blood banks across Delhi, Maharashtra, Karnataka, Tamil Nadu, West Bengal, Telangana, etc.
- **`hospitals_directory.json`**: Major Indian healthcare centers (AIIMS, KEM, Manipal, Apollo, SSKM).
- **`historical_demand_data.csv`**: 180 days of daily request, supply, and wastage records across 8 blood groups ($A^+, A^-, B^+, B^-, AB^+, AB^-, O^+, O^-$) for ML model training.
- **`synthetic_blood_units.json`**: 50 pre-seeded blood bags with Unit IDs, collection/expiry dates, test reports, and SHA-256 metadata hashes.
- **`anomaly_test_scenarios.json`**: Ground-truth malicious/invalid transaction test vectors.

---

## 4. Smart Contract & State Machine Specification

### Roles (OpenZeppelin AccessControl)
- `DEFAULT_ADMIN_ROLE`: Organization onboarding, role assignment, system pause.
- `COLLECTION_ROLE`: Collection centers registering newly donated blood bags.
- `LAB_ROLE`: Certified laboratory analysts testing bags and approving/rejecting.
- `BLOOD_BANK_ROLE`: Blood bank administrators managing inventory and custody dispatch.
- `HOSPITAL_ROLE`: Hospital blood banks receiving transfers, issuing to patients, and completing lifecycle.
- `AUDITOR_ROLE`: Read-only access to verify all event histories and flags.

### State Transitions
```
[CREATED] ──(register)──► [COLLECTED] ──(submitForTesting)──► [TESTING]
                                                                  │
                                            ┌─────────────────────┴─────────────────────┐
                                            ▼                                           ▼
                                       [APPROVED]                                  [REJECTED]
                                            │                                     (Terminal)
                                            ▼ (storeBloodUnit)
                                        [STORED] ────────────(checkExpiry)──────► [EXPIRED]
                                            │                                     (Terminal)
                                            ▼ (initiateTransfer)
                                      [TRANSFERRED]
                                            │ (confirmReceipt)
                                            ▼
                                        [RECEIVED]
                                            │ (issueBloodUnit)
                                            ▼
                                         [ISSUED]
                                            │ (completeBloodUnit)
                                            ▼
                                       [COMPLETED]
                                       (Terminal)
```

### Critical Security Guards
- **Expired Issuance Blocked**: Smart contract checks `block.timestamp <= expiryTimestamp` before any transfer or issuance.
- **Rejected Issuance Blocked**: Any unit in `REJECTED` status reverts on all downstream calls.
- **No Duplicate Handshake**: In-transit transfer requires explicit receiver confirmation before custody updates.
- **Completed Unit Lock**: Terminal status units (`COMPLETED`, `EXPIRED`, `REJECTED`) cannot re-enter transit.

---

## 5. Application Screens (Section 24)

1. **Landing & Wallet Connect**: Welcome portal, network switcher (Ethereum Sepolia / Localhost), wallet status badge.
2. **Role-Based Command Dashboard**: Dynamic views customized by active MetaMask role.
3. **Blood Unit Registration**: Intake form for collection centers; auto-generates Bag ID, dates, and QR code.
4. **Laboratory Testing Queue**: Test results entry (HIV, HCV, HBV, Syphilis, Malaria); 1-click Approve/Reject with on-chain proof.
5. **Blood Bank Inventory**: Cold-storage stock by blood group and component, with color-coded shelf-life indicators.
6. **Transfer & Custody Dispatch**: Dispatch workflow with sender signature, transit tracking, and recipient confirmation.
7. **Hospital Receipt & Issuance**: Hospital intake confirmation and patient administration.
8. **Blood Unit Passport**: Central interactive view showing the complete timeline of transactions, custody handoffs, and verification badges.
9. **QR Code Scanner**: Live camera / image upload scanner to instantly pull up any unit's passport.
10. **Document SHA-256 Verifier**: Upload test report PDF/image and compare calculated hash against the on-chain hash.
11. **Analytics Dashboard**: Real-time charts on group availability, collection trends, and wastage metrics.
12. **ML Demand Forecast View**: 7-day and 14-day blood-group demand forecasts with confidence bands ($R^2$, MAE, RMSE).
13. **Anomaly & Audit Log**: Security event feed displaying flagged attempts and rule violations.
14. **Admin Role & Facility Management**: Admin screen to authorize wallet addresses and link them to Indian blood banks/hospitals.

---

## 6. Implementation Schedule & Checklist

- [x] **Step 1: Reference Repositories & Datasets**
  - [x] Clone reference repositories (`Blockchain-Blood-Bank-Management-System-Project`, `Blood_Bank_DB_system`, `BloodLink`, `BloodCenterOS`, `Power_BI`).
  - [x] Normalize Indian Blood Bank Directory (`indian_blood_bank_directory.json / .csv`).
  - [x] Generate 180-day historical demand dataset (`historical_demand_data.csv`).
  - [x] Generate synthetic blood bag seed dataset (`synthetic_blood_units.json`).
  - [x] Generate anomaly test scenarios (`anomaly_test_scenarios.json`).
- [ ] **Step 2: Smart Contract Development (`BloodChain.sol`)**
  - [ ] Write Solidity contract with full state machine, OpenZeppelin RBAC, and events.
  - [ ] Write automated tests verifying all 8 states, expiry checks, and role restrictions.
  - [ ] Export ABI and Remix-ready single-file contract for Sepolia deployment.
- [ ] **Step 3: Machine Learning Engine (`/ml`)**
  - [ ] Train demand forecasting model (7-day / 14-day blood group predictions).
  - [ ] Implement anomaly detection script (detecting expired/tampered/invalid patterns).
- [ ] **Step 4: Backend API & Off-Chain Service (`/backend`)**
  - [ ] FastAPI REST endpoints for units, hospitals, blood banks, and document hashing.
  - [ ] Expose ML forecast endpoints and verification endpoints.
- [ ] **Step 5: Frontend Application (`/frontend`)**
  - [ ] Scaffold React + Vite with Tailwind CSS and Framer Motion.
  - [ ] Integrate ethers.js and MetaMask wallet connector with role detection.
  - [ ] Build all 14 screens, featuring the **Blood Unit Passport** and **QR Scanner**.
- [ ] **Step 6: End-to-End Testing & Demonstration Script**
  - [ ] Run full 15-step demonstration scenario from registration to hospital completion.
