
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const dataFilePath = path.join(process.cwd(), 'src/data/transactions.json');
const initialData = {
  "transactions": [
    { "id": "TXN-1", "category": "Seeds", "amount": 1200, "date": "2024-04-10T00:00:00Z", "description": "Corn seeds for North Paddock", "type": "expense", "createdAt": "2024-04-10T00:00:00Z" },
    { "id": "TXN-2", "category": "Fertilizers", "amount": 800, "date": "2024-05-15T00:00:00Z", "description": "NPK fertilizer for all fields", "type": "expense", "createdAt": "2024-05-15T00:00:00Z" },
    { "id": "TXN-3", "category": "Livestock Sale", "amount": 1500, "date": "2024-06-01T00:00:00Z", "description": "Sold 2 Boer goats", "type": "revenue", "createdAt": "2024-06-01T00:00:00Z" },
    { "id": "TXN-4", "category": "Labor", "amount": 2500, "date": "2024-06-30T00:00:00Z", "description": "June salaries", "type": "expense", "createdAt": "2024-06-30T00:00:00Z" },
    { "id": "TXN-5", "category": "Feeds", "amount": 600, "date": "2024-07-05T00:00:00Z", "description": "Chicken and cow feed", "type": "expense", "createdAt": "2024-07-05T00:00:00Z" }
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
    return NextResponse.json(data.transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
}

export async function POST(req: NextRequest) {
    const newTransaction = await req.json();
    const data = await readData();
    newTransaction.id = `TXN-${Date.now()}`;
    newTransaction.createdAt = new Date().toISOString();
    data.transactions.push(newTransaction);
    await writeData(data);
    return NextResponse.json(newTransaction, { status: 201 });
}
