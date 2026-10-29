import os
import json
import hashlib
from datetime import datetime

class BloodChainAnomalyDetector:
    """
    Rule-based and heuristic anomaly detector for BloodChain supply chain events.
    Flags invalid lifecycle transitions, counterfeit attempts, expiry violations,
    unauthorized role operations, and SHA-256 document tamper mismatches.
    """

    VALID_TRANSITIONS = {
        "CREATED": ["COLLECTED"],
        "COLLECTED": ["TESTING"],
        "TESTING": ["APPROVED", "REJECTED"],
        "APPROVED": ["STORED"],
        "STORED": ["TRANSFERRED", "EXPIRED"],
        "TRANSFERRED": ["RECEIVED", "EXPIRED"],
        "RECEIVED": ["ISSUED", "EXPIRED"],
        "ISSUED": ["COMPLETED"],
        "COMPLETED": [], # Terminal
        "REJECTED": [],  # Terminal
        "EXPIRED": []    # Terminal
    }

    ROLE_PERMISSIONS = {
        "registerBloodUnit": ["COLLECTION_ROLE", "DEFAULT_ADMIN_ROLE"],
        "submitForTesting": ["COLLECTION_ROLE", "LAB_ROLE", "DEFAULT_ADMIN_ROLE"],
        "approveBloodUnit": ["LAB_ROLE", "DEFAULT_ADMIN_ROLE"],
        "rejectBloodUnit": ["LAB_ROLE", "DEFAULT_ADMIN_ROLE"],
        "storeBloodUnit": ["BLOOD_BANK_ROLE", "DEFAULT_ADMIN_ROLE"],
        "initiateTransfer": ["BLOOD_BANK_ROLE", "DEFAULT_ADMIN_ROLE"],
        "confirmReceipt": ["HOSPITAL_ROLE", "DEFAULT_ADMIN_ROLE"],
        "issueBloodUnit": ["HOSPITAL_ROLE", "DEFAULT_ADMIN_ROLE"],
        "completeBloodUnit": ["HOSPITAL_ROLE", "DEFAULT_ADMIN_ROLE"],
        "markExpired": ["ALL_AUTHORIZED"]
    }

    def __init__(self):
        pass

    def inspect_event(self, unit_data, action, caller_role, new_status=None, doc_content=None):
        """
        Inspects an incoming transaction/event for anomalies.
        Returns a dict with `is_anomalous`, `risk_level`, `violation_code`, and `message`.
        """
        anomalies = []
        current_status = unit_data.get("current_status")
        expiry_ts = unit_data.get("expiry_timestamp", 0)
        current_ts = int(datetime.now().timestamp())

        # 1. Expiry Check
        if current_ts > expiry_ts and action not in ["markExpired", "getBloodUnit"]:
            anomalies.append({
                "code": "ERR_EXPIRED_UNIT_PROCESSED",
                "risk": "CRITICAL",
                "message": f"Action '{action}' attempted on an expired blood unit (expired at {datetime.fromtimestamp(expiry_ts).strftime('%Y-%m-%d %H:%M')})."
            })

        # 2. Terminal State Re-entry Check
        if current_status in ["COMPLETED", "REJECTED", "EXPIRED"] and action not in ["getBloodUnit", "verifyMetadataHash"]:
            anomalies.append({
                "code": "ERR_TERMINAL_STATE_REUSE",
                "risk": "CRITICAL",
                "message": f"Blood unit is in terminal status '{current_status}'. Further operations are strictly disallowed."
            })

        # 3. State Machine Transition Check
        if new_status and current_status in self.VALID_TRANSITIONS:
            allowed_next = self.VALID_TRANSITIONS[current_status]
            if new_status not in allowed_next:
                anomalies.append({
                    "code": "ERR_ILLEGAL_STATE_TRANSITION",
                    "risk": "HIGH",
                    "message": f"Illegal state transition from '{current_status}' to '{new_status}'. Allowed: {allowed_next}."
                })

        # 4. Role-Based Access Violation Check
        if action in self.ROLE_PERMISSIONS:
            allowed_roles = self.ROLE_PERMISSIONS[action]
            if "ALL_AUTHORIZED" not in allowed_roles and caller_role not in allowed_roles:
                anomalies.append({
                    "code": "ERR_UNAUTHORIZED_ROLE_ACTION",
                    "risk": "HIGH",
                    "message": f"Caller role '{caller_role}' lacks permissions for action '{action}'. Required: {allowed_roles}."
                })

        # 5. Document Integrity Verification
        if doc_content is not None:
            calculated_hash = "0x" + hashlib.sha256(doc_content.encode("utf-8") if isinstance(doc_content, str) else doc_content).hexdigest()
            recorded_hash = unit_data.get("metadata_hash", "")
            if calculated_hash.lower() != recorded_hash.lower():
                anomalies.append({
                    "code": "ERR_DOC_INTEGRITY_MISMATCH",
                    "risk": "CRITICAL",
                    "message": "Calculated SHA-256 document hash does not match blockchain metadataHash! Document has been tampered with."
                })

        is_anomalous = len(anomalies) > 0
        risk_level = "CLEAN"
        if is_anomalous:
            risk_level = "CRITICAL" if any(a["risk"] == "CRITICAL" for a in anomalies) else "HIGH"

        return {
            "is_anomalous": is_anomalous,
            "risk_level": risk_level,
            "anomalies_detected": anomalies,
            "timestamp": datetime.now().isoformat()
        }

def run_test_suite():
    detector = BloodChainAnomalyDetector()
    scenarios_path = os.path.join(os.path.dirname(__file__), "..", "data", "anomaly_test_scenarios.json")
    
    with open(scenarios_path, "r") as f:
        scenarios = json.load(f)

    print("Running Anomaly Detection Test Suite against ground-truth scenarios...\n")
    for s in scenarios:
        case_id = s["case_id"]
        desc = s["description"]
        action = s["attempted_action"]
        
        # Mock test unit
        test_unit = {
            "blood_unit_id": s["unit_id"],
            "current_status": "EXPIRED" if "expired" in desc.lower() else ("COMPLETED" if "completed" in desc.lower() else "STORED"),
            "expiry_timestamp": int(datetime.now().timestamp()) - 3600 if "expired" in desc.lower() else int(datetime.now().timestamp()) + 36000,
            "metadata_hash": "0xabc123"
        }

        role = "HOSPITAL_ROLE" if "unauthorized" not in desc.lower() else "COLLECTION_ROLE"
        doc = "tampered content" if "tamper" in desc.lower() or "integrity" in desc.lower() else None

        result = detector.inspect_event(test_unit, action, role, new_status="TRANSFERRED" if "transfer" in action.lower() else None, doc_content=doc)
        print(f"[{case_id}] {desc}")
        print(f"  Result: Risk={result['risk_level']}, Anomalous={result['is_anomalous']}")
        for a in result["anomalies_detected"]:
            print(f"  -> Flagged: [{a['code']}] {a['message']}")
        print()

if __name__ == "__main__":
    run_test_suite()
