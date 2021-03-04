import { Module } from '@nestjs/common';
import { FirestoreModule } from 'crud-firestore/lib';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports:[
    FirestoreModule.forFeature('', [
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
