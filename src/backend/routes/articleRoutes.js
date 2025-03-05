import express from "express";
import Article from "../models/Article.js";
import {createArticleFront, insertArticle} from "../methods/articleMethods.js";

const router = express.Router();

// Route GET pour récupérer tous les articles
router.post("/create-article", createArticleFront);
router.post("/insert", insertArticle);

export default router;
