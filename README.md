# BloodChain
**Blockchain-Based Blood Supply Chain Traceability & Intelligent Inventory Management System**

---

## 🩸 Why is this project useful?
Blood supply chains worldwide suffer from data fragmentation, counterfeit risks, poor shelf-life tracking, and unexpected critical supply shortages. **BloodChain** solves this by attaching an immutable digital identity—the **Blood Unit Passport**—to every physical blood bag. 

* **End-to-End Traceability:** Prevents counterfeit blood by cryptographically logging every lifecycle step (Collection ➡️ Lab ➡️ Blood Bank ➡️ Hospital ➡️ Transfusion) on the Ethereum blockchain.
* **Safety & Compliance:** Strict Smart Contract Role-Based Access Control (RBAC) ensures only authorized laboratories can approve blood, and guarantees that hospitals cannot transfuse expired or contaminated bags.
* **Cryptographic Data Integrity:** Sensitive medical reports are secured off-chain, while their immutable **SHA-256 hashes** are locked on-chain. This provides zero-knowledge tamper detection without exposing private patient data on the public ledger.
* **Predictive AI:** Uses machine learning to forecast future blood demand so national blood banks can proactively prepare for shortages before they happen.

---

## 🏗️ Architecture & Stack

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

## 🖥️ Page Components & Core Features

* **Blood Passport:** The core digital identity view for any blood bag. It displays the provenance timeline, generates a physical scannable **QR Code**, and houses the **SHA-256 Document Integrity Verifier** to detect tampered medical reports.
* **Register Unit:** Secure entry point for *Collection Centers* to mint new blood units onto the blockchain and generate the original metadata hash.
* **Lab Queue:** Interface for *Laboratory Technicians* to verify blood safety, approving healthy bags or permanently rejecting contaminated ones.
* **Cold Inventory:** Dashboard for *Blood Banks* to track stored units, monitor expiry timelines, and dispatch blood to requesting hospitals.
* **Transfer Workflow:** Interface for *Hospitals* to cryptographically acknowledge receipt of dispatched blood, issue it to patients, and mark the transfusion as complete.
* **Analytics:** Real-time data visualization showing total units collected, safe vs. contaminated ratios, and inventory distribution by blood type.
* **Demand Forecast:** A machine learning predictive dashboard forecasting blood shortages for the next 7 and 14 days based on historical trends.
* **Anomaly Audit:** An interactive security testbed allowing users (and oversight auditors) to simulate malicious attacks (like spoofing roles or issuing expired bags) and watch the backend ML heuristic guardrails actively block them.

---

## 🧠 Machine Learning & Forecasting

BloodChain utilizes a **Random Forest Regressor** to predict future blood requirements based on historical request patterns.

### Dataset
The model is trained on a robust synthetic dataset representing **180 days of historical multi-hospital request patterns**. It heavily factors in dynamic real-world variables including specific blood groups, component types (Whole Blood, PRBC, Platelets), seasonality, and emergency request surges.

### Formulas & Evaluation Metrics
* **Random Forest Regressor:** An ensemble learning method that constructs multiple decision trees during training and outputs the mean prediction, preventing overfitting on highly volatile blood demand data.
* **R² Score (Coefficient of Determination):** Measures how well the variance in daily blood demand is predicted by the model (e.g., $R^2 = 0.7539$).
* **Mean Absolute Error (MAE):** The average absolute difference between predicted and actual units needed ($\frac{1}{n} \sum |y_i - \hat{y}_i|$).
* **Root Mean Squared Error (RMSE):** The square root of the average of squared differences ($\sqrt{\frac{1}{n} \sum (y_i - \hat{y}_i)^2}$), which heavily penalizes large, dangerous forecasting errors (e.g., predicting 10 units when 100 are needed).
* **Daily Average Requirement:** Calculated by smoothing the output arrays to give hospital administrators an actionable baseline metric.

---

## 🚀 Quick Start Guide

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
