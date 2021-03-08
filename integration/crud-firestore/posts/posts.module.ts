import { Module } from '@nestjs/common';
import { FirestoreModule } from 'nest-crud-firestore';
import { postSchema } from './post.schema';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [
    FirestoreModule.forFeature(process.env.FIRESTORE_PROJECT_ID, [postSchema])
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {
}
