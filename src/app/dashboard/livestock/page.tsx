
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInMonths, differenceInYears } from "date-fns";
import Link from 'next/link';
import useSWR, { mutate } from 'swr';

import { apiFetcher } from '@/lib/api';


type Animal = {
  id: string;
  type: string;
  breed: string;
  gender: string;
  dob: string;
  status: string;
  purpose?: string;
};

type NewAnimal = Partial<Omit<Animal, 'id'> & { cost: number }>;

const ANIMAL_TYPES = ["Cow", "Buffalo", "Goat", "Chicken", "Sheep"];
const GENDERS = ["Male", "Female"];
const PURPOSES = ["Dairy", "Meat", "Egg Production", "Breeding", "For Sale", "Growing"];

export default function LivestockPage() {
  const { toast } = useToast();
  const { data: livestock = [], error, isLoading } = useSWR<Animal[]>('/api/livestock', apiFetcher);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [sellPrice, setSellPrice] = useState<number>(0);

  const [newAnimal, setNewAnimal] = useState<NewAnimal>({
    type: "Cow",
    breed: "",
    gender: "Female",
    dob: new Date().toISOString().split('T')[0],
    purpose: "",
    cost: 0,
  });

  const getAge = (dob: string) => {
    if (!dob) return "Unknown";
    const birthDate = new Date(dob);
    const now = new Date();
    const years = differenceInYears(now, birthDate);
    if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
    const months = differenceInMonths(now, birthDate);
    return `${months} month${months > 1 ? 's' : ''}`;
  };
  
  const handleFieldChange = (field: keyof NewAnimal, value: string | number | undefined) => {
    setNewAnimal(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAnimal = async () => {
    if (!newAnimal.type || !newAnimal.breed || !newAnimal.gender || !newAnimal.dob) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill out Type, Breed, Gender, and Date of Birth." });
      return;
    }

    const newAnimalData: Omit<Animal, 'id'> = {
      type: newAnimal.type,
      breed: newAnimal.breed,
      gender: newAnimal.gender,
      dob: newAnimal.dob,
      status: 'Healthy',
      purpose: newAnimal.purpose || 'Growing',
    };

    const animalWithId = {
      ...newAnimalData,
      id: `${newAnimal.type.slice(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`
    }

    await fetch('/api/livestock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(animalWithId),
    });

    if (newAnimal.cost && newAnimal.cost > 0) {
        const transactionToAdd = {
            category: "Livestock Purchase",
            amount: Number(newAnimal.cost),
            date: new Date().toISOString(),
            description: `Purchased ${newAnimal.type} (${newAnimal.breed}) with ID ${animalWithId.id}`,
            type: 'expense',
        };
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionToAdd)
        });
        mutate('/api/transactions');
    }

    mutate('/api/livestock');
    setIsAddDialogOpen(false);
    setNewAnimal({ type: "Cow", breed: "", gender: "Female", dob: new Date().toISOString().split('T')[0], purpose: "", cost: 0 });
    toast({ title: "Animal Added", description: `A new ${newAnimal.type} has been added.` });
  };

  const handleEditClick = (animal: Animal) => {
    setEditingAnimal({ ...animal });
    setIsEditDialogOpen(true);
  };
  
  const handleSellClick = (animal: Animal) => {
    setEditingAnimal(animal);
    setSellPrice(0);
    setIsSellDialogOpen(true);
  }

  const handleConfirmSell = async () => {
    if (editingAnimal && sellPrice > 0) {
        const transactionToAdd = {
            category: "Livestock Sale",
            amount: Number(sellPrice),
            date: new Date().toISOString(),
            description: `Sold ${editingAnimal.type} (${editingAnimal.breed}) with ID ${editingAnimal.id}`,
            type: 'revenue',
        };
        
        await fetch(`/api/livestock/${editingAnimal.id}`, { method: 'DELETE' });
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionToAdd)
        });

        mutate('/api/livestock');
        mutate('/api/transactions');
        
        setIsSellDialogOpen(false);
        setEditingAnimal(null);

        toast({ title: "Animal Sold!", description: `${editingAnimal.type} ID ${editingAnimal.id} has been sold for ₹${sellPrice}.` });
    } else {
        toast({ variant: "destructive", title: "Invalid Price", description: "Please enter a valid selling price." })
    }
  }

  const handleEditFieldChange = (field: keyof Animal, value: string) => {
    if (editingAnimal) {
        setEditingAnimal(prev => prev ? ({ ...prev, [field]: value }) : null);
    }
  }

  const handleSaveEdit = async () => {
    if (editingAnimal) {
        await fetch(`/api/livestock/${editingAnimal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingAnimal),
        });
        mutate('/api/livestock');
        setIsEditDialogOpen(false);
        setEditingAnimal(null);
        toast({ title: "Animal Updated", description: "The animal's information has been successfully updated." });
    }
  };
  
  if (error) return <div>Failed to load livestock</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Livestock Management</h1>
          <p className="text-muted-foreground">Track and manage all the animals on your farm.</p>
        </div>
        <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/livestock/analyze">Live Health Analysis</Link>
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Animal
            </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Livestock Herd</CardTitle>
          <CardDescription>A complete list of all animals currently on the farm.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Loading livestock...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Breed</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {livestock.map(animal => (
                  <TableRow key={animal.id}>
                    <TableCell className="font-mono text-sm">{animal.id}</TableCell>
                    <TableCell className="font-medium">{animal.type}</TableCell>
                    <TableCell className="text-muted-foreground">{animal.breed}</TableCell>
                    <TableCell>{animal.gender}</TableCell>
                    <TableCell>
                      {animal.purpose && <Badge variant="outline">{animal.purpose}</Badge>}
                    </TableCell>
                    <TableCell>{getAge(animal.dob)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={animal.status === 'Healthy' ? 'default' : 'destructive'}
                        className={animal.status === 'Healthy' ? 'bg-green-500/80 text-primary-foreground' : 'bg-yellow-500/80'}
                      >
                        {animal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(animal)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleSellClick(animal)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Animal</DialogTitle>
            <DialogDescription>Log a new animal in your farm's inventory. You can add the purchase cost to create a financial record.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="animal-type" className="text-right">Type</Label>
              <Select value={newAnimal.type} onValueChange={(value) => handleFieldChange('type', value)}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select animal type" /></SelectTrigger>
                <SelectContent>{ANIMAL_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="breed" className="text-right">Breed</Label>
              <Input id="breed" value={newAnimal.breed} onChange={(e) => handleFieldChange('breed', e.target.value)} className="col-span-3" placeholder="e.g., Holstein, Boer" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="purpose" className="text-right">Purpose</Label>
              <Select value={newAnimal.purpose} onValueChange={(value) => handleFieldChange('purpose', value)}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select purpose (optional)" /></SelectTrigger>
                <SelectContent>{PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gender" className="text-right">Gender</Label>
              <Select value={newAnimal.gender} onValueChange={(value) => handleFieldChange('gender', value)}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dob" className="text-right">Date of Birth</Label>
              <Input id="dob" type="date" value={newAnimal.dob} onChange={(e) => handleFieldChange('dob', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-right">Cost (₹)</Label>
              <Input id="cost" type="number" value={newAnimal.cost || ""} onChange={(e) => handleFieldChange('cost', e.target.valueAsNumber)} className="col-span-3" placeholder="Enter purchase price if applicable" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAnimal}>Add Animal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {editingAnimal && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Animal</DialogTitle>
              <DialogDescription>Update the details for {editingAnimal.id}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-animal-type" className="text-right">Type</Label>
                    <Select value={editingAnimal.type} onValueChange={(value) => handleEditFieldChange('type', value)}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>{ANIMAL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-breed" className="text-right">Breed</Label>
                    <Input id="edit-breed" value={editingAnimal.breed} onChange={(e) => handleEditFieldChange('breed', e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-purpose" className="text-right">Purpose</Label>
                    <Select value={editingAnimal.purpose} onValueChange={(value) => handleEditFieldChange('purpose', value)}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>{PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-gender" className="text-right">Gender</Label>
                     <Select value={editingAnimal.gender} onValueChange={(value) => handleEditFieldChange('gender', value)}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-dob" className="text-right">Date of Birth</Label>
                    <Input id="edit-dob" type="date" value={editingAnimal.dob} onChange={(e) => handleEditFieldChange('dob', e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-status" className="text-right">Status</Label>
                    <Input id="edit-status" value={editingAnimal.status} onChange={(e) => handleEditFieldChange('status', e.target.value)} className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {editingAnimal && (
        <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Sell Animal: {editingAnimal.id}</DialogTitle>
                    <DialogDescription>
                        Enter the selling price for this {editingAnimal.type}. This will remove the animal from the active list and record the revenue.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="sell-price" className="text-right">Sell Price (₹)</Label>
                        <Input id="sell-price" type="number" value={sellPrice || ''} onChange={(e) => setSellPrice(e.target.valueAsNumber)} className="col-span-3" placeholder="e.g., 500" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSellDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmSell} variant="destructive">Confirm Sale</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

    </div>
  )
}
