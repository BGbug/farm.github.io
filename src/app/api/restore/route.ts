
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-static';

const dataDir = path.join(process.cwd(), 'src/data');
const dataFiles = [
    'alerts.json',
    'crops.json',
    'egg-logs.json',
    'fields.json',
    'livestock.json',
    'recent-activities.json',
    'transactions.json',
    'users.json',
    'harvests.json',
    'backup-history.json'
];

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('backup') as File | null;

        if (!file) {
            return NextResponse.json({ message: 'No backup file uploaded.' }, { status: 400 });
        }

        const fileContent = await file.text();
        const backupData = JSON.parse(fileContent);

        // Remove metadata before processing
        delete backupData._backupMetadata;

        for (const key in backupData) {
            // The key from the backup file, e.g., 'livestock', 'recent-activities'
            const backupKey = key;
            const dataToRestore = backupData[backupKey];

            // Convert kebab-case to camelCase for the object key inside the file
            const camelCaseKey = backupKey.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const fileName = `${backupKey}.json`;

            if (dataFiles.includes(fileName)) {
                const filePath = path.join(dataDir, fileName);
                
                // The data in the JSON files is usually nested under a key that matches the camelCase version of the filename
                // e.g., egg-logs.json contains { "eggLogs": [...] }
                const filePayload = { [camelCaseKey]: dataToRestore[camelCaseKey] || dataToRestore };

                await fs.writeFile(filePath, JSON.stringify(filePayload, null, 2), 'utf-8');
            }
        }

        return NextResponse.json({ message: 'Restore successful.' }, { status: 200 });

    } catch (error) {
        console.error('Restore failed:', error);
        let message = 'An unknown error occurred during restore.';
        if (error instanceof Error) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }
        return NextResponse.json({ message }, { status: 500 });
    }
}
