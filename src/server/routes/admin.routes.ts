import { Type as t, type Static } from "@sinclair/typebox";
import { Hono } from "hono";
import {
  hashToken,
  requireOrganizationAdmin,
  setFlash,
} from "../auth";
import {
  archiveChecklistTemplate,
  checklistPublishReadiness,
  countActiveOrganizationAdmins,
  countActiveRolesByIds,
  createChecklistTemplate,
  findOrganizationMembership,
  findOrganizationMembershipById,
  findOrganizationRole,
  findOrganizationRoleByName,
  findSystemAdminRole,
  insertOrganizationInvitation,
  insertOrganizationRole,
  listActiveOrganizationRoles,
  listOrganizationMembers,
  listOrganizationChecklistTemplates,
  listOrganizationRoles,
  listPendingOrganizationInvitations,
  publishChecklistTemplate,
  replaceMembershipRoles,
  revokeOrganizationInvitation,
  setOrganizationRoleStatus,
} from "../db";
import type { AppEnv } from "../inertia-middleware";
import { sendMail } from "../mailer";
import { validateJson } from "../validation";

const roleBody = t.Object(
  {
    name: t.String({ minLength: 2, maxLength: 80 }),
    description: t.Optional(t.String({ maxLength: 500 })),
  },
  { additionalProperties: false },
);

const inviteBody = t.Object(
  { email: t.String({ format: "email" }) },
  { additionalProperties: false },
);

const membershipRolesBody = t.Object(
  {
    roleIds: t.Array(t.String({ minLength: 1, maxLength: 64 }), {
      maxItems: 20,
    }),
  },
  { additionalProperties: false },
);

const checklistBody = t.Object(
  {
    name: t.String({ minLength: 2, maxLength: 120 }),
    description: t.Optional(t.String({ maxLength: 1000 })),
    roleIds: t.Array(t.String({ minLength: 1, maxLength: 64 }), {
      minItems: 1,
      maxItems: 20,
    }),
    items: t.Array(
      t.Object(
        {
          title: t.String({ minLength: 1, maxLength: 200 }),
          description: t.Optional(t.String({ maxLength: 1000 })),
        },
        { additionalProperties: false },
      ),
      { minItems: 1, maxItems: 100 },
    ),
  },
  { additionalProperties: false },
);

type RoleBody = Static<typeof roleBody>;
type InviteBody = Static<typeof inviteBody>;
type MembershipRolesBody = Static<typeof membershipRolesBody>;
type ChecklistBody = Static<typeof checklistBody>;

export const ADMIN_ROLE_VALIDATION_MESSAGES: Record<string, string> = {
  "/name": "Nama role harus 2–80 karakter.",
  "/description": "Deskripsi role maksimal 500 karakter.",
};

export const ADMIN_USER_VALIDATION_MESSAGES: Record<string, string> = {
  "/email": "Masukkan alamat email yang valid.",
  "/roleIds": "Role yang dipilih tidak valid.",
};

export const ADMIN_CHECKLIST_VALIDATION_MESSAGES: Record<string, string> = {
  "/name": "Nama checklist harus 2–120 karakter.",
  "/description": "Deskripsi checklist maksimal 1.000 karakter.",
  "/roleIds": "Pilih minimal satu role aktif.",
  "/items": "Tambahkan minimal satu item checklist.",
};

export const adminRoutes = () => {
  const app = new Hono<AppEnv>();

  app.get("/admin/users", requireOrganizationAdmin, async (c) => {
    const membership = c.var.organizationMembership;
    if (!membership) return c.var.inertia.redirect("/organizations/switch");
    const [members, roles, invitations] = await Promise.all([
      listOrganizationMembers(membership.organizationId),
      listActiveOrganizationRoles(membership.organizationId),
      listPendingOrganizationInvitations(membership.organizationId),
    ]);
    return c.var.inertia.render("AdminUsers", {
      members: members.map((member) => ({
        ...member,
        roleIds: member.roleIds ? member.roleIds.split(",") : [],
        roleNames: member.roleNames ? member.roleNames.split(",") : [],
      })),
      roles,
      invitations: invitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      })),
    });
  });

  app.post(
    "/admin/users/invite",
    requireOrganizationAdmin,
    validateJson(inviteBody),
    async (c) => {
      const membership = c.var.organizationMembership;
      const user = c.var.user;
      if (!membership || !user)
        return c.var.inertia.redirect("/organizations/switch");
      const body = c.req.valid("json") as InviteBody;
      const email = body.email.trim().toLowerCase();

      const existingUser = await findUserByEmail(email);
      if (
        existingUser &&
        (await findOrganizationMembership(
          existingUser.id,
          membership.organizationId,
        ))
      )
        return c.var.inertia.error("AdminUsers", {
          email: "Email tersebut sudah menjadi anggota organisasi.",
        });

      const rawToken =
        crypto.randomUUID().replaceAll("-", "") +
        crypto.randomUUID().replaceAll("-", "");
      const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      await insertOrganizationInvitation({
        id: crypto.randomUUID(),
        organizationId: membership.organizationId,
        email,
        tokenHash: await hashToken(rawToken),
        createdByUserId: user.id,
        expiresAt,
      });

      const link = `${new URL(c.req.url).origin}/invitations/accept?token=${rawToken}`;
      await sendMail({
        to: email,
        subject: `Undangan bergabung ke ${membership.organizationName}`,
        text:
          `Anda diundang bergabung ke ${membership.organizationName}.\n\n` +
          `Login menggunakan email ini, lalu buka link berikut:\n${link}\n\n` +
          "Link berlaku 7 hari.",
        html:
          `<p>Anda diundang bergabung ke <strong>${membership.organizationName}</strong>.</p>` +
          `<p>Login menggunakan email ini, lalu buka <a href="${link}">link undangan</a>.</p>` +
          "<p>Link berlaku 7 hari.</p>",
      });

      if (c.var.sessionToken)
        await setFlash(c.var.sessionToken, {
          success: "Undangan berhasil dikirim.",
        });
      return c.var.inertia.redirect("/admin/users");
    },
  );

  app.post(
    "/admin/users/:membershipId/roles",
    requireOrganizationAdmin,
    validateJson(membershipRolesBody),
    async (c) => {
      const organization = c.var.organizationMembership;
      if (!organization)
        return c.var.inertia.redirect("/organizations/switch");
      const target = await findOrganizationMembershipById(
        organization.organizationId,
        c.req.param("membershipId") ?? "",
      );
      if (!target) return c.var.inertia.redirect("/admin/users");

      const body = c.req.valid("json") as MembershipRolesBody;
      const roleIds = [...new Set(body.roleIds)];
      if (
        (await countActiveRolesByIds(organization.organizationId, roleIds)) !==
        roleIds.length
      ) {
        if (c.var.sessionToken)
          await setFlash(c.var.sessionToken, {
            error: "Ada role yang tidak aktif atau bukan milik organisasi.",
          });
        return c.var.inertia.redirect("/admin/users");
      }

      const adminRole = await findSystemAdminRole(organization.organizationId);
      const currentRoleIds = target.roleIds ? target.roleIds.split(",") : [];
      if (
        adminRole &&
        currentRoleIds.includes(adminRole.id) &&
        !roleIds.includes(adminRole.id)
      ) {
        const adminCount = await countActiveOrganizationAdmins(
          organization.organizationId,
        );
        if ((adminCount?.n ?? 0) <= 1) {
          if (c.var.sessionToken)
            await setFlash(c.var.sessionToken, {
              error: "Admin aktif terakhir tidak dapat kehilangan role Admin.",
            });
          return c.var.inertia.redirect("/admin/users");
        }
      }

      await replaceMembershipRoles(target.membershipId, roleIds);
      if (c.var.sessionToken)
        await setFlash(c.var.sessionToken, {
          success: "Role anggota berhasil diperbarui.",
        });
      return c.var.inertia.redirect("/admin/users");
    },
  );

  app.post(
    "/admin/users/invitations/:id/revoke",
    requireOrganizationAdmin,
    async (c) => {
      const membership = c.var.organizationMembership;
      if (!membership) return c.var.inertia.redirect("/organizations/switch");
      await revokeOrganizationInvitation(
        membership.organizationId,
        c.req.param("id") ?? "",
      );
      return c.var.inertia.redirect("/admin/users");
    },
  );

  app.get("/admin/roles", requireOrganizationAdmin, async (c) => {
    const membership = c.var.organizationMembership;
    if (!membership) return c.var.inertia.redirect("/organizations/switch");
    return c.var.inertia.render("AdminRoles", {
      roles: await listOrganizationRoles(membership.organizationId),
    });
  });

  app.post(
    "/admin/roles",
    requireOrganizationAdmin,
    validateJson(roleBody),
    async (c) => {
      const membership = c.var.organizationMembership;
      if (!membership) return c.var.inertia.redirect("/organizations/switch");
      const body = c.req.valid("json") as RoleBody;
      const name = body.name.trim();
      if (name.length < 2)
        return c.var.inertia.error("AdminRoles", {
          name: "Nama role harus 2–80 karakter.",
        });
      if (await findOrganizationRoleByName(membership.organizationId, name))
        return c.var.inertia.error("AdminRoles", {
          name: "Nama role sudah digunakan di organisasi ini.",
        });

      await insertOrganizationRole(
        crypto.randomUUID(),
        membership.organizationId,
        name,
        body.description?.trim() || null,
      );
      if (c.var.sessionToken)
        await setFlash(c.var.sessionToken, { success: "Role berhasil dibuat." });
      return c.var.inertia.redirect("/admin/roles");
    },
  );

  app.post(
    "/admin/roles/:id/deactivate",
    requireOrganizationAdmin,
    async (c) => {
      const membership = c.var.organizationMembership;
      if (!membership) return c.var.inertia.redirect("/organizations/switch");
      const role = await findOrganizationRole(
        membership.organizationId,
        c.req.param("id") ?? "",
      );
      if (!role || role.isSystem)
        return c.var.inertia.redirect("/admin/roles");
      await setOrganizationRoleStatus(
        membership.organizationId,
        role.id,
        "inactive",
      );
      return c.var.inertia.redirect("/admin/roles");
    },
  );

  app.post(
    "/admin/roles/:id/activate",
    requireOrganizationAdmin,
    async (c) => {
      const membership = c.var.organizationMembership;
      if (!membership) return c.var.inertia.redirect("/organizations/switch");
      const role = await findOrganizationRole(
        membership.organizationId,
        c.req.param("id") ?? "",
      );
      if (!role || role.isSystem)
        return c.var.inertia.redirect("/admin/roles");
      await setOrganizationRoleStatus(
        membership.organizationId,
        role.id,
        "active",
      );
      return c.var.inertia.redirect("/admin/roles");
    },
  );

  app.get("/admin/checklists", requireOrganizationAdmin, async (c) => {
    const membership = c.var.organizationMembership;
    if (!membership) return c.var.inertia.redirect("/organizations/switch");
    return c.var.inertia.render("AdminChecklists", {
      templates: await listOrganizationChecklistTemplates(
        membership.organizationId,
      ),
    });
  });

  app.get("/admin/checklists/new", requireOrganizationAdmin, async (c) => {
    const membership = c.var.organizationMembership;
    if (!membership) return c.var.inertia.redirect("/organizations/switch");
    return c.var.inertia.render("AdminChecklistNew", {
      roles: await listActiveOrganizationRoles(membership.organizationId),
    });
  });

  app.post(
    "/admin/checklists",
    requireOrganizationAdmin,
    validateJson(checklistBody),
    async (c) => {
      const membership = c.var.organizationMembership;
      const user = c.var.user;
      if (!membership || !user)
        return c.var.inertia.redirect("/organizations/switch");
      const body = c.req.valid("json") as ChecklistBody;
      const roleIds = [...new Set(body.roleIds)];
      const name = body.name.trim();
      const items = body.items.map((item, index) => ({
        id: crypto.randomUUID(),
        title: item.title.trim(),
        description: item.description?.trim() || null,
        position: index + 1,
      }));
      if (!name || items.some((item) => !item.title))
        return c.var.inertia.error("AdminChecklistNew", {
          name: !name ? "Nama checklist wajib diisi." : "",
          items: items.some((item) => !item.title)
            ? "Judul setiap item wajib diisi."
            : "",
        });

      const activeRoleCount = await countActiveRolesByIds(
        membership.organizationId,
        roleIds,
      );
      if (activeRoleCount !== roleIds.length)
        return c.var.inertia.error("AdminChecklistNew", {
          roleIds: "Ada role yang tidak aktif atau bukan milik organisasi ini.",
        });

      await createChecklistTemplate({
        id: crypto.randomUUID(),
        organizationId: membership.organizationId,
        name,
        description: body.description?.trim() || null,
        createdByUserId: user.id,
        roleIds,
        items,
      });
      if (c.var.sessionToken)
        await setFlash(c.var.sessionToken, {
          success: "Draft checklist berhasil dibuat.",
        });
      return c.var.inertia.redirect("/admin/checklists");
    },
  );

  app.post(
    "/admin/checklists/:id/publish",
    requireOrganizationAdmin,
    async (c) => {
      const membership = c.var.organizationMembership;
      if (!membership) return c.var.inertia.redirect("/organizations/switch");
      const templateId = c.req.param("id") ?? "";
      const readiness = await checklistPublishReadiness(
        membership.organizationId,
        templateId,
      );
      if (readiness?.status !== "draft")
        return c.var.inertia.redirect("/admin/checklists");
      if (readiness.activeItems < 1 || readiness.activeRoles < 1) {
        if (c.var.sessionToken)
          await setFlash(c.var.sessionToken, {
            error:
              "Checklist harus memiliki minimal satu role aktif dan satu item aktif.",
          });
        return c.var.inertia.redirect("/admin/checklists");
      }
      await publishChecklistTemplate(
        membership.organizationId,
        templateId,
      );
      if (c.var.sessionToken)
        await setFlash(c.var.sessionToken, {
          success: "Checklist berhasil dipublish.",
        });
      return c.var.inertia.redirect("/admin/checklists");
    },
  );

  app.post(
    "/admin/checklists/:id/archive",
    requireOrganizationAdmin,
    async (c) => {
      const membership = c.var.organizationMembership;
      if (!membership) return c.var.inertia.redirect("/organizations/switch");
      await archiveChecklistTemplate(
        membership.organizationId,
        c.req.param("id") ?? "",
      );
      if (c.var.sessionToken)
        await setFlash(c.var.sessionToken, {
          success: "Checklist diarsipkan.",
        });
      return c.var.inertia.redirect("/admin/checklists");
    },
  );

  return app;
};
