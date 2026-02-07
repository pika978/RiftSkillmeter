import json

with open('service-account-key.json', 'r') as f:
    data = json.load(f)
    
project_id = data.get('project_id', 'NOT FOUND')
print(f"Project ID: {project_id}")
