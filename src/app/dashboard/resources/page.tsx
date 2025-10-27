
"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle } from "lucide-react"
import { ResourceInsightsForm } from "@/components/dashboard/resource-insights-form"
import { SpendingForecastForm } from "@/components/dashboard/spending-forecast-form"
import { useState } from "react";
import { useToast } from "@/hooks/use-toast"
import { mutate } from 'swr';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const animalTypes = ["Cow", "Buffalo", "Goat", "Chicken", "Sheep"];

export default function ResourcesPage() {
  const { toast } = useToast();
  const { data: fields = [], error: fieldsError, isLoading: fieldsLoading } = useSWR<any[]>('/api/fields', fetcher);
  const [usageFor, setUsageFor] = useState<"field" | "livestock" | "">("");

  const handleLogResource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const resourceType = formData.get('resource-type') as string;
    const quantity = formData.get('quantity') as string;
    const cost = formData.get('cost') as string;
    const usageTarget = formData.get('usage-for') as string;
    const field = formData.get('field-select') as string;
    const livestock = formData.get('livestock-select') as string;

    if (!resourceType || !quantity || !cost) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out Resource Type, Quantity and Cost.",
      });
      return;
    }
    
    let description = `Used ${quantity} of ${resourceType}`;
    if (usageTarget === 'field' && field) {
        description += ` on ${field}`;
    } else if (usageTarget === 'livestock' && livestock) {
        description += ` for ${livestock}`;
    }

    const transactionToAdd = {
        category: resourceType,
        amount: Number(cost),
        date: new Date().toISOString(),
        description: description,
        type: 'expense',
    };

    try {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionToAdd)
        });
        mutate('/api/transactions');
        toast({
            title: "Resource Logged & Expense Recorded",
            description: `An expense of ₹${cost} for ${resourceType} has been logged.`,
        });
        (e.target as HTMLFormElement).reset();
        setUsageFor("");
    } catch (error) {
          console.error("Error adding transaction: ", error);
          toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "Could not save the resource log as an expense.",
        });
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Resource Management</h1>
        <p className="text-muted-foreground">Track resource usage and leverage AI for optimization and forecasting.</p>
      </div>
      
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Usage Insights</TabsTrigger>
          <TabsTrigger value="forecast">Spending Forecast</TabsTrigger>
          <TabsTrigger value="log">Log Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <ResourceInsightsForm />
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <SpendingForecastForm />
        </TabsContent>

        <TabsContent value="log" className="space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Log Resource Consumption</CardTitle>
              <CardDescription>Enter details about the resources used. This will create an expense entry in your finances.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleLogResource} className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="resource-type">Resource Type</Label>
                  <Select name="resource-type">
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fertilizers">Fertilizer</SelectItem>
                      <SelectItem value="Seeds">Seeds</SelectItem>
                      <SelectItem value="Feeds">Feeds</SelectItem>
                      <SelectItem value="Water">Water</SelectItem>
                      <SelectItem value="Pesticide">Pesticide</SelectItem>
                      <SelectItem value="Fuel">Fuel</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage-for">Usage For</Label>
                  <Select name="usage-for" onValueChange={(value: "field" | "livestock" | "") => setUsageFor(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="field">Field / Crops</SelectItem>
                      <SelectItem value="livestock">Livestock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {usageFor === 'field' && (
                   <div className="space-y-2">
                    <Label htmlFor="field-select">Field</Label>
                    <Select name="field-select">
                        <SelectTrigger>
                        <SelectValue placeholder="Select a field" />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldsLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> : 
                            fields.map(field => (
                                <SelectItem key={field.id} value={field.name}>{field.name}</SelectItem>
                            ))
                          }
                        </SelectContent>
                    </Select>
                  </div>
                )}
                
                {usageFor === 'livestock' && (
                   <div className="space-y-2">
                    <Label htmlFor="livestock-select">Livestock Type</Label>
                    <Select name="livestock-select">
                        <SelectTrigger>
                        <SelectValue placeholder="Select animal type" />
                        </SelectTrigger>
                        <SelectContent>
                        {animalTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" placeholder="e.g., 50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                   <Select name="unit">
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="ton">ton</SelectItem>
                      <SelectItem value="liter">liter</SelectItem>
                      <SelectItem value="gallons">gallons</SelectItem>
                      <SelectItem value="m3">m³ (cubic meter)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                 <div className="space-y-2">
                  <Label htmlFor="cost">Total Cost (₹)</Label>
                  <Input id="cost" name="cost" type="number" placeholder="e.g., 250.00" />
                </div>

                <Button type="submit" className="w-full xl:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Log Entry
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
