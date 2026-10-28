import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  History,
  Trash2,
  RotateCcw,
  Volume2,
  Terminal,
  Filter,
  Download,
  Check,
  Calendar,
  Clock,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import { JarvisAction, CommandHistoryItem } from '../types';
import { triggerHaptic } from '../utils/deviceHardware';

export type { CommandHistoryItem };

interface RecentInteractionsLogProps {
  history: CommandHistoryItem[];
  onClearHistory: () => void;
  onReplayCommand: (query: string) => void;
  onSpeakResponse: (response: string) => void;
}

const QUICK_KEYWORD_TAGS = ['All', 'Weather', 'Alarm', 'Call', 'News', 'Torch', 'Music', 'Boss'];

type DatePreset = 'all' | 'today' | 'yesterday' | 'week' | 'custom';

export const RecentInteractionsLog: React.FC<RecentInteractionsLogProps> = ({
  history,
  onClearHistory,
  onReplayCommand,
  onSpeakResponse,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [hasExported, setHasExported] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Today and Yesterday reference strings (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);
  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }, []);

  const getItemDateString = (item: CommandHistoryItem): string => {
    if (item.date) return item.date;
    if (item.isoDate) return item.isoDate.slice(0, 10);
    return todayStr;
  };

  const handleExportJSON = () => {
    triggerHaptic([30, 40]);
    if (!history || history.length === 0) return;

    const exportPayload = {
      system: 'J.A.R.V.I.S. AI Command Core',
      exportedAt: new Date().toISOString(),
      totalRecords: history.length,
      filterApplied: {
        keywordQuery: searchQuery || null,
        tag: selectedTag !== 'All' ? selectedTag : null,
        datePreset,
        customDate: datePreset === 'custom' ? customDate : null,
      },
      interactions: history.map((item, index) => ({
        index: index + 1,
        query: item.query,
        response: item.response,
        timestamp: item.timestamp,
        date: item.date || getItemDateString(item),
        actions: item.actions || [],
      })),
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(exportPayload, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute(
      'download',
      `jarvis-command-history-${dateStamp}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setHasExported(true);
    setTimeout(() => {
      setHasExported(false);
    }, 2500);
  };

  // Filter history by both search keyword AND date
  const filteredHistory = useMemo(() => {
    let list = history;

    // 1. Keyword search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const inQuery = item.query.toLowerCase().includes(q);
        const inResponse = item.response.toLowerCase().includes(q);
        const inTime = item.timestamp.toLowerCase().includes(q);
        const inDate = (item.date || '').toLowerCase().includes(q);
        const inActions = item.actions?.some(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            JSON.stringify(a.args).toLowerCase().includes(q)
        );
        return inQuery || inResponse || inTime || inDate || inActions;
      });
    }

    // 2. Quick Keyword Tag filter
    if (selectedTag !== 'All') {
      const tagLower = selectedTag.toLowerCase();
      list = list.filter((item) => {
        const inQuery = item.query.toLowerCase().includes(tagLower);
        const inResponse = item.response.toLowerCase().includes(tagLower);
        const inActions = item.actions?.some((a) =>
          a.name.toLowerCase().includes(tagLower)
        );
        return inQuery || inResponse || inActions;
      });
    }

    // 3. Date filtering
    if (datePreset !== 'all') {
      list = list.filter((item) => {
        const itemDate = getItemDateString(item);
        if (datePreset === 'today') {
          return itemDate === todayStr;
        }
        if (datePreset === 'yesterday') {
          return itemDate === yesterdayStr;
        }
        if (datePreset === 'week') {
          return itemDate >= sevenDaysAgoStr;
        }
        if (datePreset === 'custom' && customDate) {
          return itemDate === customDate;
        }
        return true;
      });
    }

    return list;
  }, [history, searchQuery, selectedTag, datePreset, customDate, todayStr, yesterdayStr, sevenDaysAgoStr]);

  const handleTagClick = (tag: string) => {
    triggerHaptic([20]);
    if (selectedTag === tag) {
      setSelectedTag('All');
    } else {
      setSelectedTag(tag);
    }
  };

  const handleDatePresetClick = (preset: DatePreset) => {
    triggerHaptic([20]);
    setDatePreset(preset);
    if (preset === 'custom') {
      setShowDatePicker(true);
      if (!customDate) {
        setCustomDate(todayStr);
      }
    } else {
      setShowDatePicker(false);
    }
  };

  const handleClearAllFilters = () => {
    triggerHaptic([25]);
    setSearchQuery('');
    setSelectedTag('All');
    setDatePreset('all');
    setCustomDate('');
    setShowDatePicker(false);
  };

  const isFilteringActive =
    Boolean(searchQuery.trim()) ||
    selectedTag !== 'All' ||
    datePreset !== 'all' ||
    Boolean(customDate);

  const formatDisplayDate = (item: CommandHistoryItem): string => {
    const dStr = getItemDateString(item);
    if (dStr === todayStr) return 'Today';
    if (dStr === yesterdayStr) return 'Yesterday';
    return dStr;
  };

  return (
    <div
      id="jarvis-recent-interactions-module"
      className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-xl transition-all relative overflow-hidden group"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
              <span>Recent Interactions</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {isFilteringActive
                  ? `${filteredHistory.length} of ${history.length}`
                  : `${history.length} logged`}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Search commands by keyword or date</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {history.length > 0 && (
            <button
              id="btn-export-interactions-json"
              type="button"
              onClick={handleExportJSON}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all border ${
                hasExported
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-sm'
                  : 'bg-slate-950/70 border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 shadow-sm'
              }`}
              title="Export interaction history as JSON file"
            >
              {hasExported ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-semibold">Exported!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px]">Export JSON</span>
                </>
              )}
            </button>
          )}

          {history.length > 0 && (
            <button
              id="btn-clear-interactions"
              type="button"
              onClick={() => {
                triggerHaptic([30]);
                onClearHistory();
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Clear Interaction History"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* SEARCH BAR FOR KEYWORDS */}
      <div className="relative mb-2.5">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4 text-cyan-400" />
        </div>
        <input
          id="input-search-interactions"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by keywords (e.g. weather, alarm, call, youtube, boss)..."
          className="w-full pl-9 pr-8 py-2 bg-slate-950/80 border border-slate-800 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 rounded-xl text-xs text-white placeholder-slate-500 transition-all outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
            title="Clear keyword search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* DATE FILTER CONTROLS */}
      <div className="mb-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span>Filter by Date:</span>
          </div>
          {datePreset !== 'all' && (
            <button
              type="button"
              onClick={() => {
                setDatePreset('all');
                setCustomDate('');
                setShowDatePicker(false);
              }}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-2.5 h-2.5" />
              <span>Reset Date</span>
            </button>
          )}
        </div>

        {/* Date Presets Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => handleDatePresetClick('all')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all flex-shrink-0 ${
              datePreset === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Dates
          </button>

          <button
            type="button"
            onClick={() => handleDatePresetClick('today')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all flex-shrink-0 flex items-center gap-1 ${
              datePreset === 'today'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Clock className="w-2.5 h-2.5" />
            <span>Today</span>
          </button>

          <button
            type="button"
            onClick={() => handleDatePresetClick('yesterday')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all flex-shrink-0 ${
              datePreset === 'yesterday'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Yesterday
          </button>

          <button
            type="button"
            onClick={() => handleDatePresetClick('week')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all flex-shrink-0 ${
              datePreset === 'week'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Last 7 Days
          </button>

          <button
            type="button"
            onClick={() => {
              handleDatePresetClick('custom');
              setShowDatePicker(!showDatePicker);
            }}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all flex-shrink-0 flex items-center gap-1 ${
              datePreset === 'custom'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <CalendarDays className="w-2.5 h-2.5" />
            <span>{customDate ? customDate : 'Pick Date'}</span>
          </button>
        </div>

        {/* Custom Date Picker Input */}
        {showDatePicker && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Select Date:</span>
            <input
              id="input-filter-date"
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setDatePreset('custom');
              }}
              className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono"
            />
            {customDate && (
              <span className="text-[10px] text-slate-400 font-mono">
                Filtering: {customDate}
              </span>
            )}
          </div>
        )}
      </div>

      {/* QUICK KEYWORD TAG PILLS */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] uppercase font-semibold text-slate-500 flex items-center gap-1 mr-1 flex-shrink-0">
          <Filter className="w-2.5 h-2.5" />
          <span>Tags:</span>
        </span>
        {QUICK_KEYWORD_TAGS.map((tag) => {
          const isSelected = selectedTag === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all flex-shrink-0 ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* ACTIVE FILTER STATUS BAR */}
      {isFilteringActive && (
        <div className="flex items-center justify-between gap-2 mb-2 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-[10px] text-cyan-200">
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <span className="truncate">
              Filtered by:{' '}
              {searchQuery ? `"${searchQuery}" • ` : ''}
              {selectedTag !== 'All' ? `Tag: ${selectedTag} • ` : ''}
              {datePreset === 'today'
                ? 'Date: Today'
                : datePreset === 'yesterday'
                ? 'Date: Yesterday'
                : datePreset === 'week'
                ? 'Date: Last 7 Days'
                : datePreset === 'custom' && customDate
                ? `Date: ${customDate}`
                : 'All Dates'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="text-cyan-300 hover:text-white font-bold underline flex-shrink-0 cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* INTERACTIONS LIST CONTAINER */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
        {filteredHistory.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-950/40 border border-slate-850 space-y-2">
            <Search className="w-5 h-5 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">
              {isFilteringActive
                ? `No interactions match your selected search keywords or date.`
                : `No interaction logs recorded yet.`}
            </p>
            {isFilteringActive && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline inline-block pt-1 cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filteredHistory.map((cmd, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-cyan-500/30 text-xs transition-all duration-150 group/item"
            >
              {/* Top row: User query & timestamp/date */}
              <div className="flex items-start justify-between gap-2 text-slate-300 font-medium">
                <div className="flex items-start gap-1.5 flex-1 min-w-0">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-cyan-200 font-semibold break-words">
                    "{cmd.query}"
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-slate-500" />
                    <span>{formatDisplayDate(cmd)}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {cmd.timestamp}
                  </span>
                </div>
              </div>

              {/* Response */}
              <p className="text-slate-300 text-[11px] mt-1.5 pl-5 leading-relaxed">
                {cmd.response}
              </p>

              {/* Action buttons on card */}
              <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-900">
                <div className="text-[10px] text-slate-500 font-mono pl-5">
                  {cmd.actions && cmd.actions.length > 0 ? (
                    <span className="text-emerald-400/80">
                      ⚡ {cmd.actions.map((a) => a.name).join(', ')}
                    </span>
                  ) : (
                    <span className="text-slate-500">Voice Dialog</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic([30]);
                      onSpeakResponse(cmd.response);
                    }}
                    className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-900 cursor-pointer"
                    title="Speak this response aloud"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Speak</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic([30, 30]);
                      onReplayCommand(cmd.query);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-cyan-950/40 cursor-pointer"
                    title="Execute command again"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Run Again</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
