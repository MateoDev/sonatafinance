import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Settings, 
  CreditCard, 
  Lock, 
  Bell, 
  Upload, 
  PlusCircle,
  Check,
  Trash,
  CircleAlert
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Profile() {
  const { user, updateProfileMutation } = useAuth();
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Mock bank connections for UI
  const [bankConnections, setBankConnections] = useState([
    { id: 1, name: 'Chase Bank', status: 'connected', lastSync: '2 hours ago' },
    { id: 2, name: 'Bank of America', status: 'error', lastSync: '3 days ago' }
  ]);

  // Handle profile image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setSelectedFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save profile image
  const handleSaveImage = () => {
    if (!selectedFile || !user) return;
    
    setIsUploading(true);
    
    // Use the base64 image data and send it to the server via our mutation
    if (profileImage) {
      updateProfileMutation.mutate(
        { profileImage },
        {
          onSuccess: () => {
            setIsUploading(false);
            toast({
              title: "Profile updated",
              description: "Your profile picture has been updated.",
            });
          },
          onError: (error) => {
            setIsUploading(false);
            toast({
              title: "Update failed",
              description: error.message || "Failed to update profile picture. Please try again.",
              variant: "destructive"
            });
          }
        }
      );
    }
  };
  
  // Add new bank connection
  const handleAddBank = () => {
    // In a real app, this would trigger a bank connection flow
    toast({
      title: "Feature in development",
      description: "Bank connection feature is coming soon.",
    });
  };
  
  // Disconnect bank
  const handleDisconnectBank = (id: number) => {
    setBankConnections(prev => prev.filter(conn => conn.id !== id));
    toast({
      title: "Bank disconnected",
      description: "The bank connection has been removed.",
    });
  };
  
  // Sync bank
  const handleSyncBank = (id: number) => {
    toast({
      title: "Sync initiated",
      description: "Your bank account is being synced. This may take a moment.",
    });
    
    // Update the last sync time
    setTimeout(() => {
      setBankConnections(prev => 
        prev.map(conn => 
          conn.id === id ? {...conn, lastSync: 'Just now', status: 'connected'} : conn
        )
      );
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Removed duplicate header since it's already in the AppLayout */}
      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6 w-full sm:w-auto">
            <TabsTrigger value="profile" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="banking" className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Banking</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Lock className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-shrink-0">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profileImage || undefined} alt="Profile" />
                        <AvatarFallback className="text-2xl">
                          {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Upload a new profile picture
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            className="cursor-pointer"
                          />
                        </div>
                        {selectedFile && (
                          <Button 
                            onClick={handleSaveImage} 
                            disabled={isUploading}
                            className="w-full sm:w-auto"
                          >
                            {isUploading ? 
                              "Uploading..." : 
                              "Save Picture"
                            }
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Your name"
                      defaultValue={user?.name} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Your email"
                      defaultValue={user?.email} 
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button>Save Changes</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Account Preferences</CardTitle>
                  <CardDescription>
                    Customize your account settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <select 
                      id="currency"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      defaultValue="USD"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select 
                      id="language"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      defaultValue="en"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select 
                      id="timezone"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      defaultValue="UTC-5"
                    >
                      <option value="UTC-8">Pacific Time (UTC-8)</option>
                      <option value="UTC-7">Mountain Time (UTC-7)</option>
                      <option value="UTC-6">Central Time (UTC-6)</option>
                      <option value="UTC-5">Eastern Time (UTC-5)</option>
                      <option value="UTC+0">GMT (UTC+0)</option>
                      <option value="UTC+1">Central European (UTC+1)</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button>Save Preferences</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="banking">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bank Connections</CardTitle>
                  <CardDescription>
                    Connect your bank accounts to automatically import transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bankConnections.map(bank => (
                      <div key={bank.id} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{bank.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Last synced: {bank.lastSync}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {bank.status === 'connected' ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 flex items-center">
                                <Check className="mr-1 h-3 w-3" />
                                Connected
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600 flex items-center">
                                <CircleAlert className="mr-1 h-3 w-3" />
                                Connection error
                              </span>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSyncBank(bank.id)}
                            >
                              Sync
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Disconnect Bank</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to disconnect {bank.name}? This will stop automatic transaction imports.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleDisconnectBank(bank.id)}
                                  >
                                    Disconnect
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      className="w-full mt-2" 
                      onClick={handleAddBank}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Connect a New Bank Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Import Options</CardTitle>
                  <CardDescription>
                    Control how your bank data is imported and categorized
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Automatic categorization</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically categorize transactions based on vendor name and history
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Daily sync</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically sync transactions from your bank daily
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Duplicate detection</Label>
                        <p className="text-sm text-muted-foreground">
                          Detect and prevent duplicate transactions from being imported
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose when and how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for important updates
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Budget Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you approach your budget limits
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Bill Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive reminders before bills are due
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Large Transaction Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about unusual or large transactions
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Market Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about your investments and market changes
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input 
                      id="current-password" 
                      type="password"
                      placeholder="••••••••" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password" 
                      type="password"
                      placeholder="••••••••" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password"
                      placeholder="••••••••" 
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button>Update Password</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button variant="outline">Setup</Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Login Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications when someone logs into your account
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Account Activity</Label>
                        <p className="text-sm text-muted-foreground">
                          View your account activity and login history
                        </p>
                      </div>
                      <Button variant="outline">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}