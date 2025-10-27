
"use client";

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { diagnosePlantHealth, DiagnosePlantHealthOutput } from '@/ai/flows/diagnose-plant-health-flow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Wand2, Loader2, Leaf, HeartPulse, ShieldCheck, Info, Camera, RefreshCcw, Video } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function DiagnosePlantPage() {
  const { toast } = useToast();
  const [result, setResult] = useState<DiagnosePlantHealthOutput | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isLiveView, setIsLiveView] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    return () => {
      // Cleanup: stop video stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getCameraPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
       toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        setHasCameraPermission(false);
        return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);
      setIsLiveView(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      setIsLiveView(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this feature.',
      });
    }
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLiveView(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setPhotoPreview(canvas.toDataURL('image/jpeg'));
        setIsLiveView(false);
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const description = formData.get('description') as string;

    if (!photoPreview) {
      toast({
          variant: "destructive",
          title: "No Photo",
          description: "Please select or take a photo.",
      });
      return;
    }
    
    setPending(true);
    setResult(null);

    try {
      const res = await diagnosePlantHealth({ description, photoDataUri: photoPreview });
      setResult(res);
    } catch (e: any) {
        console.error(e);
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: e.message || "An unexpected error occurred.",
        });
    } finally {
        setPending(false);
    }
  };
  
  const handleReset = () => {
    setPhotoPreview(null);
    setHasCameraPermission(null);
    setIsLiveView(false);
    setResult(null);
    if(videoRef.current && videoRef.current.srcObject){
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    formRef.current?.reset();
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Diagnose Plant Health</h1>
        <p className="text-muted-foreground">Use your camera or upload a photo to get an AI-powered health analysis of your plants.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <form onSubmit={handleSubmit} ref={formRef}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Plant Analysis</CardTitle>
              <CardDescription>Provide a photo and optional description of the plant you want to analyze.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="photo">Plant Photo</Label>
                <div className="mt-2 aspect-video w-full relative rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                    {isLiveView ? (
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    ) : photoPreview ? (
                        <Image src={photoPreview} alt="Plant preview" fill style={{ objectFit: 'cover' }} />
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <Camera className="mx-auto h-12 w-12" />
                            <p>Camera preview or image upload will appear here.</p>
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
                        <Camera className="mr-2 h-4 w-4" /> Upload Photo
                    </Button>
                </div>
                <Input id="photo" name="photo" type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="e.g., 'The leaves are turning yellow and have brown spots. The plant is in direct sunlight for 6 hours a day.'"
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button type="submit" disabled={pending || !photoPreview} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Diagnose
              </Button>
              <Button type="button" variant="ghost" onClick={handleReset} disabled={pending}><RefreshCcw className="h-4 w-4" /> <span className="sr-only">Reset</span></Button>
            </CardFooter>
          </Card>
        </form>

        <div className="space-y-4">
            {pending ? (
                 <Card className="shadow-md">
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                    </CardHeader>
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
                        <CardTitle className="flex items-center gap-2">
                            <Leaf className="text-primary" />
                            <span>Analysis for: {result.plantType || "Unknown"}</span>
                        </CardTitle>
                        { !result.isPlant && <Badge variant="destructive">Not a Plant</Badge> }
                    </CardHeader>
                    <CardContent className="space-y-6">
                        { result.isPlant ? (
                            <>
                                <div className="space-y-2">
                                    <h3 className="font-semibold flex items-center gap-2"><HeartPulse/> Health Status</h3>
                                    <Alert variant={result.isHealthy ? "default" : "destructive"} className={result.isHealthy ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" : ""}>
                                        <AlertTitle className={result.isHealthy ? "text-green-800 dark:text-green-200" : ""}>{result.isHealthy ? "Healthy" : "Unhealthy"}</AlertTitle>
                                        <AlertDescription className={result.isHealthy ? "text-green-700 dark:text-green-300" : ""}>
                                            {result.diagnosis}
                                        </AlertDescription>
                                    </Alert>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold flex items-center gap-2"><ShieldCheck /> Recommendations</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.recommendations}</p>

                                </div>
                            </>
                        ) : (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>Not a Plant</AlertTitle>
                                <AlertDescription>
                                    The uploaded image does not appear to contain a plant. Please try another image.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            ) : null }
        </div>
      </div>
    </div>
  );
}
