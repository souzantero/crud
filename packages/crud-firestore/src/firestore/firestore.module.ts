import { DynamicModule, Module, Provider } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { FirestoreCoreModule } from './firestore-core.module';
import {
  getCollectionToken,
  getProjectToken,
  getDefinitionToken,
} from './firestore.utils';

import {
  FirestoreModuleAsyncOptions,
  FirestoreModuleOptions,
} from './interfaces/firestore-options.interface';
import { CollectionDefinition } from './interfaces/collection-definition.interface';

@Module({})
export class FirestoreModule {
  static forRoot(options: FirestoreModuleOptions = {}): DynamicModule {
    return {
      module: FirestoreModule,
      imports: [FirestoreCoreModule.forRoot(options)],
    };
  }

  static forFeature(
    collections: CollectionDefinition[] = [],
    projectId: string,
  ): DynamicModule {
    const providers = collections.reduce(
      (providers, collection) => [
        ...providers,
        {
          provide: getCollectionToken(collection.name),
          useFactory: (firestore: Firestore) => firestore.collection(collection.name),
          inject: [getProjectToken(projectId)],
        },
        {
          provide: getDefinitionToken(collection.name),
          useValue: collection,
        },
      ],
      [] as Provider[],
    );

    return {
      module: FirestoreModule,
      providers: providers,
      exports: providers,
    };
  }
}
