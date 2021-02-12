import { Inject } from '@nestjs/common';
import { getCollectionToken } from '../firestore.utils';

export function InjectCollection(collectionName: string) {
  return Inject(getCollectionToken(collectionName));
}
