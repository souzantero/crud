import { Module } from '@nestjs/common';
import { FirestoreModule } from '@nestjsx/crud-firestore';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [
    FirestoreModule.forFeature(process.env.FIRESTORE_PROJECT_ID, [
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
