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
  ObjectLiteral,
} from '@nestjsx/util';
import {
  ComparisonOperator,
  ParsedRequestParams,
  QueryFilter,
  QueryJoin,
  SCondition,
  SConditionKey,
} from '@nestjsx/crud-request';

import { oO } from '@zmotivat0r/o0';

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
  }

  getMany(req: CrudRequest): Promise<GetManyDefaultResponse<T> | T[]> {
    throw new Error('Method not implemented.');
  }

  getOne(req: CrudRequest): Promise<T> {
    return this.getOneOrFailAndDisrupt(req);
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
    const savedSnapshot = await newDocument.get();
    const saved = this.disruptDocumentSnapshot(savedSnapshot, req.options);

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

        return this.getOneOrFailAndDisrupt(req);
      }
    }
  }

  createMany(req: CrudRequest, dto: CreateManyDto<any>): Promise<T[]> {
    throw new Error('Method not implemented.');
  }

  async updateOne(req: CrudRequest, dto: T): Promise<T> {
    const { allowParamsOverride, returnShallow } = req.options.routes.updateOneBase;
    const paramsFilters = this.getParamFilters(req.parsed);
    const foundSnapshot = await this.getOneOrFail(req, returnShallow);
    const found = this.disruptDocumentSnapshot(foundSnapshot, req.options);
    const toSave = !allowParamsOverride
      ? {
          ...found,
          ...dto,
          ...paramsFilters,
          ...req.parsed.authPersist,
          updatedAt: Timestamp.fromDate(new Date()),
        }
      : {
          ...found,
          ...dto,
          ...req.parsed.authPersist,
          updatedAt: Timestamp.fromDate(new Date()),
        };

    await foundSnapshot.ref.update(toSave);
    const updatedSnapshot = await foundSnapshot.ref.get();
    const updated = this.disruptDocumentSnapshot(updatedSnapshot, req.options);

    if (returnShallow) {
      return updated;
    } else {
      req.parsed.paramsFilter.forEach((filter) => {
        filter.value = updated[filter.field];
      });

      return this.getOneOrFailAndDisrupt(req);
    }
  }

  async replaceOne(req: CrudRequest, dto: T): Promise<T> {
    const { allowParamsOverride, returnShallow } = req.options.routes.replaceOneBase;
    const paramsFilters = this.getParamFilters(req.parsed);
    const [_, foundSnapshot] = await oO(this.getOneOrFail(req, returnShallow));
    const found = this.disruptDocumentSnapshot(foundSnapshot, req.options);
    const toSave = !allowParamsOverride
      ? {
          ...(found || {}),
          ...dto,
          ...paramsFilters,
          ...req.parsed.authPersist,
          updatedAt: Timestamp.fromDate(new Date()),
        }
      : {
          ...(found || /* istanbul ignore next */ {}),
          ...paramsFilters,
          ...dto,
          ...req.parsed.authPersist,
          updatedAt: Timestamp.fromDate(new Date()),
        };

    await foundSnapshot.ref.update(toSave);
    const replacedSnapshot = await foundSnapshot.ref.get();
    const replaced = this.disruptDocumentSnapshot(replacedSnapshot, req.options);

    if (returnShallow) {
      return replaced;
    } else {
      const primaryParams = this.getPrimaryParams(req.options);

      /* istanbul ignore if */
      if (!primaryParams.length) {
        return replaced;
      }

      req.parsed.paramsFilter = primaryParams.map((p) => ({
        field: p,
        operator: '$eq',
        value: replaced[p],
      }));

      req.parsed.search = primaryParams.reduce(
        (acc, p) => ({ ...acc, [p]: replaced[p] }),
        {},
      );

      return this.getOneOrFailAndDisrupt(req);
    }
  }

  async deleteOne(req: CrudRequest): Promise<void | T> {
    const { returnDeleted } = req.options.routes.deleteOneBase;
    const found = await this.getOneOrFail(req, returnDeleted);
    const toReturn = returnDeleted
      ? this.disruptDocumentSnapshot(found, req.options)
      : undefined;

    req.options.query.softDelete === true
      ? await found.ref.update({ [this.collectionDeleteField]: true })
      : await found.ref.delete();

    return toReturn;
  }

  async recoverOne(req: CrudRequest): Promise<void | T> {
    if (!this.collectionDeleteField) {
      this.throwBadRequestException(`${this.collectionName} don't use soft delete`);
    }

    const found = await this.getOneOrFail(req, true, true);
    await found.ref.update({ [this.collectionDeleteField]: false });
    return this.getOneOrFailAndDisrupt(req);
  }

  public getParamFilters(parsed: CrudRequest['parsed']): ObjectLiteral {
    let filters = {};

    /* istanbul ignore else */
    if (hasLength(parsed.paramsFilter)) {
      for (const filter of parsed.paramsFilter) {
        filters[filter.field] = filter.value;
      }
    }

    return filters;
  }

  protected onInitMapCollectionFields() {
    this.collectionName = this.metadata.name;
    this.collectionFields = this.metadata.fields.map((field) => field.name);
    this.collectionHasDeleteField =
      this.metadata.fields.filter((field) => field.isDeleteFlag).length > 0;
    this.collectionDeleteField = this.collectionHasDeleteField
      ? this.metadata.fields.find((field) => field.isDeleteFlag).name
      : undefined;
  }

  protected async getOneOrFailAndDisrupt(
    req: CrudRequest,
    shallow = false,
    withDeleted = false,
  ): Promise<T> {
    return this.getOneOrFail(req, shallow, withDeleted).then((snapshot) =>
      this.disruptDocumentSnapshot(snapshot, req.options),
    );
  }

  protected async getOneOrFail(
    req: CrudRequest,
    shallow = false,
    withDeleted = false,
  ): Promise<DocumentSnapshot<DocumentData>> {
    const { parsed, options } = req;

    const id = this.getIdParameter(parsed, options);

    let collectionQuery = this.collection.where(FieldPath.documentId(), '==', id);

    if (!shallow) {
      collectionQuery = this.selectFields(collectionQuery, parsed, options);
      collectionQuery = this.softDeleted(collectionQuery, parsed, options, withDeleted);
    } else {
      if (!withDeleted) {
        collectionQuery = this.onlyThoseNotDeleted(collectionQuery);
      }
    }

    const snapshotQuery = await collectionQuery.get();

    if (snapshotQuery.empty) {
      this.throwNotFoundException(this.collectionName);
    }

    return snapshotQuery.docs[0];
  }

  protected disruptDocumentSnapshot(
    snapshot: DocumentSnapshot<DocumentData>,
    options: CrudRequestOptions,
  ): any {
    const primaryParams = this.getPrimaryParams(options);
    const primaryFields = primaryParams.reduce((acc, p) => ({ [p]: snapshot.id }), {});
    return { ...primaryFields, ...snapshot.data() };
  }

  protected getIdParameter(
    parsed: ParsedRequestParams,
    options: CrudRequestOptions,
  ): any {
    const primaryParams = this.getPrimaryParams(options);
    return parsed.paramsFilter.find(({ field }) => primaryParams.includes(field)).value;
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
    if (options.query.softDelete) {
      if (parsed.includeDeleted !== 1 && !withDeleted) {
        return this.onlyThoseNotDeleted(query);
      }
    }

    return query;
  }

  protected onlyThoseNotDeleted(query: Query<DocumentData>): Query<DocumentData> {
    if (this.collectionHasDeleteField) {
      return query.where(this.collectionDeleteField, '==', false);
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
