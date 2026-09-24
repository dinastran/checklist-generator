-- 0006_checklist_domain.sql — multi-organization checklist domain foundation.
--
-- This migration is additive. Existing auth/session tables remain intact while
-- organization-scoped authorization moves into memberships + membership_roles.

ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1));

CREATE TABLE IF NOT EXISTS organizations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  slug        TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  timezone    TEXT    NOT NULL DEFAULT 'UTC',
  created_by  INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS organization_memberships (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id  INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            TEXT    NOT NULL DEFAULT 'active'
                    CHECK (status IN ('pending', 'active', 'inactive')),
  joined_at         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user_status
  ON organization_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_org_status
  ON organization_memberships(organization_id, status);

CREATE TABLE IF NOT EXISTS roles (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id  INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT    NOT NULL COLLATE NOCASE,
  description      TEXT,
  is_admin         INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
  status           TEXT    NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'inactive', 'archived')),
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_roles_org_status
  ON roles(organization_id, status);

CREATE TABLE IF NOT EXISTS membership_roles (
  membership_id  INTEGER NOT NULL REFERENCES organization_memberships(id) ON DELETE CASCADE,
  role_id        INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (membership_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_membership_roles_role
  ON membership_roles(role_id);

CREATE TABLE IF NOT EXISTS organization_invitations (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id  INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email            TEXT    NOT NULL COLLATE NOCASE,
  token_hash       TEXT    NOT NULL UNIQUE,
  invited_by       INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status           TEXT    NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at       TEXT    NOT NULL,
  accepted_at      TEXT,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_invitations_org_email_status
  ON organization_invitations(organization_id, email, status);

CREATE TABLE IF NOT EXISTS checklist_templates (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id  INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT    NOT NULL,
  description      TEXT,
  status           TEXT    NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'published', 'archived')),
  version          INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  source_template_id INTEGER REFERENCES checklist_templates(id) ON DELETE SET NULL,
  created_by       INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  published_at     TEXT,
  archived_at      TEXT,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_templates_org_status
  ON checklist_templates(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_templates_source
  ON checklist_templates(source_template_id);

CREATE TABLE IF NOT EXISTS checklist_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id  INTEGER NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  description  TEXT,
  sort_order   INTEGER NOT NULL CHECK (sort_order >= 0),
  active       INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (template_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_items_template_active_order
  ON checklist_items(template_id, active, sort_order);

CREATE TABLE IF NOT EXISTS checklist_template_roles (
  template_id  INTEGER NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  role_id      INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (template_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_template_roles_role
  ON checklist_template_roles(role_id);

CREATE TABLE IF NOT EXISTS checklist_schedules (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id  INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id      INTEGER NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  frequency        TEXT    NOT NULL
                   CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  rule_json        TEXT,
  timezone         TEXT    NOT NULL,
  status           TEXT    NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'paused', 'archived')),
  created_by       INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_schedules_org_status
  ON checklist_schedules(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_schedules_template
  ON checklist_schedules(template_id);

CREATE TABLE IF NOT EXISTS checklist_runs (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id        INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id            INTEGER NOT NULL REFERENCES checklist_templates(id) ON DELETE RESTRICT,
  user_id                INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  membership_id          INTEGER NOT NULL REFERENCES organization_memberships(id) ON DELETE RESTRICT,
  schedule_id            INTEGER REFERENCES checklist_schedules(id) ON DELETE SET NULL,
  period_key             TEXT,
  status                 TEXT    NOT NULL DEFAULT 'in_progress'
                         CHECK (status IN ('in_progress', 'completed')),
  template_name_snapshot TEXT    NOT NULL,
  template_version       INTEGER NOT NULL CHECK (template_version >= 1),
  role_names_snapshot    TEXT    NOT NULL DEFAULT '[]',
  items_snapshot_json    TEXT    NOT NULL,
  started_at             TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_activity_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at           TEXT,
  created_at             TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status = 'in_progress' AND completed_at IS NULL)
  ),
  CHECK (
    (schedule_id IS NULL AND period_key IS NULL) OR
    (schedule_id IS NOT NULL AND period_key IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_runs_schedule_period_user_unique
  ON checklist_runs(organization_id, schedule_id, period_key, user_id)
  WHERE schedule_id IS NOT NULL AND period_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_runs_manual_active_unique
  ON checklist_runs(organization_id, template_id, user_id)
  WHERE schedule_id IS NULL AND status = 'in_progress';

CREATE INDEX IF NOT EXISTS idx_runs_org_status_activity
  ON checklist_runs(organization_id, status, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_user_activity
  ON checklist_runs(user_id, last_activity_at DESC);

CREATE TABLE IF NOT EXISTS checklist_item_completions (
  run_id        INTEGER NOT NULL REFERENCES checklist_runs(id) ON DELETE CASCADE,
  item_id       INTEGER NOT NULL REFERENCES checklist_items(id) ON DELETE RESTRICT,
  completed     INTEGER NOT NULL DEFAULT 1 CHECK (completed IN (0, 1)),
  completed_by  INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  completed_at  TEXT,
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (run_id, item_id),
  CHECK (
    (completed = 1 AND completed_at IS NOT NULL) OR
    (completed = 0 AND completed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_completions_actor
  ON checklist_item_completions(completed_by, updated_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id  INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type       TEXT    NOT NULL,
  entity_type      TEXT,
  entity_id        TEXT,
  metadata_json    TEXT    NOT NULL DEFAULT '{}',
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_org_created
  ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_created
  ON audit_logs(event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS api_keys (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id  INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label            TEXT    NOT NULL,
  key_prefix       TEXT    NOT NULL,
  key_hash         TEXT    NOT NULL UNIQUE,
  scopes_json      TEXT    NOT NULL DEFAULT '[]',
  status           TEXT    NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'revoked')),
  created_by       INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  last_used_at     TEXT,
  revoked_at       TEXT,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_api_keys_org_status
  ON api_keys(organization_id, status);

CREATE TABLE IF NOT EXISTS ai_imports (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id   INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by        INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  contract_version  TEXT    NOT NULL,
  source_type       TEXT    NOT NULL CHECK (source_type IN ('api', 'html')),
  status            TEXT    NOT NULL
                    CHECK (status IN ('validated', 'rejected', 'saved')),
  template_id       INTEGER REFERENCES checklist_templates(id) ON DELETE SET NULL,
  validation_json   TEXT    NOT NULL DEFAULT '{}',
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_imports_org_created
  ON ai_imports(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS schedule_runs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id  INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  schedule_id      INTEGER NOT NULL REFERENCES checklist_schedules(id) ON DELETE CASCADE,
  period_key       TEXT    NOT NULL,
  status           TEXT    NOT NULL
                   CHECK (status IN ('started', 'completed', 'failed')),
  created_count    INTEGER NOT NULL DEFAULT 0 CHECK (created_count >= 0),
  error_message    TEXT,
  started_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  finished_at      TEXT,
  UNIQUE (schedule_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_schedule_runs_org_started
  ON schedule_runs(organization_id, started_at DESC);
