
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const dataFilePath = path.join(process.cwd(), 'src/data/livestock.json');
const initialData = {
  "livestock": [
    { "id": "COW-001", "type": "Cow", "breed": "Holstein", "gender": "Female", "dob": "2020-03-15", "status": "Healthy", "purpose": "Dairy" },
    { "id": "GOA-001", "type": "Goat", "breed": "Boer", "gender": "Male", "dob": "2022-08-20", "status": "Needs Vaccination", "purpose": "For Sale" },
    { "id": "BUF-001", "type": "Buffalo", "breed": "Murrah", "gender": "Female", "dob": "2019-11-10", "status": "Healthy", "purpose": "Dairy" },
    { "id": "CHI-001", "type": "Chicken", "breed": "Broiler", "gender": "Female", "dob": "2024-05-01", "status": "Healthy", "purpose": "Egg Production" },
    { "id": "COW-002", "type": "Cow", "breed": "Jersey", "gender": "Female", "dob": "2023-12-01", "status": "Healthy", "purpose": "Growing" },
    { "id": "CHI-002", "type": "Chicken", "breed": "Layer", "gender": "Male", "dob": "2024-05-01", "status": "Healthy", "purpose": "For Sale" }
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
    return NextResponse.json(data.livestock);
}

export async function POST(req: NextRequest) {
    const newAnimal = await req.json();
    const data = await readData();
    data.livestock.push(newAnimal);
    await writeData(data);
    return NextResponse.json(newAnimal, { status: 201 });
}
