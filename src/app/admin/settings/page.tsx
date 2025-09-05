/**
 * Settings Page
 * Site configuration and module management
 */

"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import AdminLayout from "../../../components/admin/AdminLayout";
import { canAccessAdmin } from "../../../lib/auth/adminAccess";
import { useAuth } from "../../../lib/auth/session";

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  adminEmail: string;
  theme: string;
  postsPerPage: number;
  allowRegistration: boolean;
  defaultRole: string;
  timezone: string;
  language: string;
}

interface Module {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  version?: string;
}

const SettingsPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'modules' | 'security'>('general');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (user && !canAccessAdmin(user)) {
      router.push('/');
      return;
    }

    if (user) {
      fetchSettings();
      fetchModules();
    }
  }, [user, loading, router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const payload = await response.json();
        // ok() helper wraps in { data: { settings }, meta, error }
        const s = payload?.data?.settings || payload?.settings || null;
        if (s) {
          // Map internal names to UI SiteSettings interface if necessary
          setSettings({
            siteName: s.title || s.siteName || 'NeoChyrp',
            siteDescription: s.tagline || s.siteDescription || s.description || '',
            siteUrl: s.url || s.siteUrl || 'http://localhost:3000',
            adminEmail: s.contact || s.adminEmail || '',
            theme: s.theme || 'light',
            postsPerPage: Number(s.postsPerPage) || 10,
            allowRegistration: s.allowRegistration ?? true,
            defaultRole: s.defaultRole || 'USER',
            timezone: s.timezone || 'UTC',
            language: s.language || 'en'
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/modules');
      if (response.ok) {
        const data = await response.json();
        setModules(data.modules || []);
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: settings.siteName,
          tagline: settings.siteDescription,
          url: settings.siteUrl,
          contact: settings.adminEmail,
          theme: settings.theme,
          postsPerPage: settings.postsPerPage,
          allowRegistration: settings.allowRegistration,
          defaultRole: settings.defaultRole,
          timezone: settings.timezone,
          language: settings.language
        }),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleModule = async (moduleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/modules/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        setModules(modules.map(module =>
          module.id === moduleId ? { ...module, enabled } : module
        ));
      } else {
        alert('Failed to update module');
      }
    } catch (error) {
      console.error('Failed to update module:', error);
      alert('Failed to update module');
    }
  };

  if (loading || !settings) {
    return null;
  }

  return (
    <AdminLayout title="Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'general', name: 'General' },
              { id: 'modules', name: 'Modules' },
              { id: 'security', name: 'Security' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">General Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site URL
                  </label>
                  <input
                    type="url"
                    value={settings.siteUrl}
                    onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Description
                  </label>
                  <textarea
                    rows={3}
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posts Per Page
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.postsPerPage}
                    onChange={(e) => setSettings({ ...settings, postsPerPage: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Berlin">Berlin</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Module Management</h3>
              <p className="text-sm text-gray-600">
                Enable or disable modules to extend your site's functionality.
              </p>

              <div className="space-y-4">
                {modules.map((module) => (
                  <div key={module.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{module.name}</h4>
                      <p className="text-sm text-gray-500">{module.description}</p>
                      {module.version && (
                        <p className="text-xs text-gray-400">Version {module.version}</p>
                      )}
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={module.enabled}
                        onChange={(e) => handleToggleModule(module.id, e.target.checked)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {module.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Allow Registration</h4>
                    <p className="text-sm text-gray-500">Allow new users to register accounts</p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.allowRegistration}
                      onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {settings.allowRegistration ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default User Role
                  </label>
                  <select
                    value={settings.defaultRole}
                    onChange={(e) => setSettings({ ...settings, defaultRole: e.target.value })}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USER">User</option>
                    <option value="AUTHOR">Author</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    The role assigned to new users when they register
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
