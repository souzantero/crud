import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  FieldPath,
  Query,
} from '@google-cloud/firestore';
import {
  CreateManyDto,
  CrudRequest,
  CrudRequestOptions,
  CrudService,
  GetManyDefaultResponse,
  QueryOptions,
} from '@nestjsx/crud';
import {
  ClassType,
  hasLength,
  isArrayFull,
  isObject,
  isUndefined,
  objKeys,
  isNil,
  isNull,
} from '@nestjsx/util';
import {
  ComparisonOperator,
  ParsedRequestParams,
  QueryFilter,
  SCondition,
  SConditionKey,
} from '@nestjsx/crud-request';

import { FirestoreRepository } from './firestore/firestore.repository';

export abstract class FirestoreCrudService<T> extends CrudService<T> {
  constructor(protected repository: FirestoreRepository<T>) {
    super();

    console.log('Repository', repository);
  }

  getMany(req: CrudRequest): Promise<GetManyDefaultResponse<T> | T[]> {
    const { parsed, options } = req;

    console.log(parsed);
    console.log(options);

    return Promise.resolve({
      data: [],
      count: 0,
      total: 0,
      page: 0,
      pageCount: 0,
    });
  }

  getOne(req: CrudRequest): Promise<T> {
    return this.getOneOrFail(req);
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

  abstract convertDocumentSnapshot(
    snapshot: DocumentSnapshot<DocumentData>,
  ): T | Promise<T>;

  protected async getOneOrFail(
    req: CrudRequest,
    shallow = false,
    withDeleted = false,
  ): Promise<T> {
    const { parsed, options } = req;

    console.log('Parsed', parsed);
    console.log('Parsed.search', parsed.search['$and']);
    console.log('Options', options);

    const collectionQuery = await this.createQuery(parsed, options, true, withDeleted);
    const snapshotQuery = await collectionQuery.get();

    if (snapshotQuery.empty) {
      this.throwNotFoundException(this.repository.name);
    }

    return this.convertDocumentSnapshot(snapshotQuery.docs[0]);
  }

  protected async createQuery(
    parsed: ParsedRequestParams,
    options: CrudRequestOptions,
    many = true,
    withDeleted = false,
  ): Promise<Query<DocumentData>> {
    const collectionReference = this.repository.collection;

    // get select fields
    const select = this.getSelect(parsed, options.query);

    // select fields
    let collectionQuery = collectionReference.select(...select);

    return collectionQuery.where(
      FieldPath.documentId(),
      '==',
      parsed.paramsFilter[0].value,
    );
  }

  protected getSelect(query: ParsedRequestParams, options: QueryOptions): string[] {
    const allowed = this.getAllowedFields(this.repository.metadata.fields, options);

    const fields =
      query.fields && query.fields.length
        ? query.fields.filter((field) => allowed.some((f) => f === field))
        : allowed;

    const select = [
      ...(options.persist && options.persist.length ? options.persist : []),
      ...fields,
    ];

    return select;
  }

  protected getAllowedFields(fields: string[], options: QueryOptions): string[] {
    return (!options.exclude || !options.exclude.length) &&
      (!options.allow || /* istanbul ignore next */ !options.allow.length)
      ? fields
      : fields.filter(
          (field) =>
            (options.exclude && options.exclude.length
              ? !options.exclude.some((f) => f === field)
              : /* istanbul ignore next */ true) &&
            (options.allow && options.allow.length
              ? options.allow.some((f) => f === field)
              : /* istanbul ignore next */ true),
        );
  }
}
