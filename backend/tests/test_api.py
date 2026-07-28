import pytest
from io import BytesIO
from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal
from app.models.notebook import Notebook, NotebookStatus
from app.models.transaction import Transaction


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def _create_notebook(notebook_id: str, status: NotebookStatus = NotebookStatus.UPLOADED) -> Notebook:
    db = SessionLocal()
    try:
        notebook = Notebook(
            id=notebook_id,
            farmer_id="FARMER_TEST",
            original_filename=f"{notebook_id}.jpg",
            image_path=f"/tmp/{notebook_id}.jpg",
            status=status,
        )
        db.add(notebook)
        db.commit()
        db.refresh(notebook)
        return notebook
    finally:
        db.close()


def _create_transaction(transaction_id: str, notebook_id: str, verified: bool = False) -> Transaction:
    db = SessionLocal()
    try:
        transaction = Transaction(
            id=transaction_id,
            notebook_id=notebook_id,
            description="Test entry",
            category="Seeds",
            amount=100.0,
            verified=verified,
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return transaction
    finally:
        db.close()

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Online"

def test_analytics_summary_endpoint(client):
    response = client.get("/api/v1/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_notebooks" in data
    assert "total_expenses" in data

def test_knowledge_base_search_endpoint(client):
    response = client.get("/api/v1/knowledge-base/search?query=dap")
    assert response.status_code == 200
    data = response.json()
    assert data["total_results"] > 0
    assert data["results"][0]["category"] == "Fertilizer"


def test_upload_rejects_files_over_size_limit(client, monkeypatch):
    monkeypatch.setattr("app.api.v1.endpoints.notebooks.settings.MAX_UPLOAD_SIZE_MB", 1)
    oversized_bytes = BytesIO(b"x" * (1024 * 1024 + 1))

    response = client.post(
        "/api/v1/notebooks/upload",
        files={"file": ("large.jpg", oversized_bytes, "image/jpeg")},
    )

    assert response.status_code == 413
    assert "max size" in response.json()["detail"]


def test_process_rejects_notebook_with_verified_transactions(client):
    notebook = _create_notebook("notebook-verified", status=NotebookStatus.COMPLETE)
    _create_transaction("tx-verified", notebook.id, verified=True)

    response = client.post(f"/api/v1/notebooks/process/{notebook.id}", json={"crop_hint": "Cotton"})

    assert response.status_code == 409
    assert "verified transactions" in response.json()["detail"]


def test_batch_verify_rejects_transactions_from_other_notebooks(client):
    notebook_one = _create_notebook("notebook-one")
    notebook_two = _create_notebook("notebook-two")
    foreign_tx = _create_transaction("tx-foreign", notebook_two.id, verified=False)

    response = client.post(
        "/api/v1/transactions/verify",
        json={
            "notebook_id": notebook_one.id,
            "transactions": [
                {
                    "id": foreign_tx.id,
                    "notebook_id": foreign_tx.notebook_id,
                    "transaction_date": None,
                    "raw_date": None,
                    "ocr_text": None,
                    "description_en": None,
                    "description": foreign_tx.description,
                    "category": foreign_tx.category,
                    "subcategory": None,
                    "crop": None,
                    "type": "Expense",
                    "amount": foreign_tx.amount,
                    "unit": None,
                    "confidence": 1.0,
                    "confidence_level": "High",
                    "verified": False,
                    "bounding_box": None,
                    "created_at": foreign_tx.created_at.isoformat(),
                }
            ],
        },
    )

    assert response.status_code == 400
    assert "does not belong to notebook" in response.json()["detail"]


def test_allowed_origin_is_reflected_in_cors_headers(client):
    response = client.get("/", headers={"Origin": "http://localhost:5173"})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
