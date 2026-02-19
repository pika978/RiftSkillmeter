import ast, os

base = r'd:\rift\AiBoomiSkillMeter'
bk = base + r'\backend\api'
src = base + r'\src\pages'

# ── 1. syntax check all Python files ────────────────────────────────
python_files = [
    bk + r'\views.py',
    bk + r'\models.py',
    bk + r'\serializers.py',
    bk + r'\services.py',
    bk + r'\badge_generator.py',
    bk + r'\urls.py',
    base + r'\contracts\skill_credential.py',
    base + r'\contracts\skill_badge.py',
    base + r'\scripts\create_skill_token.py',
    base + r'\scripts\deploy_cert_contract.py',
    base + r'\scripts\deploy_badge_contract.py',
]
print('=== PYTHON SYNTAX ===')
all_ok = True
for f in python_files:
    try:
        ast.parse(open(f, encoding='utf-8').read())
        print(f'  OK  : {os.path.basename(f)}')
    except SyntaxError as e:
        print(f'  FAIL: {os.path.basename(f)} -> {e}')
        all_ok = False
print(f'  {"ALL VALID" if all_ok else "ERRORS FOUND"} ({len(python_files)} files)\n')

# ── 2. URL routes ────────────────────────────────────────────────────
urls = open(bk + r'\urls.py', encoding='utf-8').read()
print('=== URL ROUTES ===')
route_checks = {
    'profile/':                                       'LearnerProfileView',
    'concepts/<int:concept_id>/complete/':            'mark_concept_complete',
    'assessments/<int:assessment_id>/submit/':        'submit_assessment',
    'assessments/results/':                           'list_assessment_results',
    'assessments/results/<int:result_id>/badge-image/': 'download_badge_image',
    'roadmaps/<int:roadmap_id>/mint-nft/':            'mint_certificate_nft',
    'roadmaps/<int:roadmap_id>/certificate/':         'verify_certificate',
}
for route, view in route_checks.items():
    ok = route in urls and view in urls
    print(f'  {"OK  " if ok else "MISS"}: {route}  ({view})')

# ── 3. model fields ──────────────────────────────────────────────────
models_src = open(bk + r'\models.py', encoding='utf-8').read()
print('\n=== MODEL FIELDS (LearnerProfile) ===')
for f in ['algo_wallet', 'pending_skill_tokens', 'LearnerProfile', 'onboarding_completed']:
    print(f'  {"OK  " if f in models_src else "MISS"}: {f}')

# ── 4. serializer fields ─────────────────────────────────────────────
ser = open(bk + r'\serializers.py', encoding='utf-8').read()
print('\n=== SERIALIZER FIELDS ===')
for f in ['pendingSkillTokens', 'pending_skill_tokens', 'algoWallet', 'algo_wallet',
          'AssessmentResultSerializer', 'LearnerProfileSerializer']:
    print(f'  {"OK  " if f in ser else "MISS"}: {f}')

# ── 5. services integrity ────────────────────────────────────────────
svc = open(bk + r'\services.py', encoding='utf-8').read()
print('\n=== SERVICES INTEGRITY ===')
for k in ["'concept': 1", "'daily_task'", "'course': 100",
          'AssetTransferTxn', 'AssetCreateTxn', 'pending_skill_tokens',
          'user=None', "F('pending_skill_tokens')"]:
    print(f'  {"OK  " if k in svc else "MISS"}: {k}')

# ── 6. views integrity ───────────────────────────────────────────────
views = open(bk + r'\views.py', encoding='utf-8').read()
print('\n=== VIEWS INTEGRITY ===')
for k in ['list_assessment_results', 'mint_certificate_nft',
          'pending_skill_tokens', 'was_completed',
          'user=request.user', '_get_algo_wallet', 'download_badge_image']:
    print(f'  {"OK  " if k in views else "MISS"}: {k}')

# ── 7. frontend integrity ────────────────────────────────────────────
print('\n=== FRONTEND INTEGRITY ===')
profile = open(src + r'\Profile.jsx', encoding='utf-8').read()
dashboard = open(src + r'\Dashboard.jsx', encoding='utf-8').read()

for label, code, keys in [
    ('Profile.jsx',   profile,   ['pendingSkillTokens', 'setPendingSkillTokens',
                                   'algoWallet', 'authFetch', '755783670',
                                   'pending']),
    ('Dashboard.jsx', dashboard, ['authFetch', 'SKILL_TOKEN_ID', '755783670']),
]:
    for k in keys:
        print(f'  {"OK  " if k in code else "MISS"}: {label}: {k}')

print('\n=== RAW access_token SCAN ===')
for fname, code in [('Profile.jsx', profile), ('Dashboard.jsx', dashboard)]:
    raw = "localStorage.getItem('access_token')" in code
    print(f'  {"BAD - found raw access_token!" if raw else "OK  - clean"}: {fname}')

print('\nDONE.')
