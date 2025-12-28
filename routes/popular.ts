import express from "express";

const router = express.Router();

import { getCollections } from "../db.js";

interface CourseItem {
    country: string;
    level: string;
    gpa_percent: number;
    english_test: string;
    total_score: number;
    budget_per_year: number;
    preferred_intake: string;
    study_gaps_years: number;
}

interface queryParams {
    $regex: string;
    $options: "i" 
}
export interface FilterQuery {
    country?: string | string[];
    level?: string | string[];
    gpa_percent?: string | string[];
    english_test?: string | string[];
    total_score?: string | string[];
    budget_per_year?: string | string[];
    preferred_intake?: string | string[];
    study_gaps_years?: string | string[];
}

router.get("/",async (req: express.Request, res: express.Response): Promise<void>=>{

    try {
        const { popular } = getCollections();
        const result: CourseItem[] = await popular.find<CourseItem>({}).toArray();

        res.send(result);
    } catch (err: unknown) {
        res.status(500).send({ message: 'Failed to fetch popular items', error: err instanceof Error ? err.message : 'Unknown error' });
    }
})

router.get("/courses",async (req: express.Request, res: express.Response): Promise<void> =>{
    const {
        country, level, gpa_percent,
        english_test, total_score, budget_per_year,
        preferred_intake, study_gaps_years
    } = req.query as FilterQuery;

    try {
        const { popular } = getCollections();
        let results: CourseItem[] = await popular.find<CourseItem>({}).toArray();

        // 🔍 Filter: Country
        if (country) {
            results = results.filter(item =>
                item.country.toLowerCase() === (country as string).toLowerCase()
            );
        }

        // 🔍 Filter: Level
        if (level) {
            results = results.filter(item =>
                item.level.toLowerCase() === (level as string).toLowerCase()
            );
        }

        // 🔍 Filter: Minimum GPA (>=)
        if (gpa_percent) {
            results = results.filter(item =>
                item.gpa_percent >= Number(gpa_percent)
            );
        }

        // 🔍 Filter: English Test Type (IELTS / PTE / TOEFL)
        if (english_test) {
            results = results.filter(item =>
                item.english_test.toLowerCase() === (english_test as String).toLowerCase()
            );
        }

        // 🔍 Filter: Total Score (>=)
        if (total_score) {
            results = results.filter(item =>
                item.total_score >= Number(total_score)
            );
        }

        // 🔍 Filter: Budget (<= max budget)
        if (budget_per_year) {
            results = results.filter(item =>
                item.budget_per_year <= Number(budget_per_year)
            );
        }

        // 🔍 Filter: Preferred Intake
        if (preferred_intake) {
            results = results.filter(item =>
                item.preferred_intake.toLowerCase() === (preferred_intake as String).toLowerCase()
            );
        }

        // 🔍 Filter: Study Gap (<= allowed gap)
        if (study_gaps_years) {
            results = results.filter(item =>
                item.study_gaps_years <= Number(study_gaps_years)
            );
        }

        res.json({
            success: true,
            count: results.length,
            data: results,
        });
    } catch (err: unknown) {
        res.status(500).json({ success: false, message: 'Course filtering failed', error: err instanceof Error ? err.message : 'Unknown error' });
    }
})

export default router