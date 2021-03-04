import { Module } from '@nestjs/common';
import { FirestoreModule } from 'crud-firestore/lib';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    FirestoreModule.forRootAsync({
      projectId: '',
      useFactory: () => {
        return {};
      }
    }),
    UsersModule,
    PostsModule
  ],
  providers: [],
})
export class AppModule {
}
