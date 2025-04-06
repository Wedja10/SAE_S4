import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
    player_id: {
        type: String,
        required: true
    },
    start_article: {
        type: String,
        required: true
    },
    path: {
        type: [String],
        required: true
    },
    time_taken: {
        type: Number,
        required: true
    },
    rank: Number,
    completed: {
        type: Boolean,
        default: false
    }
});

const ChallengeSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },
    destination_article: {
        type: String,
        required: true
    },
    players: [PlayerSchema]
});

export default mongoose.model('Challenge', ChallengeSchema);
