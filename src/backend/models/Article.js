import mongoose from 'mongoose';

const ArticleSchema = new mongoose.Schema({
    title: String,
    content: String,
    popularity: Number,
    links: [String]
});

export default mongoose.model('Article', ArticleSchema);