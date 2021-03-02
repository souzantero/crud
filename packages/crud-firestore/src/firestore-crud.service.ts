import {
  CollectionReference,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  FieldPath,
  Query,
  QuerySnapshot,
  Timestamp,
} from '@google-cloud/firestore';
import {
  CreateManyDto,
  CrudRequest,
  CrudRequestOptions,
  CrudService,
  GetManyDefaultResponse,
  JoinOptions,
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
  QueryJoin,
  SCondition,
  SConditionKey,
} from '@nestjsx/crud-request';

import { CollectionMetadata } from './firestore/interfaces/collection-metadata.interface';
import { combineLatest, defer, from, Observable } from 'rxjs';
import { map, mergeMap, shareReplay, switchMap } from 'rxjs/operators';

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

  async createOne(req: CrudRequest, dto: T): Promise<T> {
    const { returnShallow } = req.options.routes.createOneBase;

    let entity = this.prepareEntityBeforeSave(dto, req.parsed);

    /* istanbul ignore if */
    if (!entity) {
      this.throwBadRequestException(`Empty data. Nothing to save.`);
    }

    const now = Timestamp.fromDate(new Date());

    if (this.collectionHasDeleteField) {
      entity = { ...entity, [this.collectionDeleteField]: false };
    }

    const newDocument = this.collection.doc();
    await newDocument.set({ ...entity, createdAt: now, updatedAt: now });
    const saved = await this.getOneById(newDocument.id);

    if (returnShallow) {
      return saved;
    } else {
      const primaryParams = this.getPrimaryParams(req.options);

      /* istanbul ignore next */
      if (!primaryParams.length && primaryParams.some((p) => isNil(saved[p]))) {
        return saved;
      } else {
        req.parsed.paramsFilter = primaryParams.map((p) => ({
          field: p,
          operator: '$eq',
          value: saved[p],
        }));
        req.parsed.search = primaryParams.reduce(
          (acc, p) => ({ ...acc, [p]: saved[p] }),
          {},
        );

        return this.getOneOrFail(req);
      }
    }
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

  protected async getOneById(id: any) {
    return this.collection
      .doc(id)
      .get()
      .then(this.disruptDocumentSnapshot);
  }

  protected async getOneOrFail(
    req: CrudRequest,
    shallow = false,
    withDeleted = false,
  ): Promise<T> {
    const { parsed, options } = req;

    const id = this.getIdParameter(parsed);

    let collectionQuery = this.buildQuery(this.collection);
    collectionQuery = collectionQuery.where(FieldPath.documentId(), '==', id);
    collectionQuery = this.selectFields(collectionQuery, parsed, options);
    collectionQuery = this.withDeleted(collectionQuery, withDeleted);

    const snapshotQuery = await collectionQuery.get();

    if (snapshotQuery.empty) {
      this.throwNotFoundException(this.collectionName);
    }

    return this.disruptQuerySnapshot(snapshotQuery)[0];
  }

  protected disruptQuerySnapshot(snapshot: QuerySnapshot<DocumentData>): T[] {
    return snapshot.docs.map(this.disruptDocumentSnapshot);
  }

  protected disruptDocumentSnapshot(snapshot: DocumentSnapshot<DocumentData>): any {
    return { id: snapshot.id, ...snapshot.data() };
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

  protected softDeleted(
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

  protected withDeleted(
    query: Query<DocumentData>,
    withDeleted: boolean = false,
  ): Query<DocumentData> {
    if (this.collectionHasDeleteField && withDeleted) {
      return query.where(this.collectionDeleteField, '==', true);
    }

    return query;
  }

  protected prepareEntityBeforeSave(
    dto: Partial<T>,
    parsed: CrudRequest['parsed'],
  ): Partial<T> {
    /* istanbul ignore if */
    if (!isObject(dto)) {
      return undefined;
    }

    if (hasLength(parsed.paramsFilter)) {
      for (const filter of parsed.paramsFilter) {
        dto[filter.field] = filter.value;
      }
    }

    const authPersist = isObject(parsed.authPersist) ? parsed.authPersist : {};

    /* istanbul ignore if */
    if (!hasLength(objKeys(dto))) {
      return undefined;
    }

    return { ...dto, ...authPersist };
  }
}
