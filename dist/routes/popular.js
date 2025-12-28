import express from "express";
const router = express.Router();
import { getCollections } from "../db.js";
router.get("/", async (req, res) => {
    try {
        const { popular } = getCollections();
        const result = await popular.find({}).toArray();
        res.send(result);
    }
    catch (err) {
        res.status(500).send({ message: 'Failed to fetch popular items', error: err instanceof Error ? err.message : 'Unknown error' });
    }
});
router.get("/courses", async (req, res) => {
    const { country, level, gpa_percent, english_test, total_score, budget_per_year, preferred_intake, study_gaps_years } = req.query;
    try {
        const { popular } = getCollections();
        let results = await popular.find({}).toArray();
        // 🔍 Filter: Country
        if (country) {
            results = results.filter(item => item.country.toLowerCase() === country.toLowerCase());
        }
        // 🔍 Filter: Level
        if (level) {
            results = results.filter(item => item.level.toLowerCase() === level.toLowerCase());
        }
        // 🔍 Filter: Minimum GPA (>=)
        if (gpa_percent) {
            results = results.filter(item => item.gpa_percent >= Number(gpa_percent));
        }
        // 🔍 Filter: English Test Type (IELTS / PTE / TOEFL)
        if (english_test) {
            results = results.filter(item => item.english_test.toLowerCase() === english_test.toLowerCase());
        }
        // 🔍 Filter: Total Score (>=)
        if (total_score) {
            results = results.filter(item => item.total_score >= Number(total_score));
        }
        // 🔍 Filter: Budget (<= max budget)
        if (budget_per_year) {
            results = results.filter(item => item.budget_per_year <= Number(budget_per_year));
        }
        // 🔍 Filter: Preferred Intake
        if (preferred_intake) {
            results = results.filter(item => item.preferred_intake.toLowerCase() === preferred_intake.toLowerCase());
        }
        // 🔍 Filter: Study Gap (<= allowed gap)
        if (study_gaps_years) {
            results = results.filter(item => item.study_gaps_years <= Number(study_gaps_years));
        }
        res.json({
            success: true,
            count: results.length,
            data: results,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Course filtering failed', error: err instanceof Error ? err.message : 'Unknown error' });
    }
});
export default router;
