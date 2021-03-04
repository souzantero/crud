import { Module } from '@nestjs/common';
import { FirestoreModule } from 'crud-firestore/lib';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [
    FirestoreModule.forFeature('', [
      {
        name: 'posts',
        fields: []
      }
    ])
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {
}
