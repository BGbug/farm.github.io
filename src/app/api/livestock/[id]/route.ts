
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const dataFilePath = path.join(process.cwd(), 'src/data/livestock.json');

async function readData() {
    try {
        const fileContent = await fs.readFile(dataFilePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return { livestock: [] };
    }
}

async function writeData(data: any) {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    const updatedAnimal = await req.json();
    const data = await readData();
    const index = data.livestock.findIndex((animal: any) => animal.id === id);

    if (index === -1) {
        return NextResponse.json({ message: 'Animal not found' }, { status: 404 });
    }

    data.livestock[index] = { ...data.livestock[index], ...updatedAnimal };
    await writeData(data);
    return NextResponse.json(data.livestock[index]);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    const data = await readData();
    const filteredLivestock = data.livestock.filter((animal: any) => animal.id !== id);

    if (data.livestock.length === filteredLivestock.length) {
        return NextResponse.json({ message: 'Animal not found' }, { status: 404 });
    }

    await writeData({ livestock: filteredLivestock });
    return NextResponse.json({ message: 'Animal sold and removed' }, { status: 200 });
}
