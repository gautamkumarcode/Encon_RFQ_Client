export function getRolePermissions(userRoleRaw?: string) {
	const userRole = (userRoleRaw || "").toUpperCase().trim();

	const canReview = ["ADMIN", "CO", "GM", "PRODUCTION_HEAD"].includes(userRole);

	const canEdit =
		["ADMIN", "CO", "GM", "PRODUCTION_HEAD", "SALES_MARKETING", "TECHNICAL_PERSON", "TECHNICAL", "ENGINEER", "DESIGNER"].includes(userRole) ||
		userRole.includes("TECH") ||
		userRole.includes("ENG") ||
		userRole.includes("DESIGN") ||
		userRole.includes("SALES");

	const canChangeAssignment =
		["ADMIN", "CO", "GM", "PRODUCTION_HEAD", "SALES_MARKETING"].includes(userRole) ||
		userRole.includes("SALES") ||
		userRole.includes("ADMIN") ||
		userRole.includes("MARKETING");

	const canChangeStatus =
		["ADMIN", "CO", "GM", "PRODUCTION_HEAD", "SALES_MARKETING"].includes(userRole) ||
		userRole.includes("SALES") ||
		userRole.includes("ADMIN") ||
		userRole.includes("MARKETING");

	const isTechnicalOnly = userRole === "TECHNICAL_PERSON" || (userRole.includes("TECH") && !userRole.includes("ADMIN") && !userRole.includes("SALES"));

	return {
		userRole,
		canReview,
		canEdit,
		canChangeAssignment,
		canChangeStatus,
		isTechnicalOnly,
	};
}
