import { Type as t, type Static } from "@sinclair/typebox";
import { Hono } from "hono";
import { requireAuth, setActiveOrganization } from "../auth";
import {
  createOrganizationForUser,
  findOrganizationMembership,
  listOrganizationsForUser,
} from "../db";
import type { AppEnv } from "../inertia-middleware";
import { validateJson } from "../validation";

const organizationBody = t.Object(
  { name: t.String({ minLength: 2, maxLength: 80 }) },
  { additionalProperties: false },
);
const switchBody = t.Object(
  { organizationId: t.String({ minLength: 1, maxLength: 64 }) },
  { additionalProperties: false },
);

type OrganizationBody = Static<typeof organizationBody>;
type SwitchBody = Static<typeof switchBody>;

export const ORGANIZATION_VALIDATION_MESSAGES: Record<string, string> = {
  "/name": "Nama organisasi harus 2–80 karakter.",
  "/organizationId": "Pilih organisasi yang valid.",
};

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "organization"}-${crypto.randomUUID().slice(0, 8)}`;
}

export const organizationRoutes = () => {
  const app = new Hono<AppEnv>();

  app.get("/organizations/new", requireAuth, (c) =>
    c.var.inertia.render("OrganizationNew"),
  );

  app.post(
    "/organizations/new",
    requireAuth,
    validateJson(organizationBody),
    async (c) => {
      const body = c.req.valid("json") as OrganizationBody;
      const user = c.var.user;
      const sessionToken = c.var.sessionToken;
      if (!user || !sessionToken)
        return c.var.inertia.redirect("/login");

      const organizationId = crypto.randomUUID();
      await createOrganizationForUser({
        organizationId,
        membershipId: crypto.randomUUID(),
        adminRoleId: crypto.randomUUID(),
        userId: user.id,
        name: body.name.trim(),
        slug: slugify(body.name),
        timezone: "Asia/Jakarta",
      });
      await setActiveOrganization(sessionToken, organizationId);
      return c.var.inertia.redirect("/dashboard");
    },
  );

  app.get("/organizations/switch", requireAuth, async (c) => {
    const user = c.var.user;
    if (!user) return c.var.inertia.redirect("/login");
    const organizations = await listOrganizationsForUser(user.id);
    if (organizations.length === 0)
      return c.var.inertia.redirect("/organizations/new");
    return c.var.inertia.render("OrganizationSwitch", {
      organizations: organizations.map((organization) => ({
        id: organization.organizationId,
        name: organization.organizationName,
        slug: organization.organizationSlug,
        timezone: organization.timezone,
        isAdmin: Boolean(organization.isAdmin),
      })),
    });
  });

  app.post(
    "/organizations/switch",
    requireAuth,
    validateJson(switchBody),
    async (c) => {
      const body = c.req.valid("json") as SwitchBody;
      const user = c.var.user;
      const sessionToken = c.var.sessionToken;
      if (!user || !sessionToken)
        return c.var.inertia.redirect("/login");

      const membership = await findOrganizationMembership(
        user.id,
        body.organizationId,
      );
      if (!membership)
        return c.var.inertia.error("OrganizationSwitch", {
          organizationId: "Organisasi tidak tersedia untuk akun ini.",
        });

      await setActiveOrganization(sessionToken, membership.organizationId);
      return c.var.inertia.redirect("/dashboard");
    },
  );

  return app;
};
