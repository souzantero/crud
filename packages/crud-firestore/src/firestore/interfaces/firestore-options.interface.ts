import { ModuleMetadata } from '@nestjs/common';
import { Settings } from '@google-cloud/firestore';
import { CollectionMetadata } from './collection-metadata.interface';

export interface FirestoreModuleOptions extends Settings, Record<string, any> {}

export interface FirestoreFeatureOptions
  extends CollectionMetadata,
    Record<string, any> {}

export interface FirestoreModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (
    ...args: any[]
  ) => Promise<FirestoreModuleOptions> | FirestoreModuleOptions;
  inject?: any[];
}
