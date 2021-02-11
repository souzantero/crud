import { DynamicModule, Module } from '@nestjs/common';
import { FirestoreProvider } from './firestore.provider';
import { FIRESTORE_PROVIDER, FIRESTORE_MODULE_OPTIONS } from './firestore.constants';
import {
  FirestoreModuleOptions,
  FirestoreModuleAsyncOptions,
} from './interfaces/firestore-options.interface';

@Module({})
export class FirestoreModule {
  static forRoot(options: FirestoreModuleOptions = {}): DynamicModule {
    return {
      module: FirestoreModule,
      providers: [
        {
          provide: FIRESTORE_PROVIDER,
          useFactory: () => {
            return new FirestoreProvider(options);
          },
        },
      ],
      exports: [FIRESTORE_PROVIDER],
    };
  }

  static forRootAsync(options: FirestoreModuleAsyncOptions): DynamicModule {
    const { imports, useFactory, inject } = options;

    return {
      module: FirestoreModule,
      providers: [
        {
          provide: FIRESTORE_MODULE_OPTIONS,
          useFactory,
          inject: inject || [],
        },
        {
          provide: FIRESTORE_PROVIDER,
          useFactory: (firestoreModuleOptions: FirestoreModuleOptions) => {
            return new FirestoreProvider(firestoreModuleOptions);
          },
          inject: [FIRESTORE_MODULE_OPTIONS],
        },
      ],
      imports,
      exports: [FIRESTORE_PROVIDER],
    };
  }
}
