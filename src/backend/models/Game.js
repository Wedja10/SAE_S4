import mongoose from 'mongoose';

const GameSchema = new mongoose.Schema({
    game_code: String,
    status: String,
    start_time: Date,
    end_time: Date,
    players: [
        {
            player_id: String,
            articles_visited: [String],
            current_article: String,
            artifacts: [String],
            score: Number
        }
    ],
    articles_to_visit: [String],
    artifacts_distribution: [
        {
            article: String,
            artifact: String
        }
    ]
});

export default mongoose.model('Game', GameSchema);