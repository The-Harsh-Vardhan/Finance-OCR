import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Online"

def test_analytics_summary_endpoint():
    response = client.get("/api/v1/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_notebooks" in data
    assert "total_expenses" in data

def test_knowledge_base_search_endpoint():
    response = client.get("/api/v1/knowledge-base/search?query=dap")
    assert response.status_code == 200
    data = response.json()
    assert data["total_results"] > 0
    assert data["results"][0]["category"] == "Fertilizer"
