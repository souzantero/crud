import { Module } from '@nestjs/common';
import { FirestoreModule } from 'nestjsx-crud-firestore';
import { PostsModule } from './posts/posts.module';
import { SettingsModule } from './shared/settings/settings.module';
import { UsersModule } from './users/users.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    FirestoreModule.forRootAsync({
      imports: [SettingsModule],
      projectId: process.env.FIRESTORE_PROJECT_ID,
      useFactory: (configService: ConfigService) => {
        return configService.get('firestore.credentials');
      },
      inject: [ConfigService]
    }),
    UsersModule,
    PostsModule
  ],
  providers: []
})
export class AppModule {
}
