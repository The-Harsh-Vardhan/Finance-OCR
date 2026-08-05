"""
GramIQ Finance OCR - Python Production Integration SDK Client
Allows Python microservices, scripts, or bot backends to communicate with GramIQ OCR.
"""

import os
import time
import requests
from typing import Dict, Any, List, Optional


class GramIQBackendClient:
    """Production Python client for GramIQ FastAPI backend."""

    def __init__(self, base_url: Optional[str] = None, timeout: int = 30):
        url = base_url or os.getenv("GRAMIQ_BACKEND_URL", "https://ledger-ocr-seven.vercel.app/api/ocr")
        self.base_url = url.rstrip("/")
        if not self.base_url.endswith("/api/v1"):
            self.base_url += "/api/v1"
        self.timeout = timeout
        self.session = requests.Session()

    def get_health(self) -> Dict[str, Any]:
        """Checks API health and database connectivity."""
        root_url = self.base_url.replace("/api/v1", "")
        res = self.session.get(f"{root_url}/", timeout=self.timeout)
        res.raise_for_status()
        return res.json()

    def upload_notebook(self, file_path_or_bytes, filename: str = "notebook.jpg", farmer_id: str = "FARMER_DEFAULT") -> Dict[str, Any]:
        """Uploads a farm ledger notebook image."""
        url = f"{self.base_url}/notebooks/upload"
        data = {"farmer_id": farmer_id}

        if isinstance(file_path_or_bytes, str):
            with open(file_path_or_bytes, "rb") as f:
                files = {"file": (os.path.basename(file_path_or_bytes), f, "image/jpeg")}
                res = self.session.post(url, data=data, files=files, timeout=self.timeout)
        elif isinstance(file_path_or_bytes, bytes):
            files = {"file": (filename, file_path_or_bytes, "image/jpeg")}
            res = self.session.post(url, data=data, files=files, timeout=self.timeout)
        else:
            files = {"file": (filename, file_path_or_bytes, "image/jpeg")}
            res = self.session.post(url, data=data, files=files, timeout=self.timeout)

        res.raise_for_status()
        return res.json()

    def process_notebook(self, notebook_id: str, crop_hint: str = "") -> Dict[str, Any]:
        """Triggers the 3-step AI vision OCR pipeline."""
        url = f"{self.base_url}/notebooks/process/{notebook_id}"
        res = self.session.post(url, json={"crop_hint": crop_hint}, timeout=self.timeout)
        res.raise_for_status()
        return res.json()

    def poll_until_complete(
        self,
        notebook_id: str,
        interval_sec: float = 2.0,
        max_timeout_sec: float = 120.0
    ) -> Dict[str, Any]:
        """Polls notebook status until 'Complete' or 'Failed'."""
        start = time.time()
        while time.time() - start < max_timeout_sec:
            notebook = self.get_notebook(notebook_id)
            status = notebook.get("status")
            if status == "Complete":
                return notebook
            if status == "Failed":
                err = notebook.get("error_message", "Unknown OCR failure")
                raise RuntimeError(f"Notebook processing failed: {err}")
            time.sleep(interval_sec)
        raise TimeoutError(f"Notebook {notebook_id} processing timed out after {max_timeout_sec}s")

    def get_notebook(self, notebook_id: str) -> Dict[str, Any]:
        url = f"{self.base_url}/notebooks/{notebook_id}"
        res = self.session.get(url, timeout=self.timeout)
        res.raise_for_status()
        return res.json()

    def get_transactions(self, notebook_id: str) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/notebooks/{notebook_id}/transactions"
        res = self.session.get(url, timeout=self.timeout)
        res.raise_for_status()
        return res.json()

    def batch_verify_transactions(self, notebook_id: str, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        url = f"{self.base_url}/transactions/verify"
        payload = {"notebook_id": notebook_id, "transactions": transactions}
        res = self.session.post(url, json=payload, timeout=self.timeout)
        res.raise_for_status()
        return res.json()

    def get_analytics(self) -> Dict[str, Any]:
        url = f"{self.base_url}/analytics/summary"
        res = self.session.get(url, timeout=self.timeout)
        res.raise_for_status()
        return res.json()
