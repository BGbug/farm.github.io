
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const dataFilePath = path.join(process.cwd(), 'src/data/egg-logs.json');
const initialData = {
  "eggLogs": [
    { "id": "LOG-1", "date": "2024-07-20T10:00:00Z", "quantity": 48, "notes": "A bit smaller than usual", "createdAt": "2024-07-20T10:00:00Z"},
    { "id": "LOG-2", "date": "2024-07-19T10:00:00Z", "quantity": 52, "notes": "", "createdAt": "2024-07-19T10:00:00Z"},
    { "id": "LOG-3", "date": "2024-07-18T10:00:00Z", "quantity": 50, "notes": "One egg was cracked", "createdAt": "2024-07-18T10:00:00Z"}
  ]
};

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

async function writeData(data: any) {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
    const data = await readData();
    const sortedLogs = data.eggLogs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json(sortedLogs);
}

export async function POST(req: NextRequest) {
    const newLog = await req.json();
    const data = await readData();
    newLog.id = `LOG-${Date.now()}`;
    newLog.createdAt = new Date().toISOString();
    data.eggLogs.push(newLog);
    await writeData(data);
    return NextResponse.json(newLog, { status: 201 });
}
