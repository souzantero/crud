export interface CollectionField {
  name: string;
  isDeleteFlag?: boolean;
}

export interface CollectionDefinition {
  name: string;
  fields: CollectionField[];
}
