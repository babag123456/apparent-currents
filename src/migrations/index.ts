import * as migration_20260430_162543_add_user_google_fields from './20260430_162543_add_user_google_fields';
import * as migration_20260723_010938_pages_drafts_archive_drop_awards from './20260723_010938_pages_drafts_archive_drop_awards';
import * as migration_20260729_013756_add_presentations_and_google_slides from './20260729_013756_add_presentations_and_google_slides';
import * as migration_20260729_230120_add_presentation_slides from './20260729_230120_add_presentation_slides';

export const migrations = [
  {
    up: migration_20260430_162543_add_user_google_fields.up,
    down: migration_20260430_162543_add_user_google_fields.down,
    name: '20260430_162543_add_user_google_fields',
  },
  {
    up: migration_20260723_010938_pages_drafts_archive_drop_awards.up,
    down: migration_20260723_010938_pages_drafts_archive_drop_awards.down,
    name: '20260723_010938_pages_drafts_archive_drop_awards',
  },
  {
    up: migration_20260729_013756_add_presentations_and_google_slides.up,
    down: migration_20260729_013756_add_presentations_and_google_slides.down,
    name: '20260729_013756_add_presentations_and_google_slides',
  },
  {
    up: migration_20260729_230120_add_presentation_slides.up,
    down: migration_20260729_230120_add_presentation_slides.down,
    name: '20260729_230120_add_presentation_slides'
  },
];
