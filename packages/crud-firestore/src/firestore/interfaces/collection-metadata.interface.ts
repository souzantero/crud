export interface CollectionField {
  name: string;
  isDeleteFlag?: boolean;
}

export interface CollectionMetadata {
  name: string;
  fields: CollectionField[];
}
