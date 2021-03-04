export function getCollectionToken(collectionName: string): string {
  return `${collectionName}Provider`;
}

export function getDefinitionToken(collectionName: string): string {
  return `${collectionName}Definition`;
}

export function getProjectToken(name: string): string {
  return `${name}Project`;
}
