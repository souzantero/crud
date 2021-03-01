import {
  CollectionReference,
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

import { CollectionMetadata } from './firestore/interfaces/collection-metadata.interface';

export abstract class FirestoreCrudService<T> extends CrudService<T> {
  protected collectionName: string;
  protected collectionFields: string[];
  protected collectionHasDeleteField: boolean = false;
  protected collectionDeleteField: string;

  constructor(
    protected collection: CollectionReference<DocumentData>,
    protected metadata: CollectionMetadata,
  ) {
    super();

    this.onInitMapCollectionFields();

    console.log('Collection', collection);
    console.log('Metadata', metadata);
    console.log('.');
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

  protected onInitMapCollectionFields() {
    this.collectionName = this.metadata.name;
    this.collectionFields = this.metadata.fields.map((field) => field.name);
    this.collectionHasDeleteField =
      this.metadata.fields.filter((field) => field.isDeleteFlag).length > 0;
    this.collectionDeleteField = this.collectionHasDeleteField
      ? this.metadata.fields.find((field) => field.isDeleteFlag).name
      : undefined;
  }

  protected async getOneOrFail(
    req: CrudRequest,
    shallow = false,
    withDeleted = false,
  ): Promise<T> {
    const { parsed, options } = req;

    console.log('Parsed', parsed);
    console.log('Parsed.search', parsed.search['$and']);
    console.log('Options', options);

    const id = this.getIdParameter(parsed);

    let collectionQuery = this.buildQuery(this.collection);
    collectionQuery = collectionQuery.where(FieldPath.documentId(), '==', id);
    collectionQuery = this.selectFields(collectionQuery, parsed, options);
    collectionQuery = this.withDeleted(collectionQuery, parsed, options, withDeleted);

    const snapshotQuery = await collectionQuery.get();

    if (snapshotQuery.empty) {
      this.throwNotFoundException(this.collectionName);
    }

    return this.convertDocumentSnapshot(snapshotQuery.docs[0]);
  }

  protected buildQuery(
    collection: CollectionReference<DocumentData>,
  ): Query<DocumentData> {
    if (this.collectionHasDeleteField) {
      return collection
        .where(this.collectionDeleteField, '==', false)
        .orderBy(FieldPath.documentId(), 'desc');
    }

    return collection.orderBy(FieldPath.documentId(), 'desc');
  }

  protected getIdParameter(parsed: ParsedRequestParams): any {
    return parsed.paramsFilter.find(
      (param) => param.field === 'id' && param.operator === '$eq',
    ).value;
  }

  protected getSelect(query: ParsedRequestParams, options: QueryOptions): string[] {
    const allowed = this.getAllowedFields(this.collectionFields, options);

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

  protected selectFields(
    query: Query<DocumentData>,
    parsed: ParsedRequestParams,
    options: CrudRequestOptions,
  ): Query<DocumentData> {
    const select = this.getSelect(parsed, options.query);
    return query.select(...select);
  }

  protected withDeleted(
    query: Query<DocumentData>,
    parsed: ParsedRequestParams,
    options: CrudRequestOptions,
    withDeleted: boolean = false,
  ): Query<DocumentData> {
    if (this.collectionHasDeleteField && options.query.softDelete) {
      if (parsed.includeDeleted === 1 || withDeleted) {
        return query.where(this.collectionDeleteField, '==', true);
      }
    }

    return query;
  }
}
