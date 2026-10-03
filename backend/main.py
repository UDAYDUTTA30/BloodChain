import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import Anomaly Detector
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml"))
from anomaly_detector import BloodChainAnomalyDetector

app = FastAPI(
    title="BloodChain REST API",
    description="Backend API for Blockchain-Based Blood Supply Chain Traceability & Intelligent Inventory System",
    version="3.0.0"
)

# Enable CORS for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
ML_DIR = os.path.join(os.path.dirname(__file__), "..", "ml")

# In-memory storage seeded from JSON
blood_units_store: Dict[str, Dict[str, Any]] = {}
audit_logs: List[Dict[str, Any]] = []
anomaly_detector = BloodChainAnomalyDetector()

def load_initial_data():
    global blood_units_store
    units_file = os.path.join(DATA_DIR, "synthetic_blood_units.json")
    if os.path.exists(units_file):
        with open(units_file, "r", encoding="utf-8") as f:
            units_list = json.load(f)
            for u in units_list:
                blood_units_store[u["blood_unit_id"]] = u
    print(f"Loaded {len(blood_units_store)} initial blood units into memory.")

load_initial_data()

# -------------------------------------------------------------------------
# Request Models
# -------------------------------------------------------------------------
class UnitRegistrationRequest(BaseModel):
    blood_unit_id: str
    donation_id: str
    blood_group: str
    component_type: str
    collection_date: str
    shelf_life_days: int = 42
    facility_name: str
    facility_wallet: str
    donor_notes: Optional[str] = "Normal healthy donation intake"

class ActionTransitionRequest(BaseModel):
    action: str  # submitForTesting, approveBloodUnit, rejectBloodUnit, storeBloodUnit, initiateTransfer, confirmReceipt, issueBloodUnit, completeBloodUnit
    caller_role: str  # COLLECTION_ROLE, LAB_ROLE, BLOOD_BANK_ROLE, HOSPITAL_ROLE
    caller_wallet: str
    remarks: Optional[str] = ""
    destination_facility: Optional[str] = None
    destination_wallet: Optional[str] = None
    rejection_reason: Optional[str] = None
    document_hash: Optional[str] = None

# -------------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------------

@app.get("/")
def root():
    return {
        "system": "BloodChain API",
        "version": "3.0.0",
        "specification": "PRD v3.0 Final Updated Specification",
        "network": "Ethereum Sepolia Testnet",
        "status": "ONLINE"
    }

@app.get("/api/status")
def get_system_status():
    return {
        "status": "HEALTHY",
        "blockchain": {
            "network": "Ethereum Sepolia Testnet",
            "chainId": 11155111,
            "standard": "Solidity 0.8.20 + OpenZeppelin AccessControl",
            "state_machine": "8-Stage Verified"
        },
        "total_units_tracked": len(blood_units_store),
        "total_audit_events": len(audit_logs)
    }

@app.get("/api/blood-banks")
def get_blood_banks(state: Optional[str] = None, city: Optional[str] = None):
    bb_file = os.path.join(DATA_DIR, "indian_blood_bank_directory.json")
    if not os.path.exists(bb_file):
        raise HTTPException(status_code=404, detail="Blood bank directory dataset not found")
    with open(bb_file, "r", encoding="utf-8") as f:
        banks = json.load(f)
    
    if state:
        banks = [b for b in banks if b["state"].lower() == state.lower()]
    if city:
        banks = [b for b in banks if b["city"].lower() == city.lower()]
    return banks

@app.get("/api/hospitals")
def get_hospitals():
    hosp_file = os.path.join(DATA_DIR, "hospitals_directory.json")
    if not os.path.exists(hosp_file):
        raise HTTPException(status_code=404, detail="Hospitals dataset not found")
    with open(hosp_file, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/api/units")
def list_blood_units(
    status: Optional[str] = None,
    blood_group: Optional[str] = None,
    component: Optional[str] = None
):
    results = list(blood_units_store.values())
    if status:
        results = [u for u in results if u.get("current_status") == status.upper()]
    if blood_group:
        # Handle '+' being parsed as space in URL query params (e.g. 'O ' -> 'O+')
        normalized_bg = blood_group.replace(" ", "+").strip().upper()
        results = [u for u in results if u.get("blood_group") == normalized_bg]
    if component:
        results = [u for u in results if u.get("component_type", "").lower() == component.lower()]
    return results

@app.get("/api/units/{unit_id}")
def get_blood_unit_passport(unit_id: str):
    """
    Returns the complete Blood Unit Passport for a specific blood unit.
    """
    unit = blood_units_store.get(unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail=f"Blood unit '{unit_id}' not found.")
    
    # Calculate days until expiry
    now_ts = int(datetime.now().timestamp())
    exp_ts = unit.get("expiry_timestamp", 0)
    days_left = round((exp_ts - now_ts) / 86400, 1)

    passport = {
        **unit,
        "days_until_expiry": days_left,
        "is_safe_for_transfusion": (
            days_left > 0 and 
            unit.get("current_status") in ["STORED", "RECEIVED"] and
            unit.get("lab_test", {}).get("is_safe", True)
        ),
        "qr_verification_url": f"https://bloodchain.eth/passport/{unit_id}"
    }
    return passport

@app.post("/api/units/register")
def register_unit(req: UnitRegistrationRequest):
    if req.blood_unit_id in blood_units_store:
        raise HTTPException(status_code=400, detail="Blood unit ID already registered.")

    col_date = datetime.strptime(req.collection_date, "%Y-%m-%d")
    exp_date = col_date + timedelta(days=req.shelf_life_days)
    
    meta_payload = f"{req.blood_unit_id}|{req.blood_group}|{req.component_type}|{col_date.isoformat()}|{req.facility_name}"
    meta_hash = "0x" + hashlib.sha256(meta_payload.encode()).hexdigest()

    tx_hash = "0x" + hashlib.sha256(f"reg_{req.blood_unit_id}_{datetime.now().isoformat()}".encode()).hexdigest()

    new_unit = {
        "blood_unit_id": req.blood_unit_id,
        "donation_id": req.donation_id,
        "blood_group": req.blood_group,
        "component_type": req.component_type,
        "collection_timestamp": int(col_date.timestamp()),
        "collection_date_str": req.collection_date,
        "expiry_timestamp": int(exp_date.timestamp()),
        "expiry_date_str": exp_date.strftime("%Y-%m-%d"),
        "current_status": "COLLECTED",
        "current_facility": req.facility_name,
        "current_owner_wallet": req.facility_wallet,
        "metadata_hash": meta_hash,
        "lab_test": {
            "test_id": f"LAB-PENDING-{req.blood_unit_id}",
            "tested_by": "Pending Lab Allocation",
            "is_safe": False
        },
        "blockchain_tx": {
            "registered_tx": tx_hash,
            "latest_tx": tx_hash
        },
        "custody_timeline": [
            {
                "status": "COLLECTED",
                "holder": req.facility_name,
                "wallet": req.facility_wallet,
                "timestamp": datetime.now().isoformat(),
                "remarks": "Donation collected and registered into BloodChain"
            }
        ]
    }

    blood_units_store[req.blood_unit_id] = new_unit
    
    audit_logs.append({
        "timestamp": datetime.now().isoformat(),
        "unit_id": req.blood_unit_id,
        "action": "registerBloodUnit",
        "actor": req.facility_wallet,
        "status": "SUCCESS",
        "tx_hash": tx_hash
    })

    return {"status": "SUCCESS", "blood_unit": new_unit, "tx_hash": tx_hash}

@app.post("/api/units/{unit_id}/action")
def execute_lifecycle_action(unit_id: str, req: ActionTransitionRequest):
    unit = blood_units_store.get(unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")

    # Determine proposed next status
    transition_map = {
        "submitForTesting": "TESTING",
        "approveBloodUnit": "APPROVED",
        "rejectBloodUnit": "REJECTED",
        "storeBloodUnit": "STORED",
        "initiateTransfer": "TRANSFERRED",
        "confirmReceipt": "RECEIVED",
        "issueBloodUnit": "ISSUED",
        "completeBloodUnit": "COMPLETED"
    }

    proposed_status = transition_map.get(req.action)
    if not proposed_status:
        raise HTTPException(status_code=400, detail=f"Unknown lifecycle action '{req.action}'.")

    # Run Anomaly Detector Pre-flight
    anomaly_result = anomaly_detector.inspect_event(
        unit_data=unit,
        action=req.action,
        caller_role=req.caller_role,
        new_status=proposed_status,
        doc_content=req.document_hash
    )

    if anomaly_result["is_anomalous"]:
        audit_logs.append({
            "timestamp": datetime.now().isoformat(),
            "unit_id": unit_id,
            "action": req.action,
            "actor": req.caller_wallet,
            "status": "BLOCKED",
            "anomaly_details": anomaly_result["anomalies_detected"]
        })
        raise HTTPException(
            status_code=403,
            detail={
                "error": "LIFECYCLE_ANOMALY_BLOCKED",
                "risk_level": anomaly_result["risk_level"],
                "violations": anomaly_result["anomalies_detected"]
            }
        )

    # Apply valid state transition
    unit["current_status"] = proposed_status
    if req.action == "approveBloodUnit":
        unit["lab_test"] = {
            "test_id": f"LAB-PASS-{unit_id}",
            "tested_by": "Certified Blood Serology Lab",
            "hiv_result": "Negative",
            "hcv_result": "Negative",
            "hbv_result": "Negative",
            "syphilis_result": "Negative",
            "malaria_result": "Negative",
            "is_safe": True
        }
    elif req.action == "rejectBloodUnit":
        unit["lab_test"] = {
            "test_id": f"LAB-FAIL-{unit_id}",
            "tested_by": "Certified Blood Serology Lab",
            "rejection_reason": req.rejection_reason or "Contamination detected",
            "is_safe": False
        }
    elif req.action == "initiateTransfer":
        if req.destination_facility:
            unit["pending_destination"] = req.destination_facility
    elif req.action == "confirmReceipt":
        if req.destination_facility:
            unit["current_facility"] = req.destination_facility
            unit["current_owner_wallet"] = req.caller_wallet
            unit.pop("pending_destination", None)

    tx_hash = "0x" + hashlib.sha256(f"{req.action}_{unit_id}_{datetime.now().isoformat()}".encode()).hexdigest()
    unit["blockchain_tx"]["latest_tx"] = tx_hash

    if "custody_timeline" not in unit:
        unit["custody_timeline"] = []
    
    unit["custody_timeline"].append({
        "status": proposed_status,
        "holder": unit.get("current_facility", "Facility"),
        "wallet": req.caller_wallet,
        "timestamp": datetime.now().isoformat(),
        "remarks": req.remarks or f"Transition to {proposed_status}"
    })

    audit_logs.append({
        "timestamp": datetime.now().isoformat(),
        "unit_id": unit_id,
        "action": req.action,
        "actor": req.caller_wallet,
        "status": "CONFIRMED",
        "tx_hash": tx_hash
    })

    return {
        "status": "CONFIRMED",
        "new_status": proposed_status,
        "tx_hash": tx_hash,
        "unit": unit
    }

class DocumentVerifyRequest(BaseModel):
    unit_id: str
    document_text: str

@app.post("/api/verify-document")
def verify_document_integrity(req: DocumentVerifyRequest):
    """
    Computes SHA-256 hash of provided document text and checks against on-chain metadataHash.
    """
    unit = blood_units_store.get(req.unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found.")

    calculated_hash = "0x" + hashlib.sha256(req.document_text.encode("utf-8")).hexdigest()
    on_chain_hash = unit.get("metadata_hash", "")

    is_verified = (calculated_hash.lower() == on_chain_hash.lower())

    return {
        "unit_id": req.unit_id,
        "calculated_sha256": calculated_hash,
        "on_chain_metadata_hash": on_chain_hash,
        "is_tamper_free": is_verified,
        "verification_status": "MATCH_CONFIRMED" if is_verified else "TAMPER_DETECTED"
    }

@app.get("/api/analytics/inventory")
def get_inventory_analytics():
    """
    Adapted from SQL Server bi_reporting_views.sql:
    Aggregates current stock by blood group, component, and shelf-life status.
    """
    units = list(blood_units_store.values())
    now_ts = int(datetime.now().timestamp())

    group_counts = {"A+": 0, "A-": 0, "B+": 0, "B-": 0, "AB+": 0, "AB-": 0, "O+": 0, "O-": 0}
    status_counts = {"STORED": 0, "IN_TRANSIT": 0, "RECEIVED": 0, "ISSUED": 0, "COMPLETED": 0, "EXPIRED": 0, "REJECTED": 0}
    shelf_life = {"safe": 0, "expiring_soon_7d": 0, "expired": 0}

    for u in units:
        bg = u.get("blood_group", "O+")
        st = u.get("current_status", "STORED")
        exp = u.get("expiry_timestamp", 0)

        if bg in group_counts:
            group_counts[bg] += 1
        if st in status_counts:
            status_counts[st] += 1

        days_left = (exp - now_ts) / 86400
        if days_left < 0 or st == "EXPIRED":
            shelf_life["expired"] += 1
        elif days_left <= 7:
            shelf_life["expiring_soon_7d"] += 1
        else:
            shelf_life["safe"] += 1

    return {
        "total_units": len(units),
        "by_blood_group": group_counts,
        "by_status": status_counts,
        "shelf_life_distribution": shelf_life,
        "safe_units_count": shelf_life["safe"]
    }

@app.get("/api/forecast")
def get_ml_forecast():
    """
    Returns 7-day and 14-day demand forecast from the trained ML pipeline.
    """
    forecast_file = os.path.join(ML_DIR, "forecast_output.json")
    if not os.path.exists(forecast_file):
        raise HTTPException(status_code=404, detail="Forecast output not generated yet. Run train_demand_forecast.py.")
    with open(forecast_file, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/api/anomalies/audit-log")
def get_audit_log():
    """
    Returns recent audit logs and flagged supply-chain actions.
    """
    return {
        "total_logs": len(audit_logs),
        "logs": audit_logs[::-1]  # Most recent first
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
