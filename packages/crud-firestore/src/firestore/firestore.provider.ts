import * as firebase from 'firebase-admin';

export class FirestoreProvider {
  constructor(options: firebase.AppOptions) {
    if (!firebase.apps.length) {
      firebase.initializeApp(options);
    }
  }

  firestore(): firebase.firestore.Firestore {
    return firebase.firestore();
  }
}
