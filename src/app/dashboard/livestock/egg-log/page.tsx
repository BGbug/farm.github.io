
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Egg } from "lucide-react";
import { cn } from "@/lib/utils";
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type EggLog = {
    id: string;
    date: string;
    quantity: number;
    notes?: string;
};

type NewEggLog = {
    date: Date;
    quantity: number;
    notes: string;
};

export default function EggLogPage() {
    const { toast } = useToast();
    const [newLog, setNewLog] = useState<NewEggLog>({
        date: new Date(),
        quantity: 0,
        notes: ""
    });

    const { data: eggLogs = [], error, isLoading } = useSWR<EggLog[]>('/api/egg-logs', fetcher);

    const handleFieldChange = (field: keyof NewEggLog, value: any) => {
        setNewLog(prev => ({ ...prev, [field]: value }));
    };

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newLog.quantity <= 0) {
            toast({
                variant: "destructive",
                title: "Invalid Quantity",
                description: "Please enter a valid number of eggs collected.",
            });
            return;
        }

        const logData = {
            date: format(newLog.date, 'yyyy-MM-dd'),
            quantity: Number(newLog.quantity),
            notes: newLog.notes,
        };

        try {
            await fetch('/api/egg-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData)
            });

            mutate('/api/egg-logs');

            toast({
                title: "Log Added",
                description: `Logged ${newLog.quantity} eggs for ${format(newLog.date, 'PPP')}.`
            });
            setNewLog({ date: new Date(), quantity: 0, notes: "" });

        } catch (error) {
            console.error("Error adding egg log:", error);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "There was a problem saving your egg log.",
            });
        }
    };
    
    if (error) return <div>Failed to load egg logs.</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><Egg /> Egg Production Log</h1>
                    <p className="text-muted-foreground">Track daily egg collection from your laying hens.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                    <form onSubmit={handleAddLog}>
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Add New Log</CardTitle>
                                <CardDescription>Record the number of eggs collected.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !newLog.date && "text-muted-foreground"
                                            )}
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
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Number of Eggs</Label>
                                    <Input 
                                        id="quantity" 
                                        type="number" 
                                        value={newLog.quantity || ''}
                                        onChange={(e) => handleFieldChange('quantity', e.target.valueAsNumber)}
                                        placeholder="e.g., 48"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes (Optional)</Label>
                                    <Input 
                                        id="notes" 
                                        value={newLog.notes}
                                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                                        placeholder="e.g., Smaller eggs today"
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Log Entry
                                </Button>
                            </CardContent>
                        </Card>
                    </form>
                </div>
                <div className="lg:col-span-2">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Collection History</CardTitle>
                            <CardDescription>A record of all egg collection entries.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                        <TableHead>Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center">Loading entries...</TableCell>
                                        </TableRow>
                                    ) : eggLogs.length > 0 ? (
                                        eggLogs.map(log => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium">{format(new Date(log.date), 'PPP')}</TableCell>
                                                <TableCell className="text-right font-mono">{log.quantity}</TableCell>
                                                <TableCell className="text-muted-foreground">{log.notes}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center">No egg logs found.</TableCell>
                                        </TableRow>
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
