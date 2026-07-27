import requests
import os
import sys

# Force UTF-8 stdout encoding for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000/api/v1"
ROOT_URL = "http://127.0.0.1:8000/"

def run_live_tests():
    print("--------------------------------------------------")
    print("[TEST] STARTING LIVE SYSTEM INTEGRATION TEST")
    print("--------------------------------------------------")

    # 1. Health check
    r = requests.get(ROOT_URL)
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print(f"[OK] 1. Root Health Check: ONLINE ({r.json()['system']})")

    # 2. Upload Sample Bahi-Khata Image
    sample_image_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "frontend", "sample_images", "bahi_khata_cotton_hindi.png"
    )

    with open(sample_image_path, "rb") as f:
        files = {"file": ("bahi_khata_cotton_hindi.png", f, "image/png")}
        r_up = requests.post(f"{BASE_URL}/notebooks/upload", files=files)

    assert r_up.status_code == 201, f"Upload failed: {r_up.text}"
    notebook = r_up.json()
    notebook_id = notebook["id"]
    print(f"[OK] 2. Notebook Image Uploaded successfully! ID: {notebook_id}")

    # 3. Process Notebook via 8-Stage Pipeline
    r_proc = requests.post(
        f"{BASE_URL}/notebooks/process/{notebook_id}",
        json={"crop_hint": "Cotton"}
    )
    assert r_proc.status_code == 200, f"Processing failed: {r_proc.text}"
    proc_res = r_proc.json()
    print(f"[OK] 3. Pipeline Processing Completed! Extracted {proc_res['total_extracted']} transactions.")

    # 4. Fetch Extracted Transactions
    r_tx = requests.get(f"{BASE_URL}/notebooks/{notebook_id}/transactions")
    assert r_tx.status_code == 200, f"Fetch transactions failed: {r_tx.text}"
    tx_list = r_tx.json()
    print(f"[OK] 4. Fetched {len(tx_list)} Extracted Transactions:")
    for tx in tx_list:
        print(f"   * [{tx['type']}] {tx['transaction_date']} | {tx['description'][:40]}... | Rs.{tx['amount']} ({tx['confidence_level']} Conf)")

    # 5. Verify & Confirm Transactions
    r_ver = requests.post(f"{BASE_URL}/transactions/verify", json={
        "notebook_id": notebook_id,
        "transactions": tx_list
    })
    assert r_ver.status_code == 200, f"Verification failed: {r_ver.text}"
    print(f"[OK] 5. Verified & Saved {len(tx_list)} transactions to database!")

    # 6. Analytics Summary
    r_an = requests.get(f"{BASE_URL}/analytics/summary")
    assert r_an.status_code == 200, f"Analytics failed: {r_an.text}"
    an_res = r_an.json()
    print("[OK] 6. Analytics Dashboard Metrics:")
    print(f"   * Total Income: Rs.{an_res['total_income']:,.2f}")
    print(f"   * Total Expenses: Rs.{an_res['total_expenses']:,.2f}")
    print(f"   * Net Profit/Loss: Rs.{an_res['net_profit_loss']:,.2f}")

    # 7. Knowledge Base Search
    r_kb = requests.get(f"{BASE_URL}/knowledge-base/search", params={"query": "मजुरी"})
    assert r_kb.status_code == 200, f"KB Search failed: {r_kb.text}"
    kb_res = r_kb.json()
    print(f"[OK] 7. Knowledge Base Term Search: Found {kb_res['total_results']} matching Indic terms for 'मजुरी'")

    print("--------------------------------------------------")
    print("[SUCCESS] ALL LIVE SYSTEM INTEGRATION TESTS PASSED 100%!")
    print("--------------------------------------------------")

if __name__ == "__main__":
    run_live_tests()
