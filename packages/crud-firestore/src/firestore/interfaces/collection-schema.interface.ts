export interface CollectionField {
  name: string;
  isDeleteFlag?: boolean;
}

export interface CollectionSchema {
  name: string;
  fields: CollectionField[];
}
