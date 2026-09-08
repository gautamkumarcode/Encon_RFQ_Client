export interface ThreadMessage {
	id: number;
	sender: string;
	email: string;
	date: string;
	body: string;
	isCompany: boolean;
}

export function decodeHtmlEntities(str: string): string {
	if (!str) return "";
	return str
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/&#x27;/gi, "'")
		.replace(/&#x2F;/gi, "/")
		.replace(/&#039;/gi, "'")
		.replace(/&ndash;/gi, "–")
		.replace(/&mdash;/gi, "—")
		.replace(/&rsquo;/gi, "’")
		.replace(/&lsquo;/gi, "‘")
		.replace(/&rdquo;/gi, "”")
		.replace(/&ldquo;/gi, "“")
		.replace(/&#160;/gi, " ");
}

export function isEnconCompanyAddr(emailAddr: string): boolean {
	if (!emailAddr) return false;
	const lower = emailAddr.toLowerCase().trim();
	return (
		lower.endsWith("@encon.co.in") ||
		lower.endsWith("@encon.in") ||
		lower === "encon.co.in" ||
		lower === "encon.in"
	);
}

export function extractEmailFromText(text: string): string {
	if (!text) return "";
	const match = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
	return match ? match[0] : "";
}

export function extractNameFromText(text: string): string {
	if (!text) return "";
	const nutanMatch = text.match(
		/(Nutan\s+Kumari|Shikha|Rupanjana|Rupanjana\s+Mitra|ENCON\s+Thermal|ENCON\s+Team)/i,
	);
	if (nutanMatch) return nutanMatch[1];
	return "";
}

export function parseEmailThreadMessages(
	rawText: string,
	defaultSender: string,
	defaultEmail: string,
	defaultDate: string,
): ThreadMessage[] {
	if (!rawText) return [];

	let text = rawText
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/p>/gi, "\n\n")
		.replace(/<\/div>/gi, "\n")
		.replace(/<\/tr>/gi, "\n")
		.replace(/<\/li>/gi, "\n")
		.replace(/<hr\s*\/?>/gi, "\n---\n")
		.replace(/<[^>]+>/g, "")
		.replace(/\r\n/g, "\n");

	if (text.includes("=3D") || text.includes("=20") || text.includes("=\n")) {
		text = text
			.replace(/=\r?\n/g, "")
			.replace(/=3D/g, "=")
			.replace(/=20/g, " ")
			.replace(/=0A/gi, "\n")
			.replace(/=0D/gi, "");
	}

	// Strip raw MIME boundary markers, preambles, attachment filenames, and Base64 noise
	text = text
		.replace(
			/This is a multipart message in MIME format\.?\s*(?:boundary=.*)?/gim,
			"",
		)
		.replace(/^--?=?[_a-zA-Z0-9.-]+.*$/gm, "")
		.replace(/_NextPart_[a-zA-Z0-9._-]+(?:--)?/g, "")
		.replace(
			/^\s*(?:Content-Type|Content-Transfer-Encoding|Content-Disposition|Content-ID|MIME-Version):\s*.*$/gim,
			"",
		)
		.replace(/^\s*(?:filename|name)\s*=\s*"?[^";\r\n]+"?.*$/gim, "")
		.replace(/\bcharset="?[a-z0-9_-]+"?/gim, "")
		.replace(/^[a-zA-Z0-9+/=]{40,}$/gm, "")
		.replace(/[a-zA-Z0-9+/=]{60,}/g, "")
		.replace(/'"/g, '"');

	text = decodeHtmlEntities(text).trim();

	// Split on all standard thread message boundaries
	const splitRegex =
		/(?:\n\s*|\n?)(?=(?:---+\s*Thread Update.*?:?|On\s+.*?\s+wrote:|-{3,}\s*(?:Original Message|Forwarded message)\s*-{3,}|From:\s*.*?(?:\r?\n|$)|-{5,}\s*Forwarded message\s*-{5,}))/gi;
	const rawBlocks = text
		.split(splitRegex)
		.map((b) => b.trim())
		.filter((b) => b.length > 5);

	if (rawBlocks.length === 0) {
		const isComp = isEnconCompanyAddr(text) || isEnconCompanyAddr(defaultEmail);
		return [
			{
				id: 1,
				sender: isComp
					? extractNameFromText(text) || "ENCON Team"
					: defaultSender || "Customer",
				email: isComp
					? extractEmailFromText(text) || "mdo@encon.co.in"
					: defaultEmail,
				date: defaultDate,
				body: text.replace(/^>+\s?/gm, "").trim(),
				isCompany: isComp,
			},
		];
	}

	const messages: ThreadMessage[] = [];

	rawBlocks.forEach((block, idx) => {
		let sender = "";
		let email = "";
		let dateStr = defaultDate;
		let body = block;

		const threadUpdateMatch = block.match(
			/^---+\s*Thread Update\s*\((.*?)\)\s*from\s*(.*?)\s*\((.*?)\)\s*---+/i,
		);
		if (threadUpdateMatch) {
			dateStr = threadUpdateMatch[1].trim() || dateStr;
			sender = threadUpdateMatch[2].trim();
			email = threadUpdateMatch[3].trim();
			body = block.replace(/^---+.*?---+/i, "").trim();
		} else {
			const wroteMatch = block.match(/^On\s+([^\n]+?)\s+wrote:/i);
			if (wroteMatch) {
				const headerInfo = wroteMatch[1];
				const emailM = headerInfo.match(/<([^>]+)>/);
				if (emailM) email = emailM[1].trim();

				const cleanHeader = headerInfo.replace(/<[^>]+>/g, "").trim();
				const parts = cleanHeader.split(",");
				if (parts.length > 1) {
					sender = parts[parts.length - 1].trim();
					dateStr =
						parts
							.slice(0, parts.length - 1)
							.join(",")
							.trim() || dateStr;
				} else {
					sender = cleanHeader;
				}
				body = block.replace(/^On\s+[^\n]+?\s+wrote:/i, "").trim();
			} else {
				const fromMatch = block.match(
					/(?:From:\s*([^\n]+)|-{3,}\s*Forwarded message\s*-{3,}[\s\S]*?From:\s*([^\n]+))/i,
				);
				if (fromMatch) {
					const fromLine = fromMatch[1] || fromMatch[2];
					const emailM =
						fromLine.match(/<([^>]+)>/) ||
						fromLine.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
					if (emailM) email = (emailM[1] || emailM[0]).trim();

					const nameM = fromLine
						.replace(/<[^>]+>/g, "")
						.replace(/^"|"$/g, "")
						.trim();
					if (nameM && !nameM.includes("@")) sender = nameM;

					const sentMatch = block.match(/^(?:Sent|Date):\s*([^\n]+)/im);
					if (sentMatch) dateStr = sentMatch[1].trim();

					body = block
						.replace(/^-\s*Forwarded message\s*-+/i, "")
						.replace(
							/^-{3,}\s*(?:Original Message|Forwarded message)\s*-{3,}/i,
							"",
						)
						.replace(/^From:\s*[^\n]+/im, "")
						.replace(/^(?:Sent|Date):\s*[^\n]+/im, "")
						.replace(/^To:\s*[^\n]+/im, "")
						.replace(/^Subject:\s*[^\n]+/im, "")
						.trim();
				}
			}
		}

		body = body
			.split("\n")
			.map((l) => l.replace(/^>+\s?/, ""))
			.join("\n")
			.trim();

		if (!email) {
			email = extractEmailFromText(block);
		}

		const isCompanyBlock = isEnconCompanyAddr(email);

		if (!sender) {
			if (isCompanyBlock) {
				const foundName = extractNameFromText(body);
				sender = foundName ? `${foundName} (ENCON)` : "ENCON Team";
			} else {
				sender = defaultSender || "Customer";
			}
		}

		if (!email) {
			email = isCompanyBlock ? "mdo@encon.co.in" : defaultEmail;
		}

		messages.push({
			id: idx + 1,
			sender,
			email,
			date: dateStr,
			body: body || "(No message content)",
			isCompany: isCompanyBlock,
		});
	});

	return messages;
}
