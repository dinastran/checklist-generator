import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { applyMigrations, closeD1Mock, createD1Mock, type D1Mock } from "./d1-mock";

let d1: D1Mock;
let userId: number;

beforeAll(async () => {
  d1 = createD1Mock();
  await applyMigrations(d1);

  const user = await d1
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?) RETURNING id")
    .bind("Owner", "owner@example.com", "hash")
    .first<{ id: number }>();
  userId = user!.id;
});

afterAll(() => {
  closeD1Mock(d1);
});

describe("checklist domain schema", () => {
  it("creates organization-scoped membership and role relationships", async () => {
    const org = await d1
      .prepare("INSERT INTO organizations (name, slug, created_by) VALUES (?, ?, ?) RETURNING id")
      .bind("Acme", "acme", userId)
      .first<{ id: number }>();

    const membership = await d1
      .prepare(
        "INSERT INTO organization_memberships (organization_id, user_id) VALUES (?, ?) RETURNING id",
      )
      .bind(org!.id, userId)
      .first<{ id: number }>();

    const role = await d1
      .prepare(
        "INSERT INTO roles (organization_id, name, is_admin) VALUES (?, ?, 1) RETURNING id",
      )
      .bind(org!.id, "Admin")
      .first<{ id: number }>();

    await d1
      .prepare("INSERT INTO membership_roles (membership_id, role_id) VALUES (?, ?)")
      .bind(membership!.id, role!.id)
      .run();

    const assigned = await d1
      .prepare(
        "SELECT mr.membership_id AS membershipId, r.organization_id AS organizationId, r.is_admin AS isAdmin FROM membership_roles mr JOIN roles r ON r.id = mr.role_id WHERE mr.membership_id = ?",
      )
      .bind(membership!.id)
      .first<{ membershipId: number; organizationId: number; isAdmin: number }>();

    expect(assigned).toEqual({
      membershipId: membership!.id,
      organizationId: org!.id,
      isAdmin: 1,
    });
  });

  it("prevents duplicate scheduled runs for the same organization, schedule, period, and user", async () => {
    const org = await d1
      .prepare("INSERT INTO organizations (name, slug, created_by) VALUES (?, ?, ?) RETURNING id")
      .bind("Ops", "ops", userId)
      .first<{ id: number }>();

    const membership = await d1
      .prepare(
        "INSERT INTO organization_memberships (organization_id, user_id) VALUES (?, ?) RETURNING id",
      )
      .bind(org!.id, userId)
      .first<{ id: number }>();

    const template = await d1
      .prepare(
        "INSERT INTO checklist_templates (organization_id, name, status, created_by) VALUES (?, ?, 'published', ?) RETURNING id",
      )
      .bind(org!.id, "Daily Ops", userId)
      .first<{ id: number }>();

    const schedule = await d1
      .prepare(
        "INSERT INTO checklist_schedules (organization_id, template_id, frequency, timezone, created_by) VALUES (?, ?, 'daily', 'Asia/Jakarta', ?) RETURNING id",
      )
      .bind(org!.id, template!.id, userId)
      .first<{ id: number }>();

    const insertRun = () =>
      d1
        .prepare(
          "INSERT INTO checklist_runs (organization_id, template_id, user_id, membership_id, schedule_id, period_key, template_name_snapshot, template_version, items_snapshot_json) VALUES (?, ?, ?, ?, ?, ?, ?, 1, '[]')",
        )
        .bind(
          org!.id,
          template!.id,
          userId,
          membership!.id,
          schedule!.id,
          "2026-09-24",
          "Daily Ops",
        )
        .run();

    await insertRun();
    await expect(insertRun()).rejects.toThrow();
  });

  it("keeps API key storage hash-only at schema level", async () => {
    const org = await d1
      .prepare("INSERT INTO organizations (name, slug, created_by) VALUES (?, ?, ?) RETURNING id")
      .bind("API Org", "api-org", userId)
      .first<{ id: number }>();

    await d1
      .prepare(
        "INSERT INTO api_keys (organization_id, label, key_prefix, key_hash, created_by) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(org!.id, "Agent", "chk_live_abcd", "sha256-hash", userId)
      .run();

    const columns = await d1
      .prepare("PRAGMA table_info(api_keys)")
      .all<{ name: string }>();

    expect(columns.results.map((column) => column.name)).toContain("key_hash");
    expect(columns.results.map((column) => column.name)).not.toContain("secret");
    expect(columns.results.map((column) => column.name)).not.toContain("api_key");
  });

  it("enforces checklist template status values", async () => {
    const org = await d1
      .prepare("INSERT INTO organizations (name, slug, created_by) VALUES (?, ?, ?) RETURNING id")
      .bind("Status Org", "status-org", userId)
      .first<{ id: number }>();

    await expect(
      d1
        .prepare(
          "INSERT INTO checklist_templates (organization_id, name, status, created_by) VALUES (?, ?, ?, ?)",
        )
        .bind(org!.id, "Invalid", "deleted", userId)
        .run(),
    ).rejects.toThrow();
  });
});
