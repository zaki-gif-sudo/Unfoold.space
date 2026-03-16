import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import BreadcrumbNav from '@/components/BreadcrumbNav.jsx';
import { User, Mail, Phone, Award, Shield, Camera, Edit2, Check, X, Bell, Lock } from 'lucide-react';

const ProfileSettingsPage = () => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    bio: currentUser?.bio || '',
    notifications: currentUser?.notificationPreferences?.email || true
  });
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    password: '',
    passwordConfirm: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPrivate, setIsPrivate] = useState(!!currentUser?.isPrivate);
  const [isTogglingPrivate, setIsTogglingPrivate] = useState(false);

  const handleTogglePrivate = async () => {
    setIsTogglingPrivate(true);
    try {
      const newVal = !isPrivate;
      await pb.collection('users').update(currentUser.id, { isPrivate: newVal }, { $autoCancel: false });
      setIsPrivate(newVal);
      setMessage({ type: 'success', text: newVal ? 'Akun diatur ke mode privat.' : 'Akun diatur ke mode publik.' });
    } catch (error) {
      console.error('Toggle private failed:', error);
      setMessage({ type: 'error', text: 'Gagal mengubah pengaturan privasi.' });
    } finally {
      setIsTogglingPrivate(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      await pb.collection('users').update(currentUser.id, formData, { $autoCancel: false });
      setMessage({ type: 'success', text: 'Avatar updated successfully. Refresh to see changes.' });
    } catch (error) {
      console.error("Avatar upload failed:", error);
      setMessage({ type: 'error', text: 'Failed to upload avatar. Max size 20MB.' });
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage({ type: '', text: '' });

    try {
      await pb.collection('users').update(currentUser.id, {
        name: formData.name,
        phone: formData.phone,
        bio: formData.bio,
        notificationPreferences: { email: formData.notifications }
      }, { $autoCancel: false });
      
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setIsEditing(false);
    } catch (error) {
      console.error("Update failed:", error);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.passwordConfirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await pb.collection('users').update(currentUser.id, {
        oldPassword: passwordData.oldPassword,
        password: passwordData.password,
        passwordConfirm: passwordData.passwordConfirm
      }, { $autoCancel: false });
      
      setMessage({ type: 'success', text: 'Password changed successfully.' });
      setPasswordData({ oldPassword: '', password: '', passwordConfirm: '' });
    } catch (error) {
      console.error("Password change failed:", error);
      setMessage({ type: 'error', text: 'Failed to change password. Check old password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const points = currentUser?.loyaltyPoints || 0;
  const tierThresholds = [{ name: 'Bronze', min: 0 }, { name: 'Silver', min: 100 }, { name: 'Gold', min: 200 }, { name: 'Platinum', min: 500 }];
  const currentTierIdx = tierThresholds.reduce((acc, t, i) => points >= t.min ? i : acc, 0);
  const currentTier = tierThresholds[currentTierIdx];
  const nextTier = tierThresholds[currentTierIdx + 1];
  const pointsToNext = nextTier ? nextTier.min - points : 0;
  const progressPercentage = nextTier ? ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100;
  const avatarUrl = currentUser?.avatar ? pb.files.getUrl(currentUser, currentUser.avatar) : null;

  return (
    <div className="min-h-screen bg-background py-12">
      <Helmet>
        <title>Profile Settings | Unfoold Espresso</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-5xl">
        <BreadcrumbNav items={[
          { label: 'Profile', path: '/profile' }
        ]} />

        <div className="flex justify-between items-end mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Account Settings</h1>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              <Edit2 size={16} /> Edit Profile
            </button>
          )}
        </div>

        {message.text && (
          <div className={`mb-8 p-4 rounded-lg flex items-center gap-3 border ${message.type === 'success' ? 'bg-muted text-foreground border-foreground' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
            {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Card & Membership */}
          <div className="space-y-8">
            {/* Profile Card */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-muted border-b border-border"></div>
              
              <div className="relative z-10">
                <div className="relative inline-block mb-4">
                  <div className="w-32 h-32 rounded-full border-4 border-card bg-background overflow-hidden mx-auto flex items-center justify-center text-foreground shadow-sm">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover grayscale" />
                    ) : (
                      <User size={48} />
                    )}
                  </div>
                  <button 
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 p-2 bg-foreground text-background rounded-full shadow-md hover:opacity-80 transition-opacity"
                    title="Change Avatar"
                  >
                    <Camera size={16} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                
                <h2 className="text-2xl font-bold text-foreground mb-1">{currentUser?.name || 'Coffee Lover'}</h2>
                <p className="text-muted-foreground font-medium mb-4">{currentUser?.membershipLevel || 'Bronze'}</p>
                
                <div className="text-sm text-muted-foreground space-y-2 text-left bg-muted/50 p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-3"><Mail size={16} className="text-foreground" /> <span className="truncate">{currentUser?.email}</span></div>
                  {currentUser?.phone && <div className="flex items-center gap-3"><Phone size={16} className="text-foreground" /> <span>{currentUser.phone}</span></div>}
                </div>
              </div>
            </div>

            {/* Membership Details */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Award size={20} /> Unfoold Rewards
              </h3>
              
              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-bold text-foreground">{points} <span className="text-sm font-normal text-muted-foreground">pts</span></span>
                  <span className="text-sm text-foreground font-medium">{nextTier ? `${pointsToNext} ke ${nextTier.name}` : 'Max Level! 🏆'}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 border border-border overflow-hidden">
                  <div className="bg-foreground h-full transition-all duration-1000 relative" style={{ width: `${progressPercentage}%` }}></div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Current Benefits</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><Check size={16} className="text-foreground shrink-0 mt-0.5" /> 2 poin per cup pesanan</li>
                  <li className="flex items-start gap-2"><Check size={16} className="text-foreground shrink-0 mt-0.5" /> 3 poin per event diikuti</li>
                  <li className="flex items-start gap-2"><Check size={16} className="text-foreground shrink-0 mt-0.5" /> Bronze 0 • Silver 100 • Gold 200 • Platinum 500</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Forms */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Profile Edit Form */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <User size={20} /> Personal Information
              </h3>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                      <input 
                        type="text" name="name" value={formData.name} onChange={handleInputChange}
                        className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                      <input 
                        type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 (555) 000-0000"
                        className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                    <textarea 
                      name="bio" rows="3" value={formData.bio} onChange={handleInputChange} placeholder="Tell the community a bit about yourself..."
                      className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground resize-none"
                    ></textarea>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
                    <input 
                      type="checkbox" id="notifications" name="notifications" checked={formData.notifications} onChange={handleInputChange}
                      className="w-5 h-5 rounded border-border text-foreground focus:ring-foreground bg-background"
                    />
                    <label htmlFor="notifications" className="text-sm text-foreground flex items-center gap-2 cursor-pointer">
                      <Bell size={16} className="text-muted-foreground" /> Receive email notifications for events and rewards
                    </label>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-border">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 text-foreground hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border">Cancel</button>
                    <button type="submit" disabled={isUpdating} className="px-8 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                      <p className="font-medium text-foreground">{currentUser?.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email Address</p>
                      <p className="font-medium text-foreground">{currentUser?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
                      <p className="font-medium text-foreground">{currentUser?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notifications</p>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        {currentUser?.notificationPreferences?.email ? <span className="text-foreground">Enabled</span> : <span className="text-muted-foreground">Disabled</span>}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Bio</p>
                    <p className="text-foreground/90 bg-muted/30 p-4 rounded-lg border border-border min-h-[80px]">
                      {currentUser?.bio || 'No bio provided yet.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Settings */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Lock size={20} /> Privasi
              </h3>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">Akun Privat</p>
                  <p className="text-xs text-muted-foreground mt-1">Jika diaktifkan, hanya pengikut yang disetujui yang dapat melihat post dan story Anda.</p>
                </div>
                <button
                  onClick={handleTogglePrivate}
                  disabled={isTogglingPrivate}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-50 ${isPrivate ? 'bg-foreground' : 'bg-muted-foreground/30'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${isPrivate ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Security Form */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Shield size={20} /> Security
              </h3>
              
              <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
                  <input 
                    type="password" required value={passwordData.oldPassword} onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                    className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                  <input 
                    type="password" required minLength="8" value={passwordData.password} onChange={(e) => setPasswordData({...passwordData, password: e.target.value})}
                    className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
                  <input 
                    type="password" required minLength="8" value={passwordData.passwordConfirm} onChange={(e) => setPasswordData({...passwordData, passwordConfirm: e.target.value})}
                    className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <button type="submit" disabled={isChangingPassword} className="px-6 py-3 bg-background border border-border text-foreground font-bold rounded-lg hover:bg-muted transition-colors disabled:opacity-50">
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;