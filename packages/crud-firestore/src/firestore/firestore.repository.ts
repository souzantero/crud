import {
  CollectionReference,
  DocumentData,
  DocumentReference,
  Query,
} from '@google-cloud/firestore';

export interface CollectionMetadata {
  fields: string[];
}

export class FirestoreRepository<T> {
  constructor(
    protected collectionName: string,
    protected collectionReference: CollectionReference<DocumentData>,
    protected collectionMetadata: CollectionMetadata,
  ) {}

  get name(): string {
    return this.collectionName;
  }

  get collection(): CollectionReference<DocumentData> {
    return this.collectionReference;
  }

  get metadata(): CollectionMetadata {
    return this.collectionMetadata;
  }
}
