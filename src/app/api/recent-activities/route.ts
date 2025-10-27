
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-static';

const dataFilePath = path.join(process.cwd(), 'src/data/recent-activities.json');
const initialData = {
  "recentActivities": [
    { "id": 1, "activity": "Harvested Corn Field A3", "timestamp": "2 hours ago", "type": "Harvest" },
    { "id": 2, "activity": "Applied fertilizer to Wheat Field B1", "timestamp": "1 day ago", "type": "Fertilizer" },
    { "id": 3, "activity": "Planted Soybeans in Field C2", "timestamp": "3 days ago", "type": "Planting" },
    { "id": 4, "activity": "Irrigation system ran on Field A3", "timestamp": "4 days ago", "type": "Water" }
  ]
};

async function readData() {
    try {
        await fs.access(dataFilePath);
        const fileContent = await fs.readFile(dataFilePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        await fs.writeFile(dataFilePath, JSON.stringify(initialData, null, 2), 'utf-8');
        return initialData;
    }
}

export async function GET() {
    const data = await readData();
    return NextResponse.json(data.recentActivities);
}
