
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { PlusCircle, Paperclip } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import useSWR, { mutate } from 'swr';
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const chartConfig: ChartConfig = {
  amount: {
    label: "Amount (₹)",
  },
  Fertilizers: {
    label: "Fertilizers",
    color: "hsl(var(--chart-1))",
  },
  Seeds: {
    label: "Seeds",
    color: "hsl(var(--chart-2))",
  },
  Labor: {
    label: "Labor",
    color: "hsl(var(--chart-3))",
  },
  Machinery: {
    label: "Machinery",
    color: "hsl(var(--chart-4))",
  },
  Utilities: {
    label: "Utilities",
    color: "hsl(var(--chart-5))",
  },
  Other: {
    label: "Other",
    color: "hsl(var(--chart-1))",
  },
  "Livestock Purchase": {
      label: "Livestock Purchase",
      color: "hsl(var(--chart-2))"
  },
  "Livestock Sale": {
      label: "Livestock Sale",
      color: "hsl(var(--chart-3))"
  },
  Feeds: {
    label: "Feeds",
    color: "hsl(var(--chart-4))",
  }
} satisfies ChartConfig;

type Transaction = {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  type: 'expense' | 'revenue';
  evidenceUrl?: string;
  createdAt: string;
};

type NewTransaction = {
  category: string;
  amount: number;
  date: string;
  description: string;
  type: 'expense' | 'revenue';
  evidence?: File;
};


export default function FinancesPage() {
  const { toast } = useToast();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<NewTransaction>>({ category: 'Other', amount: 0, description: '', date: new Date().toISOString().split('T')[0], type: 'expense'});

  const { data: transactions = [], error, isLoading } = useSWR<Transaction[]>('/api/transactions', fetcher);

  const totalBudget = 100000;
  
  const totalSpending = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((sum, exp) => sum + exp.amount, 0), [transactions]);
  const totalRevenue = useMemo(() => transactions.filter(t => t.type === 'revenue').reduce((sum, rev) => sum + rev.amount, 0), [transactions]);
  
  const budgetProgress = (totalSpending / totalBudget) * 100;
  
  const spendingData = useMemo(() => Object.entries(
    transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, amount]) => ({
    category,
    amount,
    fill: chartConfig[category as keyof typeof chartConfig]?.color || chartConfig.Other.color,
  })), [transactions]);


  const handleFieldChange = (field: keyof NewTransaction, value: string | number | File) => {
    setNewTransaction(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.category || !newTransaction.amount || !newTransaction.date) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out category, amount, and date.",
      });
      return;
    }
    
    // NOTE: In a real app, you would upload the file to a service like Firebase Storage
    // and get a URL to store in Firestore. For now, we will omit file handling.
    
    const transactionToAdd = {
        category: newTransaction.category!,
        amount: Number(newTransaction.amount!),
        date: newTransaction.date!,
        description: newTransaction.description || "",
        type: newTransaction.type!,
    };

    try {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionToAdd)
        });
        mutate('/api/transactions');
        setIsAddExpenseOpen(false);
        setNewTransaction({ category: 'Other', amount: 0, description: '', date: new Date().toISOString().split('T')[0], type: 'expense' });
        toast({
            title: "Transaction Added",
            description: `A new ${transactionToAdd.type} of ₹${transactionToAdd.amount} has been logged.`,
        });
    } catch(e) {
        console.error("Error adding document: ", e);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "Could not save the transaction.",
        });
    }
  };
  
  if (error) return <div>Failed to load data</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Financial Overview</h1>
          <p className="text-muted-foreground">Track your farm's budget, expenses, and overall financial health.</p>
        </div>
        <div className="flex gap-2">
            <Button asChild variant="outline">
                <Link href="/dashboard/finances/view">View Transactions</Link>
            </Button>
            <Button onClick={() => setIsAddExpenseOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Transaction
            </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Tracking your total spending against the allocated budget for this season.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={budgetProgress} className="h-4" />
          <div className="flex justify-between text-sm">
            <span className="font-medium">Spent: ₹{totalSpending.toLocaleString()}</span>
            <span className="text-muted-foreground">Remaining: ₹{(totalBudget - totalSpending).toLocaleString()}</span>
            <span className="font-medium">Total Budget: ₹{totalBudget.toLocaleString()}</span>
          </div>
        </CardContent>
         <CardFooter className="text-sm">
            <p>Total Revenue: <span className="font-semibold text-green-600">₹{totalRevenue.toLocaleString()}</span></p>
        </CardFooter>
      </Card>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Spending Breakdown</CardTitle>
            <CardDescription>A visual breakdown of expenses by category for the current season.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <p>Loading chart...</p> : (
              <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                <BarChart accessibilityLayer data={spendingData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => `₹${Number(value) / 1000}k`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="amount" radius={8} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>A list of the most recent financial entries.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <p>Loading transactions...</p> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.slice(0, 5).map(transaction => (
                                <TableRow key={transaction.id}>
                                    <TableCell>
                                        <div className="font-medium">{transaction.category}</div>
                                        <div className="text-sm text-muted-foreground truncate">{transaction.description}</div>
                                    </TableCell>
                                    <TableCell>{format(new Date(transaction.date), 'PPP')}</TableCell>
                                    <TableCell className={`text-right ${transaction.type === 'revenue' ? 'text-green-600' : ''}`}>
                                        {transaction.type === 'revenue' ? '+' : ''}₹{transaction.amount.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
      </div>

       <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
              <DialogDescription>
                Log a new financial entry for your farm.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                 <Select
                    value={newTransaction.type}
                    onValueChange={(value: 'expense' | 'revenue') => handleFieldChange('type', value)}
                >
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="revenue">Revenue</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select
                    value={newTransaction.category}
                    onValueChange={(value) => handleFieldChange('category', value)}
                >
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(chartConfig).filter(v => typeof v !== 'string' && v.label).map(cat => (
                            <SelectItem key={cat.label as string} value={cat.label as string}>{cat.label as string}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount (₹)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={newTransaction.amount || ""}
                  onChange={(e) => handleFieldChange('amount', e.target.valueAsNumber)}
                  className="col-span-3"
                  placeholder="e.g., 150.00"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={newTransaction.date || ""}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newTransaction.description || ""}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="col-span-3"
                  placeholder="Optional: A brief description of the transaction"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="evidence" className="text-right">
                  Evidence
                </Label>
                <div className="col-span-3">
                    <Button asChild variant="outline" className="w-full justify-start font-normal text-muted-foreground">
                        <Label htmlFor="evidence-file" className="flex items-center cursor-pointer">
                            <Paperclip className="mr-2 h-4 w-4" />
                            {newTransaction.evidence ? newTransaction.evidence.name : "Attach a file (receipt, invoice...)"}
                        </Label>
                    </Button>
                    <Input
                    id="evidence-file"
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files && handleFieldChange('evidence', e.target.files[0])}
                    />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
              <Button onClick={handleAddTransaction}>Save Transaction</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  )
}
