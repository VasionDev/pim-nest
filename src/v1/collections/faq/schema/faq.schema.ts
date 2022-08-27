import * as mongoose from 'mongoose'
import { Answer } from './answer.schema'

export const faqCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        unique: true,
        required: true
    },
    note: {
        type: String,
        trim: true,
        default: ''
    },
    faqs: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Faq',
        default: []
    }
}, {timestamps: true})

export const faqSchema = new mongoose.Schema({
    question: {
        type: String,
        trim: true,
        required: true
    },
    note: {
        type: String,
        trim: true,
        default: ''
    },
    answers: {
        type: [Answer],
        default: []
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faq_Category',
        required: true 
    }
}, {timestamps: true})
