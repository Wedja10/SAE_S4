import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
    pseudo: String,
    current_game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    history: [
        {
            game_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
            game_code: String,
            articles_visited: [String],
            score: Number,
            rank: Number
        }
    ],
    pp: String,
    pp_color: { type: String, default: null }
});

export default mongoose.model('Player', PlayerSchema, 'players');