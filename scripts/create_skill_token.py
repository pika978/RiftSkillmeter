"""
One-time script to create the $SKILL fungible ASA on Algorand TestNet.
Run: python scripts/create_skill_token.py
Save the output ASA ID to .env as ALGORAND_SKILL_TOKEN_ID
"""

from algosdk.v2client import algod
from algosdk import transaction, mnemonic, account
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

algod_client = algod.AlgodClient(
    '', 'https://testnet-api.algonode.cloud'
)

algo_mnemonic = os.environ.get('ALGORAND_MNEMONIC', '')
if not algo_mnemonic or algo_mnemonic.startswith('word1'):
    print('ERROR: Set ALGORAND_MNEMONIC in backend/.env with your 25-word mnemonic')
    print('Get a testnet wallet from: https://app.daffi.me/ or any Algorand wallet')
    print('Fund it at: https://bank.testnet.algorand.network')
    exit(1)

private_key = mnemonic.to_private_key(algo_mnemonic)
sender = account.address_from_private_key(private_key)

print(f'Admin wallet: {sender}')
print('Creating $SKILL token on TestNet...')

params = algod_client.suggested_params()

txn = transaction.AssetCreateTxn(
    sender=sender,
    sp=params,
    total=10_000_000,      # 10 million SKILL tokens total supply
    decimals=0,
    default_frozen=False,
    unit_name='SKILL',
    asset_name='SkillMeter SKILL Token',
    manager=sender,
    reserve=sender,
)

signed = txn.sign(private_key)
txid = algod_client.send_transaction(signed)
print(f'Transaction ID: {txid}')
print('Waiting for confirmation...')

result = transaction.wait_for_confirmation(algod_client, txid, 4)
asset_id = result['asset-index']

print(f'\n✅ $SKILL ASA created successfully!')
print(f'   ASA ID: {asset_id}')
print(f'   Explorer: https://testnet.explorer.algorand.org/asset/{asset_id}')
print(f'\n📝 Add this to backend/.env:')
print(f'   ALGORAND_SKILL_TOKEN_ID={asset_id}')
