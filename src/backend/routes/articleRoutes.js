import express from "express";
import Article from "../models/Article.js";
import {createArticle} from "../methods/articleMethods.js";

const router = express.Router();

// Route GET pour récupérer tous les articles
router.post("/create-article", createArticle);

export default router;
