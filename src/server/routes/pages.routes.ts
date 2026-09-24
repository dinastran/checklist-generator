/**
 * Page routes: the Inertia app-shell pages (/, /dashboard, /admin).
 * Feature pages get their own `<feature>.routes.ts` — see AGENTS.md
 * "Route conventions".
 *
 * All DB calls are async (D1).
 */
import { Hono } from "hono";
import {
  requireMembership,
  requireOrganizationAdmin,
} from "../auth";
import {
  countOrganizationUsers,
  listOrganizationUsers,
  recentOrganizationUsers,
  toPublicUser,
} from "../db";
import type { AppEnv } from "../inertia-middleware";
import type { DashboardStats, Paginated, User } from "../../shared/types";

async function dashboardStats(
  organizationId: string,
): Promise<DashboardStats> {
  return {
    userCount: (await countOrganizationUsers(organizationId))?.n ?? 0,
    recentUsers: (await recentOrganizationUsers(organizationId, 5)).map(
      toPublicUser,
    ),
  };
}

export const pageRoutes = () => {
  const app = new Hono<AppEnv>();

  app.get("/", (c) =>
    c.var.inertia.redirect(c.var.user ? "/dashboard" : "/login", 302),
  );
  app.get("/dashboard", requireMembership, async (c) => {
    const membership = c.var.organizationMembership;
    if (!membership)
      return c.var.inertia.redirect("/organizations/switch");
    return c.var.inertia.render("Dashboard", {
      stats: await dashboardStats(membership.organizationId),
      organization: {
        id: membership.organizationId,
        name: membership.organizationName,
        slug: membership.organizationSlug,
        timezone: membership.timezone,
        isAdmin: Boolean(membership.isAdmin),
      },
    });
  });
  app.get("/admin", requireOrganizationAdmin, async (c) => {
    const membership = c.var.organizationMembership;
    if (!membership)
      return c.var.inertia.redirect("/organizations/switch");
    const page = Math.max(1, Number(c.req.query("page") ?? 1) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number(c.req.query("perPage") ?? 10) || 10),
    );
    const total =
      (await countOrganizationUsers(membership.organizationId))?.n ?? 0;
    const users: Paginated<User> = {
      data: (
        await listOrganizationUsers(
          membership.organizationId,
          perPage,
          (page - 1) * perPage,
        )
      ).map(toPublicUser),
      meta: {
        currentPage: page,
        perPage,
        lastPage: Math.max(1, Math.ceil(total / perPage)),
        total,
      },
    };
    return c.var.inertia.render("Admin", { users });
  });

  return app;
};
