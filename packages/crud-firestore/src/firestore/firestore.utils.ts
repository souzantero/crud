export function getCollectionToken(collectionName: string): string {
  return `${collectionName}Provider`;
}

export function getSchemaToken(collectionName: string): string {
  return `${collectionName}Schema`;
}

export function getProjectToken(name: string): string {
  return `${name}Project`;
}
