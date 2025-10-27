
"use client"

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Leaf, Sprout, Tractor, Droplets, Drumstick, Wheat, Wind } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import useSWR from 'swr';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Transaction = {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  type: 'expense' | 'revenue';
};

type Livestock = {
  id: string;
  type: string;
};

type Activity = {
  id: number;
  activity: string;
  timestamp: string;
  type: string;
};

type Crop = {
    name: string;
    area: number;
    fill: string;
}

const chartConfig = {
  area: {
    label: "Area (acres)",
  },
  Corn: {
    label: "Corn",
    color: "hsl(var(--chart-1))",
  },
  Soybeans: {
    label: "Soybeans",
    color: "hsl(var(--chart-2))",
  },
  Wheat: {
    label: "Wheat",
    color: "hsl(var(--chart-4))",
  },
  Potatoes: {
    label: "Potatoes",
    color: "hsl(var(--chart-5))",
  },
};


export default function DashboardPage() {
  const { data: transactions = [], error: transactionsError } = useSWR<Transaction[]>('/api/transactions', fetcher);
  const { data: livestock = [], error: livestockError } = useSWR<Livestock[]>('/api/livestock', fetcher);
  const { data: recentActivities = [], error: activitiesError } = useSWR<Activity[]>('/api/recent-activities', fetcher);
  const { data: cropsData = [], error: cropsError } = useSWR<any[]>('/api/fields', fetcher);

  const chartData = useMemo(() => {
    const cropAreas = cropsData.reduce((acc: any, field: any) => {
        if (field.crop !== "Fallow") {
            acc[field.crop] = (acc[field.crop] || 0) + field.area;
        }
        return acc;
    }, {});

    return Object.entries(cropAreas).map(([crop, area]) => ({
        crop,
        area: area as number,
        fill: chartConfig[crop as keyof typeof chartConfig]?.color || '#8884d8'
    }));
}, [cropsData]);


  const getExpensesByCategory = (category: string) => {
    return transactions
      .filter(t => t.type === 'expense' && t.category.toLowerCase() === category.toLowerCase())
      .reduce((sum, exp) => sum + exp.amount, 0);
  };
  
  const feedExpenses = getExpensesByCategory('feeds');
  const fertilizerExpenses = getExpensesByCategory('fertilizers');
  const seedExpenses = getExpensesByCategory('seeds');
  const livestockCount = livestock.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Alice! Here is an overview of your farm.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Livestock" value={String(livestockCount)} icon={<Drumstick />} description="Total animals on farm" />
        <StatCard title="Feed Expenses" value={`₹${feedExpenses.toLocaleString()}`} icon={<Wind />} description="Total spent on animal feeds" />
        <StatCard title="Fertilizer Expenses" value={`₹${fertilizerExpenses.toLocaleString()}`} icon={<Leaf />} description="Total spent on fertilizers" />
        <StatCard title="Seed Expenses" value={`₹${seedExpenses.toLocaleString()}`} icon={<Wheat />} description="Total spent on seeds" />
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3 shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A log of the most recent farm operations.</CardDescription>
          </CardHeader>
          <CardContent>
             {activitiesError ? <p>Failed to load activities</p> : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentActivities.map(activity => (
                    <TableRow key={activity.id}>
                        <TableCell>
                        <div className="font-medium">{activity.activity}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                        <Badge variant={activity.type === 'Harvest' ? 'default' : 'secondary'} className={activity.type === 'Harvest' ? 'bg-accent text-accent-foreground' : ''}>{activity.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{activity.timestamp}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
             )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Crop Distribution</CardTitle>
            <CardDescription>Area distribution by crop type.</CardDescription>
          </CardHeader>
          <CardContent>
             {cropsError ? <p>Failed to load crop data</p> : (
                <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
                <PieChart>
                    <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie data={chartData} dataKey="area" nameKey="crop" innerRadius={60}>
                    {chartData.map((entry) => (
                        <Cell key={`cell-${entry.crop}`} fill={entry.fill} />
                    ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="crop" />} />
                </PieChart>
                </ChartContainer>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    