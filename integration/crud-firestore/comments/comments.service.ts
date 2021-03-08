import { Injectable } from '@nestjs/common';
import { CollectionSchema, FirestoreCrudService, InjectCollection, InjectSchema } from 'nest-crud-firestore';
import { CommentDocument } from './comment.document';
import { CollectionReference, DocumentData } from '@google-cloud/firestore';

@Injectable()
export class CommentsService extends FirestoreCrudService<CommentDocument> {
  constructor(
    @InjectCollection('comments') collection: CollectionReference<DocumentData>,
    @InjectSchema('comments') definition: CollectionSchema
  ) {
    super(collection, definition);
  }
}
