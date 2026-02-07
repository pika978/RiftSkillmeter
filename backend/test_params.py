import requests
import json

# Test Tavus API with minimal payload
api_key = "d634af1b52404c4591c37084c7353c23"
replica_id = "r9c55f9312fb"  # Verified: Steph - Office V1

headers = {
    "x-api-key": api_key,
    "Content-Type": "application/json"
}

# Test 1: Minimal persona (no echo mode)
print("=== Test 1: Minimal Persona (No Echo Mode) ===")
minimal_payload = {
    "persona_name": "Test_Simple",
    "system_prompt": "Test",
    "default_replica_id": replica_id
}
print(f"Payload: {json.dumps(minimal_payload, indent=2)}")
response = requests.post(
    "https://tavusapi.com/v2/personas",headers=headers,
    json=minimal_payload
)
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:500]}\n")

# Test 2: With context (maybe required?)
print("=== Test 2: With Context ===")
context_payload = {
    "persona_name": "Test_Context",
    "context": "You are a test interviewer.",
    "default_replica_id": replica_id
}
print(f"Payload: {json.dumps(context_payload, indent=2)}")
response2 = requests.post(
    "https://tavusapi.com/v2/personas",
    headers=headers,
    json=context_payload
)
print(f"Status: {response2.status_code}")
print(f"Response: {response2.text[:500]}\n")

# Write results
with open('persona_test_results.txt', 'w') as f:
    f.write(f"Test 1 (system_prompt): {response.status_code}\n")
    f.write(f"{response.text}\n\n")
    f.write(f"Test 2 (context): {response2.status_code}\n")
    f.write(f"{response2.text}\n")
