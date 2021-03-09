import { Injectable } from '@nestjs/common';
import {
  CollectionSchema,
  FirestoreCrudService,
  InjectCollection,
  InjectSchema,
} from 'nestjsx-crud-firestore';
import { CollectionReference, DocumentData } from '@google-cloud/firestore';
import { UserDocument } from '../../../../integration/crud-firestore/users/user.document';

@Injectable()
export class UsersService extends FirestoreCrudService<UserDocument> {
  constructor(
    @InjectCollection('users') collection: CollectionReference<DocumentData>,
    @InjectSchema('users') schema: CollectionSchema,
  ) {
    super(collection, schema);
  }
}
