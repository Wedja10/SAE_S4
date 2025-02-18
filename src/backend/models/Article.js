import mongoose from 'mongoose';

const ArticleSchema = new mongoose.Schema({
    title: String,
    popularity: Number,
});

export default mongoose.model('Article', ArticleSchema);