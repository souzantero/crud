export function getCollectionToken(collectionName: string): string {
  return `${collectionName}Provider`;
}

export function getMetadataToken(collectionName: string): string {
  return `${collectionName}Metadata`;
}
