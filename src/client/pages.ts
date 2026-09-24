/**
 * Page registry. Explicit imports work identically in the Bun server
 * runtime and the Bun.build client bundle (Bun 1.3 removed
 * `import.meta.glob`). Keys use the `./pages/<Name>.tsx` convention that
 * `resolve()` builds from the Inertia component name.
 */
import type { ComponentType } from "react";
import Admin from "./pages/Admin";
import AdminChecklistNew from "./pages/AdminChecklistNew";
import AdminChecklists from "./pages/AdminChecklists";
import AdminRoles from "./pages/AdminRoles";
import AdminUsers from "./pages/AdminUsers";
import Checklists from "./pages/Checklists";
import ChecklistRun from "./pages/ChecklistRun";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import History from "./pages/History";
import InvitationAccept from "./pages/InvitationAccept";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import OrganizationNew from "./pages/OrganizationNew";
import OrganizationSwitch from "./pages/OrganizationSwitch";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";

// Pages receive Inertia page props of varying shapes — widen deliberately.
// biome-ignore lint/suspicious/noExplicitAny: page props are heterogeneous
type PageModule = { default: ComponentType<any> };

export const pages: Record<string, PageModule> = {
	"./pages/Admin.tsx": { default: Admin },
	"./pages/AdminChecklistNew.tsx": { default: AdminChecklistNew },
	"./pages/AdminChecklists.tsx": { default: AdminChecklists },
	"./pages/AdminRoles.tsx": { default: AdminRoles },
	"./pages/AdminUsers.tsx": { default: AdminUsers },
	"./pages/Checklists.tsx": { default: Checklists },
	"./pages/ChecklistRun.tsx": { default: ChecklistRun },
	"./pages/Dashboard.tsx": { default: Dashboard },
	"./pages/History.tsx": { default: History },
	"./pages/InvitationAccept.tsx": { default: InvitationAccept },
	"./pages/ForgotPassword.tsx": { default: ForgotPassword },
	"./pages/Login.tsx": { default: Login },
	"./pages/NotFound.tsx": { default: NotFound },
	"./pages/OrganizationNew.tsx": { default: OrganizationNew },
	"./pages/OrganizationSwitch.tsx": { default: OrganizationSwitch },
	"./pages/Profile.tsx": { default: Profile },
	"./pages/Register.tsx": { default: Register },
	"./pages/ResetPassword.tsx": { default: ResetPassword },
};

/** Fallback for unknown component names — never resolve to undefined. */
export const notFoundPage = pages["./pages/NotFound.tsx"]?.default;
