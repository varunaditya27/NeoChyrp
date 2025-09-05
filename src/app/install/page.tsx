/**
 * Installation Page
 * Handles initial setup of NeoChyrp following Chyrp-Lite architecture
 */

"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface InstallStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

interface InstallData {
  siteTitle: string;
  siteDescription: string;
  adminUsername: string;
  adminPassword: string;
  adminEmail: string;
  adminDisplayName: string;
  selectedModules: string[];
  selectedTheme: string;
}

const InstallPage: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installData, setInstallData] = useState<InstallData>({
    siteTitle: "My NeoChyrp Blog",
    siteDescription: "A modern, flexible blogging platform",
    adminUsername: "CloneFest2025",
    adminPassword: "CloneFest2025",
    adminEmail: "admin@example.com",
    adminDisplayName: "Administrator",
    selectedModules: ["webmentions", "comments", "likes", "views"],
    selectedTheme: "sparrow"
  });

  const steps: InstallStep[] = [
    {
      id: 1,
      title: "Welcome",
      description: "Welcome to NeoChyrp installation",
      completed: false
    },
    {
      id: 2,
      title: "Site Settings",
      description: "Configure your site details",
      completed: false
    },
    {
      id: 3,
      title: "Admin Account",
      description: "Create your administrator account",
      completed: false
    },
    {
      id: 4,
      title: "Modules & Theme",
      description: "Choose features and appearance",
      completed: false
    },
    {
      id: 5,
      title: "Complete",
      description: "Finalize installation",
      completed: false
    }
  ];

  const availableModules = [
    { id: "webmentions", name: "WebMentions", description: "Receive and send webmentions" },
    { id: "comments", name: "Comments", description: "Allow visitors to comment on posts" },
    { id: "likes", name: "Likes", description: "Let users like posts" },
    { id: "views", name: "Post Views", description: "Track post view statistics" },
    { id: "sitemap", name: "Sitemap", description: "Generate XML sitemaps" },
    { id: "rights", name: "Rights & Licensing", description: "Manage copyright and licensing" },
    { id: "pingable", name: "Pingable", description: "Automatic ping notifications" }
  ];

  const availableThemes = [
    { id: "sparrow", name: "Sparrow", description: "Clean and minimal design" },
    { id: "blossom", name: "Blossom", description: "Elegant and colorful" },
    { id: "topaz", name: "Topaz", description: "Modern and sophisticated" },
    { id: "umbra", name: "Umbra", description: "Dark and mysterious" }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInstall = async () => {
    setIsInstalling(true);

    try {
      // Step 1: Configure site settings
      const settingsResponse = await fetch("/api/install/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: installData.siteTitle,
          description: installData.siteDescription,
          theme: installData.selectedTheme
        })
      });

      if (!settingsResponse.ok) {
        throw new Error("Failed to configure site settings");
      }

      // Step 2: Create admin user
      const userResponse = await fetch("/api/install/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: installData.adminUsername,
          password: installData.adminPassword,
          email: installData.adminEmail,
          displayName: installData.adminDisplayName
        })
      });

      if (!userResponse.ok) {
        throw new Error("Failed to create admin user");
      }

      // Step 3: Install selected modules
      const modulesResponse = await fetch("/api/install/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modules: installData.selectedModules
        })
      });

      if (!modulesResponse.ok) {
        throw new Error("Failed to install modules");
      }

      // Step 4: Complete installation
      const completeResponse = await fetch("/api/install/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!completeResponse.ok) {
        throw new Error("Failed to complete installation");
      }

      // Redirect to admin panel
      router.push("/admin");

    } catch (error) {
      console.error("Installation failed:", error);
      alert("Installation failed. Please try again.");
    } finally {
      setIsInstalling(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center">
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-blue-100">
              <svg className="size-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Welcome to NeoChyrp</h2>
            <p className="mb-6 text-gray-600">
              NeoChyrp is a modern, flexible blogging platform inspired by Chyrp-Lite.
              This installer will guide you through the setup process.
            </p>
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-900">What you'll get:</h3>
              <ul className="text-left text-sm text-blue-700">
                <li>• Flexible content types (Feathers)</li>
                <li>• Modular architecture with extensible modules</li>
                <li>• Modern admin dashboard</li>
                <li>• Beautiful, responsive themes</li>
                <li>• Built-in SEO and performance optimization</li>
              </ul>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Site Configuration</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="siteTitle" className="block text-sm font-medium text-gray-700">
                  Site Title
                </label>
                <input
                  type="text"
                  id="siteTitle"
                  value={installData.siteTitle}
                  onChange={(e) => setInstallData({...installData, siteTitle: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700">
                  Site Description
                </label>
                <textarea
                  id="siteDescription"
                  rows={3}
                  value={installData.siteDescription}
                  onChange={(e) => setInstallData({...installData, siteDescription: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Administrator Account</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="adminUsername" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  id="adminUsername"
                  value={installData.adminUsername}
                  onChange={(e) => setInstallData({...installData, adminUsername: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  value={installData.adminPassword}
                  onChange={(e) => setInstallData({...installData, adminPassword: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="adminEmail"
                  value={installData.adminEmail}
                  onChange={(e) => setInstallData({...installData, adminEmail: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="adminDisplayName" className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <input
                  type="text"
                  id="adminDisplayName"
                  value={installData.adminDisplayName}
                  onChange={(e) => setInstallData({...installData, adminDisplayName: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Modules & Theme</h2>

            <div className="mb-8">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Select Modules</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {availableModules.map((module) => (
                  <label key={module.id} className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={installData.selectedModules.includes(module.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setInstallData({
                            ...installData,
                            selectedModules: [...installData.selectedModules, module.id]
                          });
                        } else {
                          setInstallData({
                            ...installData,
                            selectedModules: installData.selectedModules.filter(m => m !== module.id)
                          });
                        }
                      }}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{module.name}</div>
                      <div className="text-sm text-gray-500">{module.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Select Theme</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {availableThemes.map((theme) => (
                  <label key={theme.id} className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-gray-50">
                    <input
                      type="radio"
                      name="theme"
                      value={theme.id}
                      checked={installData.selectedTheme === theme.id}
                      onChange={(e) => setInstallData({...installData, selectedTheme: e.target.value})}
                      className="mt-1 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{theme.name}</div>
                      <div className="text-sm text-gray-500">{theme.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center">
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-green-100">
              <svg className="size-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Ready to Install</h2>
            <p className="mb-6 text-gray-600">
              NeoChyrp is ready to be installed with your chosen configuration.
            </p>
            <div className="rounded-lg bg-gray-50 p-4 text-left">
              <h3 className="mb-2 font-semibold text-gray-900">Installation Summary:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li><strong>Site:</strong> {installData.siteTitle}</li>
                <li><strong>Admin:</strong> {installData.adminUsername}</li>
                <li><strong>Modules:</strong> {installData.selectedModules.join(", ")}</li>
                <li><strong>Theme:</strong> {installData.selectedTheme}</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">NeoChyrp Installation</h1>
          <p className="mt-2 text-gray-600">Set up your modern blogging platform</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-center space-x-8">
              {steps.map((step) => (
                <li key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center rounded-full text-sm font-medium size-8 ${
                    step.id === currentStep
                      ? "bg-blue-600 text-white"
                      : step.id < currentStep
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}>
                    {step.id < currentStep ? (
                      <svg className="size-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className={`ml-2 hidden text-sm font-medium sm:block ${
                    step.id === currentStep ? "text-blue-600" : "text-gray-500"
                  }`}>
                    {step.title}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-white p-8 shadow">
            {renderStep()}

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>

              {currentStep < steps.length ? (
                <button
                  onClick={handleNext}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isInstalling ? "Installing..." : "Install NeoChyrp"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPage;
