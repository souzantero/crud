import { Injectable } from '@nestjs/common';
import { PostDocument } from './post.document';
import { CollectionSchema, FirestoreCrudService, InjectCollection, InjectSchema } from 'nest-crud-firestore';
import { CollectionReference, DocumentData } from '@google-cloud/firestore';

@Injectable()
export class PostsService extends FirestoreCrudService<PostDocument> {

  constructor(
    @InjectCollection('posts') collection: CollectionReference<DocumentData>,
    @InjectSchema('posts') definition: CollectionSchema
  ) {
    super(collection, definition);
  }
}
