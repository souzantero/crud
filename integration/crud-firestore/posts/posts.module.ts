import { Module } from '@nestjs/common';
import { FirestoreModule } from '@nestjsx/crud-firestore';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [
    FirestoreModule.forFeature(process.env.FIRESTORE_PROJECT_ID, [
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
