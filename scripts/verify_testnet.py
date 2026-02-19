"""
Quick verification of existing TestNet deployments.
Checks that CERT_APP_ID, BADGE_APP_ID and SKILL_TOKEN_ID are live.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from algosdk.v2client import algod

client = algod.AlgodClient('', 'https://testnet-api.algonode.cloud')

cert_app_id   = int(os.environ.get('ALGORAND_CERT_APP_ID', 0))
badge_app_id  = int(os.environ.get('ALGORAND_BADGE_APP_ID', 0))
skill_token_id = int(os.environ.get('ALGORAND_SKILL_TOKEN_ID', 0))

print(f'Verifying TestNet deployments...')
print(f'  CERT_APP_ID   = {cert_app_id}')
print(f'  BADGE_APP_ID  = {badge_app_id}')
print(f'  SKILL_TOKEN   = {skill_token_id}')
print()

ok = True

# Check SkillCredential contract
try:
    info = client.application_info(cert_app_id)
    creator = info['params']['creator']
    print(f'[OK] SkillCredential app {cert_app_id} is LIVE')
    print(f'     Creator: {creator}')
    print(f'     Explorer: https://lora.algokit.io/testnet/application/{cert_app_id}')
except Exception as e:
    print(f'[FAIL] CERT app {cert_app_id}: {e}')
    ok = False

print()

# Check SkillBadge contract
try:
    info = client.application_info(badge_app_id)
    creator = info['params']['creator']
    print(f'[OK] SkillBadge app {badge_app_id} is LIVE')
    print(f'     Creator: {creator}')
    print(f'     Explorer: https://lora.algokit.io/testnet/application/{badge_app_id}')
except Exception as e:
    print(f'[FAIL] BADGE app {badge_app_id}: {e}')
    ok = False

print()

# Check $SKILL token
try:
    info = client.asset_info(skill_token_id)
    name = info['params']['name']
    total = info['params']['total']
    unit = info['params']['unit-name']
    print(f'[OK] $SKILL ASA {skill_token_id} is LIVE')
    print(f'     Name: {name} ({unit})  Total: {total:,}')
    print(f'     Explorer: https://lora.algokit.io/testnet/asset/{skill_token_id}')
except Exception as e:
    print(f'[FAIL] SKILL token {skill_token_id}: {e}')
    ok = False

print()
if ok:
    print('All 3 deployments verified on Algorand TestNet.')
else:
    print('Some deployments failed — check ALGORAND_MNEMONIC and App IDs.')
    sys.exit(1)
