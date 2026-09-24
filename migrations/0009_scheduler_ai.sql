-- 0009_scheduler_ai.sql
-- Recurring schedule metadata, execution observability, AI keys and imports.

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

CREATE TABLE schedule_executions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  schedule_id TEXT NOT NULL REFERENCES checklist_schedules(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  created_runs INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at TEXT,
  UNIQUE (schedule_id, period_key)
);

CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'revoked')),
  created_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  last_used_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE ai_imports (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  api_key_id TEXT REFERENCES api_keys(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('api', 'html')),
  contract_version TEXT,
  status TEXT NOT NULL CHECK (status IN ('validated', 'rejected', 'saved')),
  errors_json TEXT NOT NULL DEFAULT '[]',
  template_id TEXT REFERENCES checklist_templates(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_schedules_org_status
  ON checklist_schedules(organization_id, status);
CREATE INDEX idx_schedules_template
  ON checklist_schedules(template_id);
CREATE INDEX idx_schedule_executions_org
  ON schedule_executions(organization_id, started_at);
CREATE INDEX idx_api_keys_org_status
  ON api_keys(organization_id, status);
CREATE INDEX idx_ai_imports_org_created
  ON ai_imports(organization_id, created_at);
