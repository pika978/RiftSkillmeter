import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [emailNotif, setEmailNotif] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Customize your experience</p>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Daily Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminded to learn daily</p>
              </div>
              <Switch checked={dailyReminder} onCheckedChange={setDailyReminder} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
