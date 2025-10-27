
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const dataFilePath = path.join(process.cwd(), 'src/data/crops.json');
const initialData = {
  "crops": [
    { "id": "C01", "name": "Corn", "plantedOn": "2024-04-15", "expectedHarvest": "2024-09-20", "status": "Growing", "field": "North Paddock" },
    { "id": "S01", "name": "Soybeans", "plantedOn": "2024-05-01", "expectedHarvest": "2024-10-05", "status": "Flowering", "field": "West Field" },
    { "id": "W01", "name": "Wheat", "plantedOn": "2023-10-20", "expectedHarvest": "2024-06-15", "status": "Harvested", "field": "River Bend" },
    { "id": "P01", "name": "Potatoes", "plantedOn": "2024-05-20", "expectedHarvest": "2024-09-30", "status": "Planted", "field": "Hillside Plot" }
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

async function writeData(data: any) {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
    const data = await readData();
    return NextResponse.json(data.crops);
}

export async function POST(req: NextRequest) {
    const newData = await req.json();
    const data = await readData();
    data.crops.push(newData);
    await writeData(data);
    return NextResponse.json(newData, { status: 201 });
}
