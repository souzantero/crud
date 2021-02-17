export function getCollectionToken(collectionName: string): string {
  return `${collectionName}Provider`;
}

export function getRepositoryToken(collectionName: string): string {
  return `${collectionName}Repository`;
}
