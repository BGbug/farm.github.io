
"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { spendingForecast, SpendingForecastOutput } from "@/ai/flows/spending-forecasts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, TrendingUp, CircleAlert, CircleCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const initialState: SpendingForecastOutput | { error: string } = {
  forecastedSpending: 0,
  isWithinBudget: false,
  recommendations: "",
};

export function SpendingForecastForm() {
    const [state, formAction] = useFormState(spendingForecast, initialState);
    const [pending, setPending] = useState(false);
  
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setPending(true);
      const formData = new FormData(event.currentTarget);
      // @ts-ignore
      await formAction(formData);
      setPending(false);
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
            <form onSubmit={handleSubmit}>
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle>Generate Spending Forecast</CardTitle>
                        <CardDescription>Forecast future spending based on planned activities and get budget recommendations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentResourceUsage">Current Resource Usage</Label>
                            <Textarea id="currentResourceUsage" name="currentResourceUsage" placeholder="e.g., 5 tons of fertilizer, 10,000 m³ of water per month" defaultValue="5 tons of NPK 10-10-10 fertilizer, 10,000 m³ of water per month." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plannedActivities">Planned Activities</Label>
                            <Textarea id="plannedActivities" name="plannedActivities" placeholder="e.g., Planting 50 acres of corn, purchasing new tractor part" defaultValue="Planting 50 acres of corn in North Paddock, purchasing new irrigation pump." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="budget">Allotted Budget (₹)</Label>
                            <Input id="budget" name="budget" type="number" placeholder="e.g., 100000" defaultValue="100000" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={pending} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
                            Get Forecast
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            <div className="space-y-4">
              {pending && (
                <Card className="shadow-md animate-pulse">
                    <CardHeader>
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-5/6"></div>
                    </CardContent>
                </Card>
              )}
                {'error' in state && state.error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{state.error}</AlertDescription>
                    </Alert>
                )}
                {'recommendations' in state && state.recommendations && !pending && (
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Forecast Results</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                <span className="text-muted-foreground">Forecasted Spending</span>
                                <span className="text-2xl font-bold">₹{state.forecastedSpending.toLocaleString()}</span>
                            </div>
                             <Alert variant={state.isWithinBudget ? "default" : "destructive"} className={state.isWithinBudget ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 text-green-800 dark:text-green-200" : ""}>
                                {state.isWithinBudget ? <CircleCheck className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
                                <AlertTitle>{state.isWithinBudget ? "Within Budget" : "Over Budget"}</AlertTitle>
                                <AlertDescription className={state.isWithinBudget ? "text-green-700 dark:text-green-300" : ""}>
                                    The forecasted spending is {state.isWithinBudget ? "within" : "over"} the allotted budget.
                                </AlertDescription>
                            </Alert>
                            <div>
                                <h4 className="font-semibold mb-2">Recommendations</h4>
                                <p className="text-sm text-muted-foreground">{state.recommendations}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
