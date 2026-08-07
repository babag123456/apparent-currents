import * as migration_20260807_085222_initial_baseline from './20260807_085222_initial_baseline';
import * as migration_20260807_110910_domain_collections from './20260807_110910_domain_collections';
import * as migration_20260807_112753_fixture_sync_flag from './20260807_112753_fixture_sync_flag';

export const migrations = [
  {
    up: migration_20260807_085222_initial_baseline.up,
    down: migration_20260807_085222_initial_baseline.down,
    name: '20260807_085222_initial_baseline',
  },
  {
    up: migration_20260807_110910_domain_collections.up,
    down: migration_20260807_110910_domain_collections.down,
    name: '20260807_110910_domain_collections',
  },
  {
    up: migration_20260807_112753_fixture_sync_flag.up,
    down: migration_20260807_112753_fixture_sync_flag.down,
    name: '20260807_112753_fixture_sync_flag'
  },
];
