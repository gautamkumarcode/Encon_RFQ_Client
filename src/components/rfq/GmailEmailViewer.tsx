"use client";

import React, { useMemo, useRef, useState } from "react";
import { Download, ExternalLink, Image as ImageIcon, Send, X } from "lucide-react";
import { Attachment } from "../../services/rfqService";
import {
	decodeHtmlEntities,
	isEnconCompanyAddr,
	parseEmailThreadMessages,
	stripImapFraming,
	ThreadMessage,
} from "../../utils/emailParser";

interface GmailEmailViewerProps {
	rawContent: string;
	fromName?: string;
	fromEmail?: string;
	date?: string;
	subject?: string;
	attachments?: Attachment[];
	onSelectImage?: (img: { src: string; filename: string }) => void;
}

export function GmailEmailViewer({
	rawContent,
	fromName,
	fromEmail,
	date,
	subject,
	attachments = [],
	onSelectImage,
}: GmailEmailViewerProps) {
	const [viewMode, setViewMode] = useState<"original" | "gmail" | "chat">("gmail");
	const [internalSelectedImage, setInternalSelectedImage] = useState<{
		src: string;
		filename: string;
	} | null>(null);
	const [iframeHeight, setIframeHeight] = useState(450);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	const cleanBody = (text: string): { srcDoc: string; plainText: string } => {
		if (!text) return { srcDoc: "", plainText: "" };

		let cleaned = stripImapFraming(text)
			.replace(/Content-Type:\s*text\/[a-z]+;?\s*charset="?[a-z0-9_-]+"?/gi, "")
			.replace(/Content-Transfer-Encoding:\s*quoted-printable/gi, "")
			.replace(/Content-Transfer-Encoding:\s*8bit/gi, "")
			.replace(/--[a-zA-Z0-9_.-]+--?/g, "")
			.trim();

		if (
			cleaned.includes("=3D") ||
			cleaned.includes("=20") ||
			cleaned.includes("=\r\n") ||
			cleaned.includes("=\n")
		) {
			cleaned = cleaned
				.replace(/=\r?\n/g, "")
				.replace(/=3D/g, "=")
				.replace(/=20/g, " ")
				.replace(/=0A/gi, "\n")
				.replace(/=0D/gi, "");
		}

		const isHtml = /<html|<body|<div|<p|<table|<br/i.test(cleaned);

		let srcDoc = "";
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
			const safeText = decodeHtmlEntities(cleaned)
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;");
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
				.replace(/<style[\s\S]*?<\/style>/gi, "")
				.replace(/<script[\s\S]*?<\/script>/gi, "")
				.replace(/<[^>]+>/g, " ")
				.replace(/\s+/g, " "),
		).trim();

		return { srcDoc, plainText };
	};

	const { srcDoc, plainText } = cleanBody(rawContent);

	const handleIframeLoad = () => {
		try {
			if (iframeRef.current && iframeRef.current.contentWindow) {
				const bodyHeight =
					iframeRef.current.contentWindow.document.body.scrollHeight;
				if (bodyHeight > 100) {
					setIframeHeight(Math.min(Math.max(bodyHeight + 40, 250), 700));
				}
			}
		} catch (e) {}
	};

	const chatMessages = useMemo(() => {
		return parseEmailThreadMessages(
			rawContent,
			fromName || "Customer",
			fromEmail || "",
			date || "",
		);
	}, [rawContent, fromName, fromEmail, date]);

	const displaySenderName = useMemo(() => {
		const isClientEmail = fromEmail && !isEnconCompanyAddr(fromEmail);
		const isInternalName = (n?: string) => {
			if (!n) return false;
			const lower = n.toLowerCase();
			return ["nutan", "shikha", "rupanjana", "encon"].some((k) =>
				lower.includes(k),
			);
		};
		if (isClientEmail && isInternalName(fromName)) {
			return "Customer";
		}
		return fromName || "Customer";
	}, [fromName, fromEmail]);

	const firstReceivedDate = useMemo(() => {
		if (chatMessages.length > 0) {
			const oldest = chatMessages[chatMessages.length - 1];
			if (oldest.date) return oldest.date;
		}
		return date || "Recent";
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
						{(displaySenderName || "CU").substring(0, 2).toUpperCase()}
					</div>
					<div>
						<h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
							{displaySenderName}
							{fromEmail && (
								<span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-normal">
									&lt;{fromEmail}&gt;
								</span>
							)}
						</h4>
						<p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
							Subject:{" "}
							<span className="text-slate-800 dark:text-slate-200 font-medium">
								{subject}
							</span>{" "}
							· First Received:{" "}
							<span className="text-emerald-600 dark:text-emerald-400 font-semibold">
								{firstReceivedDate}
							</span>
							{latestUpdateDate && (
								<>
									{" "}
									· Last Update:{" "}
									<span className="text-cyan-600 dark:text-cyan-400 font-medium">
										{latestUpdateDate}
									</span>
								</>
							)}
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{fromEmail && (
						<a
							href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(fromEmail)}&su=RE: ${encodeURIComponent(subject || "")}`}
							target="_blank"
							rel="noopener noreferrer"
							className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-2xs transition-all flex items-center gap-1.5">
							<Send className="w-3.5 h-3.5" /> Reply{" "}
							<ExternalLink className="w-3 h-3" />
						</a>
					)}

					<div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs max-w-full overflow-x-auto custom-scrollbar shrink-0 whitespace-nowrap">
						<button
							type="button"
							onClick={() => setViewMode("original")}
							className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 whitespace-nowrap transition-all ${
								viewMode === "original"
									? "bg-cyan-600 text-white font-bold shadow-2xs"
									: "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
							}`}>
							Original Email Body
						</button>
						<button
							type="button"
							onClick={() => setViewMode("gmail")}
							className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 whitespace-nowrap transition-all ${
								viewMode === "gmail"
									? "bg-cyan-600 text-white font-bold shadow-2xs"
									: "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
							}`}>
							Gmail Reader Box
						</button>
						<button
							type="button"
							onClick={() => setViewMode("chat")}
							className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 whitespace-nowrap transition-all ${
								viewMode === "chat"
									? "bg-cyan-600 text-white font-bold shadow-2xs"
									: "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
							}`}>
							Text Chat View ({chatMessages.length})
						</button>
					</div>
				</div>
			</div>

			<div className="flex-1 min-h-[350px] h-[52vh] max-h-[55vh]">
				{viewMode === "original" ? (
					<div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 h-full max-h-[55vh] overflow-y-auto overflow-x-auto custom-scrollbar">
						<div className="text-xs text-slate-500 dark:text-slate-400 font-mono pb-2 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md z-10 pt-1">
							<div>
								From{" "}
								<strong className="text-slate-800 dark:text-slate-200">
									{fromName || "Customer"}
								</strong>{" "}
								{fromEmail && `<${fromEmail}>`} {date && `· ${date}`}
							</div>
							<div className="font-semibold text-slate-700 dark:text-slate-300">
								{subject}
							</div>
						</div>
						<pre className="whitespace-pre-wrap break-words font-sans text-xs text-slate-800 dark:text-slate-200 leading-relaxed pt-1 select-text">
							{plainText || "(No email body content)"}
						</pre>
					</div>
				) : viewMode === "gmail" ? (
					<div className="rounded-xl border border-slate-200 bg-white shadow-inner overflow-hidden h-[54vh] max-h-[54vh]">
						<iframe
							ref={iframeRef}
							srcDoc={srcDoc}
							title="Gmail Email View"
							onLoad={handleIframeLoad}
							style={{ width: "100%", height: "100%", border: "none" }}
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
									className={`flex flex-col ${
										msg.isCompany
											? "items-end ml-auto max-w-[88%]"
											: "items-start mr-auto max-w-[88%]"
									}`}>
									<div
										className={`w-full p-4 rounded-2xl space-y-2.5 shadow-lg border transition-all ${
											msg.isCompany
												? "bg-gradient-to-br from-amber-950/40 via-slate-900 to-obsidian-950 border-r-4 border-r-amber-500 border-amber-500/30 text-slate-100"
												: "bg-gradient-to-br from-slate-900 via-slate-900 to-obsidian-950 border-l-4 border-l-cyan-500 border-slate-800 text-slate-200"
										}`}>
										<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2">
											<div className="flex items-center gap-2.5">
												<div
													className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center border ${
														msg.isCompany
															? "bg-amber-500/20 text-amber-400 border-amber-500/40"
															: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
													}`}>
													{(msg.sender || (msg.isCompany ? "EN" : "CU"))
														.substring(0, 2)
														.toUpperCase()}
												</div>
												<div>
													<h5 className="text-xs font-bold text-white flex items-center gap-2">
														{msg.sender}
														{msg.email && (
															<span className="text-[10px] text-slate-400 font-mono font-normal">
																&lt;{msg.email}&gt;
															</span>
														)}
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
												{msg.date && (
													<span className="text-[10px] text-slate-400 font-mono">
														{msg.date}
													</span>
												)}
											</div>
										</div>
										<div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans pt-1">
											{msg.body
												? msg.body
														.replace(/^--=[a-zA-Z0-9_.-]+.*$/gm, "")
														.replace(/^--[a-zA-Z0-9_.-]+--?$/gm, "")
														.replace(
															/^\s*(?:Content-Type|Content-Transfer-Encoding|Content-Disposition|Content-ID):\s*.*$/gim,
															"",
														)
														.replace(/^\s*filename="?[^";\r\n]+"?.*$/gim, "")
														.replace(/^\s*name="?[^";\r\n]+"?.*$/gim, "")
														.replace(/^[a-zA-Z0-9+/=]{60,}$/gm, "")
														.replace(/\n{3,}/g, "\n\n")
														.trim() || "(Attachment content included below)"
												: "(Empty message body)"}
										</div>
									</div>
								</div>
							))
						)}
					</div>
				)}
			</div>

			{/* Lightbox Modal */}
			{internalSelectedImage && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
					onClick={() => setInternalSelectedImage(null)}>
					<div
						className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3"
						onClick={(e) => e.stopPropagation()}>
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
									className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center gap-1.5">
									<Download className="w-3.5 h-3.5" /> Download
								</a>
								<button
									type="button"
									onClick={() => setInternalSelectedImage(null)}
									className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white">
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
									(e.target as HTMLImageElement).src =
										`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%230f172a"/><rect x="20" y="20" width="360" height="260" rx="12" fill="%231e293b" stroke="%23334155" stroke-width="2"/><text x="200" y="150" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="14" font-weight="bold">${encodeURIComponent(internalSelectedImage.filename)}</text></svg>`;
								}}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
