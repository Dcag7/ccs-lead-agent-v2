'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  name: string;
  icon: React.ReactNode;
  items: NavItem[];
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Leads',
    href: '/dashboard/leads',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    name: 'Companies',
    href: '/dashboard/companies',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    name: 'Contacts',
    href: '/dashboard/contacts',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    name: 'Imports',
    href: '/dashboard/imports',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
];

// Discovery section with sub-items
const discoverySection: NavSection = {
  name: 'Discovery',
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  items: [
    {
      name: 'Manual Discovery',
      href: '/dashboard/discovery',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
    },
    {
      name: 'Automated Discovery',
      href: '/dashboard/discovery-runs',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Archived Runs',
      href: '/dashboard/discovery/archived',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
    },
  ],
};

// CCS Brand Icon SVG Component
function BrandIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 200 200" 
      width={size} 
      height={size}
      className={className}
      fill="currentColor"
    >
      <g transform="translate(100, 100)">
        {/* Center star */}
        <path d="M 0,-15 L 4,-4 L 15,-4 L 6,3 L 10,14 L 0,7 L -10,14 L -6,3 L -15,-4 L -4,-4 Z"/>
        
        {/* Six petals arranged in a circle */}
        {[0, 60, 120, 180, 240, 300].map((rotation) => (
          <g key={rotation} transform={`rotate(${rotation})`}>
            <circle cx="0" cy="-45" r="20"/>
            <path d="M -12,-45 Q 0,-35 12,-45 Q 0,-55 -12,-45 Z"/>
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function Sidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const [discoveryExpanded, setDiscoveryExpanded] = useState(
    pathname?.startsWith('/dashboard/discovery') || false
  );

  const isDiscoveryActive = pathname?.startsWith('/dashboard/discovery');

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col">
      {/* Logo Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
            <BrandIcon size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight tracking-tight">
              CCS Lead Agent
            </h1>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
              Business Development
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Regular nav items */}
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                }
              `}
            >
              <span className={isActive ? 'opacity-100' : 'opacity-70'}>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Discovery Section (collapsible) */}
        <div className="pt-2">
          <button
            onClick={() => setDiscoveryExpanded(!discoveryExpanded)}
            className={`
              w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${
                isDiscoveryActive && !discoveryExpanded
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <span className={isDiscoveryActive && !discoveryExpanded ? 'opacity-100' : 'opacity-70'}>
                {discoverySection.icon}
              </span>
              <span>{discoverySection.name}</span>
            </div>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${discoveryExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Sub-items */}
          {discoveryExpanded && (
            <div className="mt-1 ml-4 pl-3 border-l-2 border-gray-100 space-y-1">
              {discoverySection.items.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href === '/dashboard/discovery' && pathname === '/dashboard/discovery') ||
                  (item.href === '/dashboard/discovery-runs' && pathname?.startsWith('/dashboard/discovery-runs')) ||
                  (item.href === '/dashboard/discovery' && pathname?.startsWith('/dashboard/discovery/runs'));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200
                      ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 font-medium'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      }
                    `}
                  >
                    <span className={isActive ? 'opacity-100' : 'opacity-60'}>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User Info */}
      {userEmail && (
        <div className="px-3 py-3 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Signed in as</p>
              <p className="text-xs font-medium text-gray-700 truncate">{userEmail}</p>
            </div>
            <Link
              href="/api/auth/signout"
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
