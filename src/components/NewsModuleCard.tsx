import React, { useState, useEffect } from 'react';
import {
  Globe,
  Newspaper,
  Volume2,
  Square,
  RefreshCw,
  ExternalLink,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock,
  Radio,
  Share2,
} from 'lucide-react';
import { triggerHaptic } from '../utils/deviceHardware';

export interface NewsArticleItem {
  id: string;
  title: string;
  source: string;
  link: string;
  pubDate: string;
  timeAgo: string;
  category: 'bharat' | 'world';
  snippet?: string;
}

interface NewsModuleCardProps {
  isSpeaking: boolean;
  onSpeakNews: (summaryText: string) => void;
  onStopSpeaking: () => void;
}

export const NewsModuleCard: React.FC<NewsModuleCardProps> = ({
  isSpeaking,
  onSpeakNews,
  onStopSpeaking,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'bharat' | 'world'>('all');
  const [articles, setArticles] = useState<NewsArticleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [currentSpokenArticleId, setCurrentSpokenArticleId] = useState<string | null>(null);

  const fetchNews = async (cat: 'all' | 'bharat' | 'world' = activeCategory) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?category=${cat}`);
      if (res.ok) {
        const data = await res.json();
        if (data.articles && Array.isArray(data.articles)) {
          setArticles(data.articles);
          setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch (err) {
      console.warn('Failed to load news, retrying fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(activeCategory);
  }, [activeCategory]);

  const handleSummarizeAll = async () => {
    triggerHaptic([40, 40]);
    if (isSpeaking) {
      onStopSpeaking();
      return;
    }

    setIsSummarizing(true);
    try {
      const res = await fetch('/api/news/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeCategory }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          onSpeakNews(data.summary);
        }
      } else {
        // Fallback speech
        const top = articles.slice(0, 3).map((a) => a.title).join('. ');
        onSpeakNews(`Ram Ram ji! World aur Bharat headlines suniye: ${top}`);
      }
    } catch (err) {
      console.error('Error generating news summary:', err);
      const top = articles.slice(0, 3).map((a) => a.title).join('. ');
      onSpeakNews(`Ram Ram ji! Latest headlines me: ${top}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSummarizeSingleArticle = (article: NewsArticleItem) => {
    triggerHaptic([30]);
    setCurrentSpokenArticleId(article.id);
    const text = `Ram Ram ji! ${article.category === 'bharat' ? 'Bharat' : 'World'} news report: ${article.title}. Source: ${article.source}.`;
    onSpeakNews(text);
  };

  const filteredArticles =
    activeCategory === 'all'
      ? articles
      : articles.filter((a) => a.category === activeCategory);

  return (
    <div
      id="jarvis-news-module-card"
      className="bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-5 backdrop-blur-xl shadow-xl transition-all relative overflow-hidden group"
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold text-white tracking-wide uppercase flex items-center gap-1.5">
                <span>World & Bharat News</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  <Radio className="w-2.5 h-2.5 text-cyan-400 animate-ping" />
                  <span>Live Feed</span>
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>National & Global Headlines</span>
              {lastUpdated && (
                <>
                  <span>•</span>
                  <span>Updated {lastUpdated}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls: Refresh + Summarize Voice */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              triggerHaptic([30]);
              fetchNews(activeCategory);
            }}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-cyan-300 transition-all disabled:opacity-40"
            title="Refresh News Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            id="btn-summarize-news"
            onClick={handleSummarizeAll}
            disabled={isSummarizing}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer ${
              isSpeaking
                ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300 animate-pulse'
                : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            }`}
            title={isSpeaking ? 'Stop News Voice' : 'Summarize Top News with Jarvis'}
          >
            {isSpeaking ? (
              <>
                <Square className="w-3.5 h-3.5 fill-rose-300" />
                <span>Stop Voice</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isSummarizing ? 'Summarizing...' : 'Summarize News'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-2xl mb-3.5 max-w-sm">
        <button
          onClick={() => {
            triggerHaptic([20]);
            setActiveCategory('all');
          }}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Feeds
        </button>

        <button
          onClick={() => {
            triggerHaptic([20]);
            setActiveCategory('bharat');
          }}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeCategory === 'bharat'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🇮🇳</span>
          <span>Bharat</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic([20]);
            setActiveCategory('world');
          }}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeCategory === 'world'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🌍</span>
          <span>World</span>
        </button>
      </div>

      {/* SCROLLABLE NEWS ARTICLES LIST */}
      <div
        id="jarvis-news-articles-container"
        className="max-h-[340px] overflow-y-auto space-y-2.5 pr-1 focus:outline-none custom-scrollbar"
      >
        {loading && articles.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Fetching live Bharat & World headlines...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No headlines currently available in this category.
          </div>
        ) : (
          filteredArticles.map((item) => {
            const isItemSpeaking = isSpeaking && currentSpokenArticleId === item.id;
            return (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all duration-200 hover:border-cyan-500/40 ${
                  isItemSpeaking
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60'
                }`}
              >
                {/* Meta row: category tag, source, time */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        item.category === 'bharat'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                          : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                      }`}
                    >
                      {item.category === 'bharat' ? '🇮🇳 Bharat' : '🌍 World'}
                    </span>

                    <span className="text-[11px] font-medium text-slate-300 truncate max-w-[150px]">
                      {item.source}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{item.timeAgo}</span>
                  </span>
                </div>

                {/* Title */}
                <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug line-clamp-2 hover:text-cyan-300 transition-colors">
                  {item.title}
                </p>

                {/* Footer action buttons */}
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-850">
                  <button
                    onClick={() => handleSummarizeSingleArticle(item)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-all active:scale-95"
                    title="Speak this article"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Speak Story</span>
                  </button>

                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span>Read report</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER INFO BAR */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Say "News sunao" or tap Summarize</span>
        </span>

        <span className="font-mono text-[10px] text-slate-400">
          {filteredArticles.length} Stories Loaded
        </span>
      </div>
    </div>
  );
};
