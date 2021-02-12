import { DynamicModule, Module } from '@nestjs/common';
import { FirestoreCoreModule } from './firestore-core.module';
import { FirestoreProvider } from './firestore.provider';
import { FIRESTORE_PROVIDER } from './firestore.constants';
import { getCollectionToken } from './firestore.utils';

import { FirestoreModuleOptions } from './interfaces/firestore-options.interface';

@Module({})
export class FirestoreModule {
  static forRoot(options: FirestoreModuleOptions = {}): DynamicModule {
    return {
      module: FirestoreModule,
      imports: [FirestoreCoreModule.forRoot(options)],
    };
  }

  static forFeature(collectionName: string): DynamicModule {
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
      ],
      exports: [getCollectionToken(collectionName)],
    };
  }
}
