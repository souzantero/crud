import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { FIRESTORE_MODULE_OPTIONS, FIRESTORE_PROJECT_NAME } from './firestore.constants';

import {
  FirestoreModuleOptions,
  FirestoreModuleAsyncOptions,
  FirestoreOptionsFactory,
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

  static forRootAsync(options: FirestoreModuleAsyncOptions): DynamicModule {
    const projectName = getProjectToken(options.projectId);
    const projectNameProvider = {
      provide: FIRESTORE_PROJECT_NAME,
      useValue: projectName,
    };

    const firestoreProvider = {
      provide: projectName,
      useFactory: (firestoreModuleOptions: FirestoreModuleOptions) =>
        new Firestore(firestoreModuleOptions),
      inject: [FIRESTORE_MODULE_OPTIONS],
    };

    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: FirestoreCoreModule,
      imports: options.imports,
      providers: [...asyncProviders, firestoreProvider, projectNameProvider],
      exports: [firestoreProvider],
    };
  }

  private static createAsyncProviders(options: FirestoreModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass as Type<FirestoreOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: FirestoreModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: FIRESTORE_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    // `as Type<FirestoreOptionsFactory>` is a workaround for microsoft/TypeScript#31603
    const inject = [
      (options.useClass || options.useExisting) as Type<FirestoreOptionsFactory>,
    ];
    return {
      provide: FIRESTORE_MODULE_OPTIONS,
      useFactory: async (optionsFactory: FirestoreOptionsFactory) =>
        await optionsFactory.createFirestoreOptions(),
      inject,
    };
  }
}
