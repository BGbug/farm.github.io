
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-static';

const dataFilePath = path.join(process.cwd(), 'src/data/backup-history.json');
const initialData = { "backupHistory": [] };

async function readData() {
    try {
        await fs.access(dataFilePath);
        const fileContent = await fs.readFile(dataFilePath, 'utf-8');
        if (!fileContent) {
            await fs.writeFile(dataFilePath, JSON.stringify(initialData, null, 2), 'utf-8');
            return initialData;
        }
        return JSON.parse(fileContent);
    } catch (error) {
        await fs.writeFile(dataFilePath, JSON.stringify(initialData, null, 2), 'utf-8');
        return initialData;
    }
}

export async function GET() {
    const data = await readData();
    const sortedHistory = data.backupHistory.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return NextResponse.json(sortedHistory);
}
