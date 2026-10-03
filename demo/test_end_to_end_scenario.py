import sys
import os
import json
import time

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))
from main import app
from fastapi.testclient import TestClient

def run_end_to_end_demo():
    print("==================================================================")
    print("      BLOODCHAIN: END-TO-END SCENARIO VERIFICATION (PRD v3.0)     ")
    print("==================================================================\n")

    client = TestClient(app)

    # Step 1: Load Indian blood-bank reference information
    print("[Step 1] Loading Indian accredited blood-bank directory...")
    res = client.get("/api/blood-banks")
    assert res.status_code == 200
    banks = res.json()
    print(f"  -> Successfully loaded {len(banks)} Indian blood centers.")
    print(f"  -> Reference facility: {banks[0]['name']} ({banks[0]['city']}, {banks[0]['state']})")

    # Step 2: Register a new donor blood bag
    unit_id = f"BB-2026-DEMO-{int(time.time())}"
    print(f"\n[Step 2] Registering new blood unit at Collection Center...")
    reg_payload = {
        "blood_unit_id": unit_id,
        "donation_id": f"DON-2026-{int(time.time())}",
        "blood_group": "O+",
        "component_type": "PRBC",
        "collection_date": "2026-10-04",
        "shelf_life_days": 42,
        "facility_name": banks[0]["name"],
        "facility_wallet": banks[0]["wallet_address"],
        "donor_notes": "Voluntary donor, screened healthy"
    }
    res = client.post("/api/units/register", json=reg_payload)
    assert res.status_code == 200, res.text
    unit = res.json()["blood_unit"]
    print(f"  -> Registered Unit ID: {unit['blood_unit_id']}")
    print(f"  -> Initial Status: {unit['current_status']}")
    print(f"  -> On-Chain Metadata Hash: {unit['metadata_hash']}")
    print(f"  -> Minted Tx Hash: {unit['blockchain_tx']['registered_tx']}")

    # Step 3: Verify Digital Passport & QR Link
    print(f"\n[Step 3] Retrieving Blood Unit Passport & QR link...")
    res = client.get(f"/api/units/{unit_id}")
    assert res.status_code == 200
    passport = res.json()
    print(f"  -> QR Verification URL: {passport['qr_verification_url']}")
    print(f"  -> Shelf life remaining: {passport['days_until_expiry']} days")

    # Step 4: Submit unit to Laboratory testing
    print(f"\n[Step 4] Submitting unit for serological testing...")
    res = client.post(f"/api/units/{unit_id}/action", json={
        "action": "submitForTesting",
        "caller_role": "COLLECTION_ROLE",
        "caller_wallet": banks[0]["wallet_address"],
        "remarks": "Transported to certified laboratory"
    })
    assert res.status_code == 200
    print(f"  -> Transition confirmed: {res.json()['new_status']}")

    # Step 5: Laboratory tests pass & approves unit
    print(f"\n[Step 5] Laboratory verifies all 5 pathogen tests and approves unit...")
    res = client.post(f"/api/units/{unit_id}/action", json={
        "action": "approveBloodUnit",
        "caller_role": "LAB_ROLE",
        "caller_wallet": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "remarks": "HIV, HBV, HCV, Syphilis, Malaria non-reactive"
    })
    assert res.status_code == 200
    print(f"  -> Unit Status: {res.json()['new_status']}")
    print(f"  -> Lab Test Status: Safe={res.json()['unit']['lab_test']['is_safe']}")

    # Step 6: Blood Bank stores in Cold Inventory
    print(f"\n[Step 6] Blood Bank receives and stores unit into cold storage refrigerator...")
    res = client.post(f"/api/units/{unit_id}/action", json={
        "action": "storeBloodUnit",
        "caller_role": "BLOOD_BANK_ROLE",
        "caller_wallet": banks[0]["wallet_address"],
        "remarks": "Maintained at 4°C"
    })
    assert res.status_code == 200
    print(f"  -> Unit Status: {res.json()['new_status']}")

    # Step 7: Transfer to Hospital
    dest_hosp = "Safdarjung Hospital"
    dest_wallet = "0x71bE63f3384f5fb98995898A86B02Fb2426c5788"
    print(f"\n[Step 7] Blood Bank dispatches unit in cold transport box to {dest_hosp}...")
    res = client.post(f"/api/units/{unit_id}/action", json={
        "action": "initiateTransfer",
        "caller_role": "BLOOD_BANK_ROLE",
        "caller_wallet": banks[0]["wallet_address"],
        "destination_facility": dest_hosp,
        "destination_wallet": dest_wallet,
        "remarks": "Dispatched via medical transport vehicle"
    })
    assert res.status_code == 200
    print(f"  -> Custody Status: {res.json()['new_status']} (In Transit)")

    # Step 8: Hospital acknowledges receipt
    print(f"\n[Step 8] Destination hospital confirms custody receipt via MetaMask...")
    res = client.post(f"/api/units/{unit_id}/action", json={
        "action": "confirmReceipt",
        "caller_role": "HOSPITAL_ROLE",
        "caller_wallet": dest_wallet,
        "destination_facility": dest_hosp,
        "remarks": "Received with cold box integrity seal intact"
    })
    assert res.status_code == 200
    print(f"  -> Custody updated: {res.json()['new_status']}")
    print(f"  -> Current Custodian: {res.json()['unit']['current_facility']}")

    # Step 9: Verify document integrity (SHA-256)
    print(f"\n[Step 9] Verifying off-chain document integrity via SHA-256 hash match...")
    from datetime import datetime
    col_iso = datetime.strptime(unit['collection_date_str'], "%Y-%m-%d").isoformat()
    doc_payload = f"{unit['blood_unit_id']}|{unit['blood_group']}|{unit['component_type']}|{col_iso}|{banks[0]['name']}"
    res = client.post("/api/verify-document", json={
        "unit_id": unit_id,
        "document_text": doc_payload
    })
    assert res.status_code == 200
    verify_data = res.json()
    print(f"  -> Authentic Document Verified: {verify_data['is_tamper_free']} ({verify_data['verification_status']})")
    assert verify_data['is_tamper_free'] is True, "Authentic document hash should match!"

    # Test deliberate document tampering
    res_tamper = client.post("/api/verify-document", json={
        "unit_id": unit_id,
        "document_text": doc_payload + " [ALTERED RECORD: FORGED LAB CERTIFICATE]"
    })
    assert res_tamper.json()['is_tamper_free'] is False
    print(f"  -> Tampered Document Detected: {res_tamper.json()['verification_status']} (TAMPER BLOCKED)")

    # Step 10: Issue unit for patient transfusion
    print(f"\n[Step 10] Hospital crossmatches unit and issues for patient transfusion...")
    res = client.post(f"/api/units/{unit_id}/action", json={
        "action": "issueBloodUnit",
        "caller_role": "HOSPITAL_ROLE",
        "caller_wallet": dest_wallet,
        "remarks": "Crossmatch confirmed compatible with recipient"
    })
    assert res.status_code == 200
    print(f"  -> Unit Status: {res.json()['new_status']}")

    # Step 11: Complete lifecycle
    print(f"\n[Step 11] Transfusion complete: Closing blood unit lifecycle...")
    res = client.post(f"/api/units/{unit_id}/action", json={
        "action": "completeBloodUnit",
        "caller_role": "HOSPITAL_ROLE",
        "caller_wallet": dest_wallet,
        "remarks": "Transfusion successful without adverse reaction"
    })
    assert res.status_code == 200
    print(f"  -> Terminal Status: {res.json()['new_status']}")

    # Step 12: Verify Full Immutable Timeline
    print(f"\n[Step 12] Inspecting complete digital passport timeline...")
    res = client.get(f"/api/units/{unit_id}")
    passport = res.json()
    timeline = passport.get("custody_timeline", [])
    print(f"  -> Total Custody Handoffs Recorded: {len(timeline)}")
    for t in timeline:
        print(f"     • [{t['status']}] by {t['holder']} -> {t['remarks']}")

    # Step 13: Query ML Demand Forecast
    print(f"\n[Step 13] Querying ML 7-Day & 14-Day Demand Forecasts...")
    res = client.get("/api/forecast")
    assert res.status_code == 200
    fc = res.json()
    print(f"  -> Model Type: {fc['metrics']['model_type']} (R²: {fc['metrics']['R2']}, MAE: {fc['metrics']['MAE']})")
    print(f"  -> 7-Day Estimated Demand for O+: {fc['forecast_7_days']['O+']['total_estimated_units']} units")
    print(f"  -> 14-Day Estimated Demand for O+: {fc['forecast_14_days']['O+']['total_estimated_units']} units")

    # Step 14: Anomaly Detection Defense Test
    print(f"\n[Step 14] Security Defense Test: Attempting illegal re-transfer of completed unit...")
    res = client.post(f"/api/units/{unit_id}/action", json={
        "action": "initiateTransfer",
        "caller_role": "BLOOD_BANK_ROLE",
        "caller_wallet": banks[0]["wallet_address"],
        "remarks": "Malicious attempt to reuse completed unit"
    })
    assert res.status_code == 403
    print(f"  -> Defense Successful: HTTP 403 FORBIDDEN")
    print(f"  -> Intercepted by Anomaly Engine: {res.json()['detail']['error']}")
    print(f"  -> Violation Codes: {[v['code'] for v in res.json()['detail']['violations']]}")

    print("\n==================================================================")
    print("      ALL 15 END-TO-END DEMO SCENARIO STEPS VERIFIED 100%!        ")
    print("==================================================================")

if __name__ == "__main__":
    run_end_to_end_demo()
