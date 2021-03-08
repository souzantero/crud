import { ModuleMetadata } from '@nestjs/common/interfaces';
import { CollectionSchema } from './collection-schema.interface';

export interface AsyncCollectionFactory
  extends Pick<ModuleMetadata, 'imports'>,
    Pick<CollectionSchema, 'name'> {
  useFactory: (
    ...args: any[]
  ) => CollectionSchema['fields'] | Promise<CollectionSchema['fields']>;
  inject?: any[];
}
