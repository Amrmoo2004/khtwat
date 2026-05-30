import mongoose from 'mongoose';
import fs from 'fs';
import xlsx from 'xlsx';
import { QuestionModel } from './src/modules/DB/models/question.model.js';

async function seed() {
    try {
        // Connect to MongoDB Atlas
        await mongoose.connect('mongodb+srv://amrmohamaf3_db_user:mimTM47x9VFf2pBN@cluster0.yibxlnu.mongodb.net/khtwat');
        console.log('Connected to MongoDB Atlas.');

        console.log('Reading CSV file...');
        const workbook = xlsx.readFile('Khatwaat-Ai-main/backend/converted_question_bank.csv');
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to array of arrays because CSV might not have standard headers or we want to be safe
        const rows = xlsx.utils.sheet_to_json(sheet);

        console.log(`Found ${rows.length} questions in CSV.`);

        let insertedCount = 0;

        for (const row of rows) {
            // The columns in the CSV are:
            // QuestionID, QuestionText, Subject, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, irt_a, irt_c, irt_b, Difficulty
            // We need to parse them safely
            
            const irt_a = parseFloat(row.irt_a) || 1.0;
            const irt_b = parseFloat(row.irt_b) || 0.0;
            
            const questionData = {
                question_id: String(row.QuestionID),
                subject: String(row.Subject),
                text: String(row.QuestionText),
                options: {
                    A: String(row.OptionA),
                    B: String(row.OptionB),
                    C: String(row.OptionC),
                    D: String(row.OptionD)
                },
                correct_answer: String(row.CorrectAnswer),
                irt_parameters: {
                    difficulty_b: irt_b,
                    discrimination_a: irt_a
                }
            };

            // Use updateOne with upsert to avoid duplicate key errors and update existing random ones
            await QuestionModel.updateOne(
                { question_id: questionData.question_id },
                { $set: questionData },
                { upsert: true }
            );
            insertedCount++;
        }

        console.log(`Successfully seeded ${insertedCount} questions using the CALIBRATED IRT data from CSV!`);
        
    } catch (error) {
        console.error('Error during seeding:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

seed();
