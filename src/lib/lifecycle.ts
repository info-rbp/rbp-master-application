
import { firestore } from "@/firebase/server";
import { LifecycleEvent, LifecycleEventType, ToolLifecycleEvent } from "./definitions";
import { getToolAdapter } from "./tool-adapters";

async function provisionTool(userId: string, toolKey: string) {
    const adapter = getToolAdapter(toolKey);
    if (!adapter) {
        console.error(`No adapter found for tool: ${toolKey}`);
        return;
    }

    const tool = (await firestore.collection('tools_catalog').doc(toolKey).get()).data();
    if (!tool) {
        console.error(`Tool not found in catalog: ${toolKey}`);
        return;
    }

    await adapter.ensureAccount(userId, tool as any);
}

async function handleUserCreated(event: LifecycleEvent) {
    const tools = await firestore.collection('tools_catalog').where('enabled', '==', true).get();
    for (const tool of tools.docs) {
        await provisionTool(event.userId, tool.id);
    }
}

async function handleMembershipTierChanged(event: LifecycleEvent<{
    newTier: string;
    oldTier: string;
}>) {
    // For now, we'll just re-provision all tools.
    // In the future, we can be more granular.
    const tools = await firestore.collection('tools_catalog').where('enabled', '==', true).get();
    for (const tool of tools.docs) {
        await provisionTool(event.userId, tool.id);
    }
}


export async function processLifecycleEvent(event: LifecycleEvent<any>) {
    switch (event.type) {
        case "user.created":
            await handleUserCreated(event);
            break;
        case "membership.tier_changed":
            await handleMembershipTierChanged(event);
            break;
        default:
            console.log(`No handler for lifecycle event type: ${event.type}`);
    }

    const eventRef = firestore.collection("lifecycle_events").doc(event.id);
    await eventRef.update({ processedAt: new Date().toISOString() });
}
