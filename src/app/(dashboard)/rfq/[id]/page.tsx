'use client';

import React, { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { rfqService, Enquiry, Attachment, DirectoryItem, ActivityLogItem } from '../../../../services/rfqService';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  FileText,
  Send,
  ExternalLink,
  Paperclip,
  Tag,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  Download,
  Image as ImageIcon,
  Eye,
  X,
  Clock,
  CheckSquare,
  History,
  Folder,
  Calculator,
  Phone,
} from 'lucide-react';

function isImageFile(att: { filename?: string; contentType?: string }): boolean {
  if (!att) return false;
  const ct = (att.contentType || '').toLowerCase();
  const fn = (att.filename || '').toLowerCase();
  if (ct.startsWith('image/')) return true;
  return /\.(gif|png|jpe?g|webp|svg|bmp|tiff?)$/i.test(fn);
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Doc';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&#039;/gi, "'")
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&rsquo;/gi, "’")
    .replace(/&lsquo;/gi, "‘")
    .replace(/&rdquo;/gi, '”')
    .replace(/&ldquo;/gi, '“')
    .replace(/&#160;/gi, ' ');
}

interface ThreadMessage {
  id: number;
  sender: string;
  email: string;
  date: string;
  body: string;
  isCompany: boolean;
}

function isEnconCompanyAddr(emailAddr: string): boolean {
  if (!emailAddr) return false;
  const lower = emailAddr.toLowerCase().trim();
  return (
    lower.endsWith('@encon.co.in') ||
    lower.endsWith('@encon.in') ||
    lower === 'encon.co.in' ||
    lower === 'encon.in'
  );
}

function extractEmailFromText(text: string): string {
  if (!text) return '';
  const match = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  return match ? match[0] : '';
}

function extractNameFromText(text: string): string {
  if (!text) return '';
  const nutanMatch = text.match(/(Nutan\s+Kumari|Shikha|Rupanjana|Rupanjana\s+Mitra|ENCON\s+Thermal|ENCON\s+Team)/i);
  if (nutanMatch) return nutanMatch[1];
  return '';
}

function parseEmailThreadMessages(rawText: string, defaultSender: string, defaultEmail: string, defaultDate: string): ThreadMessage[] {
  if (!rawText) return [];

  let text = rawText
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\r\n/g, '\n');

  if (text.includes('=3D') || text.includes('=20') || text.includes('=\n')) {
    text = text
      .replace(/=\r?\n/g, '')
      .replace(/=3D/g, '=')
      .replace(/=20/g, ' ')
      .replace(/=0A/gi, '\n')
      .replace(/=0D/gi, '');
  }

  // Strip raw MIME boundary markers, preambles, attachment filenames, and Base64 noise
  text = text
    .replace(/This is a multipart message in MIME format\.?\s*(?:boundary=.*)?/gim, '')
    .replace(/^--?=?[_a-zA-Z0-9.-]+.*$/gm, '')
    .replace(/_NextPart_[a-zA-Z0-9._-]+(?:--)?/g, '')
    .replace(/^\s*(?:Content-Type|Content-Transfer-Encoding|Content-Disposition|Content-ID|MIME-Version):\s*.*$/gim, '')
    .replace(/^\s*(?:filename|name)\s*=\s*"?[^";\r\n]+"?.*$/gim, '')
    .replace(/\bcharset="?[a-z0-9_-]+"?/gim, '')
    .replace(/^[a-zA-Z0-9+/=]{40,}$/gm, '')
    .replace(/[a-zA-Z0-9+/=]{60,}/g, '')
    .replace(/'"/g, '"');

  text = decodeHtmlEntities(text).trim();

  // Split on all standard thread message boundaries
  const splitRegex = /(?:\n\s*|\n?)(?=(?:---+\s*Thread Update.*?:?|On\s+.*?\s+wrote:|-{3,}\s*(?:Original Message|Forwarded message)\s*-{3,}|From:\s*.*?(?:\r?\n|$)|-{5,}\s*Forwarded message\s*-{5,}))/gi;
  const rawBlocks = text.split(splitRegex).map((b) => b.trim()).filter((b) => b.length > 5);

  if (rawBlocks.length === 0) {
    const isComp = isEnconCompanyAddr(text) || isEnconCompanyAddr(defaultEmail);
    return [
      {
        id: 1,
        sender: isComp ? (extractNameFromText(text) || 'ENCON Team') : (defaultSender || 'Customer'),
        email: isComp ? (extractEmailFromText(text) || 'mdo@encon.co.in') : defaultEmail,
        date: defaultDate,
        body: text.replace(/^>+\s?/gm, '').trim(),
        isCompany: isComp,
      },
    ];
  }

  const messages: ThreadMessage[] = [];

  rawBlocks.forEach((block, idx) => {
    let sender = '';
    let email = '';
    let dateStr = defaultDate;
    let body = block;

    // Pattern 1: --- Thread Update (2026-08-20) from Nutan Kumari (mdo@encon.co.in) ---
    const threadUpdateMatch = block.match(/^---+\s*Thread Update\s*\((.*?)\)\s*from\s*(.*?)\s*\((.*?)\)\s*---+/i);
    if (threadUpdateMatch) {
      dateStr = threadUpdateMatch[1].trim() || dateStr;
      sender = threadUpdateMatch[2].trim();
      email = threadUpdateMatch[3].trim();
      body = block.replace(/^---+.*?---+/i, '').trim();
    } else {
      // Pattern 2: On Thu, Aug 20, 2026 ... Denis Karma <denis.karma@jindalstainless.com> wrote:
      const wroteMatch = block.match(/^On\s+([^\n]+?)\s+wrote:/i);
      if (wroteMatch) {
        const headerInfo = wroteMatch[1];
        const emailM = headerInfo.match(/<([^>]+)>/);
        if (emailM) email = emailM[1].trim();

        const cleanHeader = headerInfo.replace(/<[^>]+>/g, '').trim();
        const parts = cleanHeader.split(',');
        if (parts.length > 1) {
          sender = parts[parts.length - 1].trim();
          dateStr = parts.slice(0, parts.length - 1).join(',').trim() || dateStr;
        } else {
          sender = cleanHeader;
        }
        body = block.replace(/^On\s+[^\n]+?\s+wrote:/i, '').trim();
      } else {
        // Pattern 3: From: ... Sent: ... / ---------- Forwarded message ---------
        const fromMatch = block.match(/(?:From:\s*([^\n]+)|-{3,}\s*Forwarded message\s*-{3,}[\s\S]*?From:\s*([^\n]+))/i);
        if (fromMatch) {
          const fromLine = fromMatch[1] || fromMatch[2];
          const emailM = fromLine.match(/<([^>]+)>/) || fromLine.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
          if (emailM) email = (emailM[1] || emailM[0]).trim();

          const nameM = fromLine.replace(/<[^>]+>/g, '').replace(/^"|"$/g, '').trim();
          if (nameM && !nameM.includes('@')) sender = nameM;

          const sentMatch = block.match(/^(?:Sent|Date):\s*([^\n]+)/im);
          if (sentMatch) dateStr = sentMatch[1].trim();

          body = block
            .replace(/^-\s*Forwarded message\s*-+/i, '')
            .replace(/^-{3,}\s*(?:Original Message|Forwarded message)\s*-{3,}/i, '')
            .replace(/^From:\s*[^\n]+/im, '')
            .replace(/^(?:Sent|Date):\s*[^\n]+/im, '')
            .replace(/^To:\s*[^\n]+/im, '')
            .replace(/^Subject:\s*[^\n]+/im, '')
            .trim();
        }
      }
    }

    body = body.split('\n').map((l) => l.replace(/^>+\s?/, '')).join('\n').trim();

    if (!email) {
      email = extractEmailFromText(block);
    }

    const isCompanyBlock = isEnconCompanyAddr(email);

    if (!sender) {
      if (isCompanyBlock) {
        const foundName = extractNameFromText(body);
        sender = foundName ? `${foundName} (ENCON)` : 'ENCON Team';
      } else {
        sender = defaultSender || 'Customer';
      }
    }

    if (!email) {
      email = isCompanyBlock ? 'mdo@encon.co.in' : defaultEmail;
    }

    messages.push({
      id: idx + 1,
      sender,
      email,
      date: dateStr,
      body: body || '(No message content)',
      isCompany: isCompanyBlock,
    });
  });

  return messages;
}

/* ─── Embedded Gmail MIME/HTML Email Viewer ─── */
function GmailEmailViewer({
  rawContent,
  fromName,
  fromEmail,
  date,
  subject,
  attachments = [],
  onSelectImage,
}: {
  rawContent: string;
  fromName?: string;
  fromEmail?: string;
  date?: string;
  subject?: string;
  attachments?: Attachment[];
  onSelectImage?: (img: { src: string; filename: string }) => void;
}) {
  const [viewMode, setViewMode] = useState<'original' | 'gmail' | 'chat'>('gmail');
  const [internalSelectedImage, setInternalSelectedImage] = useState<{ src: string; filename: string } | null>(null);
  const [iframeHeight, setIframeHeight] = useState(450);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleSelectImage = (img: { src: string; filename: string }) => {
    if (onSelectImage) {
      onSelectImage(img);
    } else {
      setInternalSelectedImage(img);
    }
  };

  const cleanBody = (text: string): { srcDoc: string; plainText: string } => {
    if (!text) return { srcDoc: '', plainText: '' };

    let cleaned = text
      .replace(/^\*\s+\d+\s+FETCH\s+\(BODY\.PEEK\[\]\s+\{\d+\}\r?\n/i, '')
      .replace(/\)\s+A\d+\s+OK.*$/gi, '')
      .replace(/Content-Type:\s*text\/[a-z]+;?\s*charset="?[a-z0-9_-]+"?/gi, '')
      .replace(/Content-Transfer-Encoding:\s*quoted-printable/gi, '')
      .replace(/Content-Transfer-Encoding:\s*8bit/gi, '')
      .replace(/--[a-zA-Z0-9_.-]+--?/g, '')
      .trim();

    if (cleaned.includes('=3D') || cleaned.includes('=20') || cleaned.includes('=\r\n') || cleaned.includes('=\n')) {
      cleaned = cleaned
        .replace(/=\r?\n/g, '')
        .replace(/=3D/g, '=')
        .replace(/=20/g, ' ')
        .replace(/=0A/gi, '\n')
        .replace(/=0D/gi, '');
    }

    const isHtml = /<html|<body|<div|<p|<table|<br/i.test(cleaned);

    let srcDoc = '';
    if (isHtml) {
      srcDoc = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; color: #1e293b; margin: 16px; line-height: 1.6; word-break: break-word; }
            img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; }
            a { color: #f97316; }
            blockquote { border-left: 3px solid #cbd5e1; margin-left: 0; padding-left: 12px; color: #64748b; }
            table { border-collapse: collapse; max-width: 100%; width: 100%; }
            td, th { border: 1px solid #e2e8f0; padding: 6px 10px; }
            pre { white-space: pre-wrap; word-break: break-word; font-family: inherit; }
          </style>
        </head>
        <body>${cleaned}</body>
        </html>
      `;
    } else {
      const safeText = decodeHtmlEntities(cleaned).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      srcDoc = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, sans-serif; font-size: 13px; color: #1e293b; white-space: pre-wrap; word-break: break-word; margin: 16px; line-height: 1.6; }
          </style>
        </head>
        <body>${safeText}</body>
        </html>
      `;
    }

    const plainText = decodeHtmlEntities(
      cleaned
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
    ).trim();

    return { srcDoc, plainText };
  };

  const { srcDoc, plainText } = cleanBody(rawContent);

  const handleIframeLoad = () => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const bodyHeight = iframeRef.current.contentWindow.document.body.scrollHeight;
        if (bodyHeight > 100) {
          setIframeHeight(Math.min(Math.max(bodyHeight + 40, 250), 700));
        }
      }
    } catch (e) { }
  };

  const chatMessages = useMemo(() => {
    return parseEmailThreadMessages(rawContent, fromName || 'Customer', fromEmail || '', date || '');
  }, [rawContent, fromName, fromEmail, date]);

  const displaySenderName = useMemo(() => {
    const isClientEmail = fromEmail && !isEnconCompanyAddr(fromEmail);
    const isInternalName = (n?: string) => {
      if (!n) return false;
      const lower = n.toLowerCase();
      return ['nutan', 'shikha', 'rupanjana', 'encon'].some((k) => lower.includes(k));
    };
    if (isClientEmail && isInternalName(fromName)) {
      return 'Customer';
    }
    return fromName || 'Customer';
  }, [fromName, fromEmail]);

  const firstReceivedDate = useMemo(() => {
    if (chatMessages.length > 0) {
      const oldest = chatMessages[chatMessages.length - 1];
      if (oldest.date) return oldest.date;
    }
    return date || 'Recent';
  }, [chatMessages, date]);

  const latestUpdateDate = useMemo(() => {
    if (chatMessages.length > 1) {
      const newest = chatMessages[0];
      if (newest.date && newest.date !== firstReceivedDate) return newest.date;
    }
    return null;
  }, [chatMessages, firstReceivedDate]);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-4 md:p-5 h-full flex flex-col justify-between space-y-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-center border border-cyan-500/30 text-sm shrink-0">
            {(displaySenderName || 'CU').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {displaySenderName}
              {fromEmail && <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-normal">&lt;{fromEmail}&gt;</span>}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Subject: <span className="text-slate-800 dark:text-slate-200 font-medium">{subject}</span> · First Received: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{firstReceivedDate}</span>
              {latestUpdateDate && (
                <> · Last Update: <span className="text-cyan-600 dark:text-cyan-400 font-medium">{latestUpdateDate}</span></>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {fromEmail && (
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(fromEmail)}&su=RE: ${encodeURIComponent(subject || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-2xs transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Reply <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs max-w-full overflow-x-auto custom-scrollbar shrink-0 whitespace-nowrap">
            <button
              type="button"
              onClick={() => setViewMode('original')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 whitespace-nowrap transition-all ${viewMode === 'original'
                ? 'bg-cyan-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Original Email Body
            </button>
            <button
              type="button"
              onClick={() => setViewMode('gmail')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 whitespace-nowrap transition-all ${viewMode === 'gmail'
                ? 'bg-cyan-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Gmail Reader Box
            </button>
            <button
              type="button"
              onClick={() => setViewMode('chat')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 whitespace-nowrap transition-all ${viewMode === 'chat'
                ? 'bg-cyan-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Text Chat View ({chatMessages.length})
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[350px] h-[52vh] max-h-[55vh]">
        {viewMode === 'original' ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 h-full max-h-[55vh] overflow-y-auto overflow-x-auto custom-scrollbar">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono pb-2 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md z-10 pt-1">
              <div>
                From <strong className="text-slate-800 dark:text-slate-200">{fromName || 'Customer'}</strong> {fromEmail && `<${fromEmail}>`} {date && `· ${date}`}
              </div>
              <div className="font-semibold text-slate-700 dark:text-slate-300">{subject}</div>
            </div>
            <pre className="whitespace-pre-wrap break-words font-sans text-xs text-slate-800 dark:text-slate-200 leading-relaxed pt-1 select-text">
              {plainText || '(No email body content)'}
            </pre>
          </div>
        ) : viewMode === 'gmail' ? (
          <div className="rounded-xl border border-slate-200 bg-white shadow-inner overflow-hidden h-[54vh] max-h-[54vh]">
            <iframe
              ref={iframeRef}
              srcDoc={srcDoc}
              title="Gmail Email View"
              onLoad={handleIframeLoad}
              style={{ width: '100%', height: '100%', border: 'none' }}
              className="w-full h-full rounded-xl"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
            />
          </div>
        ) : (
          <div className="space-y-3 h-[54vh] max-h-[54vh] overflow-y-auto pr-1 custom-scrollbar">
            {chatMessages.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center">
                (No message content)
              </div>
            ) : (
              chatMessages.map((msg: ThreadMessage, idx: number) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isCompany ? 'items-end ml-auto max-w-[88%]' : 'items-start mr-auto max-w-[88%]'
                    }`}
                >
                  <div
                    className={`w-full p-4 rounded-2xl space-y-2.5 shadow-lg border transition-all ${msg.isCompany
                      ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-obsidian-950 border-r-4 border-r-amber-500 border-amber-500/30 text-slate-100'
                      : 'bg-gradient-to-br from-slate-900 via-slate-900 to-obsidian-950 border-l-4 border-l-cyan-500 border-slate-800 text-slate-200'
                      }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center border ${msg.isCompany
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                            }`}
                        >
                          {(msg.sender || (msg.isCompany ? 'EN' : 'CU')).substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-white flex items-center gap-2">
                            {msg.sender}
                            {msg.email && <span className="text-[10px] text-slate-400 font-mono font-normal">&lt;{msg.email}&gt;</span>}
                          </h5>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {msg.isCompany ? (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider">
                            ENCON TEAM
                          </span>
                        ) : (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase tracking-wider">
                            CUSTOMER
                          </span>
                        )}
                        {msg.date && <span className="text-[10px] text-slate-400 font-mono">{msg.date}</span>}
                      </div>
                    </div>
                    <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans pt-1">
                      {msg.body ? (
                        msg.body
                          .replace(/^--=[a-zA-Z0-9_.-]+.*$/gm, '')
                          .replace(/^--[a-zA-Z0-9_.-]+--?$/gm, '')
                          .replace(/^\s*(?:Content-Type|Content-Transfer-Encoding|Content-Disposition|Content-ID):\s*.*$/gim, '')
                          .replace(/^\s*filename="?[^";\r\n]+"?.*$/gim, '')
                          .replace(/^\s*name="?[^";\r\n]+"?.*$/gim, '')
                          .replace(/^[a-zA-Z0-9+/=]{60,}$/gm, '')
                          .replace(/\n{3,}/g, '\n\n')
                          .trim() || '(Attachment content included below)'
                      ) : (
                        '(Empty message body)'
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* FULL-SCREEN IMAGE / GIF LIGHTBOX MODAL */}
      {internalSelectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setInternalSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                {internalSelectedImage.filename}
              </h4>
              <div className="flex items-center gap-2">
                <a
                  href={internalSelectedImage.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={internalSelectedImage.filename}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  type="button"
                  onClick={() => setInternalSelectedImage(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="relative w-full max-h-[75vh] flex items-center justify-center overflow-auto rounded-xl bg-slate-950 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={internalSelectedImage.src}
                alt={internalSelectedImage.filename}
                className="max-h-[70vh] w-auto h-auto object-contain rounded-lg shadow-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%230f172a"/><rect x="20" y="20" width="360" height="260" rx="12" fill="%231e293b" stroke="%23334155" stroke-width="2"/><text x="200" y="150" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="14" font-weight="bold">${encodeURIComponent(internalSelectedImage.filename)}</text></svg>`;
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_OPTIONS = ['Open', 'Incomplete', 'Under review', 'Verified', 'Approved', 'Offer Sent', 'PO Received', 'REGRET', 'Closed'];

const getAttachmentUrl = (attId: string | number, isDownload = false) => {
  const dlParam = isDownload ? '?dl=1' : '';
  return `/api/rfq/attachments/${attId}${dlParam}`;
};

export default function EnquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast, showConfirm } = useNotification();
  const { user } = useAuth();
  const userRole = (user?.role || '').toUpperCase();
  const canReview = ['ADMIN', 'CO', 'GM', 'PRODUCTION_HEAD'].includes(userRole);
  const canEdit = ['ADMIN', 'CO', 'GM', 'PRODUCTION_HEAD', 'SALES_MARKETING'].includes(userRole);
  const isTechnicalOnly = userRole === 'TECHNICAL_PERSON';
  const isNew = params.id === 'new';
  const enquiryId = isNew ? null : (params.id as string);

  const defaultNewForm: Partial<Enquiry> = {
    type: '',
    companyName: '',
    contactPerson: '',
    mobile: '',
    email: '',
    itemDescription: '',
    assignedTo: '',
    tat: '30',
    salesResponsibility: '',
    technical: '',
    status: 'Open',
    remarks: '',
    offerNo: '',
    offerDate: '',
  };

  const [enquiryForm, setEnquiryForm] = useState<Partial<Enquiry>>({});
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; filename: string } | null>(null);

  // Client Call Logger State
  const [callDate, setCallDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [callNote, setCallNote] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');
  const [loggingCall, setLoggingCall] = useState(false);
  const [followupType, setFollowupType] = useState<string>('Call');

  const handleLogCall = async () => {
    if (!callNote.trim()) {
      showToast('Call Note Required', 'Please enter notes about the client conversation.', 'warning');
      return;
    }

    setLoggingCall(true);
    try {
      if (enquiryId) {
        await rfqService.addFollowup(enquiryId, {
          type: followupType,
          note: callNote.trim(),
          nextActionDate: nextFollowup || enquiry.nextActionDate || '',
          lastCallDate: callDate,
        });
        await queryClient.invalidateQueries({ queryKey: ['enquiry', enquiryId] });
        await queryClient.invalidateQueries({ queryKey: ['rfq-tracker'] });
      } else {
        const timestampHeader = `[${followupType} - ${callDate}]`;
        const newEntry = `${timestampHeader} ${callNote.trim()}`;
        const updatedFollowup = enquiry.followupRemarks ? `${newEntry}\n\n${enquiry.followupRemarks}` : newEntry;
        setEnquiry({
          ...enquiry,
          lastCallDate: callDate,
          nextActionDate: nextFollowup || enquiry.nextActionDate || '',
          followupRemarks: updatedFollowup,
        });
      }

      setCallNote('');
      showToast('Follow-up Recorded 📞', `${followupType} entry saved!`, 'success');
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to record follow-up', 'error');
    } finally {
      setLoggingCall(false);
    }
  };

  // React Query: Directory Items
  const { data: directory = [] } = useQuery<DirectoryItem[]>({
    queryKey: ['directory'],
    queryFn: async () => {
      const res = await rfqService.getDirectory();
      return res.data || [];
    },
  });

  // Role-filtered directory lists for assignment dropdowns
  const technicalDirectory = useMemo(() => {
    return directory.filter((item) => {
      if (!item.role) return true;
      const r = item.role.toUpperCase();
      return r !== 'SALES_MARKETING';
    });
  }, [directory]);

  const salesDirectory = useMemo(() => {
    return directory.filter((item) => {
      if (!item.role) return true;
      const r = item.role.toUpperCase();
      return r !== 'TECHNICAL_PERSON';
    });
  }, [directory]);

  // React Query: Enquiry Details & History
  const { data: enquiryResponse, isLoading: loadingEnquiry } = useQuery({
    queryKey: ['enquiry', enquiryId],
    queryFn: async () => {
      if (!enquiryId) return null;
      const res = await rfqService.getEnquiryById(enquiryId);
      return res;
    },
    enabled: !isNew && !!enquiryId,
  });

  const fetchedEnquiry = enquiryResponse?.data || (enquiryResponse && typeof enquiryResponse === 'object' && ('_id' in enquiryResponse || 'rfqId' in enquiryResponse) ? enquiryResponse : null);
  const historyLogs: ActivityLogItem[] = enquiryResponse?.history || [];

  const enquiry = useMemo(() => {
    const base = isNew ? defaultNewForm : (fetchedEnquiry || {});
    return { ...base, ...enquiryForm };
  }, [fetchedEnquiry, enquiryForm, isNew]);

  const followupsList = useMemo(() => {
    if (Array.isArray(enquiry.followups) && enquiry.followups.length > 0) {
      return [...enquiry.followups].reverse();
    }
    if (!enquiry.followupRemarks) return [];
    return enquiry.followupRemarks
      .split(/\n\n+/)
      .filter(Boolean)
      .map((entry: string, idx: number) => {
        const match = entry.match(/^\[(?:📞\s*)?Call Log\s*-\s*([^\]]+)\]\s*([\s\S]*)/);
        if (match) {
          return {
            _id: `legacy-${idx}`,
            type: 'Call',
            note: match[2].trim(),
            author: enquiry.assignedTo || enquiry.companyName || 'Team Member',
            createdAt: match[1].trim(),
          };
        }
        return {
          _id: `legacy-${idx}`,
          type: 'Remark',
          note: entry.trim(),
          author: enquiry.assignedTo || 'Team Member',
          createdAt: enquiry.dateReceived || '',
        };
      });
  }, [enquiry.followups, enquiry.followupRemarks, enquiry.assignedTo, enquiry.companyName, enquiry.dateReceived]);

  const questionnaireFiles = useMemo(() => {
    if (!enquiry.attachments) return [];
    return enquiry.attachments.filter(
      (a: Attachment) =>
        (a.kind && (a.kind.toLowerCase() === 'questionnaire' || a.kind.toLowerCase() === 'client_docs')) ||
        a.filename.toLowerCase().includes('questionnaire') ||
        a.filename.toLowerCase().includes('rfq') ||
        a.filename.toLowerCase().includes('spec') ||
        a.filename.toLowerCase().includes('req')
    );
  }, [enquiry.attachments]);

  const costingFiles = useMemo(() => {
    if (!enquiry.attachments) return [];
    return enquiry.attachments.filter(
      (a: Attachment) =>
        (a.kind && (a.kind.toLowerCase() === 'costing' || a.kind.toLowerCase() === 'technical')) ||
        a.filename.toLowerCase().includes('costing') ||
        a.filename.toLowerCase().includes('cost') ||
        a.filename.toLowerCase().includes('calc') ||
        a.filename.toLowerCase().includes('technical') ||
        a.filename.toLowerCase().includes('price') ||
        a.filename.toLowerCase().includes('estimate') ||
        a.filename.toLowerCase().includes('sheet')
    );
  }, [enquiry.attachments]);

  const offerFiles = useMemo(() => {
    if (!enquiry.attachments) return [];
    return enquiry.attachments.filter(
      (a: Attachment) =>
        (a.kind && a.kind.toLowerCase() === 'offer') ||
        a.filename.toLowerCase().includes('offer') ||
        a.filename.toLowerCase().includes('quote') ||
        a.filename.toLowerCase().includes('proposal')
    );
  }, [enquiry.attachments]);

  const inboxAttachments = useMemo(() => {
    if (!enquiry.attachments) return [];
    const raw = enquiry.attachments.filter(
      (a: Attachment) =>
        (!a.kind || (a.kind.toLowerCase() !== 'costing' && a.kind.toLowerCase() !== 'offer' && a.kind.toLowerCase() !== 'questionnaire' && a.kind.toLowerCase() !== 'technical')) &&
        !a.filename.toLowerCase().includes('costing') &&
        !a.filename.toLowerCase().includes('offer') &&
        !a.filename.toLowerCase().includes('questionnaire') &&
        !a.filename.toLowerCase().includes('technical') &&
        !a.filename.toLowerCase().includes('calc') &&
        !a.filename.toLowerCase().includes('quote')
    );
    const seen = new Set<string>();
    return raw.filter((att: Attachment) => {
      const key = `${att.filename.toLowerCase()}_${att.size || 0}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [enquiry.attachments]);

  const reviewChecklist = useMemo(() => {
    const hasDetails = Boolean(enquiry.companyName && enquiry.itemDescription && (enquiry.email || enquiry.contactPerson));
    const hasQuestionnaire = questionnaireFiles.length > 0 || Boolean(enquiry.emailBody);
    const hasCosting = costingFiles.length > 0 || Boolean(enquiry.costing || enquiry.technical || enquiry.isMappedToOffer || enquiry.offerNo);

    return {
      hasDetails,
      hasQuestionnaire,
      hasCosting,
      isReady: hasDetails && hasQuestionnaire && hasCosting,
    };
  }, [enquiry, questionnaireFiles, costingFiles]);

  const handleLaunchAutomation = async () => {
    if (!enquiryId) {
      showToast('Action Required', 'Please save the enquiry first before launching automation.', 'warning');
      return;
    }
    try {
      const res = await rfqService.getAutomationUrl(enquiryId);
      if (res.targetUrl) {
        window.open(res.targetUrl, '_blank', 'noopener,noreferrer');
        showToast('Automation Launched 🚀', 'RFQ & customer details sent to automation platform!', 'success');
      } else {
        throw new Error('Automation URL not returned');
      }
    } catch (err: any) {
      const baseUrl = (process.env.NEXT_PUBLIC_AUTOMATION_URL || 'https://automation.encon.co.in').trim();
      const params = new URLSearchParams({
        rfq_id: enquiry.rfqId || '',
        enquiry_id: String(enquiry.id || enquiryId),
        company: enquiry.companyName || '',
        contact: enquiry.contactPerson || '',
        email: enquiry.email || '',
        mobile: enquiry.mobile || '',
        item: enquiry.itemDescription || '',
        type: enquiry.type || '',
        salesResponsibility: enquiry.salesResponsibility || '',
        technical: enquiry.technical || '',
        assignedTo: enquiry.assignedTo || '',
      });
      const sep = baseUrl.includes('?') ? '&' : '?';
      window.open(`${baseUrl}${sep}${params.toString()}`, '_blank', 'noopener,noreferrer');
      showToast('Automation Launched 🚀', 'RFQ details prefilled into automation page!', 'success');
    }
  };

  const setEnquiry = (updater: any) => {
    if (typeof updater === 'function') {
      setEnquiryForm((prev) => updater({ ...enquiry, ...prev }));
    } else {
      setEnquiryForm((prev) => ({ ...prev, ...updater }));
    }
  };

  const loading = !isNew && loadingEnquiry;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let payloadToSave: Partial<Enquiry> = { ...enquiry };

      if (callNote.trim()) {
        const timestampHeader = `[Call Log - ${callDate}]`;
        const newEntry = `${timestampHeader} ${callNote.trim()}`;
        const updatedFollowup = enquiry.followupRemarks ? `${newEntry}\n\n${enquiry.followupRemarks}` : newEntry;
        payloadToSave = {
          ...payloadToSave,
          lastCallDate: callDate,
          nextActionDate: nextFollowup || enquiry.nextActionDate || '',
          followupRemarks: updatedFollowup,
        };
        setCallNote('');
      }

      if (isNew) {
        const res = await rfqService.createEnquiry(payloadToSave);
        showToast('Success', 'Enquiry created successfully', 'success');
        if (res.data?.id) {
          router.push(`/rfq/${res.data.id}`);
        }
      } else if (enquiryId) {
        await rfqService.updateEnquiry(enquiryId, payloadToSave);
        await queryClient.invalidateQueries({ queryKey: ['enquiry', enquiryId] });
        await queryClient.invalidateQueries({ queryKey: ['rfq-tracker'] });
        setEnquiryForm({});
        showToast('Success', 'Enquiry updated successfully', 'success');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to save enquiry', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendForReview = () => {
    if (!enquiryId) return;

    if (!reviewChecklist.isReady) {
      const missing: string[] = [];
      if (!reviewChecklist.hasDetails) missing.push('Enquiry Customer Details');
      if (!reviewChecklist.hasQuestionnaire) missing.push('Filled Questionnaire / RFQ Document');
      if (!reviewChecklist.hasCosting) missing.push('Technical Calculation & Costing Sheet');

      showToast(
        'Checklist Incomplete',
        `Please complete the following required items before sending for review:\n• ${missing.join('\n• ')}`,
        'error'
      );
      return;
    }

    showConfirm({
      title: 'Send for Review?',
      message: 'All required items (Enquiry Details, Questionnaire, Technical Calc & Costing Sheet) are completed. Send to Management for Review?',
      confirmText: 'Send Review',
      type: 'info',
      onConfirm: async () => {
        try {
          await rfqService.sendForReview(enquiryId);
          queryClient.invalidateQueries({ queryKey: ['enquiry', enquiryId] });
          showToast('Status Updated', 'Enquiry marked Under Review and management notified!', 'success');
        } catch (err: any) {
          showToast('Review Error', `Failed to send for review: ${err.message}`, 'error');
        }
      },
    });
  };

  const handleResolveFeedback = async () => {
    if (!enquiryId) return;
    try {
      const cleanRemarks = (enquiry.remarks || '').replace(/\[Review Feedback\]:[^\n]*/g, '').trim();
      const cleanFollowup = (enquiry.followupRemarks || '').replace(/\[Review Feedback\]:[^\n]*/g, '[Feedback Addressed]').trim();
      await rfqService.updateEnquiry(enquiryId, {
        remarks: cleanRemarks,
        followupRemarks: cleanFollowup,
      });
      queryClient.invalidateQueries({ queryKey: ['enquiry', enquiryId] });
      queryClient.invalidateQueries({ queryKey: ['rfq-tracker'] });
      showToast('Feedback Resolved', 'Review feedback marked as resolved!', 'success');
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to mark feedback as resolved', 'error');
    }
  };

  const handleUploadAttachment = async (kind: 'costing' | 'offer' | 'questionnaire' | 'technical' | string, file: File | null) => {
    if (!file) return;
    try {
      let targetId = enquiryId;

      if (isNew || !targetId) {
        const res = await rfqService.createEnquiry({
          ...enquiry,
          companyName: enquiry.companyName || 'New Customer',
          itemDescription: enquiry.itemDescription || 'New RFQ Requirement',
        });
        targetId = res.data?.id;
        if (!targetId) throw new Error('Failed to generate Enquiry entry for attachment');
        router.push(`/rfq/${targetId}`);
      }

      const res = await rfqService.uploadAttachment(targetId, file, kind);
      queryClient.invalidateQueries({ queryKey: ['enquiry', targetId] });
      if (res?.targetEnquiryId && res.targetEnquiryId !== targetId) {
        queryClient.invalidateQueries({ queryKey: ['enquiry', res.targetEnquiryId] });
      }
      queryClient.invalidateQueries({ queryKey: ['rfq-tracker'] });

      const cleanNo = (res?.extracted?.enquiryNo || res?.extracted?.offerNo || '').trim();

      if (kind === 'offer' && cleanNo) {
        showToast(
          'Offer Mapped 🎯',
          `Extracted Enquiry No: ${cleanNo.substring(0, 50)}`,
          'success'
        );
      } else if (kind === 'offer') {
        showToast('Offer Attached', 'Offer document uploaded successfully', 'success');
      } else if (kind === 'questionnaire') {
        showToast('Questionnaire Uploaded', 'Filled Questionnaire / RFQ document uploaded successfully', 'success');
      } else if (kind === 'costing') {
        showToast('Costing Sheet Uploaded', 'Technical calculation & costing sheet uploaded successfully', 'success');
      } else {
        showToast('Document Uploaded', 'Attachment uploaded successfully', 'success');
      }
    } catch (err: any) {
      showToast('Upload Error', `Failed to upload attachment: ${err.message}`, 'error');
    }
  };

  const handleDeleteAttachment = (attId: string | number) => {
    showConfirm({
      title: 'Delete Attachment?',
      message: 'Are you sure you want to remove this file attachment?',
      confirmText: 'Delete File',
      type: 'danger',
      onConfirm: async () => {
        try {
          await rfqService.deleteAttachment(attId);
          if (enquiryId) {
            queryClient.invalidateQueries({ queryKey: ['enquiry', enquiryId] });
          }
          showToast('File Removed', 'Attachment deleted successfully', 'info');
        } catch (err: any) {
          showToast('Delete Error', `Failed to delete attachment: ${err.message}`, 'error');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="w-8 h-8 text-thermal-500 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Loading Enquiry details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-r dark:from-obsidian-900 dark:via-slate-900 dark:to-obsidian-950 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/rfq')}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700 shrink-0"
            title="Back to RFQ Tracker"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-wide flex flex-wrap items-center gap-2">
              {isNew ? 'New Enquiry' : `Enquiry Detail · ${enquiry.rfqId || ''}`}
              {enquiry.status && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold border border-cyan-500/30">
                  {enquiry.status}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isNew ? 'Create new customer RFQ entry' : `Received on ${enquiry.dateReceived || enquiry.receivedOn || 'N/A'}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-2.5 w-full md:w-auto shrink-0">
          {!isNew && (
            <>
              <button
                type="button"
                onClick={async () => {
                  if (!enquiryId) return;
                  try {
                    if (enquiry.driveFolderUrl) {
                      window.open(enquiry.driveFolderUrl, '_blank');
                    } else {
                      showToast('Drive Folder', 'Ensuring Google Drive Folder structure...', 'info');
                      const res = await rfqService.openDriveFolder(enquiryId);
                      if (res.driveFolderUrl) {
                        window.open(res.driveFolderUrl, '_blank');
                        queryClient.invalidateQueries({ queryKey: ['enquiry', enquiryId] });
                      } else {
                        showToast('Drive Folder', 'Google Drive sync fallback activated', 'info');
                      }
                    }
                  } catch (err: any) {
                    showToast('Drive Error', err.message || 'Failed to open Drive folder', 'error');
                  }
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 shadow-2xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                title="Open Google Drive folder structure for this RFQ (Client documents, Technical Calcs, Costing & Offer)"
              >
                <Folder className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Open Drive
              </button>

              <button
                type="button"
                onClick={handleLaunchAutomation}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 shadow-2xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                title="Push customer & RFQ parameters to Offer & Costing Automation engine"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" /> Send to Automation
              </button>
            </>
          )}
          {canEdit && enquiry.status !== 'Incomplete' && (
            <button
              type="button"
              onClick={() => {
                setEnquiryForm((prev) => ({ ...prev, status: 'Incomplete' }));
                showToast('Marked Incomplete', 'RFQ status updated to Incomplete. Fill in missing client details below.', 'info');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap"
              title="Mark RFQ status as Incomplete (Missing client data or drawings)"
            >
              <AlertCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" /> Mark Incomplete
            </button>
          )}
          {canReview && enquiry.status === 'Under review' && enquiry.id && (
            <button
              type="button"
              onClick={() => router.push(`/review/${enquiry.id}`)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <CheckSquare className="w-3.5 h-3.5 shrink-0" /> Open Review Portal
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push('/rfq')}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-center"
          >
            Cancel
          </button>
          {canEdit ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4.5 py-2 rounded-md text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          ) : (
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center gap-1 whitespace-nowrap">
              🔒 Read-Only
            </span>
          )}
        </div>
      </div>

      {/* ADMIN REVIEW FEEDBACK BANNER (IF REJECTED / CHANGES REQUESTED) */}
      {(enquiry.followupRemarks?.includes('[Review Feedback]') || enquiry.remarks?.includes('[Review Feedback]')) && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 shadow-lg flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                ⚠️ Admin Review Feedback — Changes Requested
              </h4>
              <p className="text-xs text-rose-200 leading-relaxed font-semibold">
                {enquiry.remarks?.includes('[Review Feedback]')
                  ? enquiry.remarks.replace('[Review Feedback]:', '').trim()
                  : enquiry.followupRemarks?.substring(enquiry.followupRemarks.indexOf('[Review Feedback]')).replace('[Review Feedback]:', '').trim()}
              </p>
              <p className="text-[11px] text-rose-400/80 mt-0.5">
                This RFQ has been sent back to <strong>Open</strong> status. Please update the details, costing, or questionnaire and resubmit for review once ready.
              </p>
            </div>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={handleResolveFeedback}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all shrink-0 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved ✓
            </button>
          )}
        </div>
      )}


      {/* MAIN LAYOUT: 2 CONTAINERS */}
      <div className="space-y-4 w-full">
        {/* CONTAINER 1: FLEX ROW (EMAIL/CHATBOT BOX ON LEFT + COSTING/ATTACHMENTS PANEL ON RIGHT) */}
        {enquiry.emailBody && (
          <div className="flex flex-col lg:flex-row items-stretch gap-4 w-full">
            {/* LEFT FLEX CHILD: Email Reader & Chatbot Box */}
            <div className="flex-1 min-w-0 h-full">
              <GmailEmailViewer
                rawContent={enquiry.emailBody}
                fromName={enquiry.contactPerson || 'Customer'}
                fromEmail={enquiry.email || ''}
                date={enquiry.dateReceived || enquiry.receivedOn || ''}
                subject={enquiry.itemDescription || ''}
                attachments={enquiry.attachments || []}
                onSelectImage={(img) => setSelectedImage(img)}
              />
            </div>

            {/* RIGHT FLEX CHILD: Technical Costing, Offer Uploads & Inbox Attachments Card */}
            {!isNew && (
              <div className="glass-card p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-4 w-full lg:w-96 shrink-0 flex flex-col justify-between h-full">
                <div className="space-y-5 min-h-[350px] h-[52vh] max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Document Center
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Specifications, technical calculations & costing
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!enquiryId) return;
                        try {
                          if (enquiry.driveFolderUrl) {
                            window.open(enquiry.driveFolderUrl, '_blank');
                          } else {
                            showToast('Drive Setup', 'Opening Google Drive RFQ folder...', 'info');
                            const res = await rfqService.openDriveFolder(enquiryId);
                            if (res.driveFolderUrl) {
                              window.open(res.driveFolderUrl, '_blank');
                              queryClient.invalidateQueries({ queryKey: ['enquiry', enquiryId] });
                            } else {
                              showToast('Drive Setup Required', 'Google Drive credentials not configured in backend/.env', 'warning');
                            }
                          }
                        } catch (err: any) {
                          showToast('Drive Error', err.message || 'Failed to open Drive folder', 'error');
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Open Google Drive folder"
                    >
                      Google Drive
                    </button>
                  </div>

                  {[
                    { key: 'questionnaire', title: 'Questionnaire / RFQ Docs', files: questionnaireFiles, placeholder: 'Upload Questionnaire / RFQ Doc', emptyMsg: 'No questionnaire or RFQ document attached' },
                    { key: 'costing', title: 'Technical Calc & Costing Sheet', files: costingFiles, placeholder: 'Upload Technical Calc & Costing Sheet', emptyMsg: 'No technical calc or costing sheet attached' },
                    { key: 'offer', title: 'Offer Documents', files: offerFiles, placeholder: 'Upload Offer Document', emptyMsg: 'No offer document attached' },
                    { key: 'inbox', title: 'Email Inbox Attachments', files: inboxAttachments, placeholder: null, emptyMsg: 'No email inbox attachments' },
                  ].map((cat, idx) => (
                    <div key={cat.key} className={`space-y-2 ${idx > 0 ? 'pt-3 border-t border-slate-200 dark:border-slate-800' : ''}`}>
                      <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                        <span>{cat.title}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({cat.files.length})</span>
                      </div>

                      {cat.placeholder && (
                        <label className="w-full p-2 rounded-md bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer flex items-center justify-between transition-all">
                          <span>{cat.placeholder}</span>
                          <span className="text-[11px] text-slate-500 font-medium">Browse</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleUploadAttachment(cat.key, e.target.files?.[0] || null)}
                          />
                        </label>
                      )}

                      {cat.files.length > 0 ? (
                        <div className="flex flex-row items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                          {cat.files.map((att: Attachment) =>
                            isImageFile(att) ? (
                              <div
                                key={att.id}
                                className="group relative shrink-0 w-28 h-20 rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1 flex flex-col justify-between"
                              >
                                <div
                                  className="w-full h-13 relative rounded overflow-hidden bg-slate-200 dark:bg-slate-900 flex items-center justify-center cursor-pointer"
                                  onClick={() => setSelectedImage({ src: getAttachmentUrl(att.id), filename: att.filename })}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={getAttachmentUrl(att.id)}
                                    alt={att.filename}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 pt-0.5">
                                  <span className="truncate max-w-[70px]" title={att.filename}>{att.filename}</span>
                                  <div className="flex items-center gap-1">
                                    <a href={getAttachmentUrl(att.id, true)} target="_blank" rel="noopener noreferrer" download={att.filename} title="Download">
                                      <Download className="w-3 h-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200" />
                                    </a>
                                    <button type="button" onClick={() => handleDeleteAttachment(att.id)} title="Delete" className="text-slate-400 hover:text-rose-500">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                key={att.id}
                                className="shrink-0 w-44 p-2 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-1 text-xs shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                              >
                                <span className="truncate font-medium text-slate-800 dark:text-slate-200 text-xs" title={att.filename}>
                                  {att.filename}
                                </span>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-1">
                                  <span className="font-mono">{formatFileSize(att.size)}</span>
                                  <div className="flex items-center gap-1.5">
                                    <a
                                      href={getAttachmentUrl(att.id, false)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Preview in Browser"
                                      className="text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </a>
                                    <a
                                      href={getAttachmentUrl(att.id, true)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download={att.filename}
                                      title="Download File"
                                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAttachment(att.id)}
                                      title="Delete Attachment"
                                      className="text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="py-2 px-2.5 rounded bg-slate-50 dark:bg-slate-900/30 text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                          {cat.emptyMsg}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Send For Review Action / Status Banner */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
                  {enquiry.status === 'Under review' ? (
                    <div className="w-full py-2 rounded-md text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 text-center">
                      Status: Under Review
                    </div>
                  ) : enquiry.status === 'Offer Sent' ? (
                    <div className="w-full py-2 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 text-center">
                      Status: Offer Sent
                    </div>
                  ) : enquiry.status === 'PO Received' ? (
                    <div className="w-full py-2 rounded-md text-xs font-medium bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900/50 text-center">
                      Status: PO Received
                    </div>
                  ) : enquiry.status === 'Approved' ? (
                    <div className="w-full py-2 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 text-center">
                      Status: Approved
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={handleSendForReview}
                        className="w-full py-2 rounded-md text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                      >
                        Submit for Review
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTAINER 2: MAIN CUSTOMER & ENQUIRY DETAILS FORM (FULL WIDTH) */}
        <form onSubmit={handleSave} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6 w-full shadow-2xl">
          {/* Customer Info */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-thermal-400 uppercase tracking-wider">Customer Information</h3>
              {isTechnicalOnly && (
                <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  🔒 Read-Only Fields (Technical Role)
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={enquiry.companyName || ''}
                  onChange={(e) => setEnquiry({ ...enquiry, companyName: e.target.value })}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-thermal-500 focus:outline-none ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Contact Person</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={enquiry.contactPerson || ''}
                  onChange={(e) => setEnquiry({ ...enquiry, contactPerson: e.target.value })}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-thermal-500 focus:outline-none ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Mobile</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={enquiry.mobile || ''}
                  onChange={(e) => setEnquiry({ ...enquiry, mobile: e.target.value })}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-thermal-500 focus:outline-none ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  disabled={!canEdit}
                  value={enquiry.email || ''}
                  onChange={(e) => setEnquiry({ ...enquiry, email: e.target.value })}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-thermal-500 focus:outline-none ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Enquiry & Assignment */}
          <div>
            <h3 className="text-xs font-bold text-thermal-400 uppercase tracking-wider mb-3">Enquiry & Assignment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Item Description *</label>
                <textarea
                  rows={3}
                  required
                  disabled={!canEdit}
                  value={enquiry.itemDescription || ''}
                  onChange={(e) => setEnquiry({ ...enquiry, itemDescription: e.target.value })}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-thermal-500 focus:outline-none ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Technical Person (Assignee) *</label>
                <select
                  disabled={!canEdit}
                  value={enquiry.technical || enquiry.assignedTo || ''}
                  onChange={(e) => setEnquiry({ ...enquiry, technical: e.target.value, assignedTo: e.target.value })}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none ${!canEdit ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <option value="">Select Technical Assignee...</option>
                  {technicalDirectory.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name} {item.email ? `(${item.email})` : ''}
                    </option>
                  ))}
                  {enquiry.technical && !technicalDirectory.some((d) => d.name === enquiry.technical) && (
                    <option value={enquiry.technical}>{enquiry.technical}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">TAT (Days)</label>
                <input
                  type="number"
                  disabled={!canEdit}
                  value={enquiry.tat || '30'}
                  onChange={(e) => setEnquiry({ ...enquiry, tat: e.target.value })}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Sales Responsibility</label>
                <select
                  disabled={!canEdit}
                  value={enquiry.salesResponsibility || ''}
                  onChange={(e) => setEnquiry({ ...enquiry, salesResponsibility: e.target.value })}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none ${!canEdit ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <option value="">Unassigned</option>
                  {salesDirectory.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name} {item.email ? `(${item.email})` : ''}
                    </option>
                  ))}
                  {enquiry.salesResponsibility && !salesDirectory.some((d) => d.name === enquiry.salesResponsibility) && (
                    <option value={enquiry.salesResponsibility}>{enquiry.salesResponsibility}</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Offer & Status */}
          <div>
            <h3 className="text-xs font-bold text-thermal-400 uppercase tracking-wider mb-3">Offer Mapping & Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-indigo-400 mb-1">Offer Number</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  placeholder="e.g. ENC/OFR/2026/044"
                  value={enquiry.offerNo || ''}
                  onChange={(e) => setEnquiry({ ...enquiry, offerNo: e.target.value })}
                  className={`w-full bg-slate-950 border border-indigo-900/80 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-indigo-400 mb-1">Offer Date</label>
                <input
                  type="date"
                  disabled={!canEdit}
                  value={enquiry.offerDate || ''}
                  onChange={(e) => setEnquiry({ ...enquiry, offerDate: e.target.value })}
                  className={`w-full bg-slate-950 border border-indigo-900/80 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status</label>
                <select
                  disabled={!canEdit}
                  value={enquiry.status || 'Open'}
                  onChange={(e) => setEnquiry({ ...enquiry, status: e.target.value })}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-thermal-500 focus:outline-none ${!canEdit ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  value={enquiry.remarks || ''}
                  onChange={(e) => setEnquiry({ ...enquiry, remarks: e.target.value })}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-thermal-500 focus:outline-none ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Incomplete Data & Pending Client Information (Show ONLY when status is Incomplete or pendingRemarks exist) */}
          {(enquiry.status === 'Incomplete' || Boolean(enquiry.pendingRemarks?.trim())) && (
            <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border-l-4 border-l-amber-500 border border-amber-200 dark:border-amber-900/40 space-y-3 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                    Incomplete Data & Pending Requirements
                  </h3>
                </div>
                {enquiry.status === 'Incomplete' && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
                    STATUS: INCOMPLETE
                  </span>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Missing Information / Client Pending Remarks
                </label>
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  placeholder="e.g. Pending client specification drawing, gas flow rate & inlet temperature input."
                  value={enquiry.pendingRemarks || ''}
                  onChange={(e) => setEnquiry({ ...enquiry, pendingRemarks: e.target.value })}
                  className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none font-sans font-medium shadow-xs ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Specify technical details or drawings required from client to proceed with estimation & offer generation.
                </p>
              </div>
            </div>
          )}

          {/* Client Call & Interaction Logger */}
          <div className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Client Call & Follow-up History Log
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Record discussions, follow-ups, and track who wrote each remark entry.
                  </p>
                </div>
              </div>
              {enquiry.lastCallDate && (
                <span className="text-[11px] px-3 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold border border-slate-300/60 dark:border-slate-700">
                  Last Call: {enquiry.lastCallDate}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1">Log Type:</span>
                {[
                  { key: 'Call', label: '📞 Phone Call' },
                  { key: 'Followup', label: '🔄 Follow-up' },
                  { key: 'Email', label: '✉️ Email' },
                  { key: 'Meeting', label: '🤝 Meeting' },
                  { key: 'Remark', label: '📝 Remark' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFollowupType(t.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${followupType === t.key
                      ? 'bg-cyan-600 text-white border-cyan-500 font-bold shadow-xs'
                      : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-cyan-400'
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={callDate}
                    onChange={(e) => setCallDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500 focus:outline-none shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={nextFollowup || enquiry.nextActionDate || ''}
                    onChange={(e) => {
                      setNextFollowup(e.target.value);
                      setEnquiry({ ...enquiry, nextActionDate: e.target.value });
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500 focus:outline-none shadow-xs"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={loggingCall}
                    onClick={handleLogCall}
                    className="w-full py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> {loggingCall ? 'Saving...' : `Add ${followupType} Entry`}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Follow-up / Call Notes & Discussion Details *</label>
                <textarea
                  rows={2}
                  placeholder={`Enter ${followupType.toLowerCase()} discussion details, customer commitments, technical requirements...`}
                  value={callNote}
                  onChange={(e) => setCallNote(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none font-medium shadow-xs"
                />
              </div>
            </div>

            {/* Timeline History List */}
            {followupsList.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Follow-up & Remarks Timeline ({followupsList.length})
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Newest first</span>
                </div>
                <div className="bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-h-64 overflow-y-auto space-y-2.5 custom-scrollbar">
                  {followupsList.map((entry: any, idx: number) => {
                    const typeLabel = entry.type || 'Remark';
                    const isCall = typeLabel === 'Call';
                    const isEmail = typeLabel === 'Email';
                    const isMeeting = typeLabel === 'Meeting';

                    const formattedDate = entry.createdAt
                      ? (isNaN(new Date(entry.createdAt).getTime()) ? entry.createdAt : new Date(entry.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
                      : 'N/A';

                    return (
                      <div
                        key={entry._id || entry.id || idx}
                        className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/90 shadow-2xs space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${isCall
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : isEmail
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                  : isMeeting
                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                }`}
                            >
                              {typeLabel}
                            </span>
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-slate-100">
                              <UserCheck className="w-3.5 h-3.5 text-cyan-500" />
                              <span>{entry.author || 'User'}</span>
                            </div>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {formattedDate}
                          </div>
                        </div>

                        <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium whitespace-pre-wrap pt-0.5">
                          {entry.note}
                        </div>

                        {entry.nextActionDate && (
                          <div className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 pt-1">
                            <Clock className="w-3 h-3" /> Next Follow-up Scheduled: {entry.nextActionDate}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => router.push('/rfq')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Back to Tracker
            </button>
            {canEdit ? (
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all flex items-center gap-1.5"
              >
                {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            ) : (
              <span className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                🔒 Read-Only (Document Upload Only)
              </span>
            )}
          </div>
        </form>
      </div>

      {/* AUDIT TRAIL & STATUS ACTIVITY LOG TIMELINE */}
      {!isNew && (
        <div className="glass-card p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-thermal-400" /> Status Tracking & Audit Activity History
            </h3>
            <span className="text-[11px] text-slate-400">Tracks status changes, file uploads & admin approvals</span>
          </div>

          {historyLogs.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs italic">
              No status changes or file upload logs recorded yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {historyLogs.map((log) => {
                let parsed: any = {};
                try {
                  parsed = log.details ? JSON.parse(log.details) : {};
                } catch (e) {
                  parsed = {};
                }

                const logTime = new Date(log.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const actor = log.userEmail || parsed.updatedBy || parsed.uploadedBy || 'Team Member';

                return (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between text-xs gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-thermal-400 shrink-0 mt-0.5">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white truncate">{actor}</span>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-thermal-500/10 text-thermal-400 border border-thermal-500/20 font-bold uppercase">
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-slate-300 text-[11px] leading-relaxed">
                          {parsed.oldStatus && parsed.newStatus ? (
                            <span>
                              Changed status from <strong className="text-amber-400 font-semibold">{parsed.oldStatus}</strong> ➔ <strong className="text-emerald-400 font-semibold">{parsed.newStatus}</strong>
                            </span>
                          ) : parsed.filename ? (
                            <span>
                              Uploaded file: <strong className="text-cyan-400 font-semibold">{parsed.filename}</strong> ({parsed.kind || 'Attachment'})
                            </span>
                          ) : parsed.remarks ? (
                            <span>
                              Review remarks: <strong className="text-rose-300 italic">&quot;{parsed.remarks}&quot;</strong>
                            </span>
                          ) : (
                            <span>{log.action}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap font-mono">{logTime}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PAGE-LEVEL FULL-SCREEN IMAGE / GIF LIGHTBOX MODAL */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full text-white px-2">
              <span className="text-sm font-semibold truncate max-w-md font-mono">{selectedImage.filename}</span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedImage.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={selectedImage.filename}
                  className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="relative w-full h-[75vh] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
              <Image
                src={selectedImage.src}
                alt={selectedImage.filename}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
