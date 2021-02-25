import { DynamicModule, Module } from '@nestjs/common';
import { CollectionReference, DocumentData } from '@google-cloud/firestore';
import { FirestoreCoreModule } from './firestore-core.module';
import { FirestoreProvider } from './firestore.provider';
import { FIRESTORE_PROVIDER } from './firestore.constants';
import { getCollectionToken, getMetadataToken } from './firestore.utils';

import {
  FirestoreFeatureOptions,
  FirestoreModuleOptions,
} from './interfaces/firestore-options.interface';
import { CollectionMetadata } from './interfaces/collection-metadata.interface';

@Module({})
export class FirestoreModule {
  static forRoot(options: FirestoreModuleOptions = {}): DynamicModule {
    return {
      module: FirestoreModule,
      imports: [FirestoreCoreModule.forRoot(options)],
    };
  }

  static forFeature(options: FirestoreFeatureOptions): DynamicModule {
    const collectionToken = getCollectionToken(options.name);
    const metadataToken = getMetadataToken(options.name);

    return {
      module: FirestoreModule,
      providers: [
        {
          provide: collectionToken,
          useFactory: (firestoreProvider: FirestoreProvider) => {
            return firestoreProvider.get().collection(options.name);
          },
          inject: [FIRESTORE_PROVIDER],
        },
        {
          provide: metadataToken,
          useValue: options,
        },
      ],
      exports: [collectionToken, metadataToken],
    };
  }
}
