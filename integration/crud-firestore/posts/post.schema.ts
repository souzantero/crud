import { CollectionSchema } from "@nestjsx/crud-firestore";

export const postSchema = {
    name: 'posts',
    fields: [
        { name: 'title' },
        { name: 'userId' },
        { name: 'createdAt' },
        { name: 'updatedAt' }
    ]
} as CollectionSchema;