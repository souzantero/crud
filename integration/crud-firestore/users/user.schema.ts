import { CollectionSchema } from "nestjsx-crud-firestore";

export const userSchema = {
    name: 'users',
    fields: [
        { name: 'name' },
        { name: 'email' },
        { name: 'password' },
        { name: 'createdAt' },
        { name: 'updatedAt' }
    ]
} as CollectionSchema;