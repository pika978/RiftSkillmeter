import requests
import json

# Test Tavus API
api_key = "d634af1b52404c4591c37084c7353c23"
replica_id = "r9c55f9312fb"

headers = {
    "x-api-key": api_key,
    "Content-Type": "application/json"
}

# Test 1: List replicas
print("=== Test 1: List Replicas ===")
response = requests.get("https://tavusapi.com/v2/replicas", headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:500]}")
print()

# Test 2: Create persona
print("=== Test 2: Create Persona ===")
persona_payload = {
    "persona_name": "Test_Interviewer",
    "system_prompt": "You are a test interviewer.",
    "default_replica_id": replica_id,
    "layers": {
        "transport": {
            "microphone": False
        }
    }
}
print(f"Payload: {json.dumps(persona_payload, indent=2)}")
response = requests.post(
    "https://tavusapi.com/v2/personas",
    headers=headers,
    json=persona_payload
)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

# Write to file for full output
with open('tavus_test_result.txt', 'w') as f:
    f.write(f"Replicas Status: {response.status_code}\n")
    f.write(f"Persona Status: {response.status_code}\n")
    f.write(f"Persona Response:\n{response.text}\n")

print("\nResults written to tavus_test_result.txt")
