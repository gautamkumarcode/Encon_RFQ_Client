export function isImageFile(att?: {
	filename?: string;
	contentType?: string;
}): boolean {
	if (!att) return false;
	const ct = (att.contentType || "").toLowerCase();
	const fn = (att.filename || "").toLowerCase();
	if (ct.startsWith("image/")) return true;
	return /\.(gif|png|jpe?g|webp|svg|bmp|tiff?)$/i.test(fn);
}

export function formatFileSize(bytes?: number): string {
	if (!bytes || bytes <= 0) return "Doc";
	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`;
	}
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const STATUS_OPTIONS = [
	"Open",
	"Incomplete",
	"Under review",
	"Verified",
	"Approved",
	"Offer Sent",
	"PO Received",
	"REGRET",
	"Closed",
];

export const getAttachmentUrl = (attId: string | number, isDownload = false) => {
	const dlParam = isDownload ? "?dl=1" : "";
	return `/api/rfq/attachments/${attId}${dlParam}`;
};
