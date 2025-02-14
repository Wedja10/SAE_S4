"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var PlayerSchema = new mongoose_1.default.Schema({
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
exports.default = mongoose_1.default.model('Player', PlayerSchema);
