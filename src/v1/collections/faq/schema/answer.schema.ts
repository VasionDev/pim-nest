import * as mongoose from 'mongoose'

export const Answer = new mongoose.Schema({
    answer: {
        type: String,
        trim: true,
        required: true
    },
    products: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Product',
        default: []
    },
}, { _id : false })