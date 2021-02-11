import {
  CreateManyDto,
  CrudRequest,
  CrudService,
  GetManyDefaultResponse,
} from '@nestjsx/crud';

import * as firebase from 'firebase-admin';

export class FirestoreCrudService<T> extends CrudService<T> {
  constructor(
    protected collection: firebase.firestore.CollectionReference<
      firebase.firestore.DocumentData
    >,
  ) {
    super();
  }

  getMany(req: CrudRequest): Promise<GetManyDefaultResponse<T> | T[]> {
    throw new Error('Method not implemented.');
  }
  getOne(req: CrudRequest): Promise<T> {
    throw new Error('Method not implemented.');
  }
  createOne(req: CrudRequest, dto: T): Promise<T> {
    throw new Error('Method not implemented.');
  }
  createMany(req: CrudRequest, dto: CreateManyDto<any>): Promise<T[]> {
    throw new Error('Method not implemented.');
  }
  updateOne(req: CrudRequest, dto: T): Promise<T> {
    throw new Error('Method not implemented.');
  }
  replaceOne(req: CrudRequest, dto: T): Promise<T> {
    throw new Error('Method not implemented.');
  }
  deleteOne(req: CrudRequest): Promise<void | T> {
    throw new Error('Method not implemented.');
  }
  recoverOne(req: CrudRequest): Promise<void | T> {
    throw new Error('Method not implemented.');
  }
}
