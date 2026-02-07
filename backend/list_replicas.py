import requests
import json

# Test Tavus API to check replica list
api_key = "d634af1b52404c4591c37084c7353c23"

headers = {
    "x-api-key": api_key,
    "Content-Type": "application/json"
}

# Get list of replicas
print("=== Fetching Available Replicas ===")
response = requests.get("https://tavusapi.com/v2/replicas", headers=headers)
print(f"Status: {response.status_code}\n")

if response.status_code == 200:
    data = response.json()
    replicas = data.get('data', [])
    
    print(f"Found {len(replicas)} replicas:\n")
    for i, replica in enumerate(replicas, 1):
        print(f"{i}. Replica ID: {replica.get('replica_id', 'N/A')}")
        print(f"   Name: {replica.get('replica_name', 'N/A')}")
        print(f"   Status: {replica.get('status', 'N/A')}")
        print()
    
    # Save to file
    with open('replicas_list.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    print("Full replica data saved to replicas_list.json")
else:
    print(f"Error: {response.text}")
