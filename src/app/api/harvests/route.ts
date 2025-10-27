
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const dataFilePath = path.join(process.cwd(), 'src/data/harvests.json');
const transactionsFilePath = path.join(process.cwd(), 'src/data/transactions.json');

const initialData = {
  "harvests": [
    {
      "id": "HARV-1",
      "date": "2024-06-15",
      "item": "Wheat",
      "type": "Crop",
      "quantity": 50,
      "unit": "quintal",
      "notes": "Excellent quality, low moisture.",
      "sold": true,
      "saleDetails": {
        "pricePerUnit": 2200,
        "totalRevenue": 110000
      }
    },
    {
      "id": "HARV-2",
      "date": "2024-07-20",
      "item": "Eggs",
      "type": "Eggs",
      "quantity": 4,
      "unit": "dozen",
      "notes": "Collected from layer chickens",
      "sold": false
    }
  ]
};

async function readData(filePath: string, defaultData: any) {
    try {
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
        return defaultData;
    }
}

async function writeData(filePath: string, data: any) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
    const data = await readData(dataFilePath, initialData);
    const sorted = data.harvests.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json(sorted);
}

export async function POST(req: NextRequest) {
    const newLog = await req.json();
    
    if (!newLog.item || !newLog.quantity || !newLog.unit || !newLog.date) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const harvestData = await readData(dataFilePath, initialData);
    
    const newHarvest = {
        id: `HARV-${Date.now()}`,
        date: newLog.date,
        item: newLog.item,
        type: newLog.type,
        quantity: newLog.quantity,
        unit: newLog.unit,
        notes: newLog.notes || '',
        sold: newLog.sold || false,
        saleDetails: undefined as any,
    };

    if (newHarvest.sold) {
        if (!newLog.pricePerUnit || newLog.pricePerUnit <= 0) {
            return NextResponse.json({ message: 'Valid pricePerUnit is required for sold items' }, { status: 400 });
        }
        
        const totalRevenue = newHarvest.quantity * newLog.pricePerUnit;
        newHarvest.saleDetails = {
            pricePerUnit: newLog.pricePerUnit,
            totalRevenue: totalRevenue,
        };
        
        const transactionsData = await readData(transactionsFilePath, { transactions: [] });
        const newTransaction = {
            id: `TXN-${Date.now()}`,
            category: 'Livestock Sale', // Note: This could be more dynamic, e.g., 'Crop Sale', 'Product Sale'
            amount: totalRevenue,
            date: newHarvest.date,
            description: `Sale of ${newHarvest.quantity} ${newHarvest.unit} of ${newHarvest.item}`,
            type: 'revenue',
            createdAt: new Date().toISOString(),
        };
        transactionsData.transactions.push(newTransaction);
        await writeData(transactionsFilePath, transactionsData);
    }
    
    harvestData.harvests.push(newHarvest);
    await writeData(dataFilePath, harvestData);

    return NextResponse.json(newHarvest, { status: 201 });
}
