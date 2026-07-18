import * as migration_20260430_162543_add_user_google_fields from './20260430_162543_add_user_google_fields';
import * as migration_20260718_011824 from './20260718_011824';

export const migrations = [
  {
    up: migration_20260430_162543_add_user_google_fields.up,
    down: migration_20260430_162543_add_user_google_fields.down,
    name: '20260430_162543_add_user_google_fields',
  },
  {
    up: migration_20260718_011824.up,
    down: migration_20260718_011824.down,
    name: '20260718_011824'
  },
];
