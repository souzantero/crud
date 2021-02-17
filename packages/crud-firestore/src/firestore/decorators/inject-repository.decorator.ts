import { Inject } from '@nestjs/common';
import { getRepositoryToken } from '../firestore.utils';

export function InjectRepository(collectionName: string) {
  return Inject(getRepositoryToken(collectionName));
}
