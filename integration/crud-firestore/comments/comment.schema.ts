import { CollectionSchema } from "@nestjsx/crud-firestore";

export const commentSchema = {
    name: 'comments',
    fields: [
        { name: 'title' },
        { name: 'userId' },
        { name: 'postId' },
        { name: 'createdAt' },
        { name: 'updatedAt' }
    ]
} as CollectionSchema;