import { Module } from '@nestjs/common';
import { FirestoreModule } from 'nest-crud-firestore';
import { userSchema } from './user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports:[
    FirestoreModule.forFeature(process.env.FIRESTORE_PROJECT_ID, [userSchema])
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {
}
