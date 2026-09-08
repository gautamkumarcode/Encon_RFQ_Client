"use client";

import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	CheckSquare,
	ChevronDown,
	ChevronUp,
	Clock,
	Download,
	ExternalLink,
	Eye,
	Folder,
	History,
	Image as ImageIcon,
	Phone,
	Plus,
	RefreshCw,
	Send,
	UserCheck,
	X,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React, { useMemo, useRef, useState } from "react";
import {
	ActivityLogItem,
	Attachment,
	DirectoryItem,
	Enquiry,
	rfqService,
} from "../../../../services/rfqService";

import { GmailEmailViewer } from "@/components/rfq/GmailEmailViewer";
import { getRolePermissions } from "@/utils/rfqPermissions";
import {
	isImageFile,
	formatFileSize,
	STATUS_OPTIONS,
	getAttachmentUrl,
} from "@/utils/rfqHelpers";

export default function EnquiryDetailPage() {
	const params = useParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { showToast, showConfirm } = useNotification();
	const { user } = useAuth();
	const {
		userRole,
		canReview,
		canEdit,
		canChangeAssignment,
		canChangeStatus,
		isTechnicalOnly,
	} = getRolePermissions(user?.role);
	const isNew = params.id === "new";
	const enquiryId = isNew ? null : (params.id as string);

	const [isCustomerDetailsCollapsed, setIsCustomerDetailsCollapsed] =
		useState(false);

	const defaultNewForm: Partial<Enquiry> = {
		type: "",
		companyName: "",
		contactPerson: "",
		mobile: "",
		email: "",
		itemDescription: "",
		assignedTo: "",
		tat: "30",
		salesResponsibility: "",
		technical: "",
		status: "Open",
		remarks: "",
		offerNo: "",
		offerDate: "",
	};

	const [enquiryForm, setEnquiryForm] = useState<Partial<Enquiry>>({});
	const [saving, setSaving] = useState(false);
	const [selectedImage, setSelectedImage] = useState<{
		src: string;
		filename: string;
	} | null>(null);

	// Client Call Logger State
	const [callDate, setCallDate] = useState(
		() => new Date().toISOString().split("T")[0],
	);
	const [callNote, setCallNote] = useState("");
	const [nextFollowup, setNextFollowup] = useState("");
	const [loggingCall, setLoggingCall] = useState(false);
	const [followupType, setFollowupType] = useState<string>("Call");

	const handleLogCall = async () => {
		if (!callNote.trim()) {
			showToast(
				"Call Note Required",
				"Please enter notes about the client conversation.",
				"warning",
			);
			return;
		}

		setLoggingCall(true);
		try {
			if (enquiryId) {
				const res = await rfqService.addFollowup(enquiryId, {
					type: followupType,
					note: callNote.trim(),
					nextActionDate: nextFollowup || enquiry.nextActionDate || "",
					lastCallDate: callDate,
				});

				if (res?.data) {
					queryClient.setQueryData(["enquiry", enquiryId], (oldData: any) => {
						if (!oldData) return oldData;
						const isWrapped = Boolean(oldData.data);
						const baseObj = isWrapped ? oldData.data : oldData;
						const updatedEnquiry = {
							...baseObj,
							followups: res.data.followups || baseObj.followups,
							remarks: res.data.remarks ?? baseObj.remarks,
							followupRemarks: res.data.followupRemarks ?? baseObj.followupRemarks,
							nextActionDate: res.data.nextActionDate ?? baseObj.nextActionDate,
							lastCallDate: res.data.lastCallDate ?? baseObj.lastCallDate,
						};
						return isWrapped ? { ...oldData, data: updatedEnquiry } : updatedEnquiry;
					});
				}
				queryClient.invalidateQueries({ queryKey: ["rfq-tracker"] });
			} else {
				const timestampHeader = `[${followupType} - ${callDate}]`;
				const newEntry = `${timestampHeader} ${callNote.trim()}`;
				const updatedFollowup = enquiry.followupRemarks
					? `${newEntry}\n\n${enquiry.followupRemarks}`
					: newEntry;
				setEnquiry({
					...enquiry,
					lastCallDate: callDate,
					nextActionDate: nextFollowup || enquiry.nextActionDate || "",
					followupRemarks: updatedFollowup,
				});
			}

			setCallNote("");
			showToast(
				"Follow-up Recorded",
				`${followupType} entry saved!`,
				"success",
			);
		} catch (err: any) {
			showToast("Error", err.message || "Failed to record follow-up", "error");
		} finally {
			setLoggingCall(false);
		}
	};

	const [sendingClientEmail, setSendingClientEmail] = useState(false);

	const handleSendClientEmail = async () => {
		if (!enquiryId) return;
		if (!enquiry.email) {
			showToast(
				"Client Email Missing",
				"Please enter a valid client email address first.",
				"warning",
			);
			return;
		}

		showConfirm({
			title: "Send Follow-up Email to Client?",
			message: `Send an official post-offer follow-up email to ${enquiry.contactPerson || enquiry.companyName} at <${enquiry.email}>?`,
			confirmText: "Send Email",
			type: "info",
			onConfirm: async () => {
				setSendingClientEmail(true);
				try {
					const res = await rfqService.sendClientFollowupEmail(enquiryId, {
						clientEmail: enquiry.email,
					});

					if (res?.data) {
						queryClient.setQueryData(["enquiry", enquiryId], (oldData: any) => {
							if (!oldData) return oldData;
							const isWrapped = Boolean(oldData.data);
							const baseObj = isWrapped ? oldData.data : oldData;
							const updatedEnquiry = {
								...baseObj,
								followups: res.data.followups || baseObj.followups,
								remarks: res.data.remarks ?? baseObj.remarks,
								followupRemarks:
									res.data.followupRemarks ?? baseObj.followupRemarks,
								nextActionDate:
									res.data.nextActionDate ?? baseObj.nextActionDate,
								lastCallDate: res.data.lastCallDate ?? baseObj.lastCallDate,
							};
							return isWrapped
								? { ...oldData, data: updatedEnquiry }
								: updatedEnquiry;
						});
					}
					queryClient.invalidateQueries({ queryKey: ["rfq-tracker"] });
					showToast(
						"Email Sent",
						`Post-offer follow-up email delivered to ${enquiry.email}`,
						"success",
					);
				} catch (err: any) {
					showToast(
						"Error",
						err.message || "Failed to send client follow-up email",
						"error",
					);
				} finally {
					setSendingClientEmail(false);
				}
			},
		});
	};

	// React Query: Directory Items
	const { data: directory = [] } = useQuery<DirectoryItem[]>({
		queryKey: ["directory"],
		queryFn: async () => {
			const res = await rfqService.getDirectory();
			return res.data || [];
		},
	});

	// Role-filtered directory lists for assignment dropdowns
	// Technical Person dropdown: shows ALL users in database
	const technicalDirectory = useMemo(() => {
		return directory;
	}, [directory]);

	// Sales Responsibility dropdown: shows ONLY Sales and Admin personnel
	const salesDirectory = useMemo(() => {
		return directory.filter((item) => {
			const r = (item.role || "").toUpperCase().trim();
			// Default legacy assignees without role are included, or match Sales/Admin roles
			if (!r) return true;
			return (
				r === "SALES_MARKETING" ||
				r === "SALES" ||
				r === "ADMIN" ||
				r === "CO" ||
				r === "GM" ||
				r.includes("SALES") ||
				r.includes("MARKETING") ||
				r.includes("ADMIN") ||
				r.includes("SUPER")
			);
		});
	}, [directory]);

	// React Query: Enquiry Details & History
	const { data: enquiryResponse, isLoading: loadingEnquiry } = useQuery({
		queryKey: ["enquiry", enquiryId],
		queryFn: async () => {
			if (!enquiryId) return null;
			const res = await rfqService.getEnquiryById(enquiryId);
			return res;
		},
		enabled: !isNew && !!enquiryId,
	});

	const fetchedEnquiry =
		enquiryResponse?.data ||
		(enquiryResponse &&
			typeof enquiryResponse === "object" &&
			("_id" in enquiryResponse || "rfqId" in enquiryResponse)
			? enquiryResponse
			: null);
	const historyLogs: ActivityLogItem[] = enquiryResponse?.history || [];

	const enquiry = useMemo(() => {
		const base = isNew ? defaultNewForm : fetchedEnquiry || {};
		return { ...base, ...enquiryForm };
	}, [fetchedEnquiry, enquiryForm, isNew]);

	// Helpers for matching legacy assignee strings / emails to canonical directory names
	const currentTechVal = enquiry.technical || enquiry.assignedTo || "";
	const matchedTechItem = useMemo(() => {
		if (!currentTechVal) return null;
		const norm = currentTechVal.trim().toLowerCase();
		return technicalDirectory.find(
			(d) =>
				d.name.toLowerCase() === norm ||
				(d.email && d.email.toLowerCase() === norm) ||
				(d.aliases && d.aliases.some((a) => a.toLowerCase() === norm)),
		);
	}, [technicalDirectory, currentTechVal]);
	const selectedTechValue = matchedTechItem ? matchedTechItem.name : currentTechVal;

	const currentSalesVal = enquiry.salesResponsibility || "";
	const matchedSalesItem = useMemo(() => {
		if (!currentSalesVal) return null;
		const norm = currentSalesVal.trim().toLowerCase();
		return salesDirectory.find(
			(d) =>
				d.name.toLowerCase() === norm ||
				(d.email && d.email.toLowerCase() === norm) ||
				(d.aliases && d.aliases.some((a) => a.toLowerCase() === norm)),
		);
	}, [salesDirectory, currentSalesVal]);
	const selectedSalesValue = matchedSalesItem ? matchedSalesItem.name : currentSalesVal;

	const followupsList = useMemo(() => {
		if (Array.isArray(enquiry.followups) && enquiry.followups.length > 0) {
			return [...enquiry.followups].reverse();
		}
		if (!enquiry.followupRemarks) return [];
		return enquiry.followupRemarks
			.split(/\n\n+/)
			.filter(Boolean)
			.map((entry: string, idx: number) => {
				const match = entry.match(/^\[([^\]]+)\]\s*([\s\S]*)/);
				if (match) {
					const headerParts = match[1].split(/\s*-\s*/);
					const rawType = (headerParts[0] || "Remark").trim();
					const author = (headerParts[1] || enquiry.assignedTo || enquiry.companyName || "Team Member").trim();
					const createdAt = (headerParts[2] || enquiry.dateReceived || "").trim();
					return {
						_id: `legacy-${idx}`,
						type: rawType,
						note: match[2].trim(),
						author,
						createdAt,
					};
				}
				return {
					_id: `legacy-${idx}`,
					type: "Remark",
					note: entry.trim(),
					author: enquiry.assignedTo || "Team Member",
					createdAt: enquiry.dateReceived || "",
				};
			});
	}, [
		enquiry.followups,
		enquiry.followupRemarks,
		enquiry.assignedTo,
		enquiry.companyName,
		enquiry.dateReceived,
	]);

	const questionnaireFiles = useMemo(() => {
		if (!enquiry.attachments) return [];
		return enquiry.attachments.filter(
			(a: Attachment) =>
				(a.kind &&
					(a.kind.toLowerCase() === "questionnaire" ||
						a.kind.toLowerCase() === "client_docs")) ||
				a.filename.toLowerCase().includes("questionnaire") ||
				a.filename.toLowerCase().includes("rfq") ||
				a.filename.toLowerCase().includes("spec") ||
				a.filename.toLowerCase().includes("req"),
		);
	}, [enquiry.attachments]);

	const costingFiles = useMemo(() => {
		if (!enquiry.attachments) return [];
		return enquiry.attachments.filter(
			(a: Attachment) =>
				(a.kind &&
					(a.kind.toLowerCase() === "costing" ||
						a.kind.toLowerCase() === "technical")) ||
				a.filename.toLowerCase().includes("costing") ||
				a.filename.toLowerCase().includes("cost") ||
				a.filename.toLowerCase().includes("calc") ||
				a.filename.toLowerCase().includes("technical") ||
				a.filename.toLowerCase().includes("price") ||
				a.filename.toLowerCase().includes("estimate") ||
				a.filename.toLowerCase().includes("sheet"),
		);
	}, [enquiry.attachments]);

	const offerFiles = useMemo(() => {
		if (!enquiry.attachments) return [];
		return enquiry.attachments.filter(
			(a: Attachment) =>
				(a.kind && a.kind.toLowerCase() === "offer") ||
				a.filename.toLowerCase().includes("offer") ||
				a.filename.toLowerCase().includes("quote") ||
				a.filename.toLowerCase().includes("proposal"),
		);
	}, [enquiry.attachments]);

	const inboxAttachments = useMemo(() => {
		if (!enquiry.attachments) return [];
		const raw = enquiry.attachments.filter(
			(a: Attachment) =>
				(!a.kind ||
					(a.kind.toLowerCase() !== "costing" &&
						a.kind.toLowerCase() !== "offer" &&
						a.kind.toLowerCase() !== "questionnaire" &&
						a.kind.toLowerCase() !== "technical")) &&
				!a.filename.toLowerCase().includes("costing") &&
				!a.filename.toLowerCase().includes("offer") &&
				!a.filename.toLowerCase().includes("questionnaire") &&
				!a.filename.toLowerCase().includes("technical") &&
				!a.filename.toLowerCase().includes("calc") &&
				!a.filename.toLowerCase().includes("quote"),
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
		const hasDetails = Boolean(
			enquiry.companyName &&
			enquiry.itemDescription &&
			(enquiry.email || enquiry.contactPerson),
		);
		const hasQuestionnaire =
			questionnaireFiles.length > 0 || Boolean(enquiry.emailBody);
		const hasCosting =
			costingFiles.length > 0 ||
			Boolean(
				enquiry.costing ||
				enquiry.technical ||
				enquiry.isMappedToOffer ||
				enquiry.offerNo,
			);

		return {
			hasDetails,
			hasQuestionnaire,
			hasCosting,
			isReady: hasDetails && hasQuestionnaire && hasCosting,
		};
	}, [enquiry, questionnaireFiles, costingFiles]);

	const handleLaunchAutomation = async () => {
		if (!enquiryId) {
			showToast(
				"Action Required",
				"Please save the enquiry first before launching automation.",
				"warning",
			);
			return;
		}
		try {
			const res = await rfqService.getAutomationUrl(enquiryId);
			if (res.targetUrl) {
				window.open(res.targetUrl, "_blank", "noopener,noreferrer");
				showToast(
					"Automation Launched",
					"Opening Offer Generator dashboard…",
					"success",
				);
			} else {
				throw new Error("Automation URL not returned");
			}
		} catch (err: any) {
			// Fallback: build the dashboard URL directly with just the identifiers.
			// The offer generator will pull client details from the Encon backend itself.
			const isLocal =
				typeof window !== "undefined" &&
				window.location.hostname.includes("localhost");
			const baseUrl = (
				process.env.NEXT_PUBLIC_AUTOMATION_URL ||
				(isLocal ? "http://localhost:8000" : "https://automation.encon.co.in")
			).trim();
			const params = new URLSearchParams({
				enquiry_id: String(enquiry.id || enquiryId),
				rfq_id: enquiry.rfqId || "",
			});
			window.open(
				`${baseUrl.replace(/\/+$/, "")}/?${params.toString()}`,
				"_blank",
				"noopener,noreferrer",
			);
			showToast(
				"Automation Launched 🚀",
				"Opening Offer Generator dashboard…",
				"success",
			);
		}
	};

	const setEnquiry = (updater: any) => {
		if (typeof updater === "function") {
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
				const updatedFollowup = enquiry.followupRemarks
					? `${newEntry}\n\n${enquiry.followupRemarks}`
					: newEntry;
				payloadToSave = {
					...payloadToSave,
					lastCallDate: callDate,
					nextActionDate: nextFollowup || enquiry.nextActionDate || "",
					followupRemarks: updatedFollowup,
				};
				setCallNote("");
			}

			if (isNew) {
				const res = await rfqService.createEnquiry(payloadToSave);
				showToast("Success", "Enquiry created successfully", "success");
				if (res.data?.id) {
					router.push(`/rfq/${res.data.id}`);
				}
			} else if (enquiryId) {
				await rfqService.updateEnquiry(enquiryId, payloadToSave);
				await queryClient.invalidateQueries({
					queryKey: ["enquiry", enquiryId],
				});
				await queryClient.invalidateQueries({ queryKey: ["rfq-tracker"] });
				setEnquiryForm({});
				showToast("Success", "Enquiry updated successfully", "success");
			}
		} catch (err: any) {
			showToast("Error", err.message || "Failed to save enquiry", "error");
		} finally {
			setSaving(false);
		}
	};

	const handleSendForReview = () => {
		if (!enquiryId) return;

		if (!reviewChecklist.isReady) {
			const missing: string[] = [];
			if (!reviewChecklist.hasDetails) missing.push("Enquiry Customer Details");
			if (!reviewChecklist.hasQuestionnaire)
				missing.push("Filled Questionnaire / RFQ Document");
			if (!reviewChecklist.hasCosting)
				missing.push("Technical Calculation & Costing Sheet");

			showToast(
				"Checklist Incomplete",
				`Please complete the following required items before sending for review:\n• ${missing.join("\n• ")}`,
				"error",
			);
			return;
		}

		showConfirm({
			title: "Send for Review?",
			message:
				"All required items (Enquiry Details, Questionnaire, Technical Calc & Costing Sheet) are completed. Send to Management for Review?",
			confirmText: "Send Review",
			type: "info",
			onConfirm: async () => {
				try {
					await rfqService.sendForReview(enquiryId);
					queryClient.invalidateQueries({ queryKey: ["enquiry", enquiryId] });
					showToast(
						"Status Updated",
						"Enquiry marked Under Review and management notified!",
						"success",
					);
				} catch (err: any) {
					showToast(
						"Review Error",
						`Failed to send for review: ${err.message}`,
						"error",
					);
				}
			},
		});
	};

	const handleResolveFeedback = async () => {
		if (!enquiryId) return;
		try {
			const cleanRemarks = (enquiry.remarks || "")
				.replace(/\[Review Feedback\]:[^\n]*/g, "")
				.trim();
			const cleanFollowup = (enquiry.followupRemarks || "")
				.replace(/\[Review Feedback\]:[^\n]*/g, "[Feedback Addressed]")
				.trim();
			await rfqService.updateEnquiry(enquiryId, {
				remarks: cleanRemarks,
				followupRemarks: cleanFollowup,
			});
			queryClient.invalidateQueries({ queryKey: ["enquiry", enquiryId] });
			queryClient.invalidateQueries({ queryKey: ["rfq-tracker"] });
			showToast(
				"Feedback Resolved",
				"Review feedback marked as resolved!",
				"success",
			);
		} catch (err: any) {
			showToast(
				"Error",
				err.message || "Failed to mark feedback as resolved",
				"error",
			);
		}
	};

	const handleUploadAttachment = async (
		kind: "costing" | "offer" | "questionnaire" | "technical" | string,
		file: File | null,
	) => {
		if (!file) return;
		try {
			let targetId = enquiryId;

			if (isNew || !targetId) {
				const res = await rfqService.createEnquiry({
					...enquiry,
					companyName: enquiry.companyName || "New Customer",
					itemDescription: enquiry.itemDescription || "New RFQ Requirement",
				});
				targetId = res.data?.id;
				if (!targetId)
					throw new Error("Failed to generate Enquiry entry for attachment");
				router.push(`/rfq/${targetId}`);
			}

			const res = await rfqService.uploadAttachment(targetId, file, kind);
			queryClient.invalidateQueries({ queryKey: ["enquiry", targetId] });
			if (res?.targetEnquiryId && res.targetEnquiryId !== targetId) {
				queryClient.invalidateQueries({
					queryKey: ["enquiry", res.targetEnquiryId],
				});
			}
			queryClient.invalidateQueries({ queryKey: ["rfq-tracker"] });

			const cleanNo = (
				res?.extracted?.enquiryNo ||
				res?.extracted?.offerNo ||
				""
			).trim();

			if (kind === "offer" && cleanNo) {
				showToast(
					"Offer Mapped",
					`Extracted Enquiry No: ${cleanNo.substring(0, 50)}`,
					"success",
				);
			} else if (kind === "offer") {
				showToast(
					"Offer Attached",
					"Offer document uploaded successfully",
					"success",
				);
			} else if (kind === "questionnaire") {
				showToast(
					"Questionnaire Uploaded",
					"Filled Questionnaire / RFQ document uploaded successfully",
					"success",
				);
			} else if (kind === "costing") {
				showToast(
					"Costing Sheet Uploaded",
					"Technical calculation & costing sheet uploaded successfully",
					"success",
				);
			} else {
				showToast(
					"Document Uploaded",
					"Attachment uploaded successfully",
					"success",
				);
			}
		} catch (err: any) {
			showToast(
				"Upload Error",
				`Failed to upload attachment: ${err.message}`,
				"error",
			);
		}
	};

	const handleDeleteAttachment = (attId: string | number) => {
		showConfirm({
			title: "Delete Attachment?",
			message: "Are you sure you want to remove this file attachment?",
			confirmText: "Delete File",
			type: "danger",
			onConfirm: async () => {
				try {
					await rfqService.deleteAttachment(attId);
					if (enquiryId) {
						queryClient.invalidateQueries({ queryKey: ["enquiry", enquiryId] });
					}
					showToast("File Removed", "Attachment deleted successfully", "info");
				} catch (err: any) {
					showToast(
						"Delete Error",
						`Failed to delete attachment: ${err.message}`,
						"error",
					);
				}
			},
		});
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 gap-3">
				<RefreshCw className="w-8 h-8 text-thermal-500 animate-spin" />
				<p className="text-xs text-slate-400 font-medium">
					Loading Enquiry details...
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Top Navigation & Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-r dark:from-obsidian-900 dark:via-slate-900 dark:to-obsidian-950 shadow-xs">
				<div className="flex items-center gap-3">
					<button
						onClick={() => router.push("/rfq")}
						className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700 shrink-0"
						title="Back to RFQ Tracker">
						<ArrowLeft className="w-4 h-4" />
					</button>
					<div>
						<h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-wide flex flex-wrap items-center gap-2">
							{isNew
								? "New Enquiry"
								: `Enquiry Detail · ${enquiry.rfqId || ""}`}
							{enquiry.status && (
								<span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold border border-cyan-500/30">
									{enquiry.status}
								</span>
							)}
						</h1>
						<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
							{isNew
								? "Create new customer RFQ entry"
								: `Received on ${enquiry.dateReceived || enquiry.receivedOn || "N/A"}`}
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
											window.open(enquiry.driveFolderUrl, "_blank");
										} else {
											showToast(
												"Drive Folder",
												"Ensuring Google Drive Folder structure...",
												"info",
											);
											const res = await rfqService.openDriveFolder(enquiryId);
											if (res.driveFolderUrl) {
												window.open(res.driveFolderUrl, "_blank");
												queryClient.invalidateQueries({
													queryKey: ["enquiry", enquiryId],
												});
											} else {
												showToast(
													"Drive Folder",
													"Google Drive sync fallback activated",
													"info",
												);
											}
										}
									} catch (err: any) {
										showToast(
											"Drive Error",
											err.message || "Failed to open Drive folder",
											"error",
										);
									}
								}}
								className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 shadow-2xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
								title="Open Google Drive folder structure for this RFQ (Client documents, Technical Calcs, Costing & Offer)">
								<Folder className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />{" "}
								Open Drive
							</button>
						</>
					)}
					{!isNew && (enquiry.status || "").toLowerCase() === "open" && (
						<button
							type="button"
							onClick={handleLaunchAutomation}
							className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 shadow-2xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
							title="Push customer & RFQ parameters to Offer & Costing Automation engine">
							<ExternalLink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />{" "}
							Send to Automation
						</button>
					)}
					{canEdit && (enquiry.status || "").toLowerCase() === "open" && (
						<button
							type="button"
							onClick={() => {
								setEnquiryForm((prev) => ({ ...prev, status: "Incomplete" }));
								showToast(
									"Marked Incomplete",
									"RFQ status updated to Incomplete. Fill in missing client details below.",
									"info",
								);
							}}
							className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap"
							title="Mark RFQ status as Incomplete (Missing client data or drawings)">
							<AlertCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />{" "}
							Mark Incomplete
						</button>
					)}
					{canReview && enquiry.status === "Under review" && enquiry.id && (
						<button
							type="button"
							onClick={() => router.push(`/review/${enquiry.id}`)}
							className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap">
							<CheckSquare className="w-3.5 h-3.5 shrink-0" /> Open Review
							Portal
						</button>
					)}
					<button
						type="button"
						onClick={() => router.push("/rfq")}
						className="px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-center">
						Cancel
					</button>
					{canEdit ? (
						<button
							type="button"
							onClick={handleSave}
							disabled={saving}
							className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 !text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer">
							{saving ? "Saving..." : "Save Changes"}
						</button>
					) : (
						<span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center gap-1 whitespace-nowrap">
							🔒 Read-Only
						</span>
					)}
				</div>
			</div>

			{/* ADMIN REVIEW FEEDBACK BANNER (IF REJECTED / CHANGES REQUESTED) */}
			{(enquiry.followupRemarks?.includes("[Review Feedback]") ||
				enquiry.remarks?.includes("[Review Feedback]")) && (
					<div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 shadow-lg flex items-start justify-between gap-3">
						<div className="flex items-start gap-3">
							<AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
							<div className="space-y-1">
								<h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
									⚠️ Admin Review Feedback — Changes Requested
								</h4>
								<p className="text-xs text-rose-200 leading-relaxed font-semibold">
									{enquiry.remarks?.includes("[Review Feedback]")
										? enquiry.remarks.replace("[Review Feedback]:", "").trim()
										: enquiry.followupRemarks
											?.substring(
												enquiry.followupRemarks.indexOf("[Review Feedback]"),
											)
											.replace("[Review Feedback]:", "")
											.trim()}
								</p>
								<p className="text-[11px] text-rose-400/80 mt-0.5">
									This RFQ has been sent back to <strong>Open</strong> status.
									Please update the details, costing, or questionnaire and
									resubmit for review once ready.
								</p>
							</div>
						</div>
						{canEdit && (
							<button
								type="button"
								onClick={handleResolveFeedback}
								className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all shrink-0 flex items-center gap-1.5">
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
								fromName={enquiry.contactPerson || "Customer"}
								fromEmail={enquiry.email || ""}
								date={enquiry.dateReceived || enquiry.receivedOn || ""}
								subject={enquiry.itemDescription || ""}
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
														window.open(enquiry.driveFolderUrl, "_blank");
													} else {
														showToast(
															"Drive Setup",
															"Opening Google Drive RFQ folder...",
															"info",
														);
														const res =
															await rfqService.openDriveFolder(enquiryId);
														if (res.driveFolderUrl) {
															window.open(res.driveFolderUrl, "_blank");
															queryClient.invalidateQueries({
																queryKey: ["enquiry", enquiryId],
															});
														} else {
															showToast(
																"Drive Setup Required",
																"Google Drive credentials not configured in backend/.env",
																"warning",
															);
														}
													}
												} catch (err: any) {
													showToast(
														"Drive Error",
														err.message || "Failed to open Drive folder",
														"error",
													);
												}
											}}
											className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
											title="Open Google Drive folder">
											Google Drive
										</button>
									</div>

									{[
										{
											key: "questionnaire",
											title: "Questionnaire / RFQ Docs",
											files: questionnaireFiles,
											placeholder: "Upload Questionnaire / RFQ Doc",
											emptyMsg: "No questionnaire or RFQ document attached",
										},
										{
											key: "costing",
											title: "Technical Calc & Costing Sheet",
											files: costingFiles,
											placeholder: "Upload Technical Calc & Costing Sheet",
											emptyMsg: "No technical calc or costing sheet attached",
										},
										{
											key: "offer",
											title: "Offer Documents",
											files: offerFiles,
											placeholder: "Upload Offer Document",
											emptyMsg: "No offer document attached",
										},
										{
											key: "inbox",
											title: "Email Inbox Attachments",
											files: inboxAttachments,
											placeholder: null,
											emptyMsg: "No email inbox attachments",
										},
									].map((cat, idx) => (
										<div
											key={cat.key}
											className={`space-y-2 ${idx > 0 ? "pt-3 border-t border-slate-200 dark:border-slate-800" : ""}`}>
											<div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
												<span>{cat.title}</span>
												<span className="text-[11px] text-slate-400 font-mono">
													({cat.files.length})
												</span>
											</div>

											{cat.placeholder && (
												<label className="w-full p-2 rounded-md bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer flex items-center justify-between transition-all">
													<span>{cat.placeholder}</span>
													<span className="text-[11px] text-slate-500 font-medium">
														Browse
													</span>
													<input
														type="file"
														className="hidden"
														onChange={(e) =>
															handleUploadAttachment(
																cat.key,
																e.target.files?.[0] || null,
															)
														}
													/>
												</label>
											)}

											{cat.files.length > 0 ? (
												<div className="flex flex-row items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
													{cat.files.map((att: Attachment) =>
														isImageFile(att) ? (
															<div
																key={att.id}
																className="group relative shrink-0 w-28 h-20 rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1 flex flex-col justify-between">
																<div
																	className="w-full h-13 relative rounded overflow-hidden bg-slate-200 dark:bg-slate-900 flex items-center justify-center cursor-pointer"
																	onClick={() =>
																		setSelectedImage({
																			src: getAttachmentUrl(att.id),
																			filename: att.filename,
																		})
																	}>
																	{/* eslint-disable-next-line @next/next/no-img-element */}
																	<img
																		src={getAttachmentUrl(att.id)}
																		alt={att.filename}
																		className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
																	/>
																</div>
																<div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 pt-0.5">
																	<span
																		className="truncate max-w-[70px]"
																		title={att.filename}>
																		{att.filename}
																	</span>
																	<div className="flex items-center gap-1">
																		<a
																			href={getAttachmentUrl(att.id, true)}
																			target="_blank"
																			rel="noopener noreferrer"
																			download={att.filename}
																			title="Download">
																			<Download className="w-3 h-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200" />
																		</a>
																		<button
																			type="button"
																			onClick={() =>
																				handleDeleteAttachment(att.id)
																			}
																			title="Delete"
																			className="text-slate-400 hover:text-rose-500">
																			<X className="w-3 h-3" />
																		</button>
																	</div>
																</div>
															</div>
														) : (
															<div
																key={att.id}
																className="shrink-0 w-44 p-2 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-1 text-xs shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
																<span
																	className="truncate font-medium text-slate-800 dark:text-slate-200 text-xs"
																	title={att.filename}>
																	{att.filename}
																</span>
																<div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-1">
																	<span className="font-mono">
																		{formatFileSize(att.size)}
																	</span>
																	<div className="flex items-center gap-1.5">
																		<a
																			href={getAttachmentUrl(att.id, false)}
																			target="_blank"
																			rel="noopener noreferrer"
																			title="Preview in Browser"
																			className="text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
																			<Eye className="w-3.5 h-3.5" />
																		</a>
																		<a
																			href={getAttachmentUrl(att.id, true)}
																			target="_blank"
																			rel="noopener noreferrer"
																			download={att.filename}
																			title="Download File"
																			className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
																			<Download className="w-3.5 h-3.5" />
																		</a>
																		<button
																			type="button"
																			onClick={() =>
																				handleDeleteAttachment(att.id)
																			}
																			title="Delete Attachment"
																			className="text-slate-400 hover:text-rose-500 transition-colors">
																			<X className="w-3.5 h-3.5" />
																		</button>
																	</div>
																</div>
															</div>
														),
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
									{enquiry.status === "Under review" ? (
										<div className="w-full py-2 rounded-md text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 text-center">
											Status: Under Review
										</div>
									) : enquiry.status === "Offer Sent" ? (
										<div className="w-full py-2 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 text-center">
											Status: Offer Sent
										</div>
									) : enquiry.status === "PO Received" ? (
										<div className="w-full py-2 rounded-md text-xs font-medium bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900/50 text-center">
											Status: PO Received
										</div>
									) : enquiry.status === "Approved" ? (
										<div className="w-full py-2 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 text-center">
											Status: Approved
										</div>
									) : (
										<div>
											<button
												type="button"
												onClick={handleSendForReview}
												className="w-full py-2 rounded-md text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
												Submit for Review
											</button>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				)}

				{/* CONTAINER 2: MAIN CUSTOMER & ENQUIRY DETAILS FORM (SIDE-BY-SIDE 2-COLUMN LAYOUT) */}
				<form
					onSubmit={handleSave}
					className="glass-card p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-5 w-full shadow-2xl">
					{/* SIDE-BY-SIDE GRID WRAPPER */}
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
						{/* LEFT COLUMN (5 cols): CUSTOMER DETAILS & ASSIGNMENT (COLLAPSIBLE) */}
						<div className="lg:col-span-5 space-y-4">
							<div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 space-y-4">
								<div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
									<div className="flex items-center gap-2">
										<h3 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
											Customer & Assignment Details
										</h3>
									</div>
									<button
										type="button"
										onClick={() =>
											setIsCustomerDetailsCollapsed(!isCustomerDetailsCollapsed)
										}
										className="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer">
										{isCustomerDetailsCollapsed ? (
											<>
												<ChevronDown className="w-3.5 h-3.5" /> Expand
											</>
										) : (
											<>
												<ChevronUp className="w-3.5 h-3.5" /> Minimize
											</>
										)}
									</button>
								</div>

								{isCustomerDetailsCollapsed ? (
									/* MINIMIZED SUMMARY VIEW */
									<div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
										<div className="flex items-center justify-between">
											<span className="font-bold text-slate-900 dark:text-white">
												{enquiry.companyName || "No Company Name"}
											</span>
											<span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/30">
												{enquiry.status || "Open"}
											</span>
										</div>
										<div className="text-slate-500 dark:text-slate-400 text-[11px] space-y-0.5">
											{enquiry.contactPerson && (
												<p>
													Contact:{" "}
													<strong className="text-slate-700 dark:text-slate-300">
														{enquiry.contactPerson}
													</strong>
												</p>
											)}
											{enquiry.mobile && <p>Mobile: {enquiry.mobile}</p>}
											{enquiry.email && <p>Email: {enquiry.email}</p>}
											<p className="pt-1 text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
												Tech: {enquiry.technical || enquiry.assignedTo || "Unassigned"} | Sales: {enquiry.salesResponsibility || "Unassigned"}
											</p>
										</div>
										<button
											type="button"
											onClick={() => setIsCustomerDetailsCollapsed(false)}
											className="w-full py-1 mt-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-center cursor-pointer">
											Click to Edit Full Customer Info
										</button>
									</div>
								) : (
									/* EXPANDED FULL FORM */
									<div className="space-y-4">
										{/* Customer Info */}
										<div className="space-y-3">
											<div>
												<label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
													Company Name *
												</label>
												<input
													type="text"
													required
													disabled={!canEdit}
													value={enquiry.companyName || ""}
													onChange={(e) =>
														setEnquiry({ ...enquiry, companyName: e.target.value })
													}
													className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none ${!canEdit ? "opacity-70 cursor-not-allowed" : ""}`}
												/>
											</div>
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
												<div>
													<label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
														Contact Person
													</label>
													<input
														type="text"
														disabled={!canEdit}
														value={enquiry.contactPerson || ""}
														onChange={(e) =>
															setEnquiry({ ...enquiry, contactPerson: e.target.value })
														}
														className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none ${!canEdit ? "opacity-70 cursor-not-allowed" : ""}`}
													/>
												</div>
												<div>
													<label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
														Mobile
													</label>
													<input
														type="text"
														disabled={!canEdit}
														value={enquiry.mobile || ""}
														onChange={(e) =>
															setEnquiry({ ...enquiry, mobile: e.target.value })
														}
														className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none ${!canEdit ? "opacity-70 cursor-not-allowed" : ""}`}
													/>
												</div>
											</div>
											<div>
												<label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
													Email
												</label>
												<input
													type="email"
													disabled={!canEdit}
													value={enquiry.email || ""}
													onChange={(e) =>
														setEnquiry({ ...enquiry, email: e.target.value })
													}
													className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none ${!canEdit ? "opacity-70 cursor-not-allowed" : ""}`}
												/>
											</div>
										</div>

										{/* Item Description & Assignment */}
										<div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
											<div>
												<label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
													Item Description *
												</label>
												<textarea
													rows={2}
													required
													disabled={!canEdit}
													value={enquiry.itemDescription || ""}
													onChange={(e) =>
														setEnquiry({ ...enquiry, itemDescription: e.target.value })
													}
													className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none ${!canEdit ? "opacity-70 cursor-not-allowed" : ""}`}
												/>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
												<div>
													<label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
														Technical Assignee *
													</label>
													<select
														disabled={!canChangeAssignment}
														value={selectedTechValue}
														onChange={(e) =>
															setEnquiry({
																...enquiry,
																technical: e.target.value,
																assignedTo: e.target.value,
															})
														}
														className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none ${!canChangeAssignment ? "opacity-70 cursor-not-allowed pointer-events-none" : "cursor-pointer"}`}>
														<option value="">Select Technical Assignee...</option>
														{technicalDirectory.map((item) => (
															<option key={item.name} value={item.name}>
																{item.name} {item.email ? `(${item.email})` : ""}
															</option>
														))}
														{currentTechVal && !matchedTechItem && (
															<option value={currentTechVal}>
																{currentTechVal}
															</option>
														)}
													</select>
												</div>

												<div>
													<label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
														Sales Responsibility
													</label>
													<select
														disabled={!canChangeAssignment}
														value={selectedSalesValue}
														onChange={(e) =>
															setEnquiry({
																...enquiry,
																salesResponsibility: e.target.value,
															})
														}
														className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none ${!canChangeAssignment ? "opacity-70 cursor-not-allowed pointer-events-none" : "cursor-pointer"}`}>
														<option value="">Unassigned</option>
														{salesDirectory.map((item) => (
															<option key={item.name} value={item.name}>
																{item.name} {item.email ? `(${item.email})` : ""}
															</option>
														))}
														{currentSalesVal && !matchedSalesItem && (
															<option value={currentSalesVal}>
																{currentSalesVal}
															</option>
														)}
													</select>
												</div>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
												<div>
													<label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
														TAT (Days)
													</label>
													<input
														type="number"
														disabled={!canEdit}
														value={enquiry.tat || "30"}
														onChange={(e) =>
															setEnquiry({ ...enquiry, tat: e.target.value })
														}
														className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none ${!canEdit ? "opacity-70 cursor-not-allowed" : ""}`}
													/>
												</div>
												<div>
													<label className="block text-[11px] font-semibold text-indigo-400 mb-1">
														Offer No
													</label>
													<input
														type="text"
														disabled={!canEdit}
														placeholder="e.g. ENC/OFR/044"
														value={enquiry.offerNo || ""}
														onChange={(e) =>
															setEnquiry({ ...enquiry, offerNo: e.target.value })
														}
														className={`w-full bg-white dark:bg-slate-950 border border-indigo-900/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none font-mono ${!canEdit ? "opacity-70 cursor-not-allowed" : ""}`}
													/>
												</div>
												<div>
													<label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
														Status
													</label>
													<select
														disabled={!canChangeStatus}
														value={enquiry.status || "Open"}
														onChange={(e) =>
															setEnquiry({ ...enquiry, status: e.target.value })
														}
														className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none ${!canChangeStatus ? "opacity-70 cursor-not-allowed pointer-events-none" : "cursor-pointer"}`}>
														{STATUS_OPTIONS.map((opt) => (
															<option key={opt} value={opt}>
																{opt}
															</option>
														))}
													</select>
												</div>
											</div>

											<div>
												<label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
													Remarks
												</label>
												<textarea
													rows={2}
													disabled={!canEdit}
													value={enquiry.remarks || ""}
													onChange={(e) =>
														setEnquiry({ ...enquiry, remarks: e.target.value })
													}
													className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none ${!canEdit ? "opacity-70 cursor-not-allowed" : ""}`}
												/>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Incomplete Data Banner (if Incomplete status or pendingRemarks exist) */}
							{(enquiry.status === "Incomplete" ||
								Boolean(enquiry.pendingRemarks?.trim())) && (
								<div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border-l-4 border-l-amber-500 border border-amber-200 dark:border-amber-900/40 space-y-2 shadow-xs">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-1.5">
											<AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
											<h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
												Pending Requirements
											</h3>
										</div>
									</div>
									<textarea
										rows={2}
										disabled={!canEdit}
										placeholder="e.g. Pending client drawing input..."
										value={enquiry.pendingRemarks || ""}
										onChange={(e) =>
											setEnquiry({ ...enquiry, pendingRemarks: e.target.value })
										}
										className={`w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none ${!canEdit ? "opacity-70 cursor-not-allowed" : ""}`}
									/>
								</div>
							)}
						</div>

						{/* RIGHT COLUMN (7 cols): CLIENT CALL & FOLLOW-UP LOGGER & TIMELINE */}
						<div className="lg:col-span-7 space-y-4">
							<div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
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
												Record discussions & follow-ups side-by-side with client info
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
										<span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1">
											Log Type:
										</span>
										{[
											{ key: "Call", label: "Phone Call" },
											{ key: "Followup", label: "Follow-up" },
											{ key: "Email", label: "Email" },
											{ key: "Meeting", label: "Meeting" },
											{ key: "Remark", label: "Remark" },
										].map((t) => (
											<button
												key={t.key}
												type="button"
												onClick={() => setFollowupType(t.key)}
												className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
													followupType === t.key
														? "bg-cyan-600 text-white border-cyan-500 font-bold shadow-xs"
														: "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-cyan-400"
												}`}>
												{t.label}
											</button>
										))}
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
										<div>
											<label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
												Log Date
											</label>
											<input
												type="date"
												value={callDate}
												onChange={(e) => setCallDate(e.target.value)}
												className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500 focus:outline-none shadow-xs"
											/>
										</div>

										<div>
											<label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
												Next Follow-up Date
											</label>
											<input
												type="date"
												value={nextFollowup || enquiry.nextActionDate || ""}
												onChange={(e) => {
													setNextFollowup(e.target.value);
													setEnquiry({
														...enquiry,
														nextActionDate: e.target.value,
													});
												}}
												className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500 focus:outline-none shadow-xs"
											/>
										</div>

										<div className="flex items-end">
											<button
												type="button"
												disabled={loggingCall}
												onClick={handleLogCall}
												className="w-full py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
												<Plus className="w-3.5 h-3.5" />{" "}
												{loggingCall ? "Saving..." : `Add ${followupType}`}
											</button>
										</div>
									</div>

									<div>
										<label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
											Follow-up Notes & Discussion Details *
										</label>
										<textarea
											rows={2}
											placeholder={`Enter ${followupType.toLowerCase()} discussion details, customer commitments...`}
											value={callNote}
											onChange={(e) => setCallNote(e.target.value)}
											className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none font-medium shadow-xs"
										/>
									</div>
								</div>

								{/* Timeline History List */}
								{followupsList.length > 0 && (
									<div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800/80">
										<div className="flex items-center justify-between">
											<label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
												Timeline History ({followupsList.length})
											</label>
											<span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
												Newest first
											</span>
										</div>
										<div className="bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 max-h-[380px] overflow-y-auto space-y-2.5 custom-scrollbar">
											{followupsList.map((entry: any, idx: number) => {
												const typeLabel = entry.type || "Remark";
												const isCall = typeLabel === "Call";
												const isEmail = typeLabel === "Email";
												const isMeeting = typeLabel === "Meeting";

												const formattedDate = entry.createdAt
													? isNaN(new Date(entry.createdAt).getTime())
														? entry.createdAt
														: new Date(entry.createdAt).toLocaleString(
																"en-US",
																{
																	month: "short",
																	day: "numeric",
																	year: "numeric",
																	hour: "2-digit",
																	minute: "2-digit",
																},
														  )
													: "N/A";

												return (
													<div
														key={entry._id || entry.id || idx}
														className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/90 shadow-2xs space-y-1.5">
														<div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
															<div className="flex items-center gap-2">
																<span
																	className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
																		isCall
																			? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
																			: isEmail
																			? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
																			: isMeeting
																			? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
																			: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
																	}`}>
																	{typeLabel}
																</span>
																<div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-slate-100">
																	<UserCheck className="w-3.5 h-3.5 text-cyan-500" />
																	<span>{entry.author || "User"}</span>
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
																<Clock className="w-3 h-3" /> Next Follow-up
																Scheduled: {entry.nextActionDate}
															</div>
														)}
													</div>
												);
											})}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* FORM ACTION FOOTER */}
					<div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
						<button
							type="button"
							onClick={() => router.push("/rfq")}
							className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
							Back to Tracker
						</button>
						{canEdit ? (
							<button
								type="submit"
								disabled={saving}
								className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer">
								{saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
								{saving ? "Saving..." : "Save Changes"}
							</button>
						) : (
							<span className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1.5">
								🔒 Read-Only
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
							<History className="w-4 h-4 text-thermal-400" /> Status Tracking &
							Audit Activity History
						</h3>
						<span className="text-[11px] text-slate-400">
							Tracks status changes, file uploads & admin approvals
						</span>
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

								const logTime = new Date(log.createdAt).toLocaleString(
									"en-US",
									{
										month: "short",
										day: "numeric",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									},
								);

								const actor =
									log.userEmail ||
									parsed.updatedBy ||
									parsed.uploadedBy ||
									"Team Member";

								const renderLogDetails = () => {
									if (parsed.oldStatus && parsed.newStatus) {
										return (
											<span>
												Status changed from{" "}
												<strong className="text-amber-400 font-semibold">
													{parsed.oldStatus}
												</strong>{" "}
												to{" "}
												<strong className="text-emerald-400 font-semibold">
													{parsed.newStatus}
												</strong>
											</span>
										);
									}
									if (parsed.filename) {
										return (
											<span>
												Uploaded file:{" "}
												<strong className="text-cyan-400 font-semibold">
													{parsed.filename}
												</strong>{" "}
												({parsed.kind || "Attachment"})
											</span>
										);
									}
									if (parsed.remarks) {
										return (
											<span>
												Review feedback:{" "}
												<strong className="text-rose-300 italic">
													&quot;{parsed.remarks}&quot;
												</strong>
											</span>
										);
									}
									if (parsed.updates && typeof parsed.updates === "object") {
										const u = parsed.updates;
										const changes: string[] = [];

										if (u.status) changes.push(`Status: ${u.status}`);
										if (u.technical || u.assignedTo)
											changes.push(
												`Assignee: ${u.technical || u.assignedTo}`,
											);
										if (u.salesResponsibility)
											changes.push(`Sales: ${u.salesResponsibility}`);
										if (u.offerNo) changes.push(`Offer No: ${u.offerNo}`);
										if (u.offerDate) changes.push(`Offer Date: ${u.offerDate}`);
										if (u.nextActionDate)
											changes.push(`Next Follow-up: ${u.nextActionDate}`);
										if (u.lastCallDate)
											changes.push(`Call Date: ${u.lastCallDate}`);
										if (u.pendingRemarks)
											changes.push(`Pending Req: ${u.pendingRemarks}`);
										if (u.companyName)
											changes.push(`Company: ${u.companyName}`);
										if (u.contactPerson)
											changes.push(`Contact: ${u.contactPerson}`);

										if (changes.length > 0) {
											return (
												<span className="text-slate-300">
													Updated:{" "}
													<strong className="text-cyan-300 font-medium">
														{changes.join(" • ")}
													</strong>
												</span>
											);
										}

										const keys = Object.keys(u).filter(
											(k) =>
												![
													"id",
													"_id",
													"rfqId",
													"updatedAt",
													"createdAt",
												].includes(k),
										);
										if (keys.length > 0) {
											const formattedKeys = keys
												.map((k) =>
													k.replace(/([A-Z])/g, " $1").toLowerCase(),
												)
												.join(", ");
											return (
												<span className="text-slate-300">
													Updated fields:{" "}
													<strong className="text-slate-200">
														{formattedKeys}
													</strong>
												</span>
											);
										}
									}
									return (
										<span className="text-slate-400 font-normal">
											Updated enquiry details
										</span>
									);
								};

								const getActionBadge = () => {
									const a = (log.action || "").toUpperCase();
									if (a.includes("STATUS")) {
										return (
											<span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
												Status Changed
											</span>
										);
									}
									if (a.includes("UPLOAD") || a.includes("ATTACHMENT")) {
										return (
											<span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
												File Uploaded
											</span>
										);
									}
									if (a.includes("REVIEW")) {
										return (
											<span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
												Review Action
											</span>
										);
									}
									if (a.includes("FOLLOWUP") || a.includes("CALL")) {
										return (
											<span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
												Follow-up Logged
											</span>
										);
									}
									return (
										<span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
											RFQ Updated
										</span>
									);
								};

								return (
									<div
										key={log.id}
										className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between text-xs gap-3">
										<div className="flex items-start gap-2.5 min-w-0">
											<div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-thermal-400 shrink-0 mt-0.5">
												<UserCheck className="w-3.5 h-3.5" />
											</div>
											<div className="space-y-0.5 min-w-0">
												<div className="flex items-center gap-2 flex-wrap">
													<span className="font-bold text-white truncate">
														{actor}
													</span>
													{getActionBadge()}
												</div>
												<div className="text-slate-300 text-[11px] leading-relaxed">
													{renderLogDetails()}
												</div>
											</div>
										</div>
										<span className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap font-mono">
											{logTime}
										</span>
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
					onClick={() => setSelectedImage(null)}>
					<div
						className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center space-y-3"
						onClick={(e) => e.stopPropagation()}>
						<div className="flex items-center justify-between w-full text-white px-2">
							<span className="text-sm font-semibold truncate max-w-md font-mono">
								{selectedImage.filename}
							</span>
							<div className="flex items-center gap-2">
								<a
									href={selectedImage.src}
									target="_blank"
									rel="noopener noreferrer"
									download={selectedImage.filename}
									className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5">
									<Download className="w-3.5 h-3.5" /> Download
								</a>
								<button
									type="button"
									onClick={() => setSelectedImage(null)}
									className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
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
