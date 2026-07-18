import * as migration_20260430_162543_add_user_google_fields from './20260430_162543_add_user_google_fields';
import * as migration_20260718_011824 from './20260718_011824';
import * as migration_20260718_025007 from './20260718_025007';
import * as migration_20260718_070309 from './20260718_070309';

export const migrations = [
  {
    up: migration_20260430_162543_add_user_google_fields.up,
    down: migration_20260430_162543_add_user_google_fields.down,
    name: '20260430_162543_add_user_google_fields',
  },
  {
    up: migration_20260718_011824.up,
    down: migration_20260718_011824.down,
    name: '20260718_011824',
  },
  {
    up: migration_20260718_025007.up,
    down: migration_20260718_025007.down,
    name: '20260718_025007',
  },
  {
    up: migration_20260718_070309.up,
    down: migration_20260718_070309.down,
    name: '20260718_070309'
  },
];
