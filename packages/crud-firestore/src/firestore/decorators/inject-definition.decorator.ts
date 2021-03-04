import { Inject } from '@nestjs/common';
import { getDefinitionToken } from '../firestore.utils';

export function InjectDefinition(collectionName: string) {
  return Inject(getDefinitionToken(collectionName));
}
