import { Firestore, Settings } from '@google-cloud/firestore';

export class FirestoreProvider {
  private readonly firestore: Firestore;

  constructor(options: Settings) {
    this.firestore = new Firestore(options);
  }

  get() {
    return this.firestore;
  }
}
