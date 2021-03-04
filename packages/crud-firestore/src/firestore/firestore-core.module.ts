import { DynamicModule, Global, Module } from '@nestjs/common';
import { FIRESTORE_PROJECT_NAME } from './firestore.constants';

import {
  FirestoreModuleOptions,
  FirestoreModuleAsyncOptions,
} from './interfaces/firestore-options.interface';
import { Firestore } from '@google-cloud/firestore';
import { getProjectToken } from './firestore.utils';

@Global()
@Module({})
export class FirestoreCoreModule {
  static forRoot(options: FirestoreModuleOptions = {}): DynamicModule {
    const projectName = getProjectToken(options.projectId);
    const projectNameProvider = {
      provide: FIRESTORE_PROJECT_NAME,
      useValue: projectName,
    };

    const firestoreProvider = {
      provide: projectName,
      useFactory: () => {
        return new Firestore(options);
      },
    };

    return {
      module: FirestoreCoreModule,
      providers: [firestoreProvider, projectNameProvider],
      exports: [firestoreProvider],
    };
  }
}
