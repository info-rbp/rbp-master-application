
import { IToolAdapter } from "./base";
import { PlannerToolAdapter } from "./planner";

const adapters: { [key: string]: IToolAdapter } = {
    "planner": new PlannerToolAdapter(),
};

export function getToolAdapter(toolKey: string): IToolAdapter | null {
    return adapters[toolKey] || null;
}
