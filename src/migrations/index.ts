import * as migration_20260807_085222_initial_baseline from './20260807_085222_initial_baseline';
import * as migration_20260807_110910_domain_collections from './20260807_110910_domain_collections';

export const migrations = [
  {
    up: migration_20260807_085222_initial_baseline.up,
    down: migration_20260807_085222_initial_baseline.down,
    name: '20260807_085222_initial_baseline',
  },
  {
    up: migration_20260807_110910_domain_collections.up,
    down: migration_20260807_110910_domain_collections.down,
    name: '20260807_110910_domain_collections'
  },
];
