import { ModuleMetadata } from '@nestjs/common/interfaces';
import { CollectionDefinition } from './collection-definition.interface';

export interface AsyncCollectionFactory
  extends Pick<ModuleMetadata, 'imports'>,
    Pick<CollectionDefinition, 'name'> {
  useFactory: (
    ...args: any[]
  ) => CollectionDefinition['fields'] | Promise<CollectionDefinition['fields']>;
  inject?: any[];
}
