import { Module } from '@nestjs/common';
import { FirestoreModule } from '@nestjsx/crud-firestore';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports:[
    FirestoreModule.forFeature(process.env.FIRESTORE_PROJECT_ID, [
      {
        name: 'users',
        fields: []
      }
    ])
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {
}
