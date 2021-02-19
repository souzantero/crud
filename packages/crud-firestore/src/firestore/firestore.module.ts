import { DynamicModule, Module } from '@nestjs/common';
import { CollectionReference, DocumentData } from '@google-cloud/firestore';
import { FirestoreCoreModule } from './firestore-core.module';
import { FirestoreProvider } from './firestore.provider';
import { FIRESTORE_PROVIDER } from './firestore.constants';
import { getCollectionToken, getRepositoryToken } from './firestore.utils';

import { FirestoreModuleOptions } from './interfaces/firestore-options.interface';
import { FirestoreRepository } from './firestore.repository';

@Module({})
export class FirestoreModule {
  static forRoot(options: FirestoreModuleOptions = {}): DynamicModule {
    return {
      module: FirestoreModule,
      imports: [FirestoreCoreModule.forRoot(options)],
    };
  }

  static forFeature(collectionName: string, options: any): DynamicModule {
    return {
      module: FirestoreModule,
      providers: [
        {
          provide: getCollectionToken(collectionName),
          useFactory: (firestoreProvider: FirestoreProvider) => {
            return firestoreProvider.get().collection(collectionName);
          },
          inject: [FIRESTORE_PROVIDER],
        },
        {
          provide: getRepositoryToken(collectionName),
          useFactory: (collectionReference: CollectionReference<DocumentData>) => {
            return new FirestoreRepository(collectionName, collectionReference, {
              fields: options.collectionFields,
            });
          },
          inject: [getCollectionToken(collectionName)],
        },
      ],
      exports: [getCollectionToken(collectionName), getRepositoryToken(collectionName)],
    };
  }
}
