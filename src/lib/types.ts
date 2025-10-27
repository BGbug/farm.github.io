
export type Animal = {
  id: string;
  type: string;
  breed: string;
  gender: string;
  dob: string;
  status: string;
  purpose?: string;
};

export type Transaction = {
  id: string;
  category: string;
  amount: number;
  date: string; // ISO 8601 format
  description: string;
  type: 'expense' | 'revenue';
  evidenceUrl?: string;
  createdAt: string; // ISO 8601 format
};

export type EggLog = {
    id: string;
    date: string; // ISO 8601 format
    quantity: number;
    notes?: string;
    createdAt: string; // ISO 8601 format
};

export type Crop = { 
  id: string; 
  name: string; 
  plantedOn: string; 
  expectedHarvest: string; 
  status: string; 
  field: string;
};

export type Field = {
  id: string;
  name: string;
  crop: string;
  area: number;
  status: string;
};

export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: "Admin" | "Manager" | "Farmer";
  avatarId: string;
};

export type Activity = {
  id: number;
  activity: string;
  timestamp: string;
  type: string;
};
