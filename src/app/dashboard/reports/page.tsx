
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { format, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download, Calendar as CalendarIcon, Egg, TrendingUp, TrendingDown, DollarSign, Archive, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { StatCard } from '@/components/dashboard/stat-card';
import useSWR from 'swr';
import { useToast } from '@/hooks/use-toast';

import { apiFetcher } from '@/lib/api';


type EggLog = {
    id: string;
    date: string;
    quantity: number;
    notes?: string;
};

type Transaction = {
    id: string;
    category: string;
    amount: number;
    date: string;
    description: string;
    type: 'expense' | 'revenue';
};

type Animal = {
  id: string;
  type: string;
  breed: string;
  gender: string;
  dob: string;
  status: string;
  purpose?: string;
};

const livestockChartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

const financialChartConfig: ChartConfig = {
  amount: { label: "Amount (₹)" },
  Fertilizers: { label: "Fertilizers", color: "hsl(var(--chart-1))" },
  Seeds: { label: "Seeds", color: "hsl(var(--chart-2))" },
  Labor: { label: "Labor", color: "hsl(var(--chart-3))" },
  Machinery: { label: "Machinery", color: "hsl(var(--chart-4))" },
  Utilities: { label: "Utilities", color: "hsl(var(--chart-5))" },
  Other: { label: "Other", color: "hsl(var(--chart-1))" },
  "Livestock Purchase": { label: "Livestock Purchase", color: "hsl(var(--chart-2))" },
  "Livestock Sale": { label: "Livestock Sale", color: "hsl(var(--chart-3))" },
  "Feeds": { label: "Feeds", color: "hsl(var(--chart-4))" },
};

const downloadCSV = (data: any[], headers: string[], filename: string) => {
    if (data.length === 0) {
        alert("No data available to download for the selected period.");
        return;
    }

    const csvRows = [headers.join(',')];
    for (const row of data) {
        const values = headers.map(header => {
            const key = Object.keys(row).find(k => k.toLowerCase() === header.toLowerCase().replace(/ /g, ''));
            let value = key ? row[key as keyof typeof row] : '';
             if (value instanceof Date) {
                value = format(value, 'yyyy-MM-dd');
            }
            if (typeof value === 'string') {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


export default function ReportsPage() {
    const { toast } = useToast();
    const [filter, setFilter] = useState('monthly');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [explorerDataSource, setExplorerDataSource] = useState('');
    const [explorerCategory, setExplorerCategory] = useState('');

    const { data: eggLogs = [], error: eggLogsError, isLoading: eggLogsLoading } = useSWR<EggLog[]>('/api/egg-logs', apiFetcher);
    const { data: transactions = [], error: transactionsError, isLoading: transactionsLoading } = useSWR<Transaction[]>('/api/transactions', apiFetcher);
    const { data: livestock = [], error: livestockError, isLoading: livestockLoading } = useSWR<Animal[]>('/api/livestock', apiFetcher);
    
    const [isBackingUp, setIsBackingUp] = useState(false);


    const dateFilteredData = useMemo(() => {
        let startDate: Date | undefined;
        let endDate: Date | undefined = new Date();

        switch (filter) {
        case 'weekly': startDate = startOfWeek(endDate); break;
        case 'monthly': startDate = startOfMonth(endDate); break;
        case 'yearly': startDate = startOfYear(endDate); break;
        case 'custom': startDate = dateRange?.from; endDate = dateRange?.to; break;
        case 'all': default: startDate = undefined; endDate = undefined; break;
        }

        const filterByDate = (item: { date: string } | { dob: string }) => {
            if (!startDate) return true;
            const itemDate = new Date('date' in item ? item.date : item.dob);
            if (filter === 'custom' && startDate && !endDate) return itemDate >= startDate;
            if (!endDate) return true;
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            return itemDate >= startDate && itemDate <= endOfDay;
        };

        return {
            transactions: transactions.filter(filterByDate),
            livestock: livestock.filter(filterByDate),
            livestockTransactions: transactions.filter(t => (t.category === 'Livestock Purchase' || t.category === 'Livestock Sale') && filterByDate(t)),
            eggLogs: eggLogs.filter(filterByDate),
        };

    }, [transactions, eggLogs, livestock, filter, dateRange]);


    const livestockDistribution = useMemo(() => {
        const counts = livestock.reduce((acc, animal) => {
            acc[animal.type] = (acc[animal.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value], index) => ({ name, value, fill: livestockChartColors[index % livestockChartColors.length] }));
    }, [livestock]);
    
    const livestockChartConfig: ChartConfig = useMemo(() => Object.fromEntries(
        livestockDistribution.map(item => [item.name.toLowerCase(), { label: item.name, color: item.fill }])
    ), [livestockDistribution]);


    const eggProductionByMonth = useMemo(() => {
        const monthlyData: Record<string, number> = {};
        dateFilteredData.eggLogs.forEach(log => {
            const month = format(new Date(log.date), 'yyyy-MM');
            monthlyData[month] = (monthlyData[month] || 0) + log.quantity;
        });
        return Object.entries(monthlyData).map(([month, quantity]) => ({ month: format(new Date(month), 'MMM yyyy'), quantity }));
    }, [dateFilteredData.eggLogs]);

    const eggChartConfig: ChartConfig = { quantity: { label: "Eggs Collected", color: "hsl(var(--chart-1))" }};
    
    const financialSummary = useMemo(() => {
        const spendingData = Object.entries(
            dateFilteredData.transactions.filter(t => t.type === 'expense')
            .reduce((acc, expense) => {
                acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
                return acc;
            }, {} as Record<string, number>)
        ).map(([category, amount]) => ({ category, amount, fill: financialChartConfig[category as keyof typeof financialChartConfig]?.color || "hsl(var(--chart-1))" }));
        
        const totalRevenue = dateFilteredData.transactions.filter(t => t.type === 'revenue').reduce((sum, rev) => sum + rev.amount, 0);
        const totalExpenses = dateFilteredData.transactions.filter(t => t.type === 'expense').reduce((sum, exp) => sum + exp.amount, 0);
        
        return { spendingData, totalRevenue, totalExpenses, netResult: totalRevenue - totalExpenses };
    }, [dateFilteredData.transactions]);

    const totalEggsCollected = useMemo(() => dateFilteredData.eggLogs.reduce((sum, log) => sum + log.quantity, 0), [dateFilteredData.eggLogs]);

    const handleDownloadLivestock = () => downloadCSV(livestock, ['ID', 'Type', 'Breed', 'Gender', 'DOB', 'Status', 'Purpose'], 'livestock-report.csv');
    const handleDownloadEggProduction = () => downloadCSV(dateFilteredData.eggLogs.map(l => ({ ...l, date: format(new Date(l.date), 'yyyy-MM-dd') })), ['Date', 'Quantity', 'Notes'], 'egg-production-report.csv');
    const handleDownloadLivestockTransactions = () => downloadCSV(dateFilteredData.livestockTransactions.map(t => ({ ...t, date: format(new Date(t.date), 'yyyy-MM-dd') })), ['Date', 'Category', 'Description', 'Amount'], 'livestock-transactions.csv');
    const handleDownloadFinancialSummary = () => downloadCSV(dateFilteredData.transactions.map(t => ({ ...t, date: format(new Date(t.date), 'yyyy-MM-dd') })), ['Date', 'Type', 'Category', 'Description', 'Amount'], 'financial-summary.csv');

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            const response = await fetch('/api/backup');
            if (!response.ok) {
                throw new Error('Failed to fetch backup data.');
            }
            const backupData = await response.json();
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `farmflow-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast({
                title: "Backup Successful",
                description: "All your farm data has been downloaded.",
            });
        } catch (error) {
            console.error('Backup failed:', error);
            toast({
                variant: 'destructive',
                title: 'Backup Failed',
                description: 'There was a problem downloading your data.',
            });
        } finally {
            setIsBackingUp(false);
        }
    };

    const explorerCategories = useMemo(() => {
        let categories: string[] = [];
        switch(explorerDataSource) {
            case 'financial':
                categories = [...new Set(dateFilteredData.transactions.map(t => t.category))];
                break;
            case 'livestock':
                categories = [...new Set(livestock.map(a => a.type))];
                break;
            default:
                categories = [];
        }
        return categories;
    }, [explorerDataSource, dateFilteredData.transactions, livestock]);

    // Handle category reset when data source changes
    useEffect(() => {
        if (!explorerDataSource || explorerCategories.length === 0) {
            setExplorerCategory('');
        }
    }, [explorerDataSource, explorerCategories]);
    
    const explorerData = useMemo(() => {
        let data: any[] = [];
        let headers: string[] = [];
        let title = "Select a data source";

        switch(explorerDataSource) {
            case 'financial':
                data = dateFilteredData.transactions.filter(t => !explorerCategory || t.category === explorerCategory);
                headers = ["Date", "Type", "Category", "Description", "Amount"];
                title = `Financial Data: ${explorerCategory || 'All'}`;
                break;
            case 'livestock':
                data = dateFilteredData.livestock.filter(a => !explorerCategory || a.type === explorerCategory);
                headers = ["ID", "Type", "Breed", "Gender", "DOB", "Status", "Purpose"];
                title = `Livestock: ${explorerCategory || 'All'}`;
                break;
            case 'egg_production':
                data = dateFilteredData.eggLogs;
                headers = ["Date", "Quantity", "Notes"];
                title = "Egg Production Logs";
                break;
        }
        return { data, headers, title };
    }, [explorerDataSource, explorerCategory, dateFilteredData]);
    
    const handleDownloadExplorerData = () => {
        if (explorerData.data.length > 0) {
             const formattedData = explorerData.data.map(item => {
                const row: Record<string, any> = {};
                for (const header of explorerData.headers) {
                    const key = header.toLowerCase().replace(/ /g, '');
                    const itemKey = Object.keys(item).find(k => k.toLowerCase() === key);
                    if (itemKey) {
                        row[key] = item[itemKey];
                         if ((key === 'date' || key === 'dob') && row[key]) {
                            row[key] = format(new Date(row[key]), 'yyyy-MM-dd');
                        }
                    }
                }
                return row;
            });
            downloadCSV(formattedData, explorerData.headers, 'data-explorer-report.csv');
        } else {
            toast({
                variant: 'destructive',
                title: 'No Data',
                description: 'There is no data to download for the selected criteria.',
            });
        }
    };


    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold font-headline">Reports &amp; Analytics</h1>
                <p className="text-muted-foreground">Visualize your farm's performance and gain actionable insights.</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select a filter" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="weekly">This Week</SelectItem>
                        <SelectItem value="monthly">This Month</SelectItem>
                        <SelectItem value="yearly">This Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                </Select>
                {filter === 'custom' && (
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button id="date" variant={'outline'} className={cn('w-full sm:w-[260px] justify-start text-left font-normal', !dateRange && 'text-muted-foreground')}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}</>) : format(dateRange.from, 'LLL dd, y')) : (<span>Pick a date range</span>)}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                        <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/>
                        </PopoverContent>
                    </Popover>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button><Download className="mr-2 h-4 w-4" /><span className="hidden sm:inline">Download</span></Button></DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleDownloadLivestock}>Livestock Data (CSV)</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownloadEggProduction} disabled={eggLogsLoading || dateFilteredData.eggLogs.length === 0}>Egg Production Data (CSV)</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownloadLivestockTransactions} disabled={transactionsLoading || dateFilteredData.livestockTransactions.length === 0}>Livestock Transactions (CSV)</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownloadFinancialSummary} disabled={transactionsLoading || dateFilteredData.transactions.length === 0}>Financial Summary (CSV)</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Revenue" value={`₹${financialSummary.totalRevenue.toLocaleString()}`} icon={<TrendingUp className="text-green-500" />} description="Revenue for selected period" />
                <StatCard title="Total Expenses" value={`₹${financialSummary.totalExpenses.toLocaleString()}`} icon={<TrendingDown className="text-red-500"/>} description="Expenses for selected period" />
                <StatCard title="Net Result" value={`${financialSummary.netResult < 0 ? '-' : ''}₹${Math.abs(financialSummary.netResult).toLocaleString()}`} icon={<DollarSign />} description="Net profit/loss for period" />
                <StatCard title="Eggs Collected" value={totalEggsCollected.toLocaleString()} icon={<Egg />} description="Eggs collected for period" />
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Data Explorer & Backup</CardTitle>
                    <CardDescription>Filter your data to create custom list views and download reports, or backup all data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Select value={explorerDataSource} onValueChange={setExplorerDataSource}><SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select Data Source" /></SelectTrigger><SelectContent><SelectItem value="financial">Financial</SelectItem><SelectItem value="livestock">Livestock</SelectItem><SelectItem value="egg_production">Egg Production</SelectItem></SelectContent></Select>
                        {explorerCategories.length > 0 && (<Select value={explorerCategory} onValueChange={setExplorerCategory}><SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Categories" /></SelectTrigger><SelectContent><SelectItem value="">All Categories</SelectItem>{explorerCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select>)}
                        <Button onClick={handleDownloadExplorerData} disabled={!explorerDataSource || explorerData.data.length === 0} className="sm:ml-auto"><Download className="mr-2 h-4 w-4" />Download CSV</Button>
                        <Button onClick={handleBackup} variant="outline" className="w-full sm:w-auto" disabled={isBackingUp}>
                            {isBackingUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                            Backup All Data
                        </Button>
                    </div>
                    {explorerDataSource && explorerData.data.length > 0 ? (
                        <div className="mt-4"><h3 className="text-lg font-semibold mb-2">{explorerData.title}</h3><div className="border rounded-md max-h-[400px] overflow-auto">
                            <Table><TableHeader><TableRow>{explorerData.headers.map(header => <TableHead key={header}>{header}</TableHead>)}</TableRow></TableHeader>
                                <TableBody>{explorerData.data.map((row, rowIndex) => <TableRow key={row.id || rowIndex}>{explorerData.headers.map(header => {
                                    const key = header.toLowerCase().replace(/ /g, '');
                                    const itemKey = Object.keys(row).find(k => k.toLowerCase() === key);
                                    const cellValue = itemKey ? row[itemKey as keyof typeof row] : '';
                                    return <TableCell key={`${row.id || rowIndex}-${header}`}>{key === 'date' || key === 'dob' ? format(new Date(cellValue), 'PPP') : (key === 'amount' ? `₹${cellValue.toLocaleString()}` : String(cellValue))}</TableCell>;
                                })}</TableRow>)}</TableBody>
                            </Table>
                        </div></div>
                    ) : explorerDataSource ? (<div className="mt-4 text-center text-muted-foreground py-8"><p>No data available for the selected criteria.</p></div>) : null}
                </CardContent>
            </Card>
            
            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="shadow-lg lg:col-span-2"><CardHeader><CardTitle>Financial Summary</CardTitle><CardDescription>An overview of revenue, expenses, and net result for the selected period.</CardDescription></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                        <div><h3 className="text-lg font-semibold mb-4">Spending Breakdown</h3>
                             {transactionsLoading ? <p>Loading...</p> : financialSummary.spendingData.length > 0 ? (<ChartContainer config={financialChartConfig} className="min-h-[250px] w-full">
                                    <BarChart accessibilityLayer data={financialSummary.spendingData} layout="vertical" margin={{right: 20}}><CartesianGrid horizontal={false} /><YAxis dataKey="category" type="category" tickLine={false} tickMargin={10} axisLine={false} className="text-xs"/><XAxis type="number" hide /><ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} /><Bar dataKey="amount" radius={5} /></BarChart>
                                </ChartContainer>) : (<div className="flex items-center justify-center h-full min-h-[250px] text-muted-foreground">No expense data for this period.</div>)}
                        </div>
                        <div><h3 className="text-lg font-semibold mb-4">Income Statement</h3>
                            {transactionsLoading ? <p>Loading...</p> : (<Table><TableBody>
                                <TableRow><TableCell className="font-medium">Total Revenue</TableCell><TableCell className="text-right text-green-600 font-mono">+₹{financialSummary.totalRevenue.toLocaleString()}</TableCell></TableRow>
                                <TableRow><TableCell className="font-medium">Total Expenses</TableCell><TableCell className="text-right text-red-600 font-mono">-₹{financialSummary.totalExpenses.toLocaleString()}</TableCell></TableRow>
                                <TableRow className="border-t-2 border-border"><TableCell className="font-bold text-base">Net Result</TableCell><TableCell className={cn("text-right font-bold text-base font-mono", financialSummary.netResult >= 0 ? 'text-green-600' : 'text-red-600' )}>{financialSummary.netResult >= 0 ? `+₹${financialSummary.netResult.toLocaleString()}` : `-₹${Math.abs(financialSummary.netResult).toLocaleString()}`}</TableCell></TableRow>
                            </TableBody></Table>)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-1">
                <Card className="shadow-lg"><CardHeader><CardTitle>Livestock Transactions</CardTitle><CardDescription>A log of all livestock purchases and sales for the selected period.</CardDescription></CardHeader>
                    <CardContent>
                        {transactionsLoading ? <p>Loading transactions...</p> : dateFilteredData.livestockTransactions.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                            <TableBody>{dateFilteredData.livestockTransactions.map(t => <TableRow key={t.id}><TableCell>{format(new Date(t.date), 'PPP')}</TableCell><TableCell><span className={cn('text-xs font-semibold px-2 py-1 rounded-full', t.type === 'revenue' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>{t.category}</span></TableCell><TableCell className="text-muted-foreground">{t.description}</TableCell><TableCell className={cn("text-right font-mono", t.type === 'revenue' ? 'text-green-600' : 'text-red-600')}>{t.type === 'revenue' ? '+' : '-'}₹{t.amount.toLocaleString()}</TableCell></TableRow>)}</TableBody>
                            </Table>) : (<p className="text-center text-muted-foreground py-4">No livestock transactions found for the selected period.</p>)}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                 <Card className="shadow-lg"><CardHeader><CardTitle>Livestock Distribution</CardTitle><CardDescription>A breakdown of your current livestock by animal type.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        {livestockLoading ? <div className="flex items-center justify-center h-[350px]"><p>Loading livestock data...</p></div> : livestockDistribution.length > 0 ? (<><ChartContainer config={livestockChartConfig} className="mx-auto aspect-square max-h-[350px]">
                            <PieChart><ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} /><Pie data={livestockDistribution} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>{livestockDistribution.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}</Pie><ChartLegend content={<ChartLegendContent nameKey="name" />} /></PieChart></ChartContainer><Separator /><div><h4 className="text-sm font-medium mb-2">Data View</h4><Table><TableHeader><TableRow><TableHead>Animal Type</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader><TableBody>{livestockDistribution.map(item => <TableRow key={item.name}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="text-right">{item.value}</TableCell></TableRow>)}</TableBody></Table></div></>) : (<div className="flex items-center justify-center h-[350px]"><p className="text-muted-foreground">No livestock data available.</p></div>)}
                    </CardContent>
                </Card>

                <Card className="shadow-lg"><CardHeader><CardTitle>Monthly Egg Production</CardTitle><CardDescription>Total eggs collected over the selected period.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        {eggLogsLoading ? (<div className="flex items-center justify-center h-[350px]"><p>Loading egg data...</p></div>) : eggProductionByMonth.length > 0 ? (<>
                            <ChartContainer config={eggChartConfig} className="min-h-[300px] w-full"><BarChart accessibilityLayer data={eggProductionByMonth} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}><CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} angle={-45} textAnchor="end" /><YAxis /><ChartTooltip cursor={false} content={<ChartTooltipContent />} /><Bar dataKey="quantity" fill="var(--color-quantity)" radius={8} /></BarChart></ChartContainer>
                            <Separator /><div><h4 className="text-sm font-medium mb-2">Data View</h4><Table><TableHeader><TableRow><TableHead>Month</TableHead><TableHead className="text-right">Eggs Collected</TableHead></TableRow></TableHeader><TableBody>{eggProductionByMonth.map(item => <TableRow key={item.month}><TableCell className="font-medium">{item.month}</TableCell><TableCell className="text-right">{item.quantity}</TableCell></TableRow>)}</TableBody></Table></div></>) : (<div className="flex items-center justify-center h-[350px]"><p className="text-muted-foreground">No egg production data for the selected period.</p></div>)}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
