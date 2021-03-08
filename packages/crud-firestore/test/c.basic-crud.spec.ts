import { CollectionReference, DocumentData } from '@google-cloud/firestore';
import { BadRequestException, Controller, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { Crud } from '@nestjsx/crud';
import { FirestoreModule } from 'nest-crud-firestore';
import { RequestQueryBuilder } from '@nestjsx/crud-request';
import { Exclude } from 'class-transformer';
import * as request from 'supertest';
import { commentSchema } from '../../../integration/crud-firestore/comments';
import { postSchema } from '../../../integration/crud-firestore/posts/post.schema';
import { seedUsers } from '../../../integration/crud-firestore/seeds';
import { SettingsModule } from '../../../integration/crud-firestore/shared/settings/settings.module';
import { User } from '../../../integration/crud-firestore/users';
import { userSchema } from '../../../integration/crud-firestore/users/user.schema';
import { deleteCollection, insertCollection } from './test-utils';

import { UsersService } from './__fixture__/users.service';

class NoPasswordUser {
  @Exclude()
  password?: string;
}

// tslint:disable:max-classes-per-file no-shadowed-variable
describe('#crud-firestore', () => {
  describe('#basic crud', () => {
    let app: INestApplication;
    let server: any;
    let qb: RequestQueryBuilder;
    let service: UsersService;
    let collection: CollectionReference<DocumentData>;

    @Crud({
      model: { type: User },
      params: {
        id: {
          field: 'id',
          type: 'string',
          primary: true,
        },
      },
      routes: {
        deleteOneBase: {
          returnDeleted: true,
        },
      },
      serialize: {
        get: NoPasswordUser,
      },
    })
    @Controller('users')
    class UsersController {
      constructor(public service: UsersService) {}
    }

    beforeAll(async () => {
      const fixture = await Test.createTestingModule({
        imports: [
          FirestoreModule.forRootAsync({
            imports: [SettingsModule],
            projectId: process.env.FIRESTORE_PROJECT_ID,
            useFactory: (configService: ConfigService) => {
              return configService.get('firestore.credentials');
            },
            inject: [ConfigService],
          }),
          FirestoreModule.forFeature(process.env.FIRESTORE_PROJECT_ID, [
            userSchema,
            commentSchema,
            postSchema,
          ]),
        ],
        controllers: [UsersController],
        providers: [UsersService],
      }).compile();

      app = fixture.createNestApplication();
      service = app.get<UsersService>(UsersService);

      await app.init();
      server = app.getHttpServer();
    });

    beforeEach(async () => {
      qb = RequestQueryBuilder.create();
      collection = service.collection;
      await deleteCollection(collection);
      await insertCollection(collection, seedUsers);
    });

    afterAll(async () => {
      await deleteCollection(collection);
      await app.close();
    });

    describe('#getAllBase', () => {
      it('should return an array of all entities', (done) => {
        return request(server)
          .get('/users')
          .end((_, res) => {
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(9);
            done();
          });
      });

      it('should return an entities with limit', (done) => {
        const query = qb.setLimit(5).query();
        return request(server)
          .get('/users')
          .query(query)
          .end((_, res) => {
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(5);
            done();
          });
      });

      it('should return an entities with offset', (done) => {
        const query = qb.setOffset(3).query();
        return request(server)
          .get('/users')
          .query(query)
          .end((_, res) => {
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(6);
            done();
          });
      });

      describe('#getOneBase', () => {
        it('should return status 404', (done) => {
          return request(server)
            .get('/users/6de34417cd5e475f96a46583')
            .end((_, res) => {
              // console.error(res.body);
              expect(res.status).toBe(404);
              done();
            });
        });
        it('should return an entity, 5de34417cd5e475f96a46583', (done) => {
          return request(server)
            .get('/users/5de34417cd5e475f96a46583')
            .end((_, res) => {
              expect(res.status).toBe(200);
              expect(res.body).toEqual({
                id: '5de34417cd5e475f96a46583',
                name: 'jay',
                updatedAt: jasmine.anything(),
                createdAt: jasmine.anything(),
              });
              done();
            });
        });
        it('should return an entity, 2', (done) => {
          const query = qb.select(['name']).query();
          return request(server)
            .get('/users/5de34417cd5e475f96a46583')
            .query(query)
            .end((_, res) => {
              expect(res.status).toBe(200);
              expect(res.body.id).toBe('5de34417cd5e475f96a46583');
              expect(res.body.name).toBeTruthy();
              done();
            });
        });
      });

      describe('#createOneBase', () => {
        it('should return status 400', (done) => {
          return request(server)
            .post('/users')
            .send('')
            .end((_, res) => {
              expect(res.status).toBe(400);
              done();
            });
        });
        it('should return saved entity', (done) => {
          const dto = {
            name: 'test0',
          };
          return request(server)
            .post('/users')
            .send(dto)
            .end((_, res) => {
              expect(res.status).toBe(201);
              expect(res.body.id).toBeTruthy();
              done();
            });
        });
        it('should return saved entity with param', (done) => {
          const dto: any = {
            name: 'test1',
          };
          return request(server)
            .post('/users')
            .send(dto)
            .end((_, res) => {
              expect(res.status).toBe(201);
              expect(res.body.id).toBeTruthy();
              expect(res.body.name).toBe('test1');
              done();
            });
        });
      });

      describe('#createManyBase', () => {
        it('should return status 400', (done) => {
          const dto = { bulk: [] };
          return request(server)
            .post('/users/bulk')
            .send(dto)
            .end((_, res) => {
              expect(res.status).toBe(400);
              done();
            });
        });

        it('should return created entities', (done) => {
          const dto = {
            bulk: [
              {
                name: 'test1',
              },
              {
                name: 'test2',
              },
            ],
          };
          return request(server)
            .post('/users/bulk')
            .send(dto)
            .end((_, res) => {
              expect(res.status).toBe(201);
              expect(res.body[0].id).toBeTruthy();
              expect(res.body[1].id).toBeTruthy();
              done();
            });
        });
      });

      describe('#updateOneBase', () => {
        it('should return status 404', (done) => {
          const dto = { name: 'updated0' };
          return request(server)
            .patch('/users/6de34417cd5e475f96a46583')
            .send(dto)
            .end((_, res) => {
              expect(res.status).toBe(404);
              done();
            });
        });
        it('should return updated entity, 1', (done) => {
          const dto = { name: 'updated0' };
          return request(server)
            .patch('/users/5de34417cd5e475f96a46583')
            .send(dto)
            .end((_, res) => {
              expect(res.status).toBe(200);
              expect(res.body.name).toBe('updated0');
              done();
            });
        });
        it('should return updated entity, 2', (done) => {
          const dto = { email: 'test@test.com' };
          return request(server)
            .patch('/users/5de34417cd5e475f96a46583')
            .send(dto)
            .end((_, res) => {
              expect(res.status).toBe(200);
              expect(res.body.email).toBe('test@test.com');
              done();
            });
        });
      });

      describe('#replaceOneBase', () => {
        it('should create entity', (done) => {
          const dto = { name: 'updated0', email: 'test@test.com' };
          return request(server)
            .put('/users/5de34417cd5e475f96a46583')
            .send(dto)
            .end((_, res) => {
              expect(res.status).toBe(200);
              expect(res.body.name).toBe('updated0');
              done();
            });
        });
        it('should return updated entity, 1', (done) => {
          const dto = { name: 'updated0' };
          return request(server)
            .put('/users/5de34417cd5e475f96a46584')
            .send(dto)
            .end((_, res) => {
              expect(res.status).toBe(200);
              expect(res.body.name).toBe('updated0');
              done();
            });
        });
      });

      describe('#deleteOneBase', () => {
        it('should return status 404', (done) => {
          return request(server)
            .delete('/users/6de34417cd5e475f96a46591')
            .end((_, res) => {
              expect(res.status).toBe(404);
              done();
            });
        });
        it('should return deleted entity', (done) => {
          return request(server)
            .delete('/users/5de34417cd5e475f96a46591')
            .end((_, res) => {
              expect(res.status).toBe(200);
              expect(res.body.id).toBe('5de34417cd5e475f96a46591');
              done();
            });
        });
      });
    });
  });
});
