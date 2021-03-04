import { Injectable } from '@nestjs/common';
import { CollectionDefinition, FirestoreCrudService, InjectCollection, InjectDefinition } from '@nestjsx/crud-firestore';
import { CommentDocument } from './comment.document';
import { CollectionReference, DocumentData } from '@google-cloud/firestore';

@Injectable()
export class CommentsService extends FirestoreCrudService<CommentDocument> {
  constructor(
    @InjectCollection('comments') collection: CollectionReference<DocumentData>,
    @InjectDefinition('comments') definition: CollectionDefinition
  ) {
    super(collection, definition);
  }
}
