import { Inject } from '@nestjs/common';
import { getMetadataToken } from '../firestore.utils';

export function InjectMetadata(collectionName: string) {
  return Inject(getMetadataToken(collectionName));
}
