import { ModuleMetadata } from '@nestjs/common';
import * as firebase from 'firebase-admin';

export interface FirestoreModuleOptions
  extends firebase.AppOptions,
    Record<string, any> {}

export interface FirestoreModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (
    ...args: any[]
  ) => Promise<FirestoreModuleOptions> | FirestoreModuleOptions;
  inject?: any[];
}
