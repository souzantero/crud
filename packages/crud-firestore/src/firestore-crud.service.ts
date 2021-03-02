import {
  CollectionReference,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  FieldPath,
  Query,
  QuerySnapshot,
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
    collectionQuery = this.withDeleted(collectionQuery, withDeleted);

    const observable = from(collectionQuery.get());
    console.log('Observable', observable);
    const pipe = observable.pipe(
      this.innerJoin(parsed, options),
      shareReplay(1),
    );

    console.log('Pipe', pipe);

    return pipe.toPromise() as any;

    // if (snapshotQuery.empty) {
    //   this.throwNotFoundException(this.collectionName);
    // }

    // return this.convertDocumentSnapshot(snapshotQuery.docs[0]);
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

  protected innerJoin(parsed: ParsedRequestParams, options: CrudRequestOptions) {
    return (source) => {
      console.log('Source', source);

      return defer(() => {
        let collectionData;

        return source.pipe(
          switchMap((snapshot: any) => {
            console.log('Snapshot', snapshot);
            collectionData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            const reads$ = [];
            for (const doc of collectionData) {
              reads$.push(
                this.collection.firestore
                  .collection('kitcategories')
                  .where(
                    'kit',
                    '==',
                    this.collection.firestore.collection('kits').doc(doc.id),
                  )
                  .get(),
              );
            }

            return combineLatest(reads$);
          }),
          map((joins: any) => {
            const collectionJoins = joins[0].docs.map((doc) => {
              console.log('Doc Join', doc);
              return { id: doc.id, ...doc.data() };
            });
            console.log('Joins', collectionJoins);
            return collectionData.map((v, i) => {
              return { ...v, kitcategories: collectionJoins[i] || null };
            });
          }),
        );
      });
    };
  }

  protected join(
    promiseQuery: Promise<QuerySnapshot<DocumentData>>,
    parsed: ParsedRequestParams,
    options: CrudRequestOptions,
  ): Promise<QuerySnapshot<DocumentData>> {
    // set joins
    const joinOptions = options.query.join || {};
    const allowedJoins = objKeys(joinOptions);

    if (hasLength(allowedJoins)) {
      const eagerJoins: any = {};

      for (let i = 0; i < allowedJoins.length; i++) {
        /* istanbul ignore else */
        if (joinOptions[allowedJoins[i]].eager) {
          const cond = parsed.join.find((j) => j && j.field === allowedJoins[i]) || {
            field: allowedJoins[i],
          };

          promiseQuery = this.setJoin(promiseQuery, cond, joinOptions);
          eagerJoins[allowedJoins[i]] = true;
        }
      }

      if (isArrayFull(parsed.join)) {
        for (let i = 0; i < parsed.join.length; i++) {
          /* istanbul ignore else */
          if (!eagerJoins[parsed.join[i].field]) {
            promiseQuery = this.setJoin(promiseQuery, parsed.join[i], joinOptions);
          }
        }
      }
    }

    return promiseQuery;
  }

  protected setJoin(
    promiseQuery: Promise<QuerySnapshot<DocumentData>>,
    cond: QueryJoin,
    joinOptions: JoinOptions,
  ): Promise<QuerySnapshot<DocumentData>> {
    return promiseQuery;
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
}
