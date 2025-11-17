import React, { useState, useMemo, useEffect } from 'react';
import type { Tenant, User } from '../lib/types';

import {
    getTenants,
    getUserById,
    getTenantsForUser,
    logAuditEvent,
    getOrCreateDirectConversation,
    registerUser,
    requestPasswordReset,
    resetPassword,
    createTenant,
    updateTenant,
    getNotificationsForUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUserByEmail,
    requestToJoinTenant
} from '@/lib/data';
import { SessionProvider, useSession } from 'next-auth/react';
import LoginForm from './components/auth/LoginForm';
import TenantSelector from './components/tenant/TenantSelector';
import CreateTenantForm from './components/tenant/CreateTenantForm';
import TenantLayout from './components/tenant/TenantLayout';
import Button from './components/ui/Button';
import ImpersonationBanner from './components/admin/ImpersonationBanner';
import ProfilePage from './components/profile/ProfilePage';
import LandingPage from './components/landing/LandingPage';
import ExplorePage from './components/explore/ExplorePage';
import { ActionType, Notification } from '../lib/types';
import MessagesPage from './components/messages/MessagesPage';
import RegisterForm from './components/auth/RegisterForm';
import AccountSettingsPage from './components/account/AccountSettingsPage';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import PublicTenantPage from './components/public/PublicTenantPage';
import ResetPasswordForm from './components/auth/ResetPasswordForm';
import NotificationBell from './components/notifications/NotificationBell';
import NotificationPanel from './components/notifications/NotificationPanel';
import AdminConsole from './components/admin/AdminConsole';

type View = 'landing' | 'login' | 'register' | 'select' | 'create' | 'manage' | 'profile' | 'explore' | 'messages' | 'account' | 'forgot' | 'publicTenant' | 'resetPassword' | 'adminConsole';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null); // For impersonation
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedPublicTenantId, setSelectedPublicTenantId] = useState<string | null>(null);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [view, setView] = useState<View>('landing');
  const [previousView, setPreviousView] = useState<View>('landing');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  const handleRefresh = async () => {
    // This forces re-renders and re-fetches from our persisted store
    setRefreshKey(k => k + 1);
    const tenants = await getTenants();
    setTenants(tenants);
  };

  useEffect(() => {
    const loadData = async () => {
        const tenants = await getTenants();
        setTenants(tenants);
        if (user) {
            const notifications = await getNotificationsForUser(user.id);
            setNotifications(notifications as any);
        } else {
            setNotifications([]);
        }
    }
    loadData();
  }, [refreshKey, user]);

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    handleRefresh();
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.id);
    handleRefresh();
  };
  
  const handleNotificationNavigate = (link?: string) => {
    setIsNotificationPanelOpen(false);
    if (!link) return;
    if (link === 'messages') {
        handleViewMessages();
    } else if (link.startsWith('tenant/')) {
        const tenantId = link.split('/')[1];
        handleSelectTenant(tenantId);
    }
  };
  
  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    const foundUser = await getUserByEmail(email);

    if (foundUser) {
      // Mock password check:
      if (foundUser.password && pass === foundUser.password) {
        setUser(foundUser as any);
        setView('select');
        return true;
      }
      return false;
    }
    
    return false;
  };
  
  const handleRegister = async (displayName: string, email: string, pass: string): Promise<{ success: boolean, message?: string }> => {
    const result = await registerUser(displayName, email, pass);
    if (result.success && result.user) {
      setUser(result.user as any);
      setView('select');
      await handleRefresh();
    }
    return result;
  };

  const handleForgotPassword = async (email: string): Promise<boolean> => {
    return await requestPasswordReset(email);
  };
  
  const handleNavigateToResetPassword = (email: string) => {
    setResetEmail(email);
    setView('resetPassword');
  };

  const handleResetPassword = async (email: string, newPass: string): Promise<{ success: boolean, message?: string }> => {
    const result = await resetPassword(email, newPass);
    if(result.success) {
        await handleRefresh();
    }
    return result;
  };

  const handleImpersonate = (impersonatedUser: User) => {
    if (user?.isSuperAdmin) {
      logAuditEvent({
        actorUserId: user.id,
        effectiveUserId: impersonatedUser.id,
        actionType: 'IMPERSONATE_START',
        entityType: 'USER',
        entityId: impersonatedUser.id,
      });
      setOriginalUser(user);
      setUser(impersonatedUser);
    }
  };

  const handleExitImpersonation = () => {
    if (originalUser && user) {
       logAuditEvent({
        actorUserId: originalUser.id,
        effectiveUserId: user.id,
        actionType: 'IMPERSONATE_END',
        entityType: 'USER',
        entityId: user.id,
      });
      setUser(originalUser);
      setOriginalUser(null);
    }
  };
  
  const handleSelectTenant = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setSelectedTenant(tenant);
      setView('manage');
    }
  };

  const handleTenantCreate = async (tenantDetails: Omit<any, 'id' | 'slug' | 'settings' | 'branding' | 'permissions'>) => {
    if(!user) return;
    const newTenant = await createTenant(tenantDetails, user.id);
    setSelectedTenant(newTenant as any);
    setView('manage');
    await handleRefresh();
  };

  const handleTenantUpdate = async (updatedTenant: any) => {
    await updateTenant(updatedTenant);
    setSelectedTenant(updatedTenant);
    await handleRefresh();
  };
  
  const handleBackToSelect = () => {
    setSelectedTenant(null);
    setView('select');
  };
  
  const handleLogout = () => {
    setUser(null);
    setOriginalUser(null);
    setSelectedTenant(null);
    setView('landing');
  }

  const handleViewProfile = (userId: string) => {
    setSelectedProfileUserId(userId);
    setPreviousView(view);
    setView('profile');
  };
  
  const handleViewMessages = (conversationId?: string) => {
    setPreviousView(view);
    if (conversationId) {
      setActiveConversationId(conversationId);
    } else {
      setActiveConversationId(null);
    }
    setView('messages');
  };

  const handleViewAccountSettings = () => {
    setPreviousView(view);
    setView('account');
  };
  
  const handleViewAdminConsole = () => {
    setPreviousView(view);
    setView('adminConsole');
  };

  const handleBackFromProfile = () => {
    setSelectedProfileUserId(null);
    setView(previousView);
  };
  
  const handleSendMessage = async (recipientUserId: string) => {
    if (!currentUser) return;
    const conversation = await getOrCreateDirectConversation(currentUser.id, recipientUserId);
    handleViewMessages(conversation.id);
  };
  
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setView('explore');
  };

  const handleViewPublicTenant = (tenantId: string) => {
    setSelectedPublicTenantId(tenantId);
    setPreviousView(view);
    setView('publicTenant');
  };

  const handleBackToExplore = () => {
      setSelectedPublicTenantId(null);
      setView('explore');
  };

  const handlePublicTenantJoinRequest = async (tenantId: string) => {
    if (!currentUser) {
      setView('login');
      return;
    }
    await requestToJoinTenant(currentUser.id, tenantId);
    await handleRefresh(); // Force re-render to update join button state
  };

  const currentUser = user; // To avoid confusion, especially when impersonating
  const isFullScreenView = ['manage', 'profile', 'messages', 'account', 'publicTenant', 'adminConsole'].includes(view);
  const showHeader = !isFullScreenView && view !== 'landing' && view !== 'explore';
  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  const renderContent = () => {
    switch (view) {
      case 'landing':
        return <LandingPage onNavigateToLogin={() => setView('login')} onSearch={handleSearch} />;
      case 'explore':
        return <ExplorePage 
                  initialSearchTerm={searchTerm} 
                  tenants={tenants.filter(t => t.settings.isPublic)} 
                  onBack={() => setView('landing')}
                  onViewTenant={handleViewPublicTenant}
                />;
      case 'publicTenant': {
        if (!selectedPublicTenantId) return null;
        const tenant = tenants.find(t => t.id === selectedPublicTenantId);
        if (!tenant) {
          return <div>Tenant not found. <Button onClick={handleBackToExplore}>Back to Explore</Button></div>;
        }
        return (
          <PublicTenantPage
            key={`${tenant.id}-${refreshKey}`}
            tenant={tenant}
            currentUser={user}
            onBack={handleBackToExplore}
            onJoin={handlePublicTenantJoinRequest}
            onNavigateToLogin={() => setView('login')}
            onGoToDashboard={() => handleSelectTenant(tenant.id)}
            onRefresh={handleRefresh}
          />
        );
      }
      case 'login':
        return <LoginForm onLogin={handleLogin} onNavigateToRegister={() => setView('register')} onNavigateToForgotPassword={() => setView('forgot')} />;
      case 'register':
        return <RegisterForm onRegister={handleRegister} onNavigateToLogin={() => setView('login')} />;
      case 'forgot':
        return <ForgotPasswordForm onSubmit={handleForgotPassword} onNavigateToLogin={() => setView('login')} onNavigateToResetPassword={handleNavigateToResetPassword} />;
      case 'resetPassword': {
        if (!resetEmail) {
            setView('forgot');
            return null;
        }
        return <ResetPasswordForm email={resetEmail} onReset={handleResetPassword} onNavigateToLogin={() => { setResetEmail(null); setView('login'); }} />;
      }
      case 'select':
        return <TenantSelector tenants={tenants} onSelect={handleSelectTenant} onCreateNew={() => setView('create')} />;
      case 'create':
        return <CreateTenantForm onCreate={handleTenantCreate} onCancel={() => setView('select')} />;
      case 'manage':
        if (!selectedTenant || !currentUser) return null;
        return (
          <TenantLayout 
            key={`${selectedTenant.id}-${refreshKey}`}
            tenant={selectedTenant} 
            user={currentUser}
            onUpdateTenant={handleTenantUpdate} 
            onBackToSelect={handleBackToSelect}
            onLogout={handleLogout}
            onImpersonate={handleImpersonate}
            onViewProfile={handleViewProfile}
            onNavigateToMessages={() => handleViewMessages()}
            onViewAccountSettings={handleViewAccountSettings}
            onNavigateToAdminConsole={handleViewAdminConsole}
            onRefresh={handleRefresh}
          />
        );
      case 'profile': {
        if (!selectedProfileUserId || !currentUser) return null;
        
        const [profileUser, affiliatedTenants] = [
             getUserById(selectedProfileUserId),
             getTenantsForUser(selectedProfileUserId)
        ];

        if (!profileUser) {
          return <div>User not found. <Button onClick={handleBackFromProfile}>Back</Button></div>;
        }
        
        return (
          <ProfilePage 
            profileUser={profileUser as any} 
            affiliatedTenants={affiliatedTenants as any} 
            onBack={handleBackFromProfile}
            currentUser={currentUser}
            onImpersonate={handleImpersonate}
            onSendMessage={handleSendMessage}
          />
        );
      }
      case 'messages':
        if (!currentUser) return <LoginForm onLogin={handleLogin} onNavigateToRegister={() => setView('register')} onNavigateToForgotPassword={() => setView('forgot')} />;
        return <MessagesPage currentUser={currentUser} onBack={() => setView(previousView)} onViewProfile={handleViewProfile} initialActiveConversationId={activeConversationId} />;
      case 'account':
        if (!currentUser) return <LoginForm onLogin={handleLogin} onNavigateToRegister={() => setView('register')} onNavigateToForgotPassword={() => setView('forgot')} />;
        return <AccountSettingsPage user={currentUser} onBack={() => setView(previousView)} onRefresh={handleRefresh} />;
      case 'adminConsole':
        if (!currentUser?.isSuperAdmin) {
            setView('select');
            return null;
        }
        return <AdminConsole onBack={() => setView(previousView)} />;
      default:
        return <LandingPage onNavigateToLogin={() => setView('login')} onSearch={handleSearch} />;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-800 ${originalUser ? 'pt-12' : ''}`}>
      {originalUser && currentUser && (
        <ImpersonationBanner
          originalUser={originalUser}
          impersonatedUser={currentUser}
          onExit={handleExitImpersonation}
        />
      )}
      {showHeader && (
         <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center space-x-3">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" viewBox="http://www.w3.org/2000/svg" fill="currentColor">
                  <path d="M12 2L1 9l4 2.18v6.32L12 22l7-4.5V11.18L23 9l-3-1.68V5h-2v1.32L12 2zm0 16.5l-5-3.25V11.4l5 2.75v5.6zM12 12L7 9.25 12 6.5 17 9.25 12 12z"/>
               </svg>
              <h1 className="text-2xl font-bold text-gray-800">Temple</h1>
            </div>
             {currentUser && (
              <div className="flex items-center space-x-4">
                <div className="relative">
                    <NotificationBell
                        unreadCount={unreadNotificationCount}
                        onClick={() => setIsNotificationPanelOpen(prev => !prev)}
                    />
                    {isNotificationPanelOpen && (
                        <NotificationPanel
                            notifications={notifications}
                            onClose={() => setIsNotificationPanelOpen(false)}
                            onMarkAsRead={handleMarkNotificationAsRead}
                            onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                            onNavigate={handleNotificationNavigate}
                        />
                    )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {currentUser.isSuperAdmin ? 'Super Admin' : 'Logged in as'}
                  </p>
                  <p className="font-semibold text-amber-700">{currentUser.profile.displayName}</p>
                </div>
                 <Button variant="secondary" onClick={() => handleViewMessages()}>Messages</Button>
                 <Button variant="secondary" onClick={handleViewAccountSettings}>Account</Button>
                 {currentUser.isSuperAdmin && (
                    <Button variant="danger" size="md" onClick={handleViewAdminConsole}>Admin Console</Button>
                 )}
                 <Button variant="secondary" onClick={handleLogout}>Logout</Button>
              </div>
             )}
          </div>
        </header>
      )}
      <main className={!showHeader && !isFullScreenView ? "" : "py-10"}>
        <div className={!isFullScreenView ? "max-w-7xl mx-auto sm:px-6 lg:px-8" : ""}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
