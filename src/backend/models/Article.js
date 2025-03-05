import mongoose from 'mongoose';

const ArticleSchema = new mongoose.Schema({
    title: String,
    popular: Boolean,
});

export default mongoose.model('Article', ArticleSchema);