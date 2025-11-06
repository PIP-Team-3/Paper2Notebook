#!/usr/bin/env python
"""
Delete plan assets from Supabase storage to allow regeneration.

Usage:
    python delete_plan_assets.py <plan_id>
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add API to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from app.data.supabase import SupabaseClientFactory, SupabaseStorage

def delete_plan_assets(plan_id: str):
    """Delete notebook and requirements files for a plan."""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not url or not key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
        return False

    factory = SupabaseClientFactory(url, key)
    client = factory.build()
    storage = SupabaseStorage(client, 'plans')

    notebook_key = f'{plan_id}/notebook.ipynb'
    env_key = f'{plan_id}/requirements.txt'

    print(f'Deleting existing files for plan {plan_id}...')
    print(f'  - {notebook_key}', end=' ')
    result1 = storage.delete_object(notebook_key)
    print('✓ Deleted' if result1 else '✗ Not found')

    print(f'  - {env_key}', end=' ')
    result2 = storage.delete_object(env_key)
    print('✓ Deleted' if result2 else '✗ Not found')

    print()
    print('✓ Done! You can now retry the materialize endpoint.')
    return True

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)

    plan_id = sys.argv[1]
    success = delete_plan_assets(plan_id)
    sys.exit(0 if success else 1)
