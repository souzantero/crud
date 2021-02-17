import {
  CollectionReference,
  DocumentData,
  DocumentReference,
  Query,
} from '@google-cloud/firestore';

export class FirestoreRepository<T> {
  constructor(
    protected collectionName: string,
    protected collectionReference: CollectionReference<DocumentData>,
  ) {}

  get name(): string {
    return this.collectionName;
  }

  document(documentPath: string): DocumentReference<DocumentData> {
    return this.collectionReference.doc(documentPath);
  }
}
