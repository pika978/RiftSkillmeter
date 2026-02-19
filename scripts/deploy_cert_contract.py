"""
Deploy the SkillCredential (Certificate NFT) smart contract to Algorand TestNet.
Run: python scripts/deploy_cert_contract.py
Save the output App ID to .env as ALGORAND_CERT_APP_ID
"""

from algosdk.v2client import algod
from algosdk import transaction, mnemonic, account
import os, base64
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

# Minimal TEAL approval program for SkillCredential
# Supports: create, issue_certificate (mints ARC-69 NFT via inner txn)
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
    byte "issue_certificate"
    ==
    bnz mint_cert

    err

mint_cert:
    itxn_begin
        int acfg
        itxn_field TypeEnum
        int 1
        itxn_field ConfigAssetTotal
        int 0
        itxn_field ConfigAssetDecimals
        byte "CERT"
        itxn_field ConfigAssetUnitName
        byte "SkillMeter Certificate"
        itxn_field ConfigAssetName
        txn Note
        itxn_field Note
    itxn_submit

    itxn CreatedAssetID
    store 0

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

print(f'Deployer: {sender}')
print('Compiling & deploying SkillCredential contract...')

# Compile TEAL
approval_result = algod_client.compile(APPROVAL_TEAL.strip())
clear_result = algod_client.compile(CLEAR_TEAL.strip())

approval_program = base64.b64decode(approval_result['result'])
clear_program = base64.b64decode(clear_result['result'])

params = algod_client.suggested_params()

# Global schema: 1 bytes (admin address)
# Local schema: none
txn = transaction.ApplicationCreateTxn(
    sender=sender,
    sp=params,
    on_complete=transaction.OnComplete.NoOpOC,
    approval_program=approval_program,
    clear_program=clear_program,
    global_schema=transaction.StateSchema(num_uints=0, num_byte_slices=1),
    local_schema=transaction.StateSchema(num_uints=0, num_byte_slices=0),
)

signed = txn.sign(private_key)
txid = algod_client.send_transaction(signed)
print(f'Transaction ID: {txid}')
print('Waiting for confirmation...')

result = transaction.wait_for_confirmation(algod_client, txid, 4)
app_id = result['application-index']

print(f'\n✅ SkillCredential contract deployed!')
print(f'   App ID: {app_id}')
print(f'   Explorer: https://testnet.explorer.algorand.org/application/{app_id}')
print(f'\n📝 Add this to backend/.env:')
print(f'   ALGORAND_CERT_APP_ID={app_id}')
