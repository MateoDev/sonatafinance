import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Trash2 } from 'lucide-react';

export default function Settings() {
  const { toast } = useToast();
  const [currency, setCurrency] = useState("USD");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
  };
  
  const handleExportData = () => {
    toast({
      title: "Data exported",
      description: "Your portfolio data has been exported.",
    });
  };
  
  const handleResetData = () => {
    if (confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
      toast({
        title: "Data reset",
        description: "All your portfolio data has been reset.",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Tabs defaultValue="general" className="w-full mb-8">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card className="bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg text-neutral-800 mb-6">General Settings</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                          <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select value={dateFormat} onValueChange={setDateFormat}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select date format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label htmlFor="emailNotifications" className="cursor-pointer">Email Notifications</Label>
                      <p className="text-sm text-neutral-500">Receive emails about important portfolio changes</p>
                    </div>
                    <Switch 
                      id="emailNotifications" 
                      checked={emailNotifications} 
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label htmlFor="priceAlerts" className="cursor-pointer">Price Alerts</Label>
                      <p className="text-sm text-neutral-500">Get notified when assets reach your target price</p>
                    </div>
                    <Switch 
                      id="priceAlerts" 
                      checked={priceAlerts} 
                      onCheckedChange={setPriceAlerts}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label htmlFor="darkMode" className="cursor-pointer">Dark Mode</Label>
                      <p className="text-sm text-neutral-500">Switch between light and dark themes</p>
                    </div>
                    <Switch 
                      id="darkMode" 
                      checked={darkMode} 
                      onCheckedChange={setDarkMode} 
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveSettings}>Save Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        
        <TabsContent value="account">
          <Card className="bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg text-neutral-800 mb-6">Account Settings</h3>
              
              <div className="space-y-6">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue="John Doe" className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="john.doe@example.com" className="mt-1" />
                  </div>
                  
                  <div className="pt-4 border-t border-neutral-200">
                    <h4 className="font-medium text-neutral-800 mb-4">Change Password</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" className="mt-1" />
                      </div>
                      
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" className="mt-1" />
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input id="confirmPassword" type="password" className="mt-1" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveSettings}>Update Account</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        
        <TabsContent value="data">
          <Card className="bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg text-neutral-800 mb-6">Data Management</h3>
              
              <div className="space-y-6">
                  <div className="bg-neutral-50 p-4 rounded-lg">
                    <h4 className="font-medium text-neutral-800 mb-2">Export Portfolio Data</h4>
                    <p className="text-sm text-neutral-600 mb-4">Download all your portfolio data as a CSV file for backup or analysis</p>
                    <Button variant="outline" onClick={handleExportData}>
                      <Download className="h-4 w-4 mr-2" />
                      Export to CSV
                    </Button>
                  </div>
                  
                  <div className="bg-neutral-50 p-4 rounded-lg">
                    <h4 className="font-medium text-neutral-800 mb-2">Import Data</h4>
                    <p className="text-sm text-neutral-600 mb-4">Import portfolio data from a CSV file</p>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import from CSV
                    </Button>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">Reset Portfolio Data</h4>
                    <p className="text-sm text-red-600 mb-4">Delete all your portfolio data. This action cannot be undone.</p>
                    <Button variant="destructive" onClick={handleResetData}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Reset All Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
