import { DynamicModule, Global, Module } from '@nestjs/common';
import { FirestoreProvider } from './firestore.provider';
import { FIRESTORE_PROVIDER, FIRESTORE_MODULE_OPTIONS } from './firestore.constants';

import {
  FirestoreModuleOptions,
  FirestoreModuleAsyncOptions,
} from './interfaces/firestore-options.interface';

@Global()
@Module({})
export class FirestoreCoreModule {
  static forRoot(options: FirestoreModuleOptions = {}): DynamicModule {
    return {
      module: FirestoreCoreModule,
      providers: [
        {
          provide: FIRESTORE_PROVIDER,
          useValue: new FirestoreProvider(options),
        },
      ],
      exports: [FIRESTORE_PROVIDER],
    };
  }
}
