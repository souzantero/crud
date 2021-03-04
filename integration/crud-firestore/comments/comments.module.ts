import { Module } from '@nestjs/common';
import { FirestoreModule } from 'crud-firestore/lib';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [
    FirestoreModule.forFeature('', [
      {
        name: 'comments',
        fields: []
      }
    ])
  ], 
  controllers: [
    CommentsController
  ],
  providers: [
    CommentsService
  ]
})
export class CommentsModule {}
