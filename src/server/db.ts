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
      "SELECT id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, email_verified AS emailVerified, created_at AS createdAt FROM users WHERE email = ?",
    )
    .bind(email)
    .first<UserRow>();

export const findUserById = (id: number) =>
  d1
    .prepare(
      "SELECT id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, email_verified AS emailVerified, created_at AS createdAt FROM users WHERE id = ?",
    )
    .bind(id)
    .first<UserRow>();

export const findUserByGoogleId = (googleId: string) =>
  d1
    .prepare(
      "SELECT id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, email_verified AS emailVerified, created_at AS createdAt FROM users WHERE google_id = ?",
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
        "SELECT id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, email_verified AS emailVerified, created_at AS createdAt FROM users ORDER BY id DESC LIMIT ? OFFSET ?",
      )
      .bind(limit, offset)
      .all<UserRow>()
  ).results;

export const recentUsers = async (limit: number) =>
  (
    await d1
      .prepare(
        "SELECT id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, email_verified AS emailVerified, created_at AS createdAt FROM users ORDER BY id DESC LIMIT ?",
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
