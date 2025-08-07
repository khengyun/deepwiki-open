'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { FaTimes, FaTh, FaList } from 'react-icons/fa';

interface ProcessedProject {
  id: string;
  owner: string;
  repo: string;
  ref: string | null;
  name: string;
  repo_type: string;
  submittedAt: number;
  language: string;
}

interface RepoGroup {
  owner: string;
  repo: string;
  name: string;
  repo_type: string;
  refs: ProcessedProject[];
}

interface ProcessedProjectsProps {
  showHeader?: boolean;
  maxItems?: number;
  className?: string;
  messages?: Record<string, Record<string, string>>;
}

export default function ProcessedProjects({
  showHeader = true,
  maxItems,
  className = "",
  messages
}: ProcessedProjectsProps) {
  const [projectMap, setProjectMap] = useState<Record<string, RepoGroup>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selectedRefs, setSelectedRefs] = useState<Record<string, string>>({});

  const defaultMessages = {
    title: 'Processed Wiki Projects',
    searchPlaceholder: 'Search projects by name, owner, or repository...',
    noProjects: 'No projects found in the server cache. The cache might be empty or the server encountered an issue.',
    noSearchResults: 'No projects match your search criteria.',
    processedOn: 'Processed on:',
    loadingProjects: 'Loading projects...',
    errorLoading: 'Error loading projects:',
    backToHome: 'Back to Home'
  };

  const t = (key: string) => {
    if (messages?.projects?.[key]) {
      return messages.projects[key];
    }
    return defaultMessages[key as keyof typeof defaultMessages] || key;
  };

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/wiki/projects');
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      const grouped = (data as ProcessedProject[]).reduce(
        (acc, project) => {
          const key = `${project.owner}/${project.repo}`;
          if (!acc[key]) {
            acc[key] = {
              owner: project.owner,
              repo: project.repo,
              name: project.name,
              repo_type: project.repo_type,
              refs: [],
            };
          }
          acc[key].refs.push(project);
          return acc;
        },
        {} as Record<string, RepoGroup>
      );
      setProjectMap(grouped);
      setSelectedRefs(() => {
        const defaults: Record<string, string> = {};
        for (const key in grouped) {
          defaults[key] = grouped[key].refs[0]?.ref || '';
        }
        return defaults;
      });
    } catch (e: unknown) {
      console.error("Failed to load projects from API:", e);
      const message = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(message);
      setProjectMap({});
      setSelectedRefs({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredRepos = useMemo(() => {
    let repos = Object.values(projectMap);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      repos = repos.filter((repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.owner.toLowerCase().includes(query) ||
        repo.repo.toLowerCase().includes(query) ||
        repo.repo_type.toLowerCase().includes(query)
      );
    }
    return maxItems ? repos.slice(0, maxItems) : repos;
  }, [projectMap, searchQuery, maxItems]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleDelete = async (projectId: string) => {
    let project: ProcessedProject | undefined;
    for (const group of Object.values(projectMap)) {
      const found = group.refs.find((r) => r.id === projectId);
      if (found) {
        project = found;
        break;
      }
    }
    if (!project) {
      console.error(`Project with id ${projectId} not found`);
      alert('Project not found.');
      return;
    }
    const { owner, repo, repo_type, language, ref, name } = project;
    if (!owner || !repo || !repo_type || !language) {
      const message = 'Missing required project data for deletion.';
      console.error(message, { owner, repo, repo_type, language });
      alert(message);
      return;
    }
    if (!confirm(`Are you sure you want to delete project ${name}${ref ? ` (${ref})` : ''}?`)) {
      return;
    }
    try {
      const response = await fetch('/api/wiki/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          repo_type,
          language,
          ref,
        }),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorBody.error || response.statusText);
      }
      await fetchProjects();
    } catch (e: unknown) {
      console.error('Failed to delete project:', e);
      alert(`Failed to delete project: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  return (
    <div className={`${className}`}>
      {showHeader && (
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-[var(--accent-primary)]">{t('title')}</h1>
            <Link href="/" className="text-[var(--accent-primary)] hover:underline">
              {t('backToHome')}
            </Link>
          </div>
        </header>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="input-japanese block w-full pl-4 pr-12 py-2.5 border border-[var(--border-color)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center bg-[var(--background)] border border-[var(--border-color)] rounded-lg p-1">
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'card'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]'
            }`}
            title="Card View"
          >
            <FaTh className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]'
            }`}
            title="List View"
          >
            <FaList className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading && <p className="text-[var(--muted)]">{t('loadingProjects')}</p>}
      {error && <p className="text-[var(--highlight)]">{t('errorLoading')} {error}</p>}

      {!isLoading && !error && filteredRepos.length > 0 && (
        <div className={viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
          {filteredRepos.map((repo) => {
            const key = `${repo.owner}/${repo.repo}`;
            const selectedRef = selectedRefs[key] || repo.refs[0]?.ref || '';
            const selectedProject = repo.refs.find(r => r.ref === selectedRef) || repo.refs[0];
            if (!selectedProject) return null;
            return viewMode === 'card' ? (
              <div key={key} className="relative p-4 border border-[var(--border-color)] rounded-lg bg-[var(--card-bg)] shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedProject.id)}
                  className="absolute top-2 right-2 text-[var(--muted)] hover:text-[var(--foreground)]"
                  title="Delete project"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
                <div className="mb-2">
                  <select
                    value={selectedRef}
                    onChange={(e) => setSelectedRefs(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] rounded px-2 py-1 text-sm"
                  >
                    {repo.refs.map(r => (
                      <option key={r.ref ?? 'default'} value={r.ref ?? ''}>{r.ref ?? 'default'}</option>
                    ))}
                  </select>
                </div>
                <Link
                  href={`/${repo.owner}/${repo.repo}?type=${selectedProject.repo_type}&language=${selectedProject.language}&ref=${selectedProject.ref ?? ''}`}
                  className="block"
                >
                  <h3 className="text-lg font-semibold text-[var(--link-color)] hover:underline mb-2 line-clamp-2">
                    {repo.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 text-xs bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-full border border-[var(--accent-primary)]/20">
                      {selectedProject.repo_type}
                    </span>
                    <span className="px-2 py-1 text-xs bg-[var(--background)] text-[var(--muted)] rounded-full border border-[var(--border-color)]">
                      {selectedProject.language}
                    </span>
                    <span className="px-2 py-1 text-xs bg-[var(--background)] text-[var(--muted)] rounded-full border border-[var(--border-color)]">
                      Ref: {selectedProject.ref ?? 'default'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {t('processedOn')} {new Date(selectedProject.submittedAt).toLocaleDateString()}
                  </p>
                </Link>
              </div>
            ) : (
              <div key={key} className="relative p-3 border border-[var(--border-color)] rounded-lg bg-[var(--card-bg)] hover:bg-[var(--background)] transition-colors">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedProject.id)}
                  className="absolute top-2 right-2 text-[var(--muted)] hover:text-[var(--foreground)]"
                  title="Delete project"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
                <div className="mb-2">
                  <select
                    value={selectedRef}
                    onChange={(e) => setSelectedRefs(prev => ({ ...prev, [key]: e.target.value }))}
                    className="border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)] rounded px-2 py-1 text-sm"
                  >
                    {repo.refs.map(r => (
                      <option key={r.ref ?? 'default'} value={r.ref ?? ''}>{r.ref ?? 'default'}</option>
                    ))}
                  </select>
                </div>
                <Link
                  href={`/${repo.owner}/${repo.repo}?type=${selectedProject.repo_type}&language=${selectedProject.language}&ref=${selectedProject.ref ?? ''}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-[var(--link-color)] hover:underline truncate">
                      {repo.name}
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {t('processedOn')} {new Date(selectedProject.submittedAt).toLocaleDateString()} • {selectedProject.repo_type} • {selectedProject.language}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <span className="px-2 py-1 text-xs bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded border border-[var(--accent-primary)]/20">
                      {selectedProject.repo_type}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !error && Object.keys(projectMap).length > 0 && filteredRepos.length === 0 && searchQuery && (
        <p className="text-[var(--muted)]">{t('noSearchResults')}</p>
      )}

      {!isLoading && !error && Object.keys(projectMap).length === 0 && (
        <p className="text-[var(--muted)]">{t('noProjects')}</p>
      )}
    </div>
  );
}
