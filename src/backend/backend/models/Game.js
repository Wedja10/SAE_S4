import mongoose from 'mongoose';

const GameSchema = new mongoose.Schema({
    game_code: String,
    status: String,
    start_time: Date,
    end_time: Date,
    players: [
        {
            player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
            articles_visited: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
            current_article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
            artifacts: [String],
            score: Number
        }
    ],
    articles_to_visit: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
    artifacts_distribution: [
        {
            article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
            artifact: String
        }
    ]
});

export default mongoose.model('Game', GameSchema);