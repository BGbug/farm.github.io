
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-static';

const dataDir = path.join(process.cwd(), 'src/data');
const historyFilePath = path.join(dataDir, 'backup-history.json');

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

async function readDataFile(fileName: string) {
    const filePath = path.join(dataDir, fileName);
    try {
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        // Return null if file does not exist or has an error
        return null;
    }
}

async function writeHistory(history: any) {
    await fs.writeFile(historyFilePath, JSON.stringify(history, null, 2), 'utf-8');
}


export async function GET() {
    const backupData: Record<string, any> = {};
    const backupTimestamp = new Date().toISOString();
    // In a real app, you'd get the user from the session/authentication context.
    const backupUser = "Alice Farmer"; 

    for (const fileName of dataFiles) {
        if(fileName === 'backup-history.json') continue;
        const data = await readDataFile(fileName);
        if (data) {
            // Use the file name without extension as the key
            const key = path.parse(fileName).name;
            backupData[key] = data;
        }
    }
    
    const finalBackup = {
        _backupMetadata: {
            timestamp: backupTimestamp,
            user: backupUser,
            version: "1.0.0"
        },
        ...backupData
    };
    
    // Log the backup event
    try {
        let history = await readDataFile('backup-history.json');
        if (!history || !Array.isArray(history.backupHistory)) {
            history = { backupHistory: [] };
        }
        
        const newHistoryEntry = {
            id: `BKP-${Date.now()}`,
            timestamp: backupTimestamp,
            user: backupUser,
            fileName: `farmflow-backup-${backupTimestamp}.json`
        };

        history.backupHistory.unshift(newHistoryEntry);
        await writeHistory(history);

    } catch (error) {
        console.error("Failed to write to backup history:", error);
        // We don't want to fail the whole backup if history logging fails.
    }


    return NextResponse.json(finalBackup, {
        headers: {
            'Content-Disposition': `attachment; filename="farmflow-backup-${backupTimestamp}.json"`,
            'Content-Type': 'application/json',
        }
    });
}
