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

	// Purchase price / cost master visibility — PURCHASE team and above only.
	// All other roles see only the final selling price.
	const canViewPurchasePrices =
		["ADMIN", "CO", "GM", "PRODUCTION_HEAD", "PURCHASE"].includes(userRole) ||
		userRole.includes("PURCHASE") ||
		userRole.includes("ADMIN");

	// Can edit purchase/cost rates in the Master Price Catalog
	const canEditPurchasePrices =
		["ADMIN", "PURCHASE"].includes(userRole) ||
		userRole.includes("PURCHASE") ||
		userRole.includes("ADMIN");

	return {
		userRole,
		canReview,
		canEdit,
		canChangeAssignment,
		canChangeStatus,
		isTechnicalOnly,
		canViewPurchasePrices,
		canEditPurchasePrices,
	};
}
