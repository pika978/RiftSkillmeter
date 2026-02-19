import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Shield, ExternalLink, Award, FileCheck, Download } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8001/api');

export default function Profile() {
  const { user, updateUser, authFetch } = useAuth();
  const [name, setName] = useState('');
  const [algoWallet, setAlgoWallet] = useState('');
  const [badges, setBadges] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [pendingSkillTokens, setPendingSkillTokens] = useState(0);
  const { toast } = useToast();

  // Sync name from user object once auth loads
  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);
  // Fetch profile data including wallet, badges, and certificates
  useEffect(() => {
    // Fetch wallet address
    authFetch(`${API_URL}/profile/`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.algoWallet) setAlgoWallet(d.algoWallet);
        if (d?.pendingSkillTokens) setPendingSkillTokens(d.pendingSkillTokens);
      })
      .catch(() => { });

    // Fetch badges from assessment results
    authFetch(`${API_URL}/assessments/results/`)
      .then(r => r.ok ? r.json() : [])
      .then(results => {
        const badgeResults = (Array.isArray(results) ? results : []).filter(r => r.badge_asset_id);
        setBadges(badgeResults);
      })
      .catch(() => { });

    // Fetch certificates from roadmaps
    authFetch(`${API_URL}/roadmaps/`)
      .then(r => r.ok ? r.json() : [])
      .then(roadmaps => {
        const certs = (Array.isArray(roadmaps) ? roadmaps : []).filter(r => r.certificate_id);
        setCertificates(certs);
      })
      .catch(() => { });
  }, []);

  const handleSave = () => {
    updateUser({ name });

    // Save wallet address to backend
    authFetch(`${API_URL}/profile/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ algoWallet: algoWallet })
    })
      .then(r => {
        if (r.ok) {
          toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
        } else {
          toast({ title: 'Save failed', description: 'Could not save wallet address.', variant: 'destructive' });
        }
      })
      .catch(() => {
        toast({ title: 'Save failed', description: 'Network error.', variant: 'destructive' });
      });
  };
  return (<DashboardLayout>
    <div className="max-w-2xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </motion.div>

      <Card className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000]">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-2xl">{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name || ''} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ''} disabled />
            </div>
          </div>

          <Button onClick={handleSave}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Algorand Wallet */}
      <Card className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Algorand Wallet
          </CardTitle>
          <CardDescription>Connect your wallet to receive NFT certificates and $SKILL tokens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="algoWallet">Wallet Address</Label>
            <Input
              id="algoWallet"
              value={algoWallet || ''}
              onChange={(e) => setAlgoWallet(e.target.value)}
              placeholder="Enter your 58-character Algorand address"
              maxLength={58}
              className="font-mono text-sm"
            />
          </div>
          {algoWallet && (
            <a
              href={`https://lora.algokit.io/testnet/account/${algoWallet}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-emerald-700 font-medium hover:underline"
            >
              View on Algorand Explorer <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </CardContent>
      </Card>

      {/* $SKILL Token Card */}
      <Card className="rounded-none border-2 border-emerald-600 shadow-[6px_6px_0px_0px_#059669]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-600" />
            $SKILL Token Balance
          </CardTitle>
          <CardDescription>Earn 1 $SKILL per concept completed. More for assessments, streaks, and courses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingSkillTokens > 0 && (
            <div className="bg-amber-50 border-2 border-amber-400 p-3 text-sm">
              <p className="font-bold text-amber-800">⏳ {pendingSkillTokens} $SKILL tokens pending</p>
              <p className="text-amber-700 text-xs mt-1">These tokens are saved and will be transferred on-chain once you opt-in to the $SKILL ASA.</p>
            </div>
          )}

          <div className="bg-emerald-50 border-2 border-emerald-300 p-4">
            <p className="text-xs font-bold text-emerald-800 mb-2">HOW TO OPT-IN (one-time setup)</p>
            <ol className="text-xs text-emerald-700 space-y-1 list-decimal list-inside">
              <li>Open <strong>Pera Wallet</strong> (mobile) or <strong>Defly</strong></li>
              <li>Go to <strong>Assets → Add Asset</strong></li>
              <li>Search for ASA ID: <code className="bg-emerald-100 px-1 font-mono font-bold">755783670</code></li>
              <li>Tap <strong>Opt-In</strong> and confirm (~0.001 ALGO fee)</li>
            </ol>
          </div>

          <div className="flex flex-wrap gap-2">
            {algoWallet && (
              <a
                href={`https://lora.algokit.io/testnet/account/${algoWallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 px-3 py-2 hover:bg-emerald-700 transition-colors"
              >
                <ExternalLink className="h-3 w-3" /> View My Wallet
              </a>
            )}
            <a
              href="https://lora.algokit.io/testnet/asset/755783670"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold border-2 border-emerald-600 text-emerald-700 px-3 py-2 hover:bg-emerald-50 transition-colors"
            >
              <Shield className="h-3 w-3" /> View $SKILL ASA on Explorer
            </a>
          </div>
        </CardContent>
      </Card>

      {/* My Certificates */}
      <Card className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-600" />
            My Certificates
          </CardTitle>
          <CardDescription>Blockchain-verified course completion certificates</CardDescription>
        </CardHeader>
        <CardContent>
          {certificates.length > 0 ? (
            <div className="space-y-3">
              {certificates.map((cert, i) => (
                <motion.div
                  key={cert.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{cert.course_title || 'Course Certificate'}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">ID: {cert.certificate_id}</p>
                      {cert.completedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Completed: {new Date(cert.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {cert.nft_asset_id ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-1">
                            <Shield className="h-3 w-3" /> On-Chain
                          </span>
                          <a
                            href={`https://lora.algokit.io/testnet/asset/${cert.nft_asset_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold hover:underline"
                          >
                            ASA #{cert.nft_asset_id} <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              const res = await authFetch(`${API_URL}/roadmaps/${cert.id}/mint-nft/`, {
                                method: 'POST',
                              });
                              const data = await res.json();
                              if (res.ok && data.nft_asset_id) {
                                toast({ title: 'NFT Minted!', description: `ASA #${data.nft_asset_id}` });
                                setCertificates(prev => prev.map(c =>
                                  c.id === cert.id ? { ...c, nft_asset_id: data.nft_asset_id } : c
                                ));
                              } else {
                                toast({ title: 'Mint failed', description: data.error || 'Unknown error', variant: 'destructive' });
                              }
                            } catch (e) {
                              toast({ title: 'Mint failed', description: 'Network error', variant: 'destructive' });
                            }
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 border border-emerald-700 px-3 py-1 hover:bg-emerald-700 transition-colors"
                        >
                          <Shield className="h-3 w-3" /> Mint NFT
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <FileCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No certificates yet — complete a course to earn one!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skill Badges Gallery */}
      <Card className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            Skill Badges
          </CardTitle>
          <CardDescription>NFT badges earned from assessments — verified on Algorand</CardDescription>
        </CardHeader>
        <CardContent>
          {badges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {badges.map((badge, i) => (
                <motion.div
                  key={badge.id || i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all overflow-hidden"
                >
                  {/* Badge Header — skill/concept name */}
                  <div className="bg-yellow-400 border-b-2 border-black px-4 py-2 flex items-center gap-2">
                    <Award className="h-5 w-5 flex-shrink-0" />
                    <p className="font-bold text-sm truncate">
                      {badge.conceptTitle || 'Skill Assessment'}
                    </p>
                  </div>

                  {/* Badge Body */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Score Achieved</p>
                        <p className="text-2xl font-black">{badge.score}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Token ID</p>
                        <p className="text-xs font-mono text-emerald-700 font-bold">ASA #{badge.badge_asset_id}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                      <a
                        href={`https://lora.algokit.io/testnet/asset/${badge.badge_asset_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold hover:underline"
                      >
                        View on Chain <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        onClick={async () => {
                          try {
                            const res = await authFetch(`${API_URL}/assessments/results/${badge.id}/badge-image/`);
                            if (!res.ok) return;
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            const safeName = (badge.conceptTitle || 'skill').replace(/\s+/g, '_').toLowerCase();
                            a.download = `badge_${safeName}.png`;
                            a.click();
                            URL.revokeObjectURL(url);
                          } catch (e) { console.error(e); }
                        }}
                        className="inline-flex items-center gap-1 text-xs text-blue-700 font-bold hover:underline"
                      >
                        <Download className="h-3 w-3" /> Download Badge
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Award className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No badges yet — score 10%+ on an assessment to earn one!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </DashboardLayout>);
}
