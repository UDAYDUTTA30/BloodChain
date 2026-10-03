import csv
import json
import random
import hashlib
from datetime import datetime, timedelta

random.seed(42)

# ==========================================
# 1. INDIAN BLOOD BANK DIRECTORY
# Based on National Health Portal / Kaggle schema
# ==========================================
indian_blood_banks = [
    {
        "bank_id": "BB-IND-DEL-001",
        "name": "AIIMS Main Blood Bank",
        "state": "Delhi",
        "district": "New Delhi",
        "city": "New Delhi",
        "address": "Ansari Nagar East, Ring Road",
        "pincode": "110029",
        "contact": "011-26588500",
        "email": "bloodbank@aiims.edu",
        "category": "Government",
        "component_facility": "Yes",
        "apheresis_facility": "Yes",
        "service_time": "24/7",
        "wallet_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    },
    {
        "bank_id": "BB-IND-DEL-002",
        "name": "Indian Red Cross Society National HQ Blood Bank",
        "state": "Delhi",
        "district": "Central Delhi",
        "city": "New Delhi",
        "address": "1, Red Cross Road",
        "pincode": "110001",
        "contact": "011-23716441",
        "email": "bloodbank@indianredcross.org",
        "category": "Red Cross",
        "component_facility": "Yes",
        "apheresis_facility": "Yes",
        "service_time": "24/7",
        "wallet_address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    },
    {
        "bank_id": "BB-IND-MAH-003",
        "name": "KEM Hospital Blood Bank",
        "state": "Maharashtra",
        "district": "Mumbai",
        "city": "Mumbai",
        "address": "Acharya Donde Marg, Parel",
        "pincode": "400012",
        "contact": "022-24107000",
        "email": "bloodbank@kem.edu",
        "category": "Government",
        "component_facility": "Yes",
        "apheresis_facility": "Yes",
        "service_time": "24/7",
        "wallet_address": "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
    },
    {
        "bank_id": "BB-IND-MAH-004",
        "name": "Tata Memorial Hospital Blood Bank",
        "state": "Maharashtra",
        "district": "Mumbai",
        "city": "Mumbai",
        "address": "Dr. E Borges Road, Parel",
        "pincode": "400012",
        "contact": "022-24177000",
        "email": "bloodbank@tmc.gov.in",
        "category": "Charitable Trust",
        "component_facility": "Yes",
        "apheresis_facility": "Yes",
        "service_time": "24/7",
        "wallet_address": "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
    },
    {
        "bank_id": "BB-IND-KAR-005",
        "name": "Victoria Hospital Blood Bank (BMCRI)",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "city": "Bengaluru",
        "address": "Fort Road, near City Market",
        "pincode": "560002",
        "contact": "080-26701150",
        "email": "bloodbank@bmcri.edu.in",
        "category": "Government",
        "component_facility": "Yes",
        "apheresis_facility": "Yes",
        "service_time": "24/7",
        "wallet_address": "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"
    },
    {
        "bank_id": "BB-IND-KAR-006",
        "name": "Rashtrotthana Blood Centre",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "city": "Bengaluru",
        "address": "Kempegowda Nagar, Gavipuram Guttahalli",
        "pincode": "560019",
        "contact": "080-26612730",
        "email": "bloodcentre@rashtrotthana.org",
        "category": "Charitable Trust",
        "component_facility": "Yes",
        "apheresis_facility": "Yes",
        "service_time": "24/7",
        "wallet_address": "0x976EA74026E726554dB657fA54763abd0C3a0aa9"
    },
    {
        "bank_id": "BB-IND-TN-007",
        "name": "Rajiv Gandhi Government General Hospital Blood Bank",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "city": "Chennai",
        "address": "EVR Periyar Salai, Park Town",
        "pincode": "600003",
        "contact": "044-25305000",
        "email": "bloodbank@rgggh.gov.in",
        "category": "Government",
        "component_facility": "Yes",
        "apheresis_facility": "Yes",
        "service_time": "24/7",
        "wallet_address": "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"
    },
    {
        "bank_id": "BB-IND-WB-008",
        "name": "Calcutta Medical College & Hospital Blood Bank",
        "state": "West Bengal",
        "district": "Kolkata",
        "city": "Kolkata",
        "address": "88, College Street",
        "pincode": "700073",
        "contact": "033-22551620",
        "email": "bloodbank@medicalcollegekolkata.in",
        "category": "Government",
        "component_facility": "Yes",
        "apheresis_facility": "Yes",
        "service_time": "24/7",
        "wallet_address": "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f"
    },
    {
        "bank_id": "BB-IND-TG-009",
        "name": "Osmania General Hospital Blood Bank",
        "state": "Telangana",
        "district": "Hyderabad",
        "city": "Hyderabad",
        "address": "Afzal Gunj",
        "pincode": "500012",
        "contact": "040-24600121",
        "email": "bloodbank@osmania.gov.in",
        "category": "Government",
        "component_facility": "Yes",
        "apheresis_facility": "Yes",
        "service_time": "24/7",
        "wallet_address": "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"
    },
    {
        "bank_id": "BB-IND-UP-010",
        "name": "KGMU Blood Bank (Transfusion Medicine)",
        "state": "Uttar Pradesh",
        "district": "Lucknow",
        "city": "Lucknow",
        "address": "Shah Mina Road, Chowk",
        "pincode": "226003",
        "contact": "0522-2257540",
        "email": "bloodbank@kgmcindia.edu",
        "category": "Government",
        "component_facility": "Yes",
        "apheresis_facility": "Yes",
        "service_time": "24/7",
        "wallet_address": "0xBcd4042DE499D14e55001CcbB24a551F3b954096"
    }
]

# Write Indian Blood Banks to JSON and CSV
with open("indian_blood_bank_directory.json", "w", encoding="utf-8") as f:
    json.dump(indian_blood_banks, f, indent=2)

with open("indian_blood_bank_directory.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(indian_blood_banks[0].keys()))
    writer.writeheader()
    writer.writerows(indian_blood_banks)

# ==========================================
# 2. ASSOCIATED HOSPITALS DIRECTORY
# ==========================================
hospitals = [
    {
        "hospital_id": "HOSP-DEL-01",
        "name": "Safdarjung Hospital",
        "city": "New Delhi",
        "state": "Delhi",
        "contact": "011-26165060",
        "wallet_address": "0x71bE63f3384f5fb98995898A86B02Fb2426c5788"
    },
    {
        "hospital_id": "HOSP-MAH-02",
        "name": "Lilavati Hospital & Research Centre",
        "city": "Mumbai",
        "state": "Maharashtra",
        "contact": "022-26751000",
        "wallet_address": "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a"
    },
    {
        "hospital_id": "HOSP-KAR-03",
        "name": "Manipal Hospital Old Airport Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "contact": "080-25024444",
        "wallet_address": "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec"
    },
    {
        "hospital_id": "HOSP-TN-04",
        "name": "Apollo Hospitals Greams Road",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "contact": "044-28290200",
        "wallet_address": "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097"
    },
    {
        "hospital_id": "HOSP-WB-05",
        "name": "SSKM Hospital & IPGMER",
        "city": "Kolkata",
        "state": "West Bengal",
        "contact": "033-22231589",
        "wallet_address": "0xcd3B766CCDd6AE721141F452C550Ca635964ce71"
    }
]

with open("hospitals_directory.json", "w", encoding="utf-8") as f:
    json.dump(hospitals, f, indent=2)

# ==========================================
# 3. HISTORICAL DEMAND DATASET (180 DAYS)
# For ML Demand Forecasting
# ==========================================
blood_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
components = ["Whole Blood", "PRBC", "FFP", "Platelets"]

start_date = datetime(2026, 4, 1)
demand_rows = []

# Base demand weights by blood group (O+ and B+ most common in India)
group_weights = {
    "O+": 0.35, "B+": 0.30, "A+": 0.20, "AB+": 0.08,
    "O-": 0.03, "B-": 0.02, "A-": 0.015, "AB-": 0.005
}

for day_idx in range(180):
    curr_date = start_date + timedelta(days=day_idx)
    date_str = curr_date.strftime("%Y-%m-%d")
    weekday = curr_date.weekday() # 0 = Monday, 6 = Sunday
    is_weekend = 1 if weekday >= 5 else 0

    for hosp in hospitals:
        for bg in blood_groups:
            # Baseline request volume depends on hospital scale and blood group weight
            base_vol = int(random.uniform(5, 25) * group_weights[bg] * 10)
            if is_weekend:
                base_vol = int(base_vol * 1.3) # More emergencies on weekends

            # Occasional emergency spike
            is_emergency = 1 if random.random() < 0.08 else 0
            if is_emergency:
                base_vol += random.randint(5, 15)

            requested = max(1, base_vol + random.randint(-2, 3))
            fulfillment_rate = random.uniform(0.85, 1.0)
            supplied = min(requested, int(requested * fulfillment_rate))
            wasted = random.choices([0, 1, 2], weights=[0.85, 0.12, 0.03])[0]

            demand_rows.append({
                "date": date_str,
                "hospital_id": hosp["hospital_id"],
                "hospital_name": hosp["name"],
                "blood_group": bg,
                "component": "PRBC",
                "weekday": weekday,
                "is_weekend": is_weekend,
                "is_emergency": is_emergency,
                "requested_units": requested,
                "supplied_units": supplied,
                "wasted_units": wasted
            })

with open("historical_demand_data.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(demand_rows[0].keys()))
    writer.writeheader()
    writer.writerows(demand_rows)

# ==========================================
# 4. SYNTHETIC BLOOD UNITS & PASSPORT SEED
# ==========================================
synthetic_units = []
statuses = ["STORED", "IN_TRANSIT", "RECEIVED", "ISSUED", "COMPLETED", "EXPIRED", "REJECTED"]

for i in range(1, 51):
    unit_id = f"BB-2026-{1000 + i}"
    bg = random.choice(blood_groups)
    comp = random.choice(components)
    bank = random.choice(indian_blood_banks)
    hosp = random.choice(hospitals)
    
    col_days_ago = random.randint(1, 45)
    col_date = datetime(2026, 10, 4) - timedelta(days=col_days_ago)
    
    # 42 days expiry for RBC, 5 days for platelets
    shelf_days = 5 if comp == "Platelets" else 42
    exp_date = col_date + timedelta(days=shelf_days)
    is_expired = datetime(2026, 10, 4) > exp_date

    if is_expired:
        status = "EXPIRED"
    else:
        status = random.choice(["STORED", "IN_TRANSIT", "RECEIVED", "ISSUED", "COMPLETED"])

    # Document & test payload hash
    meta_payload = f"{unit_id}|{bg}|{comp}|{col_date.isoformat()}|{bank['bank_id']}"
    meta_hash = "0x" + hashlib.sha256(meta_payload.encode()).hexdigest()

    synthetic_units.append({
        "blood_unit_id": unit_id,
        "donation_id": f"DON-2026-{5000 + i}",
        "blood_group": bg,
        "component_type": comp,
        "collection_timestamp": int(col_date.timestamp()),
        "collection_date_str": col_date.strftime("%Y-%m-%d"),
        "expiry_timestamp": int(exp_date.timestamp()),
        "expiry_date_str": exp_date.strftime("%Y-%m-%d"),
        "current_status": status,
        "current_facility": bank["name"] if status in ["STORED", "EXPIRED"] else hosp["name"],
        "current_owner_wallet": bank["wallet_address"] if status in ["STORED", "EXPIRED"] else hosp["wallet_address"],
        "metadata_hash": meta_hash,
        "lab_test": {
            "test_id": f"LAB-{9000 + i}",
            "tested_by": "Dr. Amira Hassan",
            "hiv_result": "Negative",
            "hcv_result": "Negative",
            "hbv_result": "Negative",
            "syphilis_result": "Negative",
            "malaria_result": "Negative",
            "is_safe": True if status != "REJECTED" else False
        },
        "blockchain_tx": {
            "registered_tx": f"0x{hashlib.sha256(f'reg_{unit_id}'.encode()).hexdigest()[:64]}",
            "tested_tx": f"0x{hashlib.sha256(f'test_{unit_id}'.encode()).hexdigest()[:64]}",
            "latest_tx": f"0x{hashlib.sha256(f'latest_{unit_id}'.encode()).hexdigest()[:64]}"
        }
    })

with open("synthetic_blood_units.json", "w", encoding="utf-8") as f:
    json.dump(synthetic_units, f, indent=2)

# ==========================================
# 5. ANOMALY DETECTION TEST PATTERNS
# ==========================================
anomalies = [
    {
        "case_id": "ANOM-01",
        "description": "Attempt to issue an expired blood unit",
        "unit_id": "BB-2026-1004",
        "attempted_action": "issueBloodUnit",
        "rule_violated": "Unit expiryTimestamp < currentBlockTimestamp",
        "expected_result": "REVERT: Unit has expired"
    },
    {
        "case_id": "ANOM-02",
        "description": "Attempt to transfer already completed unit",
        "unit_id": "BB-2026-1012",
        "attempted_action": "initiateTransfer",
        "rule_violated": "Invalid state transition: COMPLETED -> IN_TRANSIT",
        "expected_result": "REVERT: State machine violation"
    },
    {
        "case_id": "ANOM-03",
        "description": "Unauthorized wallet attempting laboratory approval",
        "unit_id": "BB-2026-1025",
        "attempted_action": "approveBloodUnit",
        "rule_violated": "Caller does not possess LAB_ROLE",
        "expected_result": "REVERT: AccessControlUnauthorizedAccount"
    },
    {
        "case_id": "ANOM-04",
        "description": "Document SHA-256 integrity mismatch",
        "unit_id": "BB-2026-1033",
        "attempted_action": "verifyDocumentHash",
        "rule_violated": "Calculated SHA-256 hash does not match on-chain metadataHash",
        "expected_result": "FLAGGED: Cryptographic integrity failure / document tampered"
    }
]

with open("anomaly_test_scenarios.json", "w", encoding="utf-8") as f:
    json.dump(anomalies, f, indent=2)

print("Datasets generated successfully in C:\\Users\\dutta\\.antigravity\\BloodChain\\data!")
