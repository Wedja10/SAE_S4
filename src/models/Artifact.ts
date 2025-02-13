import mongoose from 'mongoose';

const ArtifactSchema = new mongoose.Schema({
    name: String,
    type: String,
    effect: String,
    usage: String
});

export default mongoose.model('Artifact', ArtifactSchema);