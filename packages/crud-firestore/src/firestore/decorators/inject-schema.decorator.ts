import { Inject } from '@nestjs/common';
import { getSchemaToken } from '../firestore.utils';

export function InjectSchema(collectionName: string) {
  return Inject(getSchemaToken(collectionName));
}
