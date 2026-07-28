import os
import sys
import json
import urllib.request

def deploy_to_render(api_key: str, repo_url: str):
    """
    Deploys FastAPI backend to Render using the Render REST API v1.
    """
    url = "https://api.render.com/v1/services"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    payload = {
        "type": "web_service",
        "name": "gramiq-finance-ocr-backend",
        "ownerId": "",
        "repo": repo_url,
        "autoDeploy": "yes",
        "branch": "main",
        "serviceDetails": {
            "env": "docker",
            "dockerContext": "./backend",
            "dockerfilePath": "./backend/Dockerfile",
            "envVars": [
                {"key": "PORT", "value": "8000"},
                {"key": "PROJECT_NAME", "value": "GramIQ AI Ledger Digitization"}
            ],
            "region": "singapore",
            "plan": "free"
        }
    }

    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            service = data.get("service", {})
            print(f"✅ Render Web Service Created Successfully!")
            print(f"Service ID: {service.get('id')}")
            print(f"Service Name: {service.get('name')}")
            print(f"Live URL: {service.get('serviceDetails', {}).get('url')}")
            return service
    except urllib.error.HTTPError as e:
        print(f"❌ Render API Request Failed: {e.code} {e.reason}")
        print(e.read().decode("utf-8"))
    except Exception as ex:
        print(f"❌ Error: {ex}")

if __name__ == "__main__":
    key = os.getenv("RENDER_API_KEY")
    repo = os.getenv("GITHUB_REPO_URL")
    if not key:
        print("Please set RENDER_API_KEY environment variable.")
        sys.exit(1)
    if not repo:
        print("Please set GITHUB_REPO_URL environment variable.")
        sys.exit(1)
    deploy_to_render(key, repo)
