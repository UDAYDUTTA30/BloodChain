# BloodChain
**Blockchain-Based Blood Supply Chain Traceability & Intelligent Inventory Management System**

---

## Why is this project useful?
Blood supply chains worldwide suffer from data fragmentation, counterfeit risks, poor shelf-life tracking, and unexpected critical supply shortages. **BloodChain** solves this by attaching an immutable digital identity—the **Blood Unit Passport**—to every physical blood bag. 

* **End-to-End Traceability:** Prevents counterfeit blood by cryptographically logging every lifecycle step (Collection ➡️ Lab ➡️ Blood Bank ➡️ Hospital ➡️ Transfusion) on the Ethereum blockchain.
* **Safety & Compliance:** Strict Smart Contract Role-Based Access Control (RBAC) ensures only authorized laboratories can approve blood, and guarantees that hospitals cannot transfuse expired or contaminated bags.
* **Cryptographic Data Integrity:** Sensitive medical reports are secured off-chain, while their immutable **SHA-256 hashes** are locked on-chain. This provides zero-knowledge tamper detection without exposing private patient data on the public ledger.
* **Predictive AI:** Uses machine learning to forecast future blood demand so national blood banks can proactively prepare for shortages before they happen.

---

## Architecture & Stack

```text
                              React.js + Vite (Tailwind CSS, Lucide, Recharts)
                                                      │
                            ┌─────────────────────────┴─────────────────────────┐
                            ▼                                                   ▼
                 Ethereum Sepolia Testnet                            FastAPI REST API
           (Solidity ^0.8.20 + OpenZeppelin)                 (SQLite/PostgreSQL + Python)
           - BloodUnit State Machine & RBAC                  - Real-time UI Database Sync
           - Cryptographic Metadata Hashes                   - Off-Chain Patient Privacy Records
           - Immutable Event Audit Trail                     - SHA-256 Document Verification
                            ▲                                                   ▲
                            │                                                   │
                            └─────────────────────────┬─────────────────────────┘
                                                      ▼
                                           Machine Learning Module
                                        (Pandas + Scikit-Learn RF)
                                     - 7-Day & 14-Day Demand Forecast
                                     - Lifecycle Anomaly Detector
```

---

## Page Components & Core Features

* **Blood Passport:** The core digital identity view for any blood bag. It displays the provenance timeline, generates a physical scannable **QR Code**, and houses the **SHA-256 Document Integrity Verifier** to detect tampered medical reports.
* **Register Unit:** Secure entry point for *Collection Centers* to mint new blood units onto the blockchain and generate the original metadata hash.
* **Lab Queue:** Interface for *Laboratory Technicians* to verify blood safety, approving healthy bags or permanently rejecting contaminated ones.
* **Cold Inventory:** Dashboard for *Blood Banks* to track stored units, monitor expiry timelines, and dispatch blood to requesting hospitals.
* **Transfer Workflow:** Interface for *Hospitals* to cryptographically acknowledge receipt of dispatched blood, issue it to patients, and mark the transfusion as complete.
* **Analytics:** Real-time data visualization showing total units collected, safe vs. contaminated ratios, and inventory distribution by blood type.
* **Demand Forecast:** A machine learning predictive dashboard forecasting blood shortages for the next 7 and 14 days based on historical trends.
* **Anomaly Audit:** An interactive security testbed allowing users (and oversight auditors) to simulate malicious attacks (like spoofing roles or issuing expired bags) and watch the backend ML heuristic guardrails actively block them.

---

## Datasets Utilized

BloodChain relies on three distinct datasets (currently synthetic for the MVP) to drive its UI components, Machine Learning pipelines, and Security Guardrails:

1. **Historical Blood Demand Dataset (ML Training Data):** 
   * **Where it's used:** Backend Python ML Pipeline (`train_demand_forecast.py`).
   * **What it's for:** Represents **180 days of historical multi-hospital request patterns**. It factors in variables like blood groups (A+, O-, etc.), component types, seasonality, and emergency request surges. It is used to train the Random Forest Regressor to predict future 7-day and 14-day supply shortages on the *Demand Forecast* tab.
2. **Indian Blood Bank Directory Database:**
   * **Where it's used:** Frontend *Indian Directory* Tab & Backend geographic lookups.
   * **What it's for:** A geospatial JSON registry containing verified government and private blood banks across Indian states. It allows hospitals to query nearby certified collection centers and verify the legitimacy of a facility during the Blood Passport registration phase.
3. **Lifecycle Anomaly & Inventory Seed Data:**
   * **Where it's used:** Backend API data store (`synthetic_blood_units.json`).
   * **What it's for:** Pre-populates the database with hundreds of blood units across various lifecycle states (e.g., *Collected, Stored, Expired, Transfused*). This powers the real-time charts on the *Analytics* tab and serves as the primary test-bed for the *Anomaly Audit* tab to simulate malicious attacks.

---

## Machine Learning & Forecasting

BloodChain utilizes a **Random Forest Regressor** to predict future blood requirements based on the Historical Blood Demand Dataset mentioned above.

### Formulas & Evaluation Metrics
* **Random Forest Regressor:** An ensemble learning method that constructs multiple decision trees during training and outputs the mean prediction, preventing overfitting on highly volatile blood demand data.
* **R-Squared Score (Coefficient of Determination):** Measures how well the variance in daily blood demand is predicted by the model (e.g., R² = 0.7539).
* **Mean Absolute Error (MAE):** The average absolute difference between predicted and actual units needed. Formula: `(1/n) * SUM(|y - ŷ|)`
* **Root Mean Squared Error (RMSE):** The square root of the average of squared differences. Heavily penalizes large, dangerous forecasting errors (e.g., predicting 10 units when 100 are needed). Formula: `SQRT( (1/n) * SUM((y - ŷ)^2) )`
* **Daily Average Requirement:** Calculated by smoothing the output arrays to give hospital administrators an actionable baseline metric.

---

## Quick Start Guide

### 1. Launch Backend API
```powershell
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Launch React Frontend
```powershell
cd frontend
npm.cmd run dev
```
Web Application will be accessible at: [http://localhost:5173](http://localhost:5173)

### 3. Smart Contract Deployment (Optional)
The smart contract is natively deployed on the **Sepolia Testnet**. 
If deploying a fresh instance:
1. Open **[Remix IDE](https://remix.ethereum.org)**.
2. Open `contracts/BloodChain.sol`.
3. Compile with Solidity `^0.8.20`.
4. Deploy using **Injected Provider - MetaMask** and update `contractConfig.js` with the new address.
