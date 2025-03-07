import mongoose from 'mongoose';

const ArtifactSchema = new mongoose.Schema({
    name: String,
    storable: Boolean,
    effect: String,
    positive: Boolean,
});

export default mongoose.model('Artifact', ArtifactSchema);