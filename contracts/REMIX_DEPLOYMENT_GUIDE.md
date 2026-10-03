# BloodChain: Remix IDE & Ethereum Sepolia Deployment Guide

This guide walks you through deploying **`BloodChain_Remix_Flat.sol`** to the **Ethereum Sepolia Testnet** using **Remix IDE** and **MetaMask**.

---

### Step 1: Open Remix IDE
1. Open your browser and navigate to: **[https://remix.ethereum.org](https://remix.ethereum.org)**
2. In the File Explorer sidebar, click the **New File** icon and name it `BloodChain.sol`.

---

### Step 2: Paste the Contract Code
1. Open [`contracts/BloodChain_Remix_Flat.sol`](file:///c:/Users/dutta/.antigravity/BloodChain/contracts/BloodChain_Remix_Flat.sol) in this project.
2. Copy the entire file content and paste it into the new `BloodChain.sol` file inside Remix IDE.
   *(Note: This flattened contract has all OpenZeppelin AccessControl and ReentrancyGuard contracts bundled internally, so no external npm installation is required in Remix!)*

---

### Step 3: Compile the Contract
1. In Remix, click on the **Solidity Compiler** tab on the left navigation bar (icon with `S`).
2. Select Compiler version: **`0.8.20`** (or newer, e.g. `0.8.24` / `0.8.28`).
3. Click the blue **Compile BloodChain.sol** button.
4. You should see a green checkmark indicating successful compilation!

---

### Step 4: Connect MetaMask to Sepolia Testnet
1. Open your **MetaMask** wallet extension.
2. Switch network to **Sepolia** (Test network).
3. Ensure you have Sepolia ETH for gas (free from faucets such as [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) or [Sepolia Faucet](https://sepoliafaucet.com/)).

---

### Step 5: Deploy Contract
1. In Remix, click on the **Deploy & Run Transactions** tab on the left (Ethereum logo with arrow).
2. Under **Environment**, choose:
   `Injected Provider - MetaMask`
3. MetaMask will prompt you to connect. Select your account and approve.
4. Verify that Remix now displays your MetaMask account and current balance.
5. In the **Contract** dropdown, make sure **`BloodChain`** is selected.
6. In the **Deploy** input field next to the orange button (`initialAdmin` address):
   - Leave it blank (it will automatically assign your connected MetaMask address as Admin), or enter your MetaMask wallet address `0x...`.
7. Click the orange **transact** (Deploy) button.
8. MetaMask will pop up requesting transaction confirmation. Click **Confirm**.

---

### Step 6: Record Contract Address
1. Once the transaction confirms on Sepolia, Remix will display the deployed contract under **Deployed Contracts** at the bottom left.
2. Click the **Copy** icon next to the deployed contract name (e.g., `BloodChain at 0x1234...`).
3. Paste your deployed address into `frontend/.env`:
   ```env
   VITE_BLOODCHAIN_CONTRACT_ADDRESS="0xYourDeployedContractAddressHere"
   VITE_SEPOLIA_RPC_URL="https://rpc.sepolia.org"
   ```

---

### Step 7: Interacting with Roles (Quick Setup)
The deploying address is automatically granted:
- `DEFAULT_ADMIN_ROLE`
- `COLLECTION_ROLE`
- `LAB_ROLE`
- `BLOOD_BANK_ROLE`
- `HOSPITAL_ROLE`
- `AUDITOR_ROLE`

To grant roles to additional wallets for your team or demo scenario:
1. In Remix, expand the deployed `BloodChain` contract.
2. Find `grantRole`.
3. Use the role hash getters (e.g. click `LAB_ROLE` to copy its `bytes32` hash).
4. Enter the role hash and target wallet address, then click `transact`.
