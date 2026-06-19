import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/services/api/settings.api';
import { Input, Textarea, Select } from '@/components/shared/FormComponents';
import { useToast } from '@/context/ToastContext';
import { Settings as SettingsIcon, Save, Loader2, HelpCircle, FileText, Info } from 'lucide-react';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'app' | 'policy' | 'rules'>('app');

  // Form states
  const [rules, setRules] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [terms, setTerms] = useState('');
  const [privacy, setPrivacy] = useState('');
  const [referralReward, setReferralReward] = useState(50);
  const [otpExpiry, setOtpExpiry] = useState(10);
  const [maintenanceMode, setMaintenanceMode] = useState('false');

  // Fetch settings
  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ['appSettings'],
    queryFn: settingsApi.getSettings,
  });

  // Populate form states once settings load
  useEffect(() => {
    if (settings) {
      if (settings.contest_rules) setRules(settings.contest_rules);
      if (settings.support_contact) setSupportEmail(settings.support_contact);
      if (settings.terms_conditions) setTerms(settings.terms_conditions);
      if (settings.privacy_policy) setPrivacy(settings.privacy_policy);
      if (settings.referral_reward_amount !== undefined) setReferralReward(Number(settings.referral_reward_amount));
      if (settings.otp_expiry_minutes !== undefined) setOtpExpiry(Number(settings.otp_expiry_minutes));
      if (settings.maintenance_mode !== undefined) setMaintenanceMode(String(settings.maintenance_mode));
    }
  }, [settings]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ key, value, desc }: { key: string; value: any; desc?: string }) =>
      settingsApi.updateSetting(key, value, desc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
      showToast('Setting key updated successfully', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to update setting', 'error');
    },
  });

  const handleSaveTab = async (tab: 'app' | 'policy' | 'rules') => {
    try {
      if (tab === 'app') {
        await updateMutation.mutateAsync({ key: 'referral_reward_amount', value: referralReward, desc: 'Credits rewarded on referrals' });
        await updateMutation.mutateAsync({ key: 'otp_expiry_minutes', value: otpExpiry, desc: 'Lifespan of validation OTP codes' });
        await updateMutation.mutateAsync({ key: 'maintenance_mode', value: maintenanceMode === 'true', desc: 'Maintenance lock status of app APIs' });
        showToast('App parameters updated', 'success');
      } else if (tab === 'rules') {
        await updateMutation.mutateAsync({ key: 'contest_rules', value: rules, desc: 'General eligibility & contest rules' });
        await updateMutation.mutateAsync({ key: 'support_contact', value: supportEmail, desc: 'Administrative support contact email' });
        showToast('Contest rules & support email updated', 'success');
      } else if (tab === 'policy') {
        await updateMutation.mutateAsync({ key: 'terms_conditions', value: terms, desc: 'Platform Terms and Conditions' });
        await updateMutation.mutateAsync({ key: 'privacy_policy', value: privacy, desc: 'Platform Privacy Policies' });
        showToast('T&C and Privacy Policies updated', 'success');
      }
    } catch {
      // toast shown in mutation
    }
  };

  const tabs = [
    { id: 'app', label: 'App Parameters', icon: SettingsIcon },
    { id: 'rules', label: 'Contest Rules & Support', icon: HelpCircle },
    { id: 'policy', label: 'Legal & Policies', icon: FileText },
  ];

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
        <span className="text-sm font-semibold text-text-muted">Loading settings registry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold tracking-wide text-white">System Configurations</h2>
        <p className="text-xs text-text-muted mt-0.5">Control reward amounts, maintenance locks, and legal parameters</p>
      </div>

      {/* Main panel with sidebar tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="bg-background-card border border-white/5 p-4 rounded-2xl flex flex-col gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-left ${
                activeTab === tab.id
                  ? 'bg-gold/10 text-gold border-l-2 border-gold'
                  : 'text-text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Edit fields container */}
        <div className="lg:col-span-3 p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl">
          {activeTab === 'app' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gold uppercase tracking-wider border-b border-white/5 pb-2">
                Operational Config & Wallet Weights
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Referral Payout (₹)"
                  type="number"
                  placeholder="50"
                  value={referralReward}
                  onChange={(e) => setReferralReward(Number(e.target.value))}
                />
                <Input
                  label="OTP Expiry (Minutes)"
                  type="number"
                  placeholder="10"
                  value={otpExpiry}
                  onChange={(e) => setOtpExpiry(Number(e.target.value))}
                />
              </div>

              <Select
                label="System Maintenance Mode"
                value={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.value)}
                options={[
                  { label: 'Deactivated (Platform online)', value: 'false' },
                  { label: 'Activated (Block entries / maintenance screens)', value: 'true' },
                ]}
              />

              <div className="p-4 bg-gold/5 border border-gold/15 rounded-xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                <p className="text-xxs leading-relaxed text-text-muted">
                  Changing Operational configuration applies immediately to all API controllers. Maintenance Mode locks users out of daily quizzes, mega challenges, and wallet operations.
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  onClick={() => handleSaveTab('app')}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl gold-gradient-bg text-background font-extrabold text-xs shadow-lg shadow-gold/10 hover:opacity-95 cursor-pointer disabled:opacity-50"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-background" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-background" />
                  )}
                  Save Variables
                </button>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gold uppercase tracking-wider border-b border-white/5 pb-2">
                Contest Rules & Support
              </h3>

              <Input
                label="Technical Support Contact Email"
                type="email"
                placeholder="support@gyaanchakra.com"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />

              <Textarea
                label="Platform Contest Rules & Instructions"
                placeholder="Enter rules players must follow..."
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="min-h-[220px]"
              />

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  onClick={() => handleSaveTab('rules')}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl gold-gradient-bg text-background font-extrabold text-xs shadow-lg shadow-gold/10 hover:opacity-95 cursor-pointer disabled:opacity-50"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-background" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-background" />
                  )}
                  Save Contest Policies
                </button>
              </div>
            </div>
          )}

          {activeTab === 'policy' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gold uppercase tracking-wider border-b border-white/5 pb-2">
                Legal Agreements
              </h3>

              <Textarea
                label="Terms & Conditions Agreement"
                placeholder="Write full terms & conditions..."
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="min-h-[180px]"
              />

              <Textarea
                label="Privacy Policy Agreement"
                placeholder="Write full privacy policies..."
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="min-h-[180px]"
              />

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  onClick={() => handleSaveTab('policy')}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl gold-gradient-bg text-background font-extrabold text-xs shadow-lg shadow-gold/10 hover:opacity-95 cursor-pointer disabled:opacity-50"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-background" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-background" />
                  )}
                  Save Legal Policies
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Settings;
