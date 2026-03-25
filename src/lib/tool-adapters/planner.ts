
import { MembershipTier, Tool, ToolAccount } from "../definitions";
import { IToolAdapter } from "./base";
import { firestore } from "@/firebase/server";

export class PlannerToolAdapter implements IToolAdapter {
    getRequiredTier(): MembershipTier {
        return "basic";
    }

    getBaseUrl(): string {
        return "https://planner.example.com";
    }

    allowedGoogleScopes(): string[] {
        return ["https://www.googleapis.com/auth/calendar.events.readonly"];
    }

    async ensureAccount(userId: string, tool: Tool): Promise<ToolAccount> {
        const docId = `${userId}_${tool.toolKey}`;
        const ref = firestore.collection("tool_accounts").doc(docId);
        const snap = await ref.get();

        if (snap.exists) {
            return snap.data() as ToolAccount;
        }

        const newAccount: ToolAccount = {
            userId,
            toolKey: tool.toolKey,
            tenantId: `tenant_${userId}`,
            externalUserId: `planner_user_${userId}`,
            externalWorkspaceId: `planner_ws_${userId}`,
            role: "member",
            status: "active",
            lastProvisionedAt: new Date().toISOString(),
        };

        await ref.set(newAccount);
        return newAccount;
    }

    async buildLaunchClaims(userId: string, tool: Tool, account: ToolAccount): Promise<object> {
        const user = await firestore.collection("users").doc(userId).get();
        return {
            email: user.data()?.email,
            toolKey: tool.toolKey,
            membershipTier: user.data()?.membershipTier ?? "basic",
            tenantId: account.tenantId,
            workspaceId: account.externalWorkspaceId,
            role: account.role,
            googleBrokerAllowed: true,
            googleScopes: this.allowedGoogleScopes(),
        };
    }
}
