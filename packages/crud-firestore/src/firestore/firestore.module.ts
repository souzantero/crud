import { DynamicModule, flatten, Module, Provider } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { FirestoreCoreModule } from './firestore-core.module';
import { getCollectionToken, getProjectToken, getSchemaToken } from './firestore.utils';

import {
  FirestoreModuleAsyncOptions,
  FirestoreModuleOptions,
} from './interfaces/firestore-options.interface';
import { CollectionSchema } from './interfaces/collection-schema.interface';
import { AsyncCollectionFactory } from './interfaces/async-collection-factory.interface';

@Module({})
export class FirestoreModule {
  static forRoot(options: FirestoreModuleOptions = {}): DynamicModule {
    return {
      module: FirestoreModule,
      imports: [FirestoreCoreModule.forRoot(options)],
    };
  }

  static forRootAsync(options: FirestoreModuleAsyncOptions): DynamicModule {
    return {
      module: FirestoreModule,
      imports: [FirestoreCoreModule.forRootAsync(options)],
    };
  }

  static forFeature(
    projectId: string,
    collections: CollectionSchema[] = [],
  ): DynamicModule {
    const providers = collections.reduce(
      (providers, collection) => [
        ...providers,
        {
          provide: getSchemaToken(collection.name),
          useValue: collection,
        },
        {
          provide: getCollectionToken(collection.name),
          useFactory: (firestore: Firestore) => firestore.collection(collection.name),
          inject: [getProjectToken(projectId)],
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

  static forFeatureAsync(
    projectId: string,
    factories: AsyncCollectionFactory[] = [],
  ): DynamicModule {
    const imports = factories.map((factory) => factory.imports || []);
    const uniqImports = new Set(flatten(imports));

    const providers = factories.reduce(
      (providers, factory) => [
        ...providers,
        {
          provide: getSchemaToken(factory.name),
          useFactory: async (...args: unknown[]) => {
            const fields = await factory.useFactory(...args);
            return { name: factory.name, fields };
          },
          inject: [...(factory.inject || [])],
        },
        {
          provide: getCollectionToken(factory.name),
          useFactory: (firestore: Firestore) => firestore.collection(factory.name),
          inject: [getProjectToken(projectId)],
        },
      ],
      [] as Provider[],
    );

    return {
      module: FirestoreModule,
      imports: [...uniqImports],
      providers: providers,
      exports: providers,
    };
  }
}
