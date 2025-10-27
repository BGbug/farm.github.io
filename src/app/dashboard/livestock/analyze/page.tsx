
'use client';

import { useState, useRef, useEffect } from 'react';
import { analyzeLivestockHealth, AnalyzeLivestockHealthOutput } from '@/ai/flows/analyze-livestock-health-flow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Wand2, Loader2, Video, Camera, RefreshCcw, AlertTriangle, ShieldCheck, Activity, PlusCircle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { mutate } from 'swr';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ANIMAL_TYPES = ["Cow", "Buffalo", "Goat", "Chicken", "Sheep", "Other"];
const ANALYSIS_INTERVAL = 10000; // 10 seconds

export default function AnalyzeLivestockPage() {
  const { toast } = useToast();
  const [result, setResult] = useState<AnalyzeLivestockHealthOutput | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [animalType, setAnimalType] = useState<string>("Cow");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isLiveView, setIsLiveView] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  
  const stopAnalysisInterval = () => {
    if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopAnalysisInterval();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (autoAnalyze && isLiveView && !pending) {
      analysisIntervalRef.current = setInterval(() => {
          handleAnalysis(true);
      }, ANALYSIS_INTERVAL);
    } else {
      stopAnalysisInterval();
    }
    return () => stopAnalysisInterval();
  }, [autoAnalyze, isLiveView, pending]);

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

  const takeSnapshot = (fromAutoAnalysis = false): string | null => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        
        if (!fromAutoAnalysis) {
            setSnapshot(dataUri);
            toast({
                title: 'Snapshot Captured',
                description: 'You can now analyze the captured image.',
            });
            // Stop the camera stream after taking a manual snapshot
            stopCameraStream();
        }
        return dataUri;
      }
    }
    return null;
  };
  
  const handleAnalysis = async (fromAutoAnalysis = false) => {
    let currentSnapshot = snapshot;
    if (fromAutoAnalysis) {
        currentSnapshot = takeSnapshot(true);
    } else if (isLiveView) {
        currentSnapshot = takeSnapshot(false);
        if (!currentSnapshot) return;
    }

    if (!currentSnapshot) {
      if (!fromAutoAnalysis) {
        toast({
          variant: 'destructive',
          title: 'No Snapshot',
          description: 'Please take a snapshot from the camera feed first.',
        });
      }
      return;
    }

    setPending(true);
    if(!fromAutoAnalysis) {
        setResult(null);
    }

    try {
      const res = await analyzeLivestockHealth({
        imageDataUri: currentSnapshot,
        animalType: animalType as any,
      });
      setResult(res);
      setSnapshot(currentSnapshot);
    } catch (e: any) {
      console.error(e);
      if (!fromAutoAnalysis) {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: e.message || 'An unexpected error occurred.',
        });
      }
    } finally {
      setPending(false);
    }
  };

  const handleAddAnimal = async () => {
      if (!result || !result.suggestedId) {
          toast({ variant: 'destructive', title: 'Cannot Add Animal', description: 'No suggested ID available from analysis.' });
          return;
      }

      const newAnimalData = {
          id: result.suggestedId,
          type: animalType,
          breed: result.visualDescription ? result.visualDescription.split(',')[0] : 'Unknown',
          gender: 'Unknown',
          dob: new Date().toISOString().split('T')[0], // Default to today
          status: 'Healthy',
          purpose: 'Growing',
      };

      try {
          await fetch('/api/livestock', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newAnimalData),
          });
          mutate('/api/livestock');
          toast({ title: 'Animal Added!', description: `Animal ${result.suggestedId} has been added to your herd.` });
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Failed to Add Animal' });
      }
  };


  const stopCameraStream = () => {
    if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
    setIsLiveView(false);
    setAutoAnalyze(false);
  }

  const handleReset = () => {
    setSnapshot(null);
    setHasCameraPermission(null);
    setResult(null);
    stopCameraStream();
    stopAnalysisInterval();
  };

  const getUrgencyColor = (urgency: 'High' | 'Medium' | 'Low') => {
      switch(urgency) {
          case 'High': return 'bg-red-500 text-white';
          case 'Medium': return 'bg-yellow-500 text-white';
          case 'Low': return 'bg-blue-500 text-white';
          default: return 'bg-gray-500 text-white';
      }
  }
  
  const AnalyzeButton = () => (
    <Button onClick={() => handleAnalysis(false)} disabled={pending || (!snapshot && !isLiveView) || autoAnalyze} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        {pending && !autoAnalyze ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isLiveView ? <Camera className="mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />}
        {isLiveView ? 'Capture & Analyze' : 'Analyze Snapshot'}
    </Button>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Live Livestock Analysis</h1>
        <p className="text-muted-foreground">Use your farm's camera feed to monitor your herd's health and register new animals with AI.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Camera Feed Analysis</CardTitle>
            <CardDescription>Connect to your camera, analyze health, and identify new animals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Camera Control</Label>
              <div className="mt-2 aspect-video w-full relative rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                {isLiveView ? (
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay/>
                ) : snapshot ? (
                   <Image src={snapshot} alt="Livestock snapshot" fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Video className="mx-auto h-12 w-12" />
                    <p>Connect to your live camera feed.</p>
                  </div>
                )}
              </div>
                {!isLiveView && (
                    <Button type="button" variant="outline" onClick={getCameraPermission} className="w-full mt-2">
                        <Video className="mr-2 h-4 w-4" /> Connect to Live Camera
                    </Button>
                )}
            </div>

             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <Label htmlFor="auto-analyze">Auto-Analyze Feed</Label>
                    <p className="text-[0.8rem] text-muted-foreground">
                        Automatically analyze the feed every {ANALYSIS_INTERVAL / 1000} seconds.
                    </p>
                </div>
                <Switch 
                    id="auto-analyze"
                    checked={autoAnalyze}
                    onCheckedChange={setAutoAnalyze}
                    disabled={!isLiveView}
                />
            </div>


            <div className="space-y-2">
                <Label htmlFor="animal-type">Animal Type</Label>
                <Select value={animalType} onValueChange={setAnimalType} disabled={pending}>
                    <SelectTrigger id="animal-type">
                        <SelectValue placeholder="Select animal type" />
                    </SelectTrigger>
                    <SelectContent>
                        {ANIMAL_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
             <TooltipProvider>
                {autoAnalyze ? (
                    <Tooltip>
                        <TooltipTrigger className="w-full" asChild>
                            <span>
                                <AnalyzeButton />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Manual analysis is disabled during auto-analysis.</p>
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <AnalyzeButton />
                )}
            </TooltipProvider>

            <Button type="button" variant="ghost" onClick={handleReset} disabled={pending}>
              <RefreshCcw className="h-4 w-4" /> <span className="sr-only">Reset</span>
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-4">
          {pending && !result && (
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
          )}
          { result && (
            <Card className={`shadow-lg transition-all duration-300 ${pending ? 'opacity-50' : 'opacity-100'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   {pending ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : <Activity className="text-primary h-6 w-6" />}
                  <span>Analysis Results</span>
                </CardTitle>
                <CardDescription>Found approximately {result.animalCount} animal(s). {pending && "(Updating...)"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {result.suggestedId && (
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="text-primary" /> AI Animal Identification</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-sm text-muted-foreground">{result.visualDescription}</p>
                            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                                <div>
                                    <p className="text-xs font-semibold">Suggested ID</p>
                                    <p className="font-mono font-bold text-primary">{result.suggestedId}</p>
                                </div>
                                <Button size="sm" onClick={handleAddAnimal}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add to Herd
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2"><AlertTriangle /> Health Observations</h3>
                  {result.healthAnalysis.length > 0 ? (
                    <div className="space-y-4">
                      {result.healthAnalysis.map((item, index) => (
                        <Alert key={index} variant={item.urgency === 'High' ? 'destructive' : 'default'}>
                          <AlertTitle className="flex justify-between items-center">
                            <span>Observation</span>
                            <Badge className={getUrgencyColor(item.urgency)}>{item.urgency} Urgency</Badge>
                          </AlertTitle>
                          <AlertDescription>{item.observation}</AlertDescription>
                          <h4 className="font-semibold mt-2 text-sm">Recommendation:</h4>
                          <p className="text-sm text-muted-foreground">{item.recommendation}</p>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No specific health issues detected.</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold flex items-center gap-2"><ShieldCheck/> General Advice</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.generalAdvice}</p>
                </div>
              </CardContent>
            </Card>
          )} 
          { !result && !pending && snapshot && (
             <Card>
                <CardHeader>
                    <CardTitle>Ready to Analyze</CardTitle>
                    <CardDescription>Click the "Analyze Snapshot" button to get health insights for the captured image.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Image src={snapshot} alt="Livestock snapshot" width={1920} height={1080} className="rounded-md border" />
                </CardContent>
             </Card>
          )}
        </div>
      </div>
    </div>
  );
}
