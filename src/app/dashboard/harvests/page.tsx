
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Tractor } from "lucide-react";
import { cn } from "@/lib/utils";
import useSWR, { mutate } from 'swr';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiFetcher } from '@/lib/api';

type HarvestLog = {
    id: string;
    date: string;
    item: string;
    type: string;
    quantity: number;
    unit: string;
    notes?: string;
    sold: boolean;
    saleDetails?: {
        pricePerUnit: number;
        totalRevenue: number;
    };
};

type NewHarvestLog = {
    date: Date;
    item: string;
    type: 'Crop' | 'Vegetable' | 'Fruit' | 'Eggs' | 'Meat' | 'Other';
    quantity: number;
    unit: string;
    notes: string;
    sold: boolean;
    pricePerUnit?: number;
};

const harvestTypes = ['Crop', 'Vegetable', 'Fruit', 'Eggs', 'Meat', 'Other'];
const units = ['quintal', 'kg', 'ton', 'dozen', 'item'];

export default function HarvestLogPage() {
    const { toast } = useToast();
    const [newLog, setNewLog] = useState<NewHarvestLog>({
        date: new Date(),
        item: "",
        type: "Crop",
        quantity: 0,
        unit: "kg",
        notes: "",
        sold: false,
    });

    const { data: harvestLogs = [], error, isLoading } = useSWR<HarvestLog[]>('/api/harvests', apiFetcher);

    const handleFieldChange = (field: keyof NewHarvestLog, value: any) => {
        setNewLog(prev => ({ ...prev, [field]: value }));
    };

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newLog.quantity <= 0 || !newLog.item) {
            toast({
                variant: "destructive",
                title: "Invalid Input",
                description: "Please enter a valid item name and quantity.",
            });
            return;
        }

        if (newLog.sold && (!newLog.pricePerUnit || newLog.pricePerUnit <= 0)) {
            toast({
                variant: "destructive",
                title: "Invalid Price",
                description: "Please enter a valid price per unit for the sale.",
            });
            return;
        }

        const logData = {
            ...newLog,
            date: format(newLog.date, 'yyyy-MM-dd'),
            quantity: Number(newLog.quantity),
            pricePerUnit: newLog.sold ? Number(newLog.pricePerUnit) : undefined,
        };

        try {
            const res = await fetch('/api/harvests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData)
            });
            
            if (!res.ok) {
              throw new Error('Failed to add harvest log');
            }

            mutate('/api/harvests');
            if (logData.sold) {
              mutate('/api/transactions');
            }

            toast({
                title: "Harvest Logged!",
                description: `Successfully logged ${newLog.quantity} ${newLog.unit} of ${newLog.item}.`
            });
            
            setNewLog({
                date: new Date(),
                item: "",
                type: "Crop",
                quantity: 0,
                unit: "kg",
                notes: "",
                sold: false,
                pricePerUnit: 0,
            });

        } catch (error) {
            console.error("Error adding harvest log:", error);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "There was a problem saving your harvest log.",
            });
        }
    };
    
    if (error) return <div>Failed to load harvest logs.</div>;

    const lastHarvests = harvestLogs.reduce((acc, log) => {
        if (!acc[log.item] || new Date(log.date) > new Date(acc[log.item].date)) {
            acc[log.item] = log;
        }
        return acc;
    }, {} as Record<string, HarvestLog>);

    const previousHarvestQuantity = newLog.item ? lastHarvests[newLog.item]?.quantity : null;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><Tractor /> Harvest Log</h1>
                    <p className="text-muted-foreground">Track yields for all your farm products.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                    <form onSubmit={handleAddLog}>
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Add New Harvest Record</CardTitle>
                                <CardDescription>Record a new harvest and optionally log the sale.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !newLog.date && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newLog.date ? format(newLog.date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={newLog.date}
                                            onSelect={(d) => d && handleFieldChange('date', d)}
                                            initialFocus
                                        />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="item">Item Name</Label>
                                        <Input id="item" value={newLog.item} onChange={(e) => handleFieldChange('item', e.target.value)} placeholder="e.g., Wheat" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Type</Label>
                                        <Select value={newLog.type} onValueChange={(v) => handleFieldChange('type', v)}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>{harvestTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                      <Label htmlFor="quantity">Quantity</Label>
                                      <Input id="quantity" type="number" value={newLog.quantity || ''} onChange={(e) => handleFieldChange('quantity', e.target.valueAsNumber)} required />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="unit">Unit</Label>
                                      <Select value={newLog.unit} onValueChange={(v) => handleFieldChange('unit', v)}>
                                          <SelectTrigger><SelectValue/></SelectTrigger>
                                          <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                      </Select>
                                  </div>
                                </div>
                                {previousHarvestQuantity !== null && newLog.item && (
                                    <div className="text-sm text-muted-foreground">
                                        Last harvest for {newLog.item}: {previousHarvestQuantity} {lastHarvests[newLog.item].unit}
                                    </div>
                                )}


                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes (Optional)</Label>
                                    <Input id="notes" value={newLog.notes} onChange={(e) => handleFieldChange('notes', e.target.value)} placeholder="e.g., Good quality yield" />
                                </div>
                                
                                <Collapsible>
                                  <div className="flex items-center space-x-2">
                                      <Switch id="sold" checked={newLog.sold} onCheckedChange={(c) => handleFieldChange('sold', c)} />
                                      <CollapsibleTrigger asChild>
                                        <Label htmlFor="sold" className="cursor-pointer flex items-center">
                                          Mark as Sold & Record Revenue
                                          <ChevronDown className="h-4 w-4 ml-1" />
                                        </Label>
                                      </CollapsibleTrigger>
                                  </div>
                                  <CollapsibleContent className="space-y-4 pt-4">
                                      <div className="space-y-2">
                                          <Label htmlFor="pricePerUnit">Sale Price per {newLog.unit} (₹)</Label>
                                          <Input id="pricePerUnit" type="number" value={newLog.pricePerUnit || ''} onChange={(e) => handleFieldChange('pricePerUnit', e.target.valueAsNumber)} placeholder="Enter price" />
                                      </div>
                                      {newLog.sold && newLog.pricePerUnit && newLog.quantity > 0 && (
                                          <div className="p-3 bg-muted rounded-md text-sm">
                                              <span className="font-medium">Estimated Total Revenue:</span>
                                              <span className="font-bold ml-2">₹{(newLog.quantity * newLog.pricePerUnit).toLocaleString()}</span>
                                          </div>
                                      )}
                                  </CollapsibleContent>
                                </Collapsible>

                            </CardContent>
                             <CardFooter>
                                <Button type="submit" className="w-full">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Harvest Log
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </div>
                <div className="lg:col-span-2">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Harvest History</CardTitle>
                            <CardDescription>A record of all past harvests.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
                                    ) : harvestLogs.length > 0 ? (
                                        harvestLogs.map(log => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium">{format(new Date(log.date), 'PPP')}</TableCell>
                                                <TableCell>{log.item} <Badge variant="secondary" className="ml-2">{log.type}</Badge></TableCell>
                                                <TableCell className="font-mono">{log.quantity} {log.unit}</TableCell>
                                                <TableCell>
                                                    {log.sold ? <Badge className="bg-green-100 text-green-800">Sold</Badge> : <Badge variant="outline">Harvested</Badge>}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-green-600">
                                                    {log.saleDetails ? `+₹${log.saleDetails.totalRevenue.toLocaleString()}` : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={5} className="text-center">No harvest logs found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
