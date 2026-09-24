import { Type as t, type Static } from "@sinclair/typebox";
import { Hono } from "hono";
import { requireMembership } from "../auth";
import {
  createManualChecklistRun,
  findAvailableChecklistTemplate,
  findChecklistRunForUser,
  findChecklistRunItemForUser,
  listAvailableChecklistTemplates,
  listChecklistRunItems,
  listChecklistTemplateItems,
  listUserChecklistHistory,
  setChecklistRunItemCompletion,
} from "../db";
import type { AppEnv } from "../inertia-middleware";
import { validateJson } from "../validation";

const completionBody = t.Object(
  { completed: t.Boolean() },
  { additionalProperties: false },
);
type CompletionBody = Static<typeof completionBody>;

export const checklistRoutes = () => {
  const app = new Hono<AppEnv>();

  app.get("/checklists", requireMembership, async (c) => {
    const membership = c.var.organizationMembership;
    const user = c.var.user;
    if (!membership || !user)
      return c.var.inertia.redirect("/organizations/switch");
    return c.var.inertia.render("Checklists", {
      templates: await listAvailableChecklistTemplates(
        membership.organizationId,
        user.id,
      ),
    });
  });

  app.get("/checklists/:templateId", requireMembership, async (c) => {
    const membership = c.var.organizationMembership;
    const user = c.var.user;
    if (!membership || !user)
      return c.var.inertia.redirect("/organizations/switch");

    const template = await findAvailableChecklistTemplate(
      membership.organizationId,
      user.id,
      c.req.param("templateId"),
    );
    if (!template) return c.notFound();

    const sourceKey = [
      "manual",
      membership.organizationId,
      template.id,
      `v${template.version}`,
      user.id,
    ].join(":");
    let run = await findChecklistRunForUser(
      membership.organizationId,
      user.id,
      c.req.query("run") ?? "",
    );
    if (!run || run.sourceKey !== sourceKey) {
      const items = await listChecklistTemplateItems(
        membership.organizationId,
        template.id,
      );
      run = await createManualChecklistRun({
        id: crypto.randomUUID(),
        organizationId: membership.organizationId,
        template,
        userId: user.id,
        sourceKey,
        items,
      });
    }
    if (!run) return c.text("Could not create checklist run.", 500);

    return c.var.inertia.render("ChecklistRun", {
      run,
      items: await listChecklistRunItems(
        membership.organizationId,
        user.id,
        run.id,
      ),
    });
  });

  app.post(
    "/checklists/runs/:runId/items/:runItemId",
    requireMembership,
    validateJson(completionBody),
    async (c) => {
      const membership = c.var.organizationMembership;
      const user = c.var.user;
      if (!membership || !user)
        return c.json({ error: "organization_context_required" }, 403);
      const runId = c.req.param("runId");
      const runItemId = c.req.param("runItemId");
      const run = await findChecklistRunForUser(
        membership.organizationId,
        user.id,
        runId,
      );
      if (!run) return c.json({ error: "run_not_found" }, 404);
      const item = await findChecklistRunItemForUser(
        membership.organizationId,
        user.id,
        runId,
        runItemId,
      );
      if (!item) return c.json({ error: "item_not_found" }, 404);

      const body = c.req.valid("json") as CompletionBody;
      await setChecklistRunItemCompletion({
        organizationId: membership.organizationId,
        userId: user.id,
        runId,
        runItemId,
        completed: body.completed,
      });
      const updated = await findChecklistRunForUser(
        membership.organizationId,
        user.id,
        runId,
      );
      return c.json({
        run: updated
          ? {
              id: updated.id,
              status: updated.status,
              progressPercent: updated.progressPercent,
              completedAt: updated.completedAt,
            }
          : null,
      });
    },
  );

  app.get("/history", requireMembership, async (c) => {
    const membership = c.var.organizationMembership;
    const user = c.var.user;
    if (!membership || !user)
      return c.var.inertia.redirect("/organizations/switch");
    return c.var.inertia.render("History", {
      runs: await listUserChecklistHistory(
        membership.organizationId,
        user.id,
      ),
    });
  });

  return app;
};
