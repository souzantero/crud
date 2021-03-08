import { CollectionReference, DocumentData } from '@google-cloud/firestore';

export async function deleteCollection(collection: CollectionReference<DocumentData>) {
  return collection.get().then((snapshot) => {
    if (!snapshot.size) {
      return;
    }

    const batch = collection.firestore.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    return batch.commit();
  });
}

export async function insertCollection(
  collection: CollectionReference<DocumentData>,
  seeds: any[],
) {
  const batch = collection.firestore.batch();
  seeds.forEach((seed) => {
    const doc = collection.doc(seed.id);
    const now = Date.now();
    batch.set(doc, { ...seed, createdAt: now, updatedAt: now });
  });

  return await batch.commit();
}
