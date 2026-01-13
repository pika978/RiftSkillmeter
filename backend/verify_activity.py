import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"

# 1. Login
session = requests.Session()
username = "testuser_progress_final"
password = "testpassword123"

print(f"[-] Logging in user: {username}")
login_res = session.post(f"{BASE_URL}/auth/login/", json={
    "username": username,
    "password": password
})

if login_res.status_code == 200:
    print("[+] Login successful")
    token = login_res.json()['access']
else:
    print(f"[!] Login failed: {login_res.text}")
    sys.exit(1)

headers = {"Authorization": f"Bearer {token}"}

# 2. Fetch Activity Log
print("[-] Fetching Activity Log...")
activity_res = requests.get(f"{BASE_URL}/activity/", headers=headers)

if activity_res.status_code == 200:
    data = activity_res.json()
    print("[+] Activity Log Response Received")
    print(json.dumps(data, indent=2))
    
    if len(data) > 0:
        print("[+] SUCCESS: Data found in activity log.")
    else:
        print("[!] WARNING: Activity log is empty (expected if no progress today).")
else:
    print(f"[!] Failed to fetch activity log: {activity_res.status_code} {activity_res.text}")
