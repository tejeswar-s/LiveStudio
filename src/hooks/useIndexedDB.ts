import { openDB, deleteDB } from "idb";
import { Annotation } from "../types";

const DB_NAME = "live-studio";
const DB_VERSION = 2; // bump version to force upgrade

export async function getDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains("annotations")) {
                db.createObjectStore("annotations", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("pending-sync")) {
                db.createObjectStore("pending-sync", { keyPath: "id" });
            }
        },
    });
}

export async function getAnnotations() {
    const db = await getDB();
    return db.getAll("annotations");
}

export async function saveAnnotation(annotation: any) {
    const db = await getDB();
    return db.put("annotations", annotation);
}

export async function savePendingSync(annotation: Annotation) {
    const db = await getDB();
    await db.put("pending-sync", annotation);
}

export async function getPendingSync(): Promise<Annotation[]> {
    const db = await getDB();
    return (await db.getAll("pending-sync")) as Annotation[];
}

export async function clearPendingSync() {
    const db = await getDB();
    await db.clear("pending-sync");
}

export async function clearDB() {
    await deleteDB(DB_NAME);
} 