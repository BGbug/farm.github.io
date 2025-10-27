
"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, PlusCircle, KeyRound, Video, Globe, DollarSign, Archive, Upload } from "lucide-react"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import useSWR, { mutate } from 'swr';
import { format, formatDistanceToNow } from "date-fns"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"

const fetcher = (url: string) => fetch(url).then(res => res.json());

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: "Admin" | "Manager" | "Farmer";
  avatarId: string;
};

type BackupHistory = {
    id: string;
    timestamp: string;
    user: string;
    fileName: string;
}

const getAvatar = (id: string) => PlaceHolderImages.find(p => p.id === id);

type NewUser = Omit<User, "id" | "avatarId">;

const countries = [
    { code: "IN", name: "India" },
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
    { code: "GB", name: "United Kingdom" },
    { code: "AU", name: "Australia" },
];

const currencies = [
    { code: "INR", name: "Indian Rupee (₹)" },
    { code: "USD", name: "United States Dollar ($)" },
    { code: "CAD", name: "Canadian Dollar (C$)" },
    { code: "GBP", name: "British Pound (£)" },
    { code: "AUD", name: "Australian Dollar (A$)" },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: users = [], error: usersError, mutate: mutateUsers } = useSWR<User[]>('/api/users', fetcher);
  const { data: backupHistory = [], error: backupHistoryError, mutate: mutateBackupHistory } = useSWR<BackupHistory[]>('/api/backup-history', fetcher);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({ name: "", username: "", email: "", role: "Farmer" });

  const [selectedCountry, setSelectedCountry] = useState("IN");
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);


  const handleEditClick = (user: User) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingUser) {
      if (!editingUser.name || !editingUser.username || !editingUser.email) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all fields." });
        return;
      }
      // In a real app, this would be a PUT request to /api/users/[id]
      // For this prototype, we just optimistically update the UI.
      const updatedUsers = users.map(u => u.id === editingUser.id ? editingUser : u);
      mutateUsers(updatedUsers, false); 
      setIsEditDialogOpen(false);
      setEditingUser(null);
      toast({ title: "User Updated", description: "The user's information has been saved." });
      // Here you would make the API call, and handle success/error, possibly revalidating
    }
  };
  
  const handleEditFieldChange = (field: keyof User, value: string) => {
    if (editingUser) {
      setEditingUser({ ...editingUser, [field]: value });
    }
  }

  const handleInviteClick = () => {
    setNewUser({ name: "", username: "", email: "", role: "Farmer" });
    setIsInviteDialogOpen(true);
  };

  const handleInviteFieldChange = (field: keyof NewUser, value: string) => {
    setNewUser({ ...newUser, [field]: value });
  };
  
  const handleSaveInvite = async () => {
    if (!newUser.name || !newUser.email || !newUser.username) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all fields to invite a new user." });
        return;
    }
    
    const newUserWithId: User = { 
        ...newUser, 
        id: Math.max(0, ...users.map(u => u.id)) + 1,
        avatarId: `avatar-${(users.length % 3) + 1}`
    };
    
    // In a real app, this would be a POST request to /api/users
    const updatedUsers = [...users, newUserWithId];
    mutateUsers(updatedUsers, false);
    setIsInviteDialogOpen(false);
    toast({ title: "Invitation Sent", description: `${newUser.name} has been invited to join the team.` });
  };

  const handleSaveRegional = () => {
    // In a real app, you'd save this to a user settings endpoint
    toast({
        title: "Settings Saved",
        description: `Country set to ${countries.find(c => c.code === selectedCountry)?.name} and currency set to ${currencies.find(c => c.code === selectedCurrency)?.name}.`,
    });
  }
  
  const handleBackup = async () => {
    try {
        const response = await fetch('/api/backup');
        if (!response.ok) throw new Error('Failed to fetch backup data.');
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = `farmflow-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (fileNameMatch && fileNameMatch.length > 1) {
                fileName = fileNameMatch[1];
            }
        }
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        mutateBackupHistory();

        toast({
            title: "Backup Successful",
            description: "All your farm data has been downloaded.",
        });
    } catch (error) {
        console.error('Backup failed:', error);
        toast({
            variant: 'destructive',
            title: 'Backup Failed',
            description: 'There was a problem downloading your data.',
        });
    }
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setBackupFile(e.target.files[0]);
    }
  };
  
  const handleRestore = async () => {
    if (!backupFile) {
        toast({ variant: 'destructive', title: 'No File Selected', description: 'Please select a backup file to restore.' });
        return;
    }

    setIsRestoring(true);
    const formData = new FormData();
    formData.append('backup', backupFile);

    try {
        const response = await fetch('/api/restore', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to restore data.');
        }

        toast({
            title: "Restore Successful",
            description: "All data has been restored from the backup file. The page will now reload.",
        });

        // Reload the page to reflect the new data
        setTimeout(() => window.location.reload(), 2000);

    } catch (error: any) {
        console.error('Restore failed:', error);
        toast({
            variant: 'destructive',
            title: 'Restore Failed',
            description: error.message || 'There was a problem restoring your data.',
        });
    } finally {
        setIsRestoring(false);
        setBackupFile(null);
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Settings</h1>
          <p className="text-muted-foreground">Manage user accounts, API keys, and other application settings.</p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>A list of all users on the FarmFlow account.</CardDescription>
          </div>
          <Button onClick={handleInviteClick} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </CardHeader>
        <CardContent>
          {usersError ? <p>Failed to load users.</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  const avatar = getAvatar(user.avatarId);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <Avatar>
                            {avatar && <AvatarImage src={avatar.imageUrl} alt={avatar.description} data-ai-hint={avatar.imageHint} />}
                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name} <span className="text-sm text-muted-foreground">(@{user.username})</span></p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'Admin' ? 'destructive' : 'secondary'} className={user.role === 'Admin' ? 'bg-accent text-accent-foreground' : ''}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(user)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Change Role</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">Remove</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Backup all application data or restore from a previous backup file.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
              <h3 className="text-base font-medium mb-2">Backup</h3>
              <p className="text-sm text-muted-foreground mb-4">Download a single JSON file containing all your farm data, including livestock, crops, finances, and more.</p>
              <Button onClick={handleBackup}>
                <Archive className="mr-2 h-4 w-4" />
                Backup All Data
              </Button>
            </div>
             <div>
              <h3 className="text-base font-medium mb-2">Restore</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Restore all application data from a previously downloaded backup file. <strong className="text-destructive">Warning:</strong> This will overwrite all current data.
              </p>
              <div className="flex items-center gap-4">
                <Input id="backup-file" type="file" accept=".json" onChange={handleFileChange} className="max-w-xs" />
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={!backupFile || isRestoring}>
                            <Upload className="mr-2 h-4 w-4" />
                            {isRestoring ? 'Restoring...' : 'Restore Data'}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action is irreversible. Restoring from a backup will permanently delete all current data and replace it with the contents of the backup file.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRestore}>Yes, Restore Data</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <Separator />
            <div>
                 <h3 className="text-base font-medium mb-2">Backup History</h3>
                 <p className="text-sm text-muted-foreground mb-4">A log of all recent data backups.</p>
                 <div className="border rounded-md">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>File Name</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {backupHistoryError && <TableRow><TableCell colSpan={3}>Error loading history.</TableCell></TableRow>}
                            {backupHistory.length > 0 ? backupHistory.slice(0, 5).map(history => (
                                <TableRow key={history.id}>
                                    <TableCell>
                                        <div>{format(new Date(history.timestamp), 'PPpp')}</div>
                                        <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(history.timestamp), { addSuffix: true })}</div>
                                    </TableCell>
                                    <TableCell>{history.user}</TableCell>
                                    <TableCell className="font-mono text-xs">{history.fileName}</TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={3} className="text-center">No backup history found.</TableCell></TableRow>}
                        </TableBody>
                     </Table>
                 </div>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
          <CardDescription>Set your farm's location and currency for accurate tracking.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger id="country">
                        <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                        {countries.map(country => (
                            <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                 <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger id="currency">
                        <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                    <SelectContent>
                        {currencies.map(currency => (
                            <SelectItem key={currency.code} value={currency.code}>{currency.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                </div>
            </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveRegional} className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">Save Regional Settings</Button>
        </CardFooter>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>API Key Management</CardTitle>
          <CardDescription>Manage API keys for third-party AI and video streaming services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Google Gemini API Key</Label>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <Input id="gemini-key" type="password" placeholder="Enter your Gemini API Key" defaultValue="************" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <Input id="openai-key" type="password" placeholder="Enter your OpenAI API Key" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="video-key">Video Streaming API Key</Label>
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-muted-foreground" />
              <Input id="video-key" type="password" placeholder="Enter your Video Streaming API Key" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">Save API Keys</Button>
        </CardFooter>
      </Card>

      {editingUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Modify the user's details below and click save.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={editingUser.name} onChange={(e) => handleEditFieldChange('name', e.target.value)} className="col-span-3"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">Username</Label>
                <Input id="username" value={editingUser.username} onChange={(e) => handleEditFieldChange('username', e.target.value)} className="col-span-3"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={editingUser.email} onChange={(e) => handleEditFieldChange('email', e.target.value)} className="col-span-3"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Role</Label>
                 <Select value={editingUser.role} onValueChange={(value) => handleEditFieldChange('role', value)}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Farmer">Farmer</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a New User</DialogTitle>
            <DialogDescription>Enter the new user's details to send an invitation.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-name" className="text-right">Name</Label>
              <Input id="new-name" value={newUser.name} onChange={(e) => handleInviteFieldChange('name', e.target.value)} className="col-span-3" placeholder="John Doe"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-username" className="text-right">Username</Label>
              <Input id="new-username" value={newUser.username} onChange={(e) => handleInviteFieldChange('username', e.target.value)} className="col-span-3" placeholder="johndoe"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-email" className="text-right">Email</Label>
              <Input id="new-email" type="email" value={newUser.email} onChange={(e) => handleInviteFieldChange('email', e.target.value)} className="col-span-3" placeholder="john.doe@example.com"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-role" className="text-right">Role</Label>
              <Select value={newUser.role} onValueChange={(value: "Admin" | "Manager" | "Farmer") => handleInviteFieldChange('role', value)}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Farmer">Farmer</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveInvite}>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
