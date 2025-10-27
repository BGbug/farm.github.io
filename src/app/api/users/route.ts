
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-static';

const dataFilePath = path.join(process.cwd(), 'src/data/users.json');
const initialData = {
  "users": [
    { "id": 1, "name": "Alice Farmer", "username": "alicefarm", "email": "alice@farm.com", "role": "Admin", "avatarId": "avatar-1" },
    { "id": 2, "name": "Bob Manager", "username": "bobman", "email": "bob@farm.com", "role": "Manager", "avatarId": "avatar-2" },
    { "id": 3, "name": "Charlie Worker", "username": "charliework", "email": "charlie@farm.com", "role": "Farmer", "avatarId": "avatar-3" }
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
    return NextResponse.json(data.users);
}
