import mongoose from 'mongoose';

const ChallengeSchema = new mongoose.Schema({
    date: Date,
    destination_article: String,
    players: [
        {
            player_id: String,
            start_article: String,
            path: [String],
            time_taken: Number,
            rank: Number
        }
    ],
    leaderboard: [
        {
            player_id: String,
            path_length: Number,
            time_taken: Number
        }
    ]
});

export default mongoose.model('Challenge', ChallengeSchema);