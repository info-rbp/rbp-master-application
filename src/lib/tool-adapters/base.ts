
import { MembershipTier, Tool, ToolAccount } from "../definitions";

export interface IToolAdapter {
    ensureAccount(userId: string, tool: Tool): Promise<ToolAccount>;
    buildLaunchClaims(userId: string, tool: Tool, account: ToolAccount): Promise<object>;
    getRequiredTier(): MembershipTier;
    getBaseUrl(): string;
    allowedGoogleScopes(): string[];
}
