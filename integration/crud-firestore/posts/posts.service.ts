import { Injectable } from '@nestjs/common';
import { PostDocument } from './post.document';
import { CollectionDefinition, FirestoreCrudService, InjectCollection, InjectDefinition } from '@nestjsx/crud-firestore';
import { CollectionReference, DocumentData } from '@google-cloud/firestore';

@Injectable()
export class PostsService extends FirestoreCrudService<PostDocument> {

  constructor(
    @InjectCollection('posts') collection: CollectionReference<DocumentData>,
    @InjectDefinition('posts') definition: CollectionDefinition
  ) {
    super(collection, definition);
  }
}
