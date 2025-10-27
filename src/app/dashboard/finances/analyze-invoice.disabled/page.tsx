
'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { analyzeInvoice, AnalyzeInvoiceOutput } from '@/ai/flows/analyze-invoice-flow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Wand2, Loader2, Camera, RefreshCcw, Video, Receipt, FilePlus, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mutate } from 'swr';
import { format } from 'date-fns';

export default function AnalyzeInvoicePage() {
  const { toast } = useToast();
  const [result, setResult] = useState<AnalyzeInvoiceOutput | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isLiveView, setIsLiveView] = useState(false);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getCameraPermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({ variant: 'destructive', title: 'Camera Not Supported' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);
      setIsLiveView(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      setHasCameraPermission(false);
      toast({ variant: 'destructive', title: 'Camera Access Denied' });
    }
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLiveView(false);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setPhotoPreview(canvas.toDataURL('image/jpeg'));
      setIsLiveView(false);
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleSubmit = async () => {
    if (!photoPreview) {
      toast({ variant: 'destructive', title: 'No Photo Provided' });
      return;
    }
    setPending(true);
    setResult(null);
    try {
      const res = await analyzeInvoice({ invoiceImageUri: photoPreview });
      setResult(res);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Analysis Failed', description: e.message });
    } finally {
      setPending(false);
    }
  };

  const handleCreateTransaction = async () => {
    if (!result) return;

    const transactionToAdd = {
      category: result.category,
      amount: result.totalAmount,
      date: result.date ? new Date(result.date).toISOString() : new Date().toISOString(),
      description: result.summary || `Invoice from ${result.vendor}`,
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
        title: 'Transaction Created',
        description: `Expense of ₹${result.totalAmount} has been logged.`,
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to create transaction', description: e.message });
    }
  };

  const handleReset = () => {
    setPhotoPreview(null);
    setHasCameraPermission(null);
    setIsLiveView(false);
    setResult(null);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Analyze Invoice</h1>
        <p className="text-muted-foreground">Capture or upload an invoice to automatically extract details and log an expense.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Invoice Capture</CardTitle>
            <CardDescription>Use your camera to capture an invoice or upload an existing image file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Invoice Image</Label>
              <div className="mt-2 aspect-video w-full relative rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                {isLiveView ? (
                  <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                ) : photoPreview ? (
                  <Image src={photoPreview} alt="Invoice preview" fill style={{ objectFit: 'contain' }} />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Receipt className="mx-auto h-12 w-12" />
                    <p>Use your camera or upload an invoice image.</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                {!isLiveView ? (
                  <Button type="button" variant="outline" onClick={getCameraPermission} className="w-full">
                    <Video className="mr-2 h-4 w-4" /> Use Camera
                  </Button>
                ) : (
                  <Button type="button" onClick={takeSnapshot} className="w-full">
                    <Camera className="mr-2 h-4 w-4" /> Take Snapshot
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                  <FilePlus className="mr-2 h-4 w-4" /> Upload Image
                </Button>
              </div>
              <Input id="photo" name="photo" type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" />
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button onClick={handleSubmit} disabled={pending || !photoPreview} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Analyze Invoice
            </Button>
            <Button type="button" variant="ghost" onClick={handleReset} disabled={pending}>
              <RefreshCcw className="h-4 w-4" /> <span className="sr-only">Reset</span>
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-4">
          {pending ? (
            <Card className="shadow-md animate-pulse">
              <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ) : result ? (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>{result.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Vendor</p>
                    <p className="font-medium">{result.vendor || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{result.date ? format(new Date(result.date), 'PPP') : 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium"><Badge variant="secondary">{result.category}</Badge></p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Line Items</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">₹{item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                  <span className="font-bold text-lg">Total Amount</span>
                  <span className="font-bold text-2xl text-primary">₹{result.totalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleCreateTransaction} className="w-full">
                  <FilePlus className="mr-2" /> Create Transaction
                </Button>
              </CardFooter>
            </Card>
          ) : (
            !photoPreview && (
                <Alert>
                    <Receipt className="h-4 w-4" />
                    <AlertTitle>Awaiting Invoice</AlertTitle>
                    <AlertDescription>
                    Capture or upload an invoice image to begin analysis. The extracted details will appear here.
                    </AlertDescription>
                </Alert>
            )
          )}
        </div>
      </div>
    </div>
  );
}
