'use client';

import React, { useState, useEffect } from 'react';
import { GitBranch, ExternalLink, Sparkles, Calendar, Tag, X, AlertCircle } from 'lucide-react';
import { useMood } from '@/contexts/MoodContext';

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  prerelease: boolean;
}

export const PatchNotesCard = () => {
  const { currentMood, getMoodClasses } = useMood();
  const [latestRelease, setLatestRelease] = useState<GitHubRelease | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moodClasses = getMoodClasses();

  // Mock release data for testing while we debug the API
  const mockRelease: GitHubRelease = {
    tag_name: "v3.1.0",
    name: "v3.1.0 - Patch Notes Integration & Complete Mood Theme Enhancement ✨",
    body: `# 🎉 Version 3.1.0 - Dynamic Updates & Enhanced Experience

## ✨ Major New Features

### 🔔 Dynamic Patch Notes System
- **Real-time release notifications** directly on the dashboard
- **Smart dismissal system** that remembers user preferences
- **Expandable release notes** with formatted markdown support

### 🎨 Complete Mood Theme Integration
- **Universal theming** now applied across ALL pages
- **7 stunning mood themes**: Cozy Library, Midnight Study, Morning Glow, Forest Retreat, Electric Dreams, Romance Novel, Mystical Realm
- **Dynamic styling** for backgrounds, cards, buttons, and text

## 🚀 Enhancements
- **Enhanced welcome section** with mood-aware styling
- **Improved stat cards** with gradient text and hover animations
- **Seamless theme switching** with persistent preferences`,
    published_at: new Date().toISOString(),
    html_url: "https://github.com/thelittlelibraryapp/little-library/releases/latest",
    prerelease: false
  };

  useEffect(() => {
    checkIfDismissed();
    fetchLatestRelease();
  }, []);

  const checkIfDismissed = () => {
    const dismissed = localStorage.getItem('patchNotesDismissed');
    const dismissedVersion = localStorage.getItem('patchNotesDismissedVersion');
    
    if (dismissed === 'true' && dismissedVersion) {
      setIsDismissed(true);
    }
  };

  const fetchLatestRelease = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to fetch from GitHub API
      const response = await fetch('https://api.github.com/repos/thelittlelibraryapp/little-library/releases/latest');
      
      if (response.ok) {
        const release: GitHubRelease = await response.json();
        setLatestRelease(release);
        
        // Check if this version was already dismissed
        const dismissedVersion = localStorage.getItem('patchNotesDismissedVersion');
        if (dismissedVersion !== release.tag_name) {
          setIsDismissed(false);
          localStorage.removeItem('patchNotesDismissed');
        }
      } else if (response.status === 404) {
        // 404 means no releases found, use mock data for now
        console.log('📝 No GitHub releases found, using mock data');
        setLatestRelease(mockRelease);
        
        // Check if mock version was dismissed
        const dismissedVersion = localStorage.getItem('patchNotesDismissedVersion');
        if (dismissedVersion !== mockRelease.tag_name) {
          setIsDismissed(false);
          localStorage.removeItem('patchNotesDismissed');
        }
      } else {
        throw new Error(`GitHub API returned ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch latest release:', error);
      // Fallback to mock data on any error
      setLatestRelease(mockRelease);
      setIsDismissed(false);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissPatchNotes = () => {
    setIsDismissed(true);
    localStorage.setItem('patchNotesDismissed', 'true');
    if (latestRelease) {
      localStorage.setItem('patchNotesDismissedVersion', latestRelease.tag_name);
    }
  };

  const formatReleaseDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatReleaseNotes = (body: string) => {
    // Simple formatting for GitHub markdown-style release notes
    return body
      .replace(/^###? (.+)$/gm, '<h3 class="font-semibold text-sm mt-3 mb-1 text-gray-800">$1</h3>')
      .replace(/^- (.+)$/gm, '<li class="text-sm opacity-80 ml-4 list-disc">$1</li>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs font-mono">$1</code>')
      .replace(/\n\n/g, '<br><br>');
  };

  // Don't render if loading or dismissed
  if (isLoading) {
    return null; // Silent loading
  }

  if (isDismissed || !latestRelease) {
    return null;
  }

  return (
    <div className={`relative p-6 rounded-2xl shadow-xl border-l-4 border-l-${moodClasses.accentColor}-500 ${moodClasses.cardStyle} transition-all duration-300 hover:shadow-2xl`}>
      {/* Dismiss button */}
      <button
        onClick={dismissPatchNotes}
        className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Dismiss patch notes"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className={`w-10 h-10 ${moodClasses.buttonStyle} rounded-xl flex items-center justify-center`}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${moodClasses.textStyle}`}>
            🎉 What's New
          </h3>
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center space-x-1">
              <Tag className={`w-3 h-3 text-${moodClasses.accentColor}-600`} />
              <span className={`${moodClasses.textStyle} opacity-70 font-medium`}>
                {latestRelease.tag_name}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className={`w-3 h-3 text-${moodClasses.accentColor}-600`} />
              <span className={`${moodClasses.textStyle} opacity-70`}>
                {formatReleaseDate(latestRelease.published_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Release name */}
      <h4 className={`font-medium ${moodClasses.textStyle} mb-3`}>
        {latestRelease.name}
      </h4>

      {/* Release notes preview/full */}
      <div className={`${moodClasses.textStyle} opacity-80`}>
        {isExpanded ? (
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: formatReleaseNotes(latestRelease.body) 
            }}
          />
        ) : (
          <p className="text-sm">
            {latestRelease.body.split('\n')[0].substring(0, 120)}
            {latestRelease.body.length > 120 ? '...' : ''}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`text-sm font-medium text-${moodClasses.accentColor}-600 hover:text-${moodClasses.accentColor}-700 transition-colors`}
        >
          {isExpanded ? 'Show Less' : 'Read More'}
        </button>
        
        <a
          href={latestRelease.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center space-x-1 text-sm font-medium text-${moodClasses.accentColor}-600 hover:text-${moodClasses.accentColor}-700 transition-colors`}
        >
          <GitBranch className="w-3 h-3" />
          <span>View on GitHub</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Beta/prerelease indicator */}
      {latestRelease.prerelease && (
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Beta
          </span>
        </div>
      )}
    </div>
  );
};