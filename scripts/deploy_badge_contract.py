"""
Deploy the SkillBadge (Badge NFT + Token Rewards) smart contract to Algorand TestNet.
Run: python scripts/deploy_badge_contract.py
Save the output App ID to .env as ALGORAND_BADGE_APP_ID
"""

from algosdk.v2client import algod
from algosdk import transaction, mnemonic, account
import os, base64
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

# Minimal TEAL approval program for SkillBadge
# Supports: create, issue_skill_badge (mints badge NFT), reward_tokens (sends $SKILL)
APPROVAL_TEAL = """
#pragma version 10

txn ApplicationID
int 0
==
bnz handle_create

txn OnCompletion
int NoOp
==
bnz handle_noop

txn OnCompletion
int OptIn
==
bnz handle_allow

txn OnCompletion
int CloseOut
==
bnz handle_allow

txn OnCompletion
int UpdateApplication
==
bnz handle_admin

txn OnCompletion
int DeleteApplication
==
bnz handle_admin

err

handle_create:
    txn Sender
    byte "admin"
    app_global_put
    txna ApplicationArgs 0
    btoi
    byte "skill_token_id"
    swap
    app_global_put
    int 1
    return

handle_admin:
    txn Sender
    byte "admin"
    app_global_get
    ==
    return

handle_allow:
    int 1
    return

handle_noop:
    txn Sender
    byte "admin"
    app_global_get
    ==
    assert

    txna ApplicationArgs 0
    byte "issue_skill_badge"
    ==
    bnz mint_badge

    txna ApplicationArgs 0
    byte "reward_tokens"
    ==
    bnz reward

    err

mint_badge:
    itxn_begin
        int acfg
        itxn_field TypeEnum
        int 1
        itxn_field ConfigAssetTotal
        int 0
        itxn_field ConfigAssetDecimals
        byte "BADGE"
        itxn_field ConfigAssetUnitName
        byte "SkillMeter Badge"
        itxn_field ConfigAssetName
        txn Note
        itxn_field Note
    itxn_submit

    itxn CreatedAssetID
    store 0

    int 1
    return

reward:
    itxn_begin
        int axfer
        itxn_field TypeEnum
        byte "skill_token_id"
        app_global_get
        itxn_field XferAsset
        txna ApplicationArgs 2
        btoi
        itxn_field AssetAmount
        txna ApplicationArgs 1
        itxn_field AssetReceiver
    itxn_submit

    int 1
    return
"""

CLEAR_TEAL = """
#pragma version 10
int 1
"""

algod_client = algod.AlgodClient('', 'https://testnet-api.algonode.cloud')

algo_mnemonic = os.environ.get('ALGORAND_MNEMONIC', '')
if not algo_mnemonic or algo_mnemonic.startswith('word1'):
    print('ERROR: Set ALGORAND_MNEMONIC in backend/.env')
    exit(1)

private_key = mnemonic.to_private_key(algo_mnemonic)
sender = account.address_from_private_key(private_key)

skill_token_id = int(os.environ.get('ALGORAND_SKILL_TOKEN_ID', '0') or '0')
if skill_token_id == 0:
    print('ERROR: Set ALGORAND_SKILL_TOKEN_ID in backend/.env first')
    print('Run scripts/create_skill_token.py first')
    exit(1)

print(f'Deployer: {sender}')
print(f'$SKILL Token ID: {skill_token_id}')
print('Compiling & deploying SkillBadge contract...')

# Compile TEAL
approval_result = algod_client.compile(APPROVAL_TEAL.strip())
clear_result = algod_client.compile(CLEAR_TEAL.strip())

approval_program = base64.b64decode(approval_result['result'])
clear_program = base64.b64decode(clear_result['result'])

params = algod_client.suggested_params()

# Global schema: 1 bytes (admin), 1 uint (skill_token_id)
# Pass skill_token_id as first app arg during creation
txn = transaction.ApplicationCreateTxn(
    sender=sender,
    sp=params,
    on_complete=transaction.OnComplete.NoOpOC,
    approval_program=approval_program,
    clear_program=clear_program,
    global_schema=transaction.StateSchema(num_uints=1, num_byte_slices=1),
    local_schema=transaction.StateSchema(num_uints=0, num_byte_slices=0),
    app_args=[skill_token_id.to_bytes(8, 'big')],
)

signed = txn.sign(private_key)
txid = algod_client.send_transaction(signed)
print(f'Transaction ID: {txid}')
print('Waiting for confirmation...')

result = transaction.wait_for_confirmation(algod_client, txid, 4)
app_id = result['application-index']

print(f'\n✅ SkillBadge contract deployed!')
print(f'   App ID: {app_id}')
print(f'   Explorer: https://testnet.explorer.algorand.org/application/{app_id}')
print(f'\n📝 Add this to backend/.env:')
print(f'   ALGORAND_BADGE_APP_ID={app_id}')
