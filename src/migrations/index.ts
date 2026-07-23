import * as migration_20260430_162543_add_user_google_fields from './20260430_162543_add_user_google_fields';
import * as migration_20260723_010938_pages_drafts_archive_drop_awards from './20260723_010938_pages_drafts_archive_drop_awards';

export const migrations = [
  {
    up: migration_20260430_162543_add_user_google_fields.up,
    down: migration_20260430_162543_add_user_google_fields.down,
    name: '20260430_162543_add_user_google_fields',
  },
  {
    up: migration_20260723_010938_pages_drafts_archive_drop_awards.up,
    down: migration_20260723_010938_pages_drafts_archive_drop_awards.down,
    name: '20260723_010938_pages_drafts_archive_drop_awards'
  },
];
