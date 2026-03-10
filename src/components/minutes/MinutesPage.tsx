'use client';

import { useState, useMemo, useEffect } from 'react';
import type { BoardDocument } from '@/lib/types';

interface MinutesPageProps {
  documents: BoardDocument[];
}

const TYPE_ORDER = ['agenda', 'minutes', 'resolution', 'board_packet'] as const;
const TYPE_LABELS: Record<string, string> = {
  agenda: 'Agendas',
  minutes: 'Minutes',
  resolution: 'Resolutions',
  board_packet: 'Board Packets',
};
const TYPE_ICONS: Record<string, string> = {
  agenda: 'fas fa-clipboard-list',
  minutes: 'fas fa-file-alt',
  resolution: 'fas fa-gavel',
  board_packet: 'fas fa-folder-open',
};
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function parseDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00');
}

export default function MinutesPage({ documents }: MinutesPageProps) {
  // Derive available years
  const years = useMemo(() => {
    const set = new Set<string>();
    for (const doc of documents) {
      set.add(parseDate(doc.document_date).getFullYear().toString());
    }
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [documents]);

  const [activeYear, setActiveYear] = useState(years[0] || new Date().getFullYear().toString());
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Filter by year
  const yearFiltered = useMemo(() => {
    return documents.filter(doc => {
      return parseDate(doc.document_date).getFullYear().toString() === activeYear;
    });
  }, [documents, activeYear]);

  // Available months within selected year
  const months = useMemo(() => {
    const set = new Set<number>();
    for (const doc of yearFiltered) {
      set.add(parseDate(doc.document_date).getMonth());
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [yearFiltered]);

  // Filter by month, then search
  const filtered = useMemo(() => {
    let result = yearFiltered;
    if (activeMonth !== null) {
      result = result.filter(doc => parseDate(doc.document_date).getMonth() === activeMonth);
    }
    if (search) {
      result = result.filter(doc => doc.title.toLowerCase().includes(search.toLowerCase()));
    }
    return result;
  }, [yearFiltered, activeMonth, search]);

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, BoardDocument[]> = {};
    for (const doc of filtered) {
      const key = doc.document_date;
      if (!map[key]) map[key] = [];
      map[key].push(doc);
    }
    const dates = Object.keys(map).sort((a, b) => b.localeCompare(a));
    return dates.map(date => ({ date, docs: map[date] }));
  }, [filtered]);

  // Auto-expand only the first date when filters change
  useEffect(() => {
    if (grouped.length > 0) {
      setExpandedDates(new Set([grouped[0].date]));
    } else {
      setExpandedDates(new Set());
    }
  }, [activeYear, activeMonth, search, grouped.length > 0 ? grouped[0].date : '']);

  function toggleDate(date: string) {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }

  return (
    <section className="section">
      <div className="container">
        {/* TOOLBAR: Year pills + month pills + search */}
        <div className="minutes-toolbar">
          {/* Year pills (desktop) */}
          <div className="minutes-year-pills">
            {years.map(year => (
              <button
                key={year}
                className={`minutes-year-pill${activeYear === year ? ' active' : ''}`}
                onClick={() => { setActiveYear(year); setActiveMonth(null); setSearch(''); }}
              >
                {year}
              </button>
            ))}
          </div>
          {/* Year select (mobile) */}
          <div className="minutes-select-wrap minutes-year-select-wrap">
            <select
              value={activeYear}
              onChange={e => { setActiveYear(e.target.value); setActiveMonth(null); setSearch(''); }}
              className="minutes-select"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Month pills */}
        <div className="minutes-toolbar minutes-month-bar">
          <div className="minutes-month-pills">
            <button
              className={`minutes-month-pill${activeMonth === null ? ' active' : ''}`}
              onClick={() => { setActiveMonth(null); setSearch(''); }}
            >
              All Months
            </button>
            {months.map(m => (
              <button
                key={m}
                className={`minutes-month-pill${activeMonth === m ? ' active' : ''}`}
                onClick={() => { setActiveMonth(m); setSearch(''); }}
              >
                {MONTH_NAMES[m]}
              </button>
            ))}
          </div>
          {/* Month select (mobile) */}
          <div className="minutes-select-wrap minutes-month-select-wrap">
            <select
              value={activeMonth === null ? 'all' : activeMonth.toString()}
              onChange={e => { setActiveMonth(e.target.value === 'all' ? null : Number(e.target.value)); setSearch(''); }}
              className="minutes-select"
            >
              <option value="all">All Months</option>
              {months.map(m => (
                <option key={m} value={m.toString()}>{MONTH_FULL[m]}</option>
              ))}
            </select>
          </div>

          <div className="minutes-search-wrap">
            <i className="fas fa-search minutes-search-icon"></i>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="minutes-search"
            />
          </div>
        </div>

        {/* Result count */}
        <p className="minutes-result-count">
          {filtered.length} document{filtered.length !== 1 ? 's' : ''} in {activeMonth !== null ? MONTH_FULL[activeMonth] + ' ' : ''}{activeYear}
        </p>

        {/* MEETING GROUPS */}
        {grouped.length === 0 ? (
          <div className="minutes-empty">
            <i className="fas fa-file-pdf"></i>
            <p>{search ? 'No documents match your search.' : 'No documents available for this period.'}</p>
          </div>
        ) : (
          grouped.map(({ date, docs }) => {
            const isExpanded = expandedDates.has(date);
            // Group docs by type
            const byType: Record<string, BoardDocument[]> = {};
            for (const doc of docs) {
              const t = doc.document_type || 'minutes';
              if (!byType[t]) byType[t] = [];
              byType[t].push(doc);
            }

            return (
              <div key={date} className={`minutes-meeting-group${isExpanded ? ' expanded' : ''}`}>
                <button
                  className="minutes-meeting-date"
                  onClick={() => toggleDate(date)}
                  aria-expanded={isExpanded}
                >
                  <i className="fas fa-calendar-alt"></i>
                  <span className="minutes-meeting-date-text">
                    {parseDate(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="minutes-doc-count">{docs.length} doc{docs.length !== 1 ? 's' : ''}</span>
                  <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} minutes-chevron`}></i>
                </button>
                {isExpanded && (
                  <div className="minutes-meeting-docs">
                    {TYPE_ORDER.map(type => {
                      const typeDocs = byType[type];
                      if (!typeDocs || typeDocs.length === 0) return null;
                      return (
                        <div key={type} className="minutes-doc-category">
                          <h4 className="minutes-doc-category-label">
                            <i className={TYPE_ICONS[type]}></i> {TYPE_LABELS[type]}
                          </h4>
                          <div className="minutes-doc-list">
                            {typeDocs.map(doc => (
                              <a
                                key={doc.id}
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="minutes-doc-link"
                              >
                                <i className="fas fa-file-pdf minutes-doc-pdf-icon"></i>
                                <span className="minutes-doc-title">{doc.title}</span>
                                {doc.file_size ? (
                                  <span className="minutes-doc-size">{formatFileSize(doc.file_size)}</span>
                                ) : null}
                                <i className="fas fa-external-link-alt minutes-doc-external"></i>
                              </a>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
