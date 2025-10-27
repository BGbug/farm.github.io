
"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { suggestCrops, SuggestCropsOutput } from '@/ai/flows/suggest-crops-flow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wand2, Loader2, Droplets, Sun, Camera, Video, RefreshCcw, Sprout } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuggestCropsPage() {
  const { toast } = useToast();
  const [result, setResult] = useState<SuggestCropsOutput | null>(null);
  const [pending, setPending] = useState(false);
  const [currentMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLiveView, setIsLiveView] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const getCameraPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
       toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        setIsLiveView(false);
        return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setIsLiveView(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
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
    const waterResourceNotes = formData.get('waterResourceNotes') as string;

    if (!photoPreview) {
        toast({
            variant: "destructive",
            title: "Missing Photo",
            description: "Please provide a photo of the soil.",
        });
        return;
    }

    setPending(true);
    setResult(null);

    try {
      const res = await suggestCrops({ 
          soilPhotoDataUri: photoPreview, 
          currentMonth,
          waterResourceNotes
      });
      setResult(res);
    } catch (e: any) {
        console.error(e);
        toast({
            variant: "destructive",
            title: "Suggestion Failed",
            description: e.message || "An unexpected error occurred.",
        });
    } finally {
        setPending(false);
    }
  };
  
  const handleReset = () => {
    setPhotoPreview(null);
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
        <h1 className="text-3xl font-bold font-headline">AI Crop Suggester</h1>
        <p className="text-muted-foreground">Get intelligent crop recommendations for the Indian climate based on a photo of your soil.</p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <form onSubmit={handleSubmit} ref={formRef}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Field Conditions</CardTitle>
              <CardDescription>Provide details about your field to get the best crop suggestions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="photo">Soil Photo</Label>
                <div className="mt-2 aspect-video w-full relative rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                    {isLiveView ? (
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    ) : photoPreview ? (
                        <Image src={photoPreview} alt="Soil preview" fill style={{ objectFit: 'cover' }} />
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <Camera className="mx-auto h-12 w-12" />
                            <p>Use camera or upload a photo of your soil.</p>
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
                <Label htmlFor="waterResourceNotes">Water Resources (Optional)</Label>
                <Textarea id="waterResourceNotes" name="waterResourceNotes" placeholder="e.g., 'Rain-fed only', 'Canal irrigation available twice a week', 'Borewell with good water table'" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentMonth">Planting Month</Label>
                <Input id="currentMonth" name="currentMonth" readOnly defaultValue={currentMonth} />
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button type="submit" disabled={pending || !photoPreview} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Suggest Crops
              </Button>
              <Button type="button" variant="ghost" onClick={handleReset} disabled={pending}><RefreshCcw className="h-4 w-4" /> <span className="sr-only">Reset</span></Button>
            </CardFooter>
          </Card>
        </form>

        <div className="space-y-4">
            {pending ? (
                <div className="space-y-4">
                    <Card className="shadow-md animate-pulse">
                        <CardHeader>
                            <div className="h-6 bg-muted rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-4 bg-muted rounded w-full"></div>
                        </CardContent>
                    </Card>
                    {[...Array(2)].map((_, i) => (
                        <Card key={i} className="shadow-md animate-pulse">
                            <CardHeader>
                                <div className="h-6 bg-muted rounded w-1/2"></div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="h-4 bg-muted rounded w-full"></div>
                                <div className="h-4 bg-muted rounded w-5/6"></div>
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : result ? (
              <div className="space-y-4">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sprout className="text-primary"/> AI Soil Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{result.soilAnalysis}</p>
                    </CardContent>
                </Card>

                {result.suggestions && result.suggestions.length > 0 ? (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold font-headline">Top Suggestions</h2>
                        {result.suggestions.map((suggestion, index) => (
                        <Card key={index} className="shadow-md">
                            <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>{suggestion.name}</span>
                                <Badge variant="secondary">{suggestion.type}</Badge>
                            </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-sm mb-1">Reasoning</h4>
                                    <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Sun className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-semibold">Growth Time</p>
                                            <p>{suggestion.estimatedGrowthDays} days</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Droplets className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-semibold">Watering Needs</p>
                                            <p>{suggestion.wateringNeeds}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        ))}
                    </div>
                ) : (
                    <Alert>
                        <Wand2 className="h-4 w-4" />
                        <AlertTitle>No Suggestions</AlertTitle>
                        <AlertDescription>
                            The AI could not generate crop suggestions based on the provided information. Try a different image or adjust the parameters.
                        </AlertDescription>
                    </Alert>
                )}
              </div>
            ) : null }
        </div>
      </div>
    </div>
  );
}
