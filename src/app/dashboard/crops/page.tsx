
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, addDays } from "date-fns"
import { useToast } from "@/hooks/use-toast";
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Crop = { 
  id: string; 
  name: string; 
  plantedOn: string; 
  expectedHarvest: string; 
  status: string; 
  field: string;
};

type Field = {
  id: string;
  name: string;
}

export default function CropsPage() {
  const { toast } = useToast();
  const [isAddCropOpen, setIsAddCropOpen] = useState(false);
  const [newCrop, setNewCrop] = useState<Partial<Omit<Crop, 'id'>>>({
    name: "",
    field: "",
    plantedOn: new Date().toISOString().split('T')[0],
  });

  const { data: crops = [], error: cropsError, isLoading: cropsLoading } = useSWR<Crop[]>('/api/crops', fetcher);
  const { data: fields = [], error: fieldsError, isLoading: fieldsLoading } = useSWR<Field[]>('/api/fields', fetcher);


  const handleFieldChange = (field: keyof typeof newCrop, value: string | Date | undefined) => {
    let finalValue = value;
    if (value instanceof Date) {
      finalValue = format(value, 'yyyy-MM-dd');
    }
    setNewCrop(prev => ({ ...prev, [field]: finalValue }));
  };

  const handleAddCrop = async () => {
    if (!newCrop.name || !newCrop.field || !newCrop.plantedOn) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all crop details.",
      });
      return;
    }

    const plantedDate = new Date(newCrop.plantedOn);
    const newCropData: Omit<Crop, 'id'> = {
      name: newCrop.name,
      field: newCrop.field,
      plantedOn: format(plantedDate, 'yyyy-MM-dd'),
      expectedHarvest: format(addDays(plantedDate, 120), 'yyyy-MM-dd'),
      status: 'Planted'
    };
    
    const finalCropData = {
      ...newCropData,
      id: `CROP-${Date.now()}`
    }

    try {
      await fetch('/api/crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalCropData),
      });

      mutate('/api/crops'); // Revalidate the crops data
      setIsAddCropOpen(false);
      setNewCrop({ name: "", field: "", plantedOn: new Date().toISOString().split('T')[0] });
      toast({
        title: "Crop Added",
        description: `${newCrop.name} has been added to your crop log.`,
      });
    } catch(e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add crop.",
      });
    }
  };

  if (cropsError || fieldsError) return <div>Failed to load data</div>;
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Crop Management</h1>
          <p className="text-muted-foreground">Monitor and manage your crop cycles from planting to harvest.</p>
        </div>
        <Button onClick={() => setIsAddCropOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Crop
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Crop Overview</CardTitle>
          <CardDescription>A summary of all active and past crop cycles on your farm.</CardDescription>
        </CardHeader>
        <CardContent>
          {cropsLoading ? <p>Loading crops...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Planted On</TableHead>
                  <TableHead>Expected Harvest</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crops.map(crop => (
                  <TableRow key={crop.id}>
                    <TableCell className="font-medium">{crop.name}</TableCell>
                    <TableCell className="text-muted-foreground">{crop.field}</TableCell>
                    <TableCell>{format(new Date(crop.plantedOn), 'PPP')}</TableCell>
                    <TableCell>{format(new Date(crop.expectedHarvest), 'PPP')}</TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={crop.status === 'Harvested' ? 'default' : 'outline'}
                        className={crop.status === 'Harvested' ? 'bg-primary/80 text-primary-foreground' : crop.status === 'Growing' ? 'border-green-500/50 text-green-600' : ''}
                      >
                        {crop.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddCropOpen} onOpenChange={setIsAddCropOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Crop</DialogTitle>
            <DialogDescription>
              Log a new crop cycle. The expected harvest date will be estimated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="crop-name" className="text-right">
                Crop Name
              </Label>
              <Input
                id="crop-name"
                value={newCrop.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="col-span-3"
                placeholder="e.g., Corn"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="field" className="text-right">
                Field
              </Label>
              <Select
                  value={newCrop.field}
                  onValueChange={(value) => handleFieldChange('field', value)}
              >
                  <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                      {fieldsLoading && <SelectItem value="loading" disabled>Loading fields...</SelectItem>}
                      {fields.map(field => (
                          <SelectItem key={field.id} value={field.name}>{field.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plantedOn" className="text-right">
                Planted On
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !newCrop.plantedOn && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newCrop.plantedOn ? format(new Date(newCrop.plantedOn), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newCrop.plantedOn ? new Date(newCrop.plantedOn) : undefined}
                    onSelect={(date) => handleFieldChange('plantedOn', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCropOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCrop}>Add Crop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
