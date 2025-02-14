import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
    pseudo: String,
    current_game: String,
    history: [
        {
            game_code: String,
            articles_visited: [String],
            score: Number,
            rank: Number
        }
    ]
});

export default mongoose.model('Player', PlayerSchema);