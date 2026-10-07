# BloodChain: End-to-End Demonstration Workflow

Welcome to **BloodChain**—a blockchain-based blood supply chain traceability and intelligent inventory system. This guide provides a complete step-by-step walkthrough for first-time users to demonstrate the core features: Role-Based Access Control (RBAC), immutable state transitions, cryptographic integrity verification, and ML-powered anomaly detection.

---

## 🛑 Prerequisites for the Demo

Before clicking any buttons in the UI, ensure your environment is set up:
1. **MetaMask Extension:** Installed in your browser.
2. **Sepolia Testnet:** Your MetaMask must be switched to the `Ethereum Sepolia` network.
3. **Test ETH:** Ensure your wallets have Sepolia ETH to cover gas fees.
4. **Local Servers:** 
   - Start the FastAPI backend: `cd backend && uvicorn main:app --reload`
   - Start the Vite frontend: `cd frontend && npm run dev`

### 🔑 The 5 Key Wallets (RBAC)
The Smart Contract strictly enforces roles. You **must** switch to the correct MetaMask account to execute specific actions, otherwise the blockchain will instantly revert your transaction with an `AccessControlUnauthorizedAccount` error.

* **Account 1 (Admin):** Deployer / Administrator
* **Account 2 (Collection Center):** `0xeFB9718896502eF989cF17c81C2C198B305767e0`
* **Account 3 (Laboratory):** `0x56E3AA2B7e91c09d6c762864AFb62C099691024A`
* **Account 4 (Blood Bank):** `0xfccd469b90A45308A8983118606E37c477e3af6D`
* **Account 5 (Hospital):** `0x2808d69BBcaAd5Dc56161632a8F78d22A73f7dfb`

---

## 🚀 The End-to-End Supply Chain Journey

### Step 1: Collection & Registration (Status: `COLLECTED`)
1. **Wallet:** Switch MetaMask to **Account 2 (Collection Center)**.
2. **Action:** Go to the **Register Unit** tab.
3. Fill out the donor blood bag details (e.g., O+, Whole Blood) and click **Register Unit**.
4. **Behind the scenes:** The frontend generates a Medical Record template, hashes it using SHA-256, and locks this `metadataHash` on the Sepolia blockchain. 
5. Confirm the transaction in MetaMask. A physical QR Passport is generated!

### Step 2: Laboratory Testing (Status: `TESTING` ➡️ `APPROVED`)
1. **Wallet:** Stay on **Account 2**, navigate to the **Blood Passport** (via the search bar or inventory).
2. Click **Submit to Lab**. (Confirm in MetaMask).
3. **Wallet:** Switch MetaMask to **Account 3 (Laboratory)**.
4. Go to the **Lab Queue** tab. You will see the unit pending testing.
5. Click **Approve (Safe)**. (Confirm in MetaMask).
*Note: If you try to approve it from Account 2, the smart contract will reject it because you lack `LAB_ROLE`.*

### Step 3: Blood Bank Cold Storage (Status: `STORED` ➡️ `TRANSFERRED`)
1. **Wallet:** Switch MetaMask to **Account 4 (Blood Bank)**.
2. Search for your unit or find it in the **Cold Inventory** tab.
3. Click **Accept into Cold Storage**. (Confirm in MetaMask). 
4. Once stored, a hospital requests it. Click **Initiate Transfer** to dispatch it in a cold box to the destination. (Confirm in MetaMask).

### Step 4: Hospital Transfusion (Status: `RECEIVED` ➡️ `ISSUED` ➡️ `COMPLETED`)
1. **Wallet:** Switch MetaMask to **Account 5 (Hospital)**.
2. Go to the **Transfer Workflow** tab.
3. Click **Acknowledge Receipt** to take legal custody of the bag. (Confirm in MetaMask).
4. Click **Issue for Patient Transfusion**. The backend internally generates a patient linkage hash. (Confirm in MetaMask).
5. Finally, click **Complete Transfusion** to close the lifecycle. This is a terminal state. (Confirm in MetaMask).

---

## 🔒 Step 5: Cryptographic Document Verification
BloodChain ensures that physical off-chain medical reports have not been tampered with.

1. Go to the **Blood Passport** tab for the unit you just created.
2. Scroll down to the **SHA-256 Document Integrity Verifier**.
3. Click **"Load Authentic Record Template"** to simulate a physical lab printout.
4. Click **Verify Cryptographic Hash**. The system hashes the text and compares it against the immutable hash on Sepolia. It should glow green (MATCH CONFIRMED).
5. **Tamper Test:** Change a single letter in the text box (e.g., change `O+` to `A+`) and click verify again. The system will flash a red Tamper Alert!

---

## 🧠 Step 6: Machine Learning & Analytics

1. **Intelligent Demand Forecasting:**
   * Go to the **Demand Forecast** tab.
   * Toggle between the **7 Days** and **14 Days** segmented buttons to dynamically slice the ML trajectory array (trained via RandomForestRegressor) predicting hospital blood demands.
2. **Anomaly Audit (AI Guardrails):**
   * Go to the **Anomaly Audit** tab.
   * Click **Execute Attack Scenario** on `ANOM-01` (Attempting to use an expired bag) or `ANOM-03` (Unauthorized wallet).
   * Watch the backend ML heuristic engine intercept the invalid state transition before it hits the blockchain, generating a high-risk security audit log!

---
*End of Demonstration Workflow.*
