import { Module } from '@nestjs/common';
import { FirestoreModule } from 'nest-crud-firestore';
import { postSchema } from '../posts/post.schema';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [
    FirestoreModule.forFeature(process.env.FIRESTORE_PROJECT_ID, [postSchema])
  ], 
  controllers: [
    CommentsController
  ],
  providers: [
    CommentsService
  ]
})
export class CommentsModule {}
