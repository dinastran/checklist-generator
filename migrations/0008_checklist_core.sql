-- 0008_checklist_core.sql
-- Versioned checklist templates, assignments, execution snapshots and audit.

CREATE TABLE checklist_templates (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  published_at TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE checklist_items (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL CHECK (position >= 1),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (template_id, position)
);

CREATE TABLE checklist_template_roles (
  template_id TEXT NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (template_id, role_id)
);

CREATE TABLE checklist_schedules (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL
    CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'custom')),
  rule TEXT,
  timezone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused')),
  created_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE checklist_runs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES checklist_templates(id) ON DELETE RESTRICT,
  template_version INTEGER NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  schedule_id TEXT REFERENCES checklist_schedules(id) ON DELETE SET NULL,
  period_key TEXT,
  source_key TEXT NOT NULL UNIQUE,
  template_name_snapshot TEXT NOT NULL,
  role_name_snapshot TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  progress_percent INTEGER NOT NULL DEFAULT 0
    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_activity_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at TEXT
);

CREATE TABLE checklist_run_items (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES checklist_runs(id) ON DELETE CASCADE,
  source_item_id TEXT REFERENCES checklist_items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL CHECK (position >= 1),
  UNIQUE (run_id, position)
);

CREATE TABLE checklist_item_completions (
  run_id TEXT NOT NULL REFERENCES checklist_runs(id) ON DELETE CASCADE,
  run_item_id TEXT NOT NULL REFERENCES checklist_run_items(id) ON DELETE CASCADE,
  completed_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  completed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (run_id, run_item_id)
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_templates_org_status
  ON checklist_templates(organization_id, status, updated_at);
CREATE INDEX idx_items_template_active
  ON checklist_items(template_id, is_active, position);
CREATE INDEX idx_template_roles_role
  ON checklist_template_roles(role_id, template_id);
CREATE INDEX idx_schedules_org_status
  ON checklist_schedules(organization_id, status);
CREATE INDEX idx_schedules_template
  ON checklist_schedules(template_id);
CREATE INDEX idx_runs_org_user_status
  ON checklist_runs(organization_id, user_id, status, last_activity_at);
CREATE INDEX idx_runs_org_template_status
  ON checklist_runs(organization_id, template_id, status);
CREATE INDEX idx_run_items_run_position
  ON checklist_run_items(run_id, position);
CREATE INDEX idx_audit_org_created
  ON audit_logs(organization_id, created_at);
