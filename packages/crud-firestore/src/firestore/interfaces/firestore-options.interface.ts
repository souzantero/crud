import { ModuleMetadata } from '@nestjs/common';
import { Settings } from '@google-cloud/firestore';

export interface FirestoreModuleOptions extends Settings, Record<string, any> {}

export interface FirestoreModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (
    ...args: any[]
  ) => Promise<FirestoreModuleOptions> | FirestoreModuleOptions;
  inject?: any[];
}
