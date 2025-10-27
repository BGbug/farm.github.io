
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-static';

const dataFilePath = path.join(process.cwd(), 'src/data/fields.json');
const initialData = {
  "fields": [
    { "id": "F001", "name": "North Paddock", "crop": "Corn", "area": 120, "status": "Growing" },
    { "id": "F002", "name": "West Field", "crop": "Soybeans", "area": 85, "status": "Flowering" },
    { "id": "F003", "name": "River Bend", "crop": "Wheat", "area": 150, "status": "Harvest Ready" },
    { "id": "F004", "name": "Hillside Plot", "crop": "Potatoes", "area": 45, "status": "Planted" },
    { "id": "F005", "name": "South Field", "crop": "Fallow", "area": 100, "status": "Idle" }
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
    return NextResponse.json(data.fields);
}
