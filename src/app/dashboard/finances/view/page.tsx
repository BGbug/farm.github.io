
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Transaction = {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  type: 'expense' | 'revenue';
  evidenceUrl?: string;
};

export default function ViewFinancesPage() {
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { data: transactions = [], error, isLoading } = useSWR<Transaction[]>('/api/transactions', fetcher);

  const filteredTransactions = useMemo(() => {
    let startDate: Date | undefined;
    let endDate: Date | undefined = new Date();

    switch (filter) {
      case 'weekly':
        startDate = startOfWeek(endDate);
        break;
      case 'monthly':
        startDate = startOfMonth(endDate);
        break;
      case 'yearly':
        startDate = startOfYear(endDate);
        break;
      case 'custom':
        startDate = dateRange?.from;
        endDate = dateRange?.to;
        break;
      case 'all':
      default:
        startDate = undefined;
        endDate = undefined;
    }
    
    return transactions
        .filter(transaction => {
            if (!startDate) return true;
            const transactionDate = new Date(transaction.date);
            
            if (filter === 'custom' && startDate && !endDate) {
                 return transactionDate >= startDate;
            }
            if (!endDate) return true;
            
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);

            return transactionDate >= startDate && transactionDate <= endOfDay;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [transactions, filter, dateRange]);

  const handleDownload = () => {
    const csvContent =
      'data:text/csv;charset=utf-t,' +
      ['ID,Category,Amount,Date,Description,Type,Evidence URL']
        .concat(
          filteredTransactions.map(t =>
            [
              t.id,
              t.category,
              t.amount,
              t.date,
              `"${t.description.replace(/"/g, '""')}"`,
              t.type,
              t.evidenceUrl || '',
            ].join(',')
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions-${filter}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (error) return <div>Failed to load transactions</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">View Transactions</h1>
        <p className="text-muted-foreground">Review and export your financial records.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Filter & Export</CardTitle>
          <CardDescription>Filter your transactions by date and download the data as a CSV file.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
            <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select a filter" />
                </SelectTrigger>
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
                  <Button
                    id="date"
                    variant={'outline'}
                    className={cn(
                      'w-full sm:w-[300px] justify-start text-left font-normal',
                      !dateRange && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}
            <Button onClick={handleDownload} className="ml-auto w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Download CSV
            </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>A complete list of your financial records based on the selected filter.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading transactions...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell>{format(new Date(transaction.date), 'PPP')}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                        <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', transaction.type === 'revenue' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                            {transaction.type}
                        </span>
                    </TableCell>
                    <TableCell className={cn('text-right', transaction.type === 'revenue' ? 'text-green-600' : 'text-destructive')}>
                      {transaction.type === 'revenue' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {transaction.evidenceUrl ? (
                        <a href={transaction.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          <ExternalLink className="h-4 w-4 mx-auto" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    