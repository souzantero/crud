import { Injectable } from '@nestjs/common';
import { CollectionDefinition, FirestoreCrudService, InjectCollection, InjectDefinition } from '@nestjsx/crud-firestore';
import { UserDocument } from './user.document';
import { CollectionReference, DocumentData } from '@google-cloud/firestore';

@Injectable()
export class UsersService extends FirestoreCrudService<UserDocument> {

  constructor(
    @InjectCollection('users') collection: CollectionReference<DocumentData>,
    @InjectDefinition('users') definition: CollectionDefinition
  ) {
    super(collection, definition);
  }
}
