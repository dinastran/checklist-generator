import { Type as t, type Static } from "@sinclair/typebox";
import { Hono } from "hono";
import {
  hashToken,
  requireAuth,
  setActiveOrganization,
  setFlash,
} from "../auth";
import {
  acceptOrganizationInvitation,
  findOrganizationMembership,
  findPendingOrganizationInvitation,
  insertOrganizationMembership,
} from "../db";
import type { AppEnv } from "../inertia-middleware";
import { validateJson } from "../validation";

const acceptBody = t.Object(
  { token: t.String({ minLength: 32, maxLength: 256 }) },
  { additionalProperties: false },
);
type AcceptBody = Static<typeof acceptBody>;

async function resolveInvitation(token: string) {
  if (!token) return null;
  const invitation = await findPendingOrganizationInvitation(
    await hashToken(token),
  );
  if (!invitation) return null;
  if (Date.now() > new Date(invitation.expiresAt).getTime()) return null;
  return invitation;
}

export const invitationRoutes = () => {
  const app = new Hono<AppEnv>();

  app.get("/invitations/accept", requireAuth, async (c) => {
    const user = c.var.user;
    if (!user) return c.var.inertia.redirect("/login");
    const token = c.req.query("token") ?? "";
    const invitation = await resolveInvitation(token);
    if (!invitation)
      return c.var.inertia.render("InvitationAccept", {
        token: "",
        organizationName: null,
        invitedEmail: null,
        canAccept: false,
        message: "Undangan tidak valid atau sudah kedaluwarsa.",
      });

    const matchesEmail =
      invitation.email.toLowerCase() === user.email.toLowerCase();
    return c.var.inertia.render("InvitationAccept", {
      token,
      organizationName: invitation.organizationName,
      invitedEmail: invitation.email,
      canAccept: matchesEmail,
      message: matchesEmail
        ? null
        : "Login menggunakan email yang menerima undangan ini.",
    });
  });

  app.post(
    "/invitations/accept",
    requireAuth,
    validateJson(acceptBody),
    async (c) => {
      const user = c.var.user;
      const sessionToken = c.var.sessionToken;
      if (!user || !sessionToken)
        return c.var.inertia.redirect("/login");

      const body = c.req.valid("json") as AcceptBody;
      const invitation = await resolveInvitation(body.token);
      if (!invitation)
        return c.var.inertia.error("InvitationAccept", {
          token: "Undangan tidak valid atau sudah kedaluwarsa.",
        });
      if (invitation.email.toLowerCase() !== user.email.toLowerCase())
        return c.var.inertia.error("InvitationAccept", {
          token: "Undangan ini ditujukan untuk akun email lain.",
        });

      const existing = await findOrganizationMembership(
        user.id,
        invitation.organizationId,
      );
      if (!existing)
        await insertOrganizationMembership(
          crypto.randomUUID(),
          invitation.organizationId,
          user.id,
        );
      await acceptOrganizationInvitation(invitation.id, user.id);
      await setActiveOrganization(sessionToken, invitation.organizationId);
      await setFlash(sessionToken, {
        success: `Berhasil bergabung ke ${invitation.organizationName}.`,
      });
      return c.var.inertia.redirect("/dashboard");
    },
  );

  return app;
};
