"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { analyzeResourceUsage, AnalyzeResourceUsageOutput } from "@/ai/flows/resource-usage-insights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const initialState: AnalyzeResourceUsageOutput | { error: string } = {
  insights: "",
  overallAssessment: "",
};

export function ResourceInsightsForm() {
  const [state, formAction] = useFormState(analyzeResourceUsage, initialState);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setMonth(new Date().getMonth() - 3)));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const formData = new FormData(event.currentTarget);
    if(startDate) formData.set('startDate', format(startDate, 'yyyy-MM-dd'));
    if(endDate) formData.set('endDate', format(endDate, 'yyyy-MM-dd'));
    
    // @ts-ignore
    await formAction(formData);
    setPending(false);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <form onSubmit={handleSubmit}>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Generate Usage Insights</CardTitle>
            <CardDescription>Select a date range to analyze resource consumption patterns and get AI-powered recommendations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farmId">Farm ID</Label>
              <Input id="farmId" name="farmId" defaultValue="FARM-001" placeholder="Enter Farm ID" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={pending} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Generate Insights
            </Button>
          </CardFooter>
        </Card>
      </form>
      
      <div className="space-y-4">
        {pending && (
          <div className="space-y-4">
            <Card className="shadow-md animate-pulse">
                <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                </CardContent>
            </Card>
            <Card className="shadow-md animate-pulse">
                <CardHeader>
                    <div className="h-6 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardContent>
            </Card>
          </div>
        )}
        {'error' in state && state.error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {'insights' in state && state.insights && !pending && (
          <div className="space-y-4">
            <Card className="shadow-md bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-200">Overall Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 dark:text-green-300">{state.overallAssessment}</p>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Optimization Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{state.insights}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
