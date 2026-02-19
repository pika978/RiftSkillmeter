"""Check admin wallet ALGO balance on TestNet."""
import os, sys
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
from algosdk.v2client import algod

client = algod.AlgodClient('', 'https://testnet-api.algonode.cloud')
addr = 'IGKF6PEEDZXTHPT35WBBXVCWBESHGJOHYJVONSUYO4NRSSPKPENRAO6NWU'

info = client.account_info(addr)
algo = info['amount'] / 1_000_000
minbal = info['min-balance'] / 1_000_000
spendable = algo - minbal

print(f'Admin wallet:  {addr[:20]}...{addr[-8:]}')
print(f'Balance:       {algo:.4f} ALGO')
print(f'Min balance:   {minbal:.4f} ALGO')
print(f'Spendable:     {spendable:.4f} ALGO')

if spendable < 0.1:
    print()
    print('WARNING: Low balance! Fund via https://bank.testnet.algorand.network/')
    print(f'Address: {addr}')
else:
    print()
    print('Balance is sufficient for minting NFTs.')
