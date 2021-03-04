import { ModuleMetadata, Type } from '@nestjs/common';
import { Settings } from '@google-cloud/firestore';

export interface FirestoreModuleOptions extends Settings, Record<string, any> {}

export interface FirestoreModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'>,
    Pick<FirestoreModuleOptions, 'projectId'> {
  useExisting?: Type<FirestoreOptionsFactory>;
  useClass?: Type<FirestoreOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) =>
    | Promise<FirestoreModuleOptions['credentials']>
    | FirestoreModuleOptions['credentials'];
  inject?: any[];
}

export interface FirestoreOptionsFactory {
  createFirestoreCredentials():
    | Promise<FirestoreModuleOptions['credentials']>
    | FirestoreModuleOptions['credentials'];
}
