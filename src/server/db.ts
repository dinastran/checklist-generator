/**
 * D1 database layer — async, zero-ORM.
 *
 * Replaces bun:sqlite (sync prepared statements). D1 bindings arrive
 * per-request via `env.DB`; `initDb(d1)` stores the binding in a module-level
 * variable so query functions can access it without threading it through
 * every callsite. D1 caches prepared statements internally, so calling
 * `prepare()` on each invocation is cheap.
 *
 * Schema comes from migrations/ applied via `wrangler d1 migrations apply`.
 */
import type { Role } from "../shared/types";

let d1: D1Database;

/** Set the D1 binding for the current request. Called in the fetch handler. */
export function initDb(db: D1Database): void {
  d1 = db;
}

// ---------------------------------------------------------------------------
// Row types (unchanged from bun:sqlite — D1 returns the same column names)
// ---------------------------------------------------------------------------

export interface UserRow {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  googleId: string | null;
  avatarUrl: string | null;
  emailVerified: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface SessionRow {
  tokenHash: string;
  userId: number;
  flash: string;
  activeOrganizationId: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface PasswordResetRow {
  email: string;
  tokenHash: string;
  expiresAt: string;
}

export interface UploadRow {
  id: string;
  uploadLength: number;
  offset: number;
  metadata: string;
  userId: number | null;
  path: string;
  createdAt: string;
  expiresAt: string | null;
}

/** The user shape that may leave the server (never includes passwordHash). */
export type PublicUser = Omit<UserRow, "passwordHash" | "googleId">;

export const toPublicUser = (row: UserRow): PublicUser => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  avatarUrl: row.avatarUrl,
  emailVerified: row.emailVerified,
  status: row.status,
  createdAt: row.createdAt,
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const createUser = (name: string, email: string, passwordHash: string) =>
  d1
    .prepare(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?) RETURNING id",
    )
    .bind(name, email, passwordHash)
    .first<{ id: number }>();

export const createUserWithRole = (
  name: string,
  email: string,
  passwordHash: string,
  role: Role,
) =>
  d1
    .prepare(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?) RETURNING id",
    )
    .bind(name, email, passwordHash, role)
    .first<{ id: number }>();

export const createGoogleUser = (
  name: string,
  email: string,
  googleId: string,
  avatarUrl: string,
) =>
  d1
    .prepare(
      "INSERT INTO users (name, email, password_hash, google_id, avatar_url) VALUES (?, ?, '', ?, ?) RETURNING id",
    )
    .bind(name, email, googleId, avatarUrl)
    .first<{ id: number }>();

export const findUserByEmail = (email: string) =>
  d1
    .prepare(
      "SELECT id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, email_verified AS emailVerified, status, created_at AS createdAt FROM users WHERE email = ?",
    )
    .bind(email)
    .first<UserRow>();

export const findUserById = (id: number) =>
  d1
    .prepare(
      "SELECT id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, email_verified AS emailVerified, status, created_at AS createdAt FROM users WHERE id = ?",
    )
    .bind(id)
    .first<UserRow>();

export const findUserByGoogleId = (googleId: string) =>
  d1
    .prepare(
      "SELECT id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, email_verified AS emailVerified, status, created_at AS createdAt FROM users WHERE google_id = ?",
    )
    .bind(googleId)
    .first<UserRow>();

export const linkGoogleAccount = (googleId: string, id: number) =>
  d1
    .prepare("UPDATE users SET google_id = ? WHERE id = ?")
    .bind(googleId, id)
    .run();

export const updateUserPassword = (passwordHash: string, id: number) =>
  d1
    .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .bind(passwordHash, id)
    .run();

export const updateUserAvatar = (avatarUrl: string, id: number) =>
  d1
    .prepare("UPDATE users SET avatar_url = ? WHERE id = ?")
    .bind(avatarUrl, id)
    .run();

export const updateUserProfile = (name: string, email: string, id: number) =>
  d1
    .prepare("UPDATE users SET name = ?, email = ? WHERE id = ?")
    .bind(name, email, id)
    .run();

export const countUsers = () =>
  d1.prepare("SELECT COUNT(*) AS n FROM users").first<{ n: number }>();

export const listUsers = async (limit: number, offset: number) =>
  (
    await d1
      .prepare(
        "SELECT id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, email_verified AS emailVerified, status, created_at AS createdAt FROM users ORDER BY id DESC LIMIT ? OFFSET ?",
      )
      .bind(limit, offset)
      .all<UserRow>()
  ).results;

export const recentUsers = async (limit: number) =>
  (
    await d1
      .prepare(
        "SELECT id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, email_verified AS emailVerified, status, created_at AS createdAt FROM users ORDER BY id DESC LIMIT ?",
      )
      .bind(limit)
      .all<UserRow>()
  ).results;

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export const insertSession = (
  tokenHash: string,
  userId: number,
  expiresAt: string,
) =>
  d1
    .prepare(
      "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
    )
    .bind(tokenHash, userId, expiresAt)
    .run();

export const findSession = (tokenHash: string) =>
  d1
    .prepare(
      "SELECT token_hash AS tokenHash, user_id AS userId, flash, active_organization_id AS activeOrganizationId, expires_at AS expiresAt, created_at AS createdAt FROM sessions WHERE token_hash = ?",
    )
    .bind(tokenHash)
    .first<SessionRow>();

export const deleteSession = (tokenHash: string) =>
  d1.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();

export const deleteOtherSessions = (userId: number, tokenHash: string) =>
  d1
    .prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?")
    .bind(userId, tokenHash)
    .run();

export const updateSessionFlash = (flash: string, tokenHash: string) =>
  d1
    .prepare("UPDATE sessions SET flash = ? WHERE token_hash = ?")
    .bind(flash, tokenHash)
    .run();

// ---------------------------------------------------------------------------
// Password resets
// ---------------------------------------------------------------------------

export const insertPasswordReset = (
  email: string,
  tokenHash: string,
  expiresAt: string,
) =>
  d1
    .prepare(
      "INSERT INTO password_resets (email, token_hash, expires_at) VALUES (?, ?, ?)",
    )
    .bind(email, tokenHash, expiresAt)
    .run();

export const findPasswordReset = (tokenHash: string) =>
  d1
    .prepare(
      "SELECT email, token_hash AS tokenHash, expires_at AS expiresAt FROM password_resets WHERE token_hash = ?",
    )
    .bind(tokenHash)
    .first<PasswordResetRow>();

export const deletePasswordResetsByEmail = (email: string) =>
  d1
    .prepare("DELETE FROM password_resets WHERE email = ?")
    .bind(email)
    .run();

// ---------------------------------------------------------------------------
// Uploads (tus) — retained for profile avatar linking; byte storage is
// skipped in the CF experiment (no R2 binding yet).
// ---------------------------------------------------------------------------

export const insertUpload = (
  id: string,
  uploadLength: number,
  metadata: string,
  userId: number | null,
  path: string,
  expiresAt: string | null,
) =>
  d1
    .prepare(
      "INSERT INTO uploads (id, upload_length, metadata, user_id, path, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(id, uploadLength, metadata, userId, path, expiresAt)
    .run();

export const findUpload = (id: string) =>
  d1
    .prepare(
      "SELECT id, upload_length AS uploadLength, offset, metadata, user_id AS userId, path, created_at AS createdAt, expires_at AS expiresAt FROM uploads WHERE id = ?",
    )
    .bind(id)
    .first<UploadRow>();

export const advanceOffset = (increment: number, id: string, expected: number) =>
  d1
    .prepare(
      "UPDATE uploads SET offset = offset + ? WHERE id = ? AND offset = ? RETURNING 1 AS n",
    )
    .bind(increment, id, expected)
    .first<{ n: number }>();

export const deleteUpload = (id: string) =>
  d1.prepare("DELETE FROM uploads WHERE id = ?").bind(id).run();

export const listExpired = async (now: string) =>
  (
    await d1
      .prepare(
        "SELECT id, upload_length AS uploadLength, offset, metadata, user_id AS userId, path, created_at AS createdAt, expires_at AS expiresAt FROM uploads WHERE expires_at IS NOT NULL AND expires_at < ?",
      )
      .bind(now)
      .all<UploadRow>()
  ).results;

// ---------------------------------------------------------------------------
// Organizations and memberships
// ---------------------------------------------------------------------------

export interface OrganizationMembershipRow {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  timezone: string;
  isAdmin: number;
}

export interface OrganizationSummaryRow {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  timezone: string;
  isAdmin: number;
}

export interface CreateOrganizationInput {
  organizationId: string;
  membershipId: string;
  adminRoleId: string;
  userId: number;
  name: string;
  slug: string;
  timezone: string;
}

export async function createOrganizationForUser(
  input: CreateOrganizationInput,
): Promise<void> {
  await d1.batch([
    d1
      .prepare(
        "INSERT INTO organizations (id, name, slug, timezone, created_by_user_id) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(
        input.organizationId,
        input.name,
        input.slug,
        input.timezone,
        input.userId,
      ),
    d1
      .prepare(
        "INSERT INTO organization_memberships (id, organization_id, user_id) VALUES (?, ?, ?)",
      )
      .bind(input.membershipId, input.organizationId, input.userId),
    d1
      .prepare(
        "INSERT INTO roles (id, organization_id, name, description, is_system) VALUES (?, ?, 'Admin', 'Administrator organisasi', 1)",
      )
      .bind(input.adminRoleId, input.organizationId),
    d1
      .prepare(
        "INSERT INTO membership_roles (membership_id, role_id) VALUES (?, ?)",
      )
      .bind(input.membershipId, input.adminRoleId),
  ]);
}

export const findOrganizationMembership = (
  userId: number,
  organizationId: string,
) =>
  d1
    .prepare(
      `SELECT
        m.id AS membershipId,
        o.id AS organizationId,
        o.name AS organizationName,
        o.slug AS organizationSlug,
        o.timezone,
        CASE WHEN EXISTS (
          SELECT 1
          FROM membership_roles mr
          JOIN roles r ON r.id = mr.role_id
          WHERE mr.membership_id = m.id
            AND r.organization_id = o.id
            AND r.name = 'Admin'
            AND r.status = 'active'
        ) THEN 1 ELSE 0 END AS isAdmin
      FROM organization_memberships m
      JOIN organizations o ON o.id = m.organization_id
      WHERE m.user_id = ?
        AND m.organization_id = ?
        AND m.status = 'active'
        AND o.status = 'active'`,
    )
    .bind(userId, organizationId)
    .first<OrganizationMembershipRow>();

export const listOrganizationsForUser = async (userId: number) =>
  (
    await d1
      .prepare(
        `SELECT
          m.id AS membershipId,
          o.id AS organizationId,
          o.name AS organizationName,
          o.slug AS organizationSlug,
          o.timezone,
          CASE WHEN EXISTS (
            SELECT 1
            FROM membership_roles mr
            JOIN roles r ON r.id = mr.role_id
            WHERE mr.membership_id = m.id
              AND r.organization_id = o.id
              AND r.name = 'Admin'
              AND r.status = 'active'
          ) THEN 1 ELSE 0 END AS isAdmin
        FROM organization_memberships m
        JOIN organizations o ON o.id = m.organization_id
        WHERE m.user_id = ?
          AND m.status = 'active'
          AND o.status = 'active'
        ORDER BY o.name COLLATE NOCASE`,
      )
      .bind(userId)
      .all<OrganizationSummaryRow>()
  ).results;

export const updateSessionActiveOrganization = (
  organizationId: string | null,
  tokenHash: string,
) =>
  d1
    .prepare(
      "UPDATE sessions SET active_organization_id = ? WHERE token_hash = ?",
    )
    .bind(organizationId, tokenHash)
    .run();

export const countOrganizationUsers = (organizationId: string) =>
  d1
    .prepare(
      "SELECT COUNT(*) AS n FROM organization_memberships WHERE organization_id = ? AND status = 'active'",
    )
    .bind(organizationId)
    .first<{ n: number }>();

export const listOrganizationUsers = async (
  organizationId: string,
  limit: number,
  offset: number,
) =>
  (
    await d1
      .prepare(
        `SELECT
          u.id,
          u.name,
          u.email,
          u.password_hash AS passwordHash,
          u.role,
          u.google_id AS googleId,
          u.avatar_url AS avatarUrl,
          u.email_verified AS emailVerified,
          u.status,
          u.created_at AS createdAt
        FROM organization_memberships m
        JOIN users u ON u.id = m.user_id
        WHERE m.organization_id = ? AND m.status = 'active'
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?`,
      )
      .bind(organizationId, limit, offset)
      .all<UserRow>()
  ).results;

export const recentOrganizationUsers = async (
  organizationId: string,
  limit: number,
) =>
  (
    await d1
      .prepare(
        `SELECT
          u.id,
          u.name,
          u.email,
          u.password_hash AS passwordHash,
          u.role,
          u.google_id AS googleId,
          u.avatar_url AS avatarUrl,
          u.email_verified AS emailVerified,
          u.status,
          u.created_at AS createdAt
        FROM organization_memberships m
        JOIN users u ON u.id = m.user_id
        WHERE m.organization_id = ? AND m.status = 'active'
        ORDER BY m.created_at DESC
        LIMIT ?`,
      )
      .bind(organizationId, limit)
      .all<UserRow>()
  ).results;

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

/** Cheap liveness probe for the /health endpoint. */
export const pingDb = () =>
  d1.prepare("SELECT 1 AS n").first<{ n: number }>();

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

export interface EmailVerificationRow {
  tokenHash: string;
  userId: number;
  expiresAt: string;
}

export const insertEmailVerification = (
  tokenHash: string,
  userId: number,
  expiresAt: string,
) =>
  d1
    .prepare(
      "INSERT INTO email_verifications (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
    )
    .bind(tokenHash, userId, expiresAt)
    .run();

export const findEmailVerification = (tokenHash: string) =>
  d1
    .prepare(
      "SELECT token_hash AS tokenHash, user_id AS userId, expires_at AS expiresAt FROM email_verifications WHERE token_hash = ?",
    )
    .bind(tokenHash)
    .first<EmailVerificationRow>();

export const deleteEmailVerification = (tokenHash: string) =>
  d1
    .prepare("DELETE FROM email_verifications WHERE token_hash = ?")
    .bind(tokenHash)
    .run();

export const deleteUserEmailVerifications = (userId: number) =>
  d1
    .prepare("DELETE FROM email_verifications WHERE user_id = ?")
    .bind(userId)
    .run();

export const verifyUserEmail = (userId: number) =>
  d1
    .prepare("UPDATE users SET email_verified = 1 WHERE id = ?")
    .bind(userId)
    .run();


// ---------------------------------------------------------------------------
// Organization roles
// ---------------------------------------------------------------------------

export interface OrganizationRoleRow {
  id: string;
  name: string;
  description: string | null;
  isSystem: number;
  status: "active" | "inactive";
  userCount: number;
  templateCount: number;
}

export const listOrganizationRoles = async (organizationId: string) =>
  (
    await d1
      .prepare(
        `SELECT
          r.id,
          r.name,
          r.description,
          r.is_system AS isSystem,
          r.status,
          COUNT(DISTINCT mr.membership_id) AS userCount,
          COUNT(DISTINCT ctr.template_id) AS templateCount
        FROM roles r
        LEFT JOIN membership_roles mr ON mr.role_id = r.id
        LEFT JOIN checklist_template_roles ctr ON ctr.role_id = r.id
        WHERE r.organization_id = ?
        GROUP BY r.id
        ORDER BY r.is_system DESC, r.name COLLATE NOCASE`,
      )
      .bind(organizationId)
      .all<OrganizationRoleRow>()
  ).results;

export const listActiveOrganizationRoles = async (organizationId: string) =>
  (
    await d1
      .prepare(
        "SELECT id, name, description, is_system AS isSystem, status, 0 AS userCount, 0 AS templateCount FROM roles WHERE organization_id = ? AND status = 'active' ORDER BY name COLLATE NOCASE",
      )
      .bind(organizationId)
      .all<OrganizationRoleRow>()
  ).results;

export const findOrganizationRoleByName = (
  organizationId: string,
  name: string,
) =>
  d1
    .prepare(
      "SELECT id, name, description, is_system AS isSystem, status, 0 AS userCount, 0 AS templateCount FROM roles WHERE organization_id = ? AND name = ? COLLATE NOCASE",
    )
    .bind(organizationId, name)
    .first<OrganizationRoleRow>();

export const findOrganizationRole = (
  organizationId: string,
  roleId: string,
) =>
  d1
    .prepare(
      "SELECT id, name, description, is_system AS isSystem, status, 0 AS userCount, 0 AS templateCount FROM roles WHERE organization_id = ? AND id = ?",
    )
    .bind(organizationId, roleId)
    .first<OrganizationRoleRow>();

export const insertOrganizationRole = (
  id: string,
  organizationId: string,
  name: string,
  description: string | null,
) =>
  d1
    .prepare(
      "INSERT INTO roles (id, organization_id, name, description) VALUES (?, ?, ?, ?)",
    )
    .bind(id, organizationId, name, description)
    .run();

export const updateOrganizationRole = (
  organizationId: string,
  roleId: string,
  name: string,
  description: string | null,
) =>
  d1
    .prepare(
      "UPDATE roles SET name = ?, description = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE organization_id = ? AND id = ? AND is_system = 0",
    )
    .bind(name, description, organizationId, roleId)
    .run();

export const setOrganizationRoleStatus = (
  organizationId: string,
  roleId: string,
  status: "active" | "inactive",
) =>
  d1
    .prepare(
      "UPDATE roles SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE organization_id = ? AND id = ? AND is_system = 0",
    )
    .bind(status, organizationId, roleId)
    .run();

export const countActiveRolesByIds = async (
  organizationId: string,
  roleIds: string[],
): Promise<number> => {
  if (roleIds.length === 0) return 0;
  const placeholders = roleIds.map(() => "?").join(", ");
  const row = await d1
    .prepare(
      `SELECT COUNT(*) AS n FROM roles WHERE organization_id = ? AND status = 'active' AND id IN (${placeholders})`,
    )
    .bind(organizationId, ...roleIds)
    .first<{ n: number }>();
  return row?.n ?? 0;
};

// ---------------------------------------------------------------------------
// Checklist templates and execution
// ---------------------------------------------------------------------------

export interface ChecklistTemplateSummaryRow {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  version: number;
  itemCount: number;
  roleCount: number;
  updatedAt: string;
}

export interface ChecklistTemplateRow {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  version: number;
  createdByUserId: number;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItemRow {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isActive: number;
}

export interface CreateChecklistTemplateInput {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdByUserId: number;
  roleIds: string[];
  items: Array<{
    id: string;
    title: string;
    description: string | null;
    position: number;
  }>;
}

export async function createChecklistTemplate(
  input: CreateChecklistTemplateInput,
): Promise<void> {
  const statements = [
    d1
      .prepare(
        "INSERT INTO checklist_templates (id, organization_id, name, description, created_by_user_id) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(
        input.id,
        input.organizationId,
        input.name,
        input.description,
        input.createdByUserId,
      ),
    ...input.roleIds.map((roleId) =>
      d1
        .prepare(
          "INSERT INTO checklist_template_roles (template_id, role_id) VALUES (?, ?)",
        )
        .bind(input.id, roleId),
    ),
    ...input.items.map((item) =>
      d1
        .prepare(
          "INSERT INTO checklist_items (id, organization_id, template_id, title, description, position) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(
          item.id,
          input.organizationId,
          input.id,
          item.title,
          item.description,
          item.position,
        ),
    ),
  ];
  await d1.batch(statements);
}

export const listOrganizationChecklistTemplates = async (
  organizationId: string,
) =>
  (
    await d1
      .prepare(
        `SELECT
          t.id,
          t.name,
          t.description,
          t.status,
          t.version,
          COUNT(DISTINCT i.id) AS itemCount,
          COUNT(DISTINCT tr.role_id) AS roleCount,
          t.updated_at AS updatedAt
        FROM checklist_templates t
        LEFT JOIN checklist_items i
          ON i.template_id = t.id AND i.is_active = 1
        LEFT JOIN checklist_template_roles tr ON tr.template_id = t.id
        WHERE t.organization_id = ?
        GROUP BY t.id
        ORDER BY t.updated_at DESC`,
      )
      .bind(organizationId)
      .all<ChecklistTemplateSummaryRow>()
  ).results;

export const findOrganizationChecklistTemplate = (
  organizationId: string,
  templateId: string,
) =>
  d1
    .prepare(
      `SELECT
        id,
        organization_id AS organizationId,
        name,
        description,
        status,
        version,
        created_by_user_id AS createdByUserId,
        published_at AS publishedAt,
        archived_at AS archivedAt,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM checklist_templates
      WHERE organization_id = ? AND id = ?`,
    )
    .bind(organizationId, templateId)
    .first<ChecklistTemplateRow>();

export const listChecklistTemplateItems = async (
  organizationId: string,
  templateId: string,
) =>
  (
    await d1
      .prepare(
        `SELECT id, title, description, position, is_active AS isActive
         FROM checklist_items
         WHERE organization_id = ? AND template_id = ?
         ORDER BY position`,
      )
      .bind(organizationId, templateId)
      .all<ChecklistItemRow>()
  ).results;

export const listChecklistTemplateRoleIds = async (
  organizationId: string,
  templateId: string,
) =>
  (
    await d1
      .prepare(
        `SELECT tr.role_id AS roleId
         FROM checklist_template_roles tr
         JOIN roles r ON r.id = tr.role_id
         WHERE tr.template_id = ? AND r.organization_id = ?`,
      )
      .bind(templateId, organizationId)
      .all<{ roleId: string }>()
  ).results;

export const checklistPublishReadiness = (
  organizationId: string,
  templateId: string,
) =>
  d1
    .prepare(
      `SELECT
        t.status,
        (SELECT COUNT(*) FROM checklist_items i WHERE i.template_id = t.id AND i.organization_id = t.organization_id AND i.is_active = 1) AS activeItems,
        (SELECT COUNT(*) FROM checklist_template_roles tr JOIN roles r ON r.id = tr.role_id WHERE tr.template_id = t.id AND r.organization_id = t.organization_id AND r.status = 'active') AS activeRoles
      FROM checklist_templates t
      WHERE t.organization_id = ? AND t.id = ?`,
    )
    .bind(organizationId, templateId)
    .first<{
      status: "draft" | "published" | "archived";
      activeItems: number;
      activeRoles: number;
    }>();

export const publishChecklistTemplate = (
  organizationId: string,
  templateId: string,
) =>
  d1
    .prepare(
      "UPDATE checklist_templates SET status = 'published', published_at = COALESCE(published_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), archived_at = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE organization_id = ? AND id = ? AND status = 'draft'",
    )
    .bind(organizationId, templateId)
    .run();

export const archiveChecklistTemplate = (
  organizationId: string,
  templateId: string,
) =>
  d1
    .prepare(
      "UPDATE checklist_templates SET status = 'archived', archived_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE organization_id = ? AND id = ? AND status != 'archived'",
    )
    .bind(organizationId, templateId)
    .run();

export interface AvailableChecklistTemplateRow {
  id: string;
  name: string;
  description: string | null;
  version: number;
  roleNames: string;
}

export const listAvailableChecklistTemplates = async (
  organizationId: string,
  userId: number,
) =>
  (
    await d1
      .prepare(
        `SELECT
          t.id,
          t.name,
          t.description,
          t.version,
          GROUP_CONCAT(DISTINCT r.name) AS roleNames
        FROM organization_memberships m
        JOIN membership_roles mr ON mr.membership_id = m.id
        JOIN roles r
          ON r.id = mr.role_id
          AND r.organization_id = m.organization_id
          AND r.status = 'active'
        JOIN checklist_template_roles tr ON tr.role_id = r.id
        JOIN checklist_templates t
          ON t.id = tr.template_id
          AND t.organization_id = m.organization_id
          AND t.status = 'published'
        WHERE m.organization_id = ?
          AND m.user_id = ?
          AND m.status = 'active'
        GROUP BY t.id
        ORDER BY t.name COLLATE NOCASE`,
      )
      .bind(organizationId, userId)
      .all<AvailableChecklistTemplateRow>()
  ).results;

export const findAvailableChecklistTemplate = (
  organizationId: string,
  userId: number,
  templateId: string,
) =>
  d1
    .prepare(
      `SELECT
        t.id,
        t.name,
        t.description,
        t.version,
        GROUP_CONCAT(DISTINCT r.name) AS roleNames
      FROM organization_memberships m
      JOIN membership_roles mr ON mr.membership_id = m.id
      JOIN roles r
        ON r.id = mr.role_id
        AND r.organization_id = m.organization_id
        AND r.status = 'active'
      JOIN checklist_template_roles tr ON tr.role_id = r.id
      JOIN checklist_templates t
        ON t.id = tr.template_id
        AND t.organization_id = m.organization_id
        AND t.status = 'published'
      WHERE m.organization_id = ?
        AND m.user_id = ?
        AND m.status = 'active'
        AND t.id = ?
      GROUP BY t.id`,
    )
    .bind(organizationId, userId, templateId)
    .first<AvailableChecklistTemplateRow>();

export interface ChecklistRunRow {
  id: string;
  organizationId: string;
  templateId: string;
  templateVersion: number;
  userId: number;
  sourceKey: string;
  templateName: string;
  roleName: string | null;
  status: "in_progress" | "completed";
  progressPercent: number;
  startedAt: string;
  lastActivityAt: string;
  completedAt: string | null;
}

export interface ChecklistRunItemRow {
  id: string;
  title: string;
  description: string | null;
  position: number;
  completed: number;
  completedAt: string | null;
}

export const findChecklistRunBySourceKey = (
  organizationId: string,
  userId: number,
  sourceKey: string,
) =>
  d1
    .prepare(
      `SELECT
        id,
        organization_id AS organizationId,
        template_id AS templateId,
        template_version AS templateVersion,
        user_id AS userId,
        source_key AS sourceKey,
        template_name_snapshot AS templateName,
        role_name_snapshot AS roleName,
        status,
        progress_percent AS progressPercent,
        started_at AS startedAt,
        last_activity_at AS lastActivityAt,
        completed_at AS completedAt
      FROM checklist_runs
      WHERE organization_id = ? AND user_id = ? AND source_key = ?`,
    )
    .bind(organizationId, userId, sourceKey)
    .first<ChecklistRunRow>();

export async function createManualChecklistRun(input: {
  id: string;
  organizationId: string;
  template: AvailableChecklistTemplateRow;
  userId: number;
  sourceKey: string;
  items: ChecklistItemRow[];
}): Promise<ChecklistRunRow | null> {
  const statements = [
    d1
      .prepare(
        `INSERT OR IGNORE INTO checklist_runs
          (id, organization_id, template_id, template_version, user_id, source_key, template_name_snapshot, role_name_snapshot)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.organizationId,
        input.template.id,
        input.template.version,
        input.userId,
        input.sourceKey,
        input.template.name,
        input.template.roleNames,
      ),
    ...input.items
      .filter((item) => item.isActive === 1)
      .map((item) =>
        d1
          .prepare(
            `INSERT INTO checklist_run_items
              (id, run_id, source_item_id, title, description, position)
             SELECT ?, ?, ?, ?, ?, ?
             WHERE EXISTS (SELECT 1 FROM checklist_runs WHERE id = ?)`,
          )
          .bind(
            crypto.randomUUID(),
            input.id,
            item.id,
            item.title,
            item.description,
            item.position,
            input.id,
          ),
      ),
  ];
  await d1.batch(statements);
  return findChecklistRunBySourceKey(
    input.organizationId,
    input.userId,
    input.sourceKey,
  );
}

export const findChecklistRunForUser = (
  organizationId: string,
  userId: number,
  runId: string,
) =>
  d1
    .prepare(
      `SELECT
        id,
        organization_id AS organizationId,
        template_id AS templateId,
        template_version AS templateVersion,
        user_id AS userId,
        source_key AS sourceKey,
        template_name_snapshot AS templateName,
        role_name_snapshot AS roleName,
        status,
        progress_percent AS progressPercent,
        started_at AS startedAt,
        last_activity_at AS lastActivityAt,
        completed_at AS completedAt
      FROM checklist_runs
      WHERE organization_id = ? AND user_id = ? AND id = ?`,
    )
    .bind(organizationId, userId, runId)
    .first<ChecklistRunRow>();

export const listChecklistRunItems = async (
  organizationId: string,
  userId: number,
  runId: string,
) =>
  (
    await d1
      .prepare(
        `SELECT
          ri.id,
          ri.title,
          ri.description,
          ri.position,
          CASE WHEN c.run_item_id IS NULL THEN 0 ELSE 1 END AS completed,
          c.completed_at AS completedAt
        FROM checklist_runs r
        JOIN checklist_run_items ri ON ri.run_id = r.id
        LEFT JOIN checklist_item_completions c
          ON c.run_id = r.id AND c.run_item_id = ri.id
        WHERE r.organization_id = ? AND r.user_id = ? AND r.id = ?
        ORDER BY ri.position`,
      )
      .bind(organizationId, userId, runId)
      .all<ChecklistRunItemRow>()
  ).results;

export const findChecklistRunItemForUser = (
  organizationId: string,
  userId: number,
  runId: string,
  runItemId: string,
) =>
  d1
    .prepare(
      `SELECT ri.id
       FROM checklist_runs r
       JOIN checklist_run_items ri ON ri.run_id = r.id
       WHERE r.organization_id = ? AND r.user_id = ? AND r.id = ? AND ri.id = ?`,
    )
    .bind(organizationId, userId, runId, runItemId)
    .first<{ id: string }>();

export async function setChecklistRunItemCompletion(input: {
  organizationId: string;
  userId: number;
  runId: string;
  runItemId: string;
  completed: boolean;
}): Promise<void> {
  const completionStatement = input.completed
    ? d1
        .prepare(
          `INSERT INTO checklist_item_completions
            (run_id, run_item_id, completed_by_user_id, updated_by_user_id)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(run_id, run_item_id) DO UPDATE SET
             completed_by_user_id = excluded.completed_by_user_id,
             completed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
             updated_by_user_id = excluded.updated_by_user_id,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
        )
        .bind(input.runId, input.runItemId, input.userId, input.userId)
    : d1
        .prepare(
          "DELETE FROM checklist_item_completions WHERE run_id = ? AND run_item_id = ?",
        )
        .bind(input.runId, input.runItemId);

  const totalSql =
    "(SELECT COUNT(*) FROM checklist_run_items ri WHERE ri.run_id = checklist_runs.id)";
  const completedSql =
    "(SELECT COUNT(*) FROM checklist_item_completions c WHERE c.run_id = checklist_runs.id)";
  await d1.batch([
    completionStatement,
    d1
      .prepare(
        `UPDATE checklist_runs
         SET progress_percent = CASE
               WHEN ${totalSql} = 0 THEN 0
               ELSE CAST((${completedSql} * 100) / ${totalSql} AS INTEGER)
             END,
             status = CASE
               WHEN ${totalSql} > 0 AND ${completedSql} >= ${totalSql}
                 THEN 'completed'
               ELSE 'in_progress'
             END,
             completed_at = CASE
               WHEN ${totalSql} > 0 AND ${completedSql} >= ${totalSql}
                 THEN COALESCE(completed_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
               ELSE NULL
             END,
             last_activity_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ? AND organization_id = ? AND user_id = ?`,
      )
      .bind(input.runId, input.organizationId, input.userId),
  ]);
}

export const listUserChecklistHistory = async (
  organizationId: string,
  userId: number,
  limit = 50,
) =>
  (
    await d1
      .prepare(
        `SELECT
          id,
          organization_id AS organizationId,
          template_id AS templateId,
          template_version AS templateVersion,
          user_id AS userId,
          source_key AS sourceKey,
          template_name_snapshot AS templateName,
          role_name_snapshot AS roleName,
          status,
          progress_percent AS progressPercent,
          started_at AS startedAt,
          last_activity_at AS lastActivityAt,
          completed_at AS completedAt
        FROM checklist_runs
        WHERE organization_id = ? AND user_id = ?
        ORDER BY last_activity_at DESC
        LIMIT ?`,
      )
      .bind(organizationId, userId, limit)
      .all<ChecklistRunRow>()
  ).results;


// ---------------------------------------------------------------------------
// Membership management and invitations
// ---------------------------------------------------------------------------

export interface OrganizationMemberRow {
  membershipId: string;
  userId: number;
  name: string;
  email: string;
  userStatus: "active" | "inactive";
  membershipStatus: "active" | "inactive";
  roleIds: string | null;
  roleNames: string | null;
}

export interface OrganizationInvitationRow {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  tokenHash: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
}

export const listOrganizationMembers = async (organizationId: string) =>
  (
    await d1
      .prepare(
        `SELECT
          m.id AS membershipId,
          u.id AS userId,
          u.name,
          u.email,
          u.status AS userStatus,
          m.status AS membershipStatus,
          GROUP_CONCAT(DISTINCT r.id) AS roleIds,
          GROUP_CONCAT(DISTINCT r.name) AS roleNames
        FROM organization_memberships m
        JOIN users u ON u.id = m.user_id
        LEFT JOIN membership_roles mr ON mr.membership_id = m.id
        LEFT JOIN roles r
          ON r.id = mr.role_id AND r.organization_id = m.organization_id
        WHERE m.organization_id = ?
        GROUP BY m.id
        ORDER BY u.name COLLATE NOCASE, u.email COLLATE NOCASE`,
      )
      .bind(organizationId)
      .all<OrganizationMemberRow>()
  ).results;

export const findOrganizationMembershipById = (
  organizationId: string,
  membershipId: string,
) =>
  d1
    .prepare(
      `SELECT
        m.id AS membershipId,
        u.id AS userId,
        u.name,
        u.email,
        u.status AS userStatus,
        m.status AS membershipStatus,
        GROUP_CONCAT(DISTINCT r.id) AS roleIds,
        GROUP_CONCAT(DISTINCT r.name) AS roleNames
      FROM organization_memberships m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN membership_roles mr ON mr.membership_id = m.id
      LEFT JOIN roles r
        ON r.id = mr.role_id AND r.organization_id = m.organization_id
      WHERE m.organization_id = ? AND m.id = ?
      GROUP BY m.id`,
    )
    .bind(organizationId, membershipId)
    .first<OrganizationMemberRow>();

export const replaceMembershipRoles = async (
  membershipId: string,
  roleIds: string[],
): Promise<void> => {
  await d1.batch([
    d1
      .prepare("DELETE FROM membership_roles WHERE membership_id = ?")
      .bind(membershipId),
    ...roleIds.map((roleId) =>
      d1
        .prepare(
          "INSERT INTO membership_roles (membership_id, role_id) VALUES (?, ?)",
        )
        .bind(membershipId, roleId),
    ),
  ]);
};

export const findSystemAdminRole = (organizationId: string) =>
  d1
    .prepare(
      "SELECT id FROM roles WHERE organization_id = ? AND name = 'Admin' AND is_system = 1 AND status = 'active'",
    )
    .bind(organizationId)
    .first<{ id: string }>();

export const countActiveOrganizationAdmins = (organizationId: string) =>
  d1
    .prepare(
      `SELECT COUNT(DISTINCT m.id) AS n
       FROM organization_memberships m
       JOIN users u ON u.id = m.user_id AND u.status = 'active'
       JOIN membership_roles mr ON mr.membership_id = m.id
       JOIN roles r
         ON r.id = mr.role_id
         AND r.organization_id = m.organization_id
         AND r.name = 'Admin'
         AND r.is_system = 1
         AND r.status = 'active'
       WHERE m.organization_id = ? AND m.status = 'active'`,
    )
    .bind(organizationId)
    .first<{ n: number }>();

export const insertOrganizationMembership = (
  id: string,
  organizationId: string,
  userId: number,
) =>
  d1
    .prepare(
      "INSERT INTO organization_memberships (id, organization_id, user_id) VALUES (?, ?, ?)",
    )
    .bind(id, organizationId, userId)
    .run();

export const insertOrganizationInvitation = (input: {
  id: string;
  organizationId: string;
  email: string;
  tokenHash: string;
  createdByUserId: number;
  expiresAt: string;
}) =>
  d1
    .prepare(
      `INSERT INTO organization_invitations
        (id, organization_id, email, token_hash, created_by_user_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.organizationId,
      input.email,
      input.tokenHash,
      input.createdByUserId,
      input.expiresAt,
    )
    .run();

export const findPendingOrganizationInvitation = (
  tokenHash: string,
) =>
  d1
    .prepare(
      `SELECT
        i.id,
        i.organization_id AS organizationId,
        o.name AS organizationName,
        i.email,
        i.token_hash AS tokenHash,
        i.status,
        i.expires_at AS expiresAt,
        i.created_at AS createdAt
      FROM organization_invitations i
      JOIN organizations o ON o.id = i.organization_id
      WHERE i.token_hash = ?
        AND i.status = 'pending'
        AND o.status = 'active'`,
    )
    .bind(tokenHash)
    .first<OrganizationInvitationRow>();

export const listPendingOrganizationInvitations = async (
  organizationId: string,
) =>
  (
    await d1
      .prepare(
        `SELECT
          i.id,
          i.organization_id AS organizationId,
          o.name AS organizationName,
          i.email,
          i.token_hash AS tokenHash,
          i.status,
          i.expires_at AS expiresAt,
          i.created_at AS createdAt
        FROM organization_invitations i
        JOIN organizations o ON o.id = i.organization_id
        WHERE i.organization_id = ?
          AND i.status = 'pending'
          AND i.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        ORDER BY i.created_at DESC`,
      )
      .bind(organizationId)
      .all<OrganizationInvitationRow>()
  ).results;

export const acceptOrganizationInvitation = (
  invitationId: string,
  userId: number,
) =>
  d1
    .prepare(
      `UPDATE organization_invitations
       SET status = 'accepted',
           accepted_by_user_id = ?,
           accepted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ? AND status = 'pending'`,
    )
    .bind(userId, invitationId)
    .run();

export const revokeOrganizationInvitation = (
  organizationId: string,
  invitationId: string,
) =>
  d1
    .prepare(
      "UPDATE organization_invitations SET status = 'revoked' WHERE organization_id = ? AND id = ? AND status = 'pending'",
    )
    .bind(organizationId, invitationId)
    .run();
