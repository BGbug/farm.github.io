
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const dataFilePath = path.join(process.cwd(), 'src/data/alerts.json');
const initialData = {
  "alerts": [
    {
      "id": "ALERT-001",
      "timestamp": "2024-07-21T08:00:00Z",
      "module": "Livestock",
      "message": "High urgency health concern detected for COW-001. Limping observed.",
      "read": false,
      "link": "/dashboard/livestock/analyze"
    },
    {
      "id": "ALERT-002",
      "timestamp": "2024-07-20T14:30:00Z",
      "module": "Finances",
      "message": "You have exceeded 90% of your total budget for the season.",
      "read": false,
      "link": "/dashboard/finances"
    },
    {
      "id": "ALERT-003",
      "timestamp": "2024-07-20T09:00:00Z",
      "module": "Crops",
      "message": "Wheat in River Bend field is now ready for harvest.",
      "read": true,
      "link": "/dashboard/crops"
    },
    {
      "id": "ALERT-004",
      "timestamp": "2024-07-19T18:00:00Z",
      "module": "Resources",
      "message": "Fertilizer stock is running low. Current inventory is below 10%.",
      "read": false,
      "link": "/dashboard/resources"
    },
    {
        "id": "ALERT-005",
        "timestamp": "2024-07-18T11:00:00Z",
        "module": "Crops",
        "message": "AI detected potential signs of blight in the Hillside Plot (Potatoes).",
        "read": true,
        "link": "/dashboard/ai/diagnose-plant"
    }
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

export async function GET() {
    const data = await readData();
    const sortedAlerts = data.alerts.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return NextResponse.json(sortedAlerts);
}
