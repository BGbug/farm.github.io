
"use client";

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { MapPin, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Field = {
  id: string;
  name: string;
  crop: string;
  area: number;
  status: string;
};

export default function FieldsPage() {
  const mapImage = PlaceHolderImages.find(p => p.id === 'map-placeholder');
  const { data: fields, error, isLoading } = useSWR<Field[]>('/api/fields', fetcher);

  if (error) return <div>Failed to load fields</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Field Management</h1>
          <p className="text-muted-foreground">Manage and view your farm fields and their corresponding crops.</p>
        </div>
        <div className="flex gap-2">
            <Button asChild variant="outline">
                <Link href="/dashboard/ai/suggest-crops">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Suggest Crops
                </Link>
            </Button>
            <Button asChild>
                <Link href="/dashboard/ai/diagnose-plant">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Diagnose Plant
                </Link>
            </Button>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Geolocation View</CardTitle>
          <CardDescription>A map of your farm's fields.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-[4/3] w-full bg-muted rounded-lg overflow-hidden relative">
            {mapImage && 
              <Image 
                src={mapImage.imageUrl} 
                alt={mapImage.description}
                fill
                style={{ objectFit: "cover" }}
                data-ai-hint={mapImage.imageHint}
              />
            }
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <p className="text-white text-2xl font-bold">Map View Placeholder</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Field Details</CardTitle>
          <CardDescription>A list of all fields on the farm.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Loading fields...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field Name</TableHead>
                  <TableHead>Current Crop</TableHead>
                  <TableHead>Area (acres)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields?.map(field => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.name} ({field.id})</TableCell>
                    <TableCell>{field.crop}</TableCell>
                    <TableCell>{field.area}</TableCell>
                    <TableCell>
                      <Badge variant={field.status === 'Harvest Ready' ? 'default' : 'outline'} className={field.status === 'Harvest Ready' ? 'bg-accent text-accent-foreground' : ''}>
                        {field.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <button className="text-muted-foreground hover:text-primary"><MapPin className="h-4 w-4 inline" /></button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
