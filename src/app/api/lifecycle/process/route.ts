
import { NextResponse } from "next/server";
import { firestore } from "@/firebase/server";
import { processLifecycleEvent } from "@/lib/lifecycle";
import { LifecycleEvent } from "@/lib/definitions";

export async function GET() {
    const eventsSnap = await firestore
        .collection("lifecycle_events")
        .where("processedAt", "==", null)
        .limit(50) // To avoid timeouts
        .get();

    if (eventsSnap.empty) {
        return NextResponse.json({ ok: true, processed: 0 });
    }

    const processingPromises = eventsSnap.docs.map(doc => processLifecycleEvent(doc.data() as LifecycleEvent<any>));
    await Promise.all(processingPromises);

    return NextResponse.json({ ok: true, processed: eventsSnap.size });
}
