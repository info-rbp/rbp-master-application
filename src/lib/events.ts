
import { firestore } from "@/firebase/server";
import { LifecycleEvent, LifecycleEventType } from "./definitions";
import { randomUUID } from "crypto";

export async function createLifecycleEvent<T>(
    type: LifecycleEventType,
    userId: string,
    data: T
): Promise<LifecycleEvent<T>> {
    const event: LifecycleEvent<T> = {
        id: randomUUID(),
        type,
        userId,
        data,
    };

    await firestore.collection("lifecycle_events").doc(event.id).set(event);
    return event;
}
