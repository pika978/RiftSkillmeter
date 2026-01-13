import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"

# 1. Register/Login a test user
session = requests.Session()
username = "testuser_progress_final"
password = "testpassword123"

print(f"[-] Registering/Logging in user: {username}")
try:
    # Try register
    reg_res = session.post(f"{BASE_URL}/auth/register/", json={
        "username": username,
        "email": f"{username}@example.com",
        "password": password,
        "password2": password,
        "first_name": "Test",
        "last_name": "User"
    })
    
    if reg_res.status_code == 201:
        print("[+] Registration successful")
        token = reg_res.json()['access']
    else:
        # Try login
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
    
    # 2. Get Roadmaps (Create one if none)
    print("[-] Fetching Roadmaps...")
    roadmaps_res = requests.get(f"{BASE_URL}/roadmaps/", headers=headers)
    roadmaps = roadmaps_res.json()
    
    if not roadmaps:
        print("[-] No roadmap found. Generating one...")
        gen_res = requests.post(f"{BASE_URL}/roadmaps/generate/", json={"topic": "Python", "skillLevel": "beginner"}, headers=headers)
        if gen_res.status_code == 201:
            print("[+] Roadmap generated")
            roadmaps = [gen_res.json()]
        else:
            print(f"[!] Generation failed: {gen_res.text}")
            sys.exit(1)
            
    roadmap = roadmaps[0]
    course = roadmap['course']
    print(f"[-] Selected Course: {course['title']}")
    
    # 3. Pick a concept
    first_chapter = course['chapters'][0]
    first_concept = first_chapter['concepts'][0]
    concept_id = first_concept['id']
    print(f"[-] Selected Concept: {first_concept['title']} (ID: {concept_id})")
    
    # Check initial status (should be false/None if new)
    initial_completed = first_concept.get('completed', False)
    print(f"[-] Initial 'completed' status in API: {initial_completed}")

    # 4. Mark as Complete
    print("[-] Marking as complete...")
    comp_res = requests.post(f"{BASE_URL}/concepts/{concept_id}/complete/", headers=headers)
    if comp_res.status_code == 200:
        print("[+] Mark complete request successful")
    else:
        print(f"[!] Mark complete failed: {comp_res.text}")
        sys.exit(1)
        
    # 5. Re-fetch Roadmap to verify 'completed' field
    print("[-] Re-fetching Roadmap to verify status...")
    roadmaps_res_2 = requests.get(f"{BASE_URL}/roadmaps/", headers=headers)
    updated_roadmap = roadmaps_res_2.json()[0]
    updated_concept = updated_roadmap['course']['chapters'][0]['concepts'][0]
    
    final_completed = updated_concept.get('completed')
    print(f"[-] Final 'completed' status in API: {final_completed}")
    
    # 6. Check User Progress
    print("[-] Checking User Progress stats...")
    prog_res = requests.get(f"{BASE_URL}/progress/", headers=headers)
    stats = prog_res.json()
    print(f"[-] Stats: Minutes Learned={stats.get('totalMinutesLearned')}, Concepts Completed={stats.get('totalConceptsCompleted')}")

    # 7. Check Daily Progress for Charts
    print("[-] Checking Daily Progress data for charts...")
    daily_progress = stats.get('dailyProgress')
    if isinstance(daily_progress, list) and len(daily_progress) > 0:
        day_one = daily_progress[0]
        print(f"[-] Sample Daily Data: {day_one}")
        if 'date' in day_one and 'minutesLearned' in day_one and 'conceptsCompleted' in day_one:
            print("[+] Daily Progress structure is correct (matches Frontend expectations)")
        else:
            print("[!] Daily Progress structure IS MISSING KEYS")
            final_completed = False # Fail the test
    else:
        print("[!] Daily Progress is missing or empty")
        final_completed = False

    if final_completed is True:
        print("\nSUCCESS: End-to-end integration verified. API returns 'completed: true' after action.")
    else:
        print("\nFAILURE: API did not return 'completed: true'.")

except Exception as e:
    print(f"[!] Error: {e}")
