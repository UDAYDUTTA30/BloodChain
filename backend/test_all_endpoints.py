import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_backend_comprehensive():
    print("=================================================================")
    print("          TASK 2: COMPREHENSIVE BACKEND API AUDIT               ")
    print("=================================================================\n")

    results = []

    def record_test(name, passed, details=""):
        status = "PASS" if passed else "FAIL"
        results.append((name, status, details))
        print(f"[{status}] {name} - {details}")

    # 1. Root & Status
    try:
        r = requests.get(f"{BASE_URL}/", timeout=3)
        record_test("GET / (Root)", r.status_code == 200, f"Status: {r.status_code}, System: {r.json().get('system')}")
    except Exception as e:
        record_test("GET / (Root)", False, str(e))

    try:
        r = requests.get(f"{BASE_URL}/api/status", headers={"Origin": "http://localhost:5173"}, timeout=3)
        cors_header = r.headers.get("access-control-allow-origin")
        record_test("GET /api/status (Status & CORS)", r.status_code == 200 and cors_header in ["*", "http://localhost:5173"], f"Status: {r.status_code}, CORS: {cors_header}")
    except Exception as e:
        record_test("GET /api/status", False, str(e))

    # 2. Blood Banks Directory
    try:
        r = requests.get(f"{BASE_URL}/api/blood-banks", timeout=3)
        data = r.json()
        record_test("GET /api/blood-banks (All)", r.status_code == 200 and len(data) == 10, f"Count: {len(data)}")

        # Filter by state
        r_delhi = requests.get(f"{BASE_URL}/api/blood-banks?state=Delhi", timeout=3)
        record_test("GET /api/blood-banks (Filter state=Delhi)", r_delhi.status_code == 200 and len(r_delhi.json()) == 2, f"Delhi Count: {len(r_delhi.json())}")
    except Exception as e:
        record_test("GET /api/blood-banks", False, str(e))

    # 3. Hospitals Directory
    try:
        r = requests.get(f"{BASE_URL}/api/hospitals", timeout=3)
        record_test("GET /api/hospitals", r.status_code == 200 and len(r.json()) >= 5, f"Count: {len(r.json())}")
    except Exception as e:
        record_test("GET /api/hospitals", False, str(e))

    # 4. Units Listing & Filtering
    try:
        r = requests.get(f"{BASE_URL}/api/units", timeout=3)
        record_test("GET /api/units (List all)", r.status_code == 200 and len(r.json()) >= 50, f"Total Units: {len(r.json())}")

        r_filt = requests.get(f"{BASE_URL}/api/units?blood_group=O+", timeout=3)
        record_test("GET /api/units?blood_group=O+", r_filt.status_code == 200 and all(u['blood_group'] == 'O+' for u in r_filt.json()), f"O+ Units: {len(r_filt.json())}")
    except Exception as e:
        record_test("GET /api/units", False, str(e))

    # 5. Unit Passport Query (Success & 404)
    try:
        r = requests.get(f"{BASE_URL}/api/units/BB-2026-1001", timeout=3)
        unit = r.json()
        record_test("GET /api/units/{id} (Existing)", r.status_code == 200 and "qr_verification_url" in unit, f"Unit: {unit.get('blood_unit_id')}, QR: {unit.get('qr_verification_url')}")

        r_404 = requests.get(f"{BASE_URL}/api/units/BB-NONEXISTENT", timeout=3)
        record_test("GET /api/units/{id} (404 Handling)", r_404.status_code == 404, f"Status: {r_404.status_code}")
    except Exception as e:
        record_test("GET /api/units/{id}", False, str(e))

    # 6. Unit Registration (Success & Duplicate 400)
    test_id = f"BB-AUDIT-{int(time.time())}"
    reg_body = {
        "blood_unit_id": test_id,
        "donation_id": f"DON-AUDIT-{int(time.time())}",
        "blood_group": "A+",
        "component_type": "PRBC",
        "collection_date": "2026-10-04",
        "shelf_life_days": 42,
        "facility_name": "KEM Hospital Blood Bank",
        "facility_wallet": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        "donor_notes": "Audit verification bag"
    }
    try:
        r = requests.post(f"{BASE_URL}/api/units/register", json=reg_body, timeout=3)
        record_test("POST /api/units/register (Valid)", r.status_code == 200, f"Registered: {r.json().get('blood_unit', {}).get('blood_unit_id')}")

        # Duplicate register attempt
        r_dup = requests.post(f"{BASE_URL}/api/units/register", json=reg_body, timeout=3)
        record_test("POST /api/units/register (Duplicate 400)", r_dup.status_code == 400, f"Status: {r_dup.status_code}, Detail: {r_dup.json().get('detail')}")
    except Exception as e:
        record_test("POST /api/units/register", False, str(e))

    # 7. Document Verification (Authentic vs Tampered)
    try:
        from datetime import datetime
        col_iso = datetime.strptime("2026-10-04", "%Y-%m-%d").isoformat()
        auth_doc = f"{test_id}|A+|PRBC|{col_iso}|KEM Hospital Blood Bank"
        
        r_auth = requests.post(f"{BASE_URL}/api/verify-document", json={"unit_id": test_id, "document_text": auth_doc}, timeout=3)
        auth_pass = r_auth.status_code == 200 and r_auth.json().get("is_tamper_free") is True
        record_test("POST /api/verify-document (Authentic)", auth_pass, f"Status: {r_auth.json().get('verification_status')}")

        r_tamper = requests.post(f"{BASE_URL}/api/verify-document", json={"unit_id": test_id, "document_text": auth_doc + " [TAMPERED]"}, timeout=3)
        tamper_pass = r_tamper.status_code == 200 and r_tamper.json().get("is_tamper_free") is False
        record_test("POST /api/verify-document (Tampered)", tamper_pass, f"Status: {r_tamper.json().get('verification_status')}")
    except Exception as e:
        record_test("POST /api/verify-document", False, str(e))

    # 8. Lifecycle Transitions & State Machine Guards
    try:
        # submitForTesting
        r1 = requests.post(f"{BASE_URL}/api/units/{test_id}/action", json={
            "action": "submitForTesting",
            "caller_role": "COLLECTION_ROLE",
            "caller_wallet": "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
        }, timeout=3)
        record_test("POST /action (submitForTesting)", r1.status_code == 200 and r1.json().get("new_status") == "TESTING")

        # approveBloodUnit
        r2 = requests.post(f"{BASE_URL}/api/units/{test_id}/action", json={
            "action": "approveBloodUnit",
            "caller_role": "LAB_ROLE",
            "caller_wallet": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
        }, timeout=3)
        record_test("POST /action (approveBloodUnit)", r2.status_code == 200 and r2.json().get("new_status") == "APPROVED")

        # storeBloodUnit
        r3 = requests.post(f"{BASE_URL}/api/units/{test_id}/action", json={
            "action": "storeBloodUnit",
            "caller_role": "BLOOD_BANK_ROLE",
            "caller_wallet": "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
        }, timeout=3)
        record_test("POST /action (storeBloodUnit)", r3.status_code == 200 and r3.json().get("new_status") == "STORED")

        # initiateTransfer
        r4 = requests.post(f"{BASE_URL}/api/units/{test_id}/action", json={
            "action": "initiateTransfer",
            "caller_role": "BLOOD_BANK_ROLE",
            "caller_wallet": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
            "destination_facility": "Lilavati Hospital",
            "destination_wallet": "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a"
        }, timeout=3)
        record_test("POST /action (initiateTransfer)", r4.status_code == 200 and r4.json().get("new_status") == "TRANSFERRED")

        # confirmReceipt
        r5 = requests.post(f"{BASE_URL}/api/units/{test_id}/action", json={
            "action": "confirmReceipt",
            "caller_role": "HOSPITAL_ROLE",
            "caller_wallet": "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
            "destination_facility": "Lilavati Hospital"
        }, timeout=3)
        record_test("POST /action (confirmReceipt)", r5.status_code == 200 and r5.json().get("new_status") == "RECEIVED")

        # issueBloodUnit
        r6 = requests.post(f"{BASE_URL}/api/units/{test_id}/action", json={
            "action": "issueBloodUnit",
            "caller_role": "HOSPITAL_ROLE",
            "caller_wallet": "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a"
        }, timeout=3)
        record_test("POST /action (issueBloodUnit)", r6.status_code == 200 and r6.json().get("new_status") == "ISSUED")

        # completeBloodUnit
        r7 = requests.post(f"{BASE_URL}/api/units/{test_id}/action", json={
            "action": "completeBloodUnit",
            "caller_role": "HOSPITAL_ROLE",
            "caller_wallet": "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a"
        }, timeout=3)
        record_test("POST /action (completeBloodUnit)", r7.status_code == 200 and r7.json().get("new_status") == "COMPLETED")

        # Terminal state reuse check (must fail with HTTP 403)
        r_reuse = requests.post(f"{BASE_URL}/api/units/{test_id}/action", json={
            "action": "initiateTransfer",
            "caller_role": "BLOOD_BANK_ROLE",
            "caller_wallet": "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
        }, timeout=3)
        record_test("POST /action (Terminal State Reuse Blocked 403)", r_reuse.status_code == 403, f"Status: {r_reuse.status_code}")
    except Exception as e:
        record_test("POST /action (Lifecycle Transitions)", False, str(e))

    # 9. Inventory Analytics & ML Forecast Endpoints
    try:
        r_inv = requests.get(f"{BASE_URL}/api/analytics/inventory", timeout=3)
        record_test("GET /api/analytics/inventory", r_inv.status_code == 200 and "by_blood_group" in r_inv.json(), f"Total units: {r_inv.json().get('total_units')}")

        r_fc = requests.get(f"{BASE_URL}/api/forecast", timeout=3)
        record_test("GET /api/forecast", r_fc.status_code == 200 and "metrics" in r_fc.json(), f"R2: {r_fc.json().get('metrics', {}).get('R2')}")

        r_log = requests.get(f"{BASE_URL}/api/anomalies/audit-log", timeout=3)
        record_test("GET /api/anomalies/audit-log", r_log.status_code == 200 and "logs" in r_log.json(), f"Total logs: {r_log.json().get('total_logs')}")
    except Exception as e:
        record_test("Analytics / Forecast", False, str(e))

    print("\n-----------------------------------------------------------------")
    passed_count = sum(1 for _, st, _ in results if st == "PASS")
    print(f"BACKEND AUDIT RESULT: {passed_count}/{len(results)} TESTS PASSED")
    print("-----------------------------------------------------------------")
    return passed_count == len(results)

if __name__ == "__main__":
    test_backend_comprehensive()
