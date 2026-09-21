"use client";

import {
	Calculator,
	ChevronRight,
	Droplet,
	Factory,
	FileText,
	Flame,
	Gauge,
	History,
	Home,
	Menu,
	Recycle,
	Settings,
	Wind,
	X,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

interface NavItem {
	label: string;
	path: string;
	icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
	title: string;
	items: NavItem[];
}

export default function AutomationLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

	const navSections: NavSection[] = [
		{
			title: "Main",
			items: [
				{ label: "Dashboard", path: "/automation", icon: Home },
				{
					label: "Generate Offer",
					path: "/automation/generate-offer",
					icon: FileText,
				},
				{
					label: "Calculate BOM",
					path: "/automation/calculate-bom",
					icon: Calculator,
				},
				{ label: "Offer History", path: "/automation/history", icon: History },
			],
		},
		{
			title: "Costing Systems",
			items: [
				{
					label: "VLPH Costing",
					path: "/automation/costing/vlph",
					icon: Flame,
				},
				{
					label: "HLPH Costing",
					path: "/automation/costing/hlph",
					icon: Flame,
				},
				{
					label: "BRF Costing",
					path: "/automation/costing/brf",
					icon: Factory,
				},
				{
					label: "BTF Costing",
					path: "/automation/costing/btf",
					icon: Factory,
				},
				{
					label: "Regen Costing",
					path: "/automation/costing/regen",
					icon: Recycle,
				},
				{
					label: "Recuperator",
					path: "/automation/costing/recuperator",
					icon: Gauge,
				},
				{
					label: "Burner Costing",
					path: "/automation/costing/burner",
					icon: Flame,
				},
				{
					label: "Blower Costing",
					path: "/automation/costing/blower",
					icon: Wind,
				},
				{
					label: "HPU Costing",
					path: "/automation/costing/hpu",
					icon: Droplet,
				},
			],
		},
		{
			title: "Configuration",
			items: [
				{
					label: "Templates",
					path: "/automation/templates",
					icon: FileText,
				},
				{
					label: "Price Master",
					path: "/automation/price-master",
					icon: Calculator,
				},
				{ label: "Settings", path: "/automation/settings", icon: Settings },
			],
		},
	];

	const renderSidebarContent = () => (
		<>
			{/* Header */}
			<div className="p-4 border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
						<h2 className="text-lg font-bold text-gray-900 dark:text-white">
							Automation
						</h2>
					</div>
					{mobileSidebarOpen && (
						<button
							onClick={() => setMobileSidebarOpen(false)}
							className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
							<X className="h-5 w-5" />
						</button>
					)}
				</div>
				<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
					Offer Generation System
				</p>
			</div>

			{/* Navigation */}
			<div className="flex-1 overflow-y-auto p-4 space-y-6">
				{navSections.map((section) => (
					<div key={section.title}>
						<h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
							{section.title}
						</h3>
						<nav className="space-y-1">
							{section.items.map((item) => {
								const isActive = pathname === item.path;
								const Icon = item.icon;

								return (
									<Link
										key={item.path}
										href={item.path}
										onClick={() => setMobileSidebarOpen(false)}
										className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
											isActive
												? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
												: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
										}`}>
										<Icon
											className={`h-4 w-4 ${
												isActive
													? "text-blue-600 dark:text-blue-400"
													: "text-gray-400 dark:text-gray-500"
											}`}
										/>
										<span className="flex-1">{item.label}</span>
										{isActive && (
											<ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
										)}
									</Link>
								);
							})}
						</nav>
					</div>
				))}
			</div>

			{/* Footer */}
			<div className="p-4 border-t border-gray-200 dark:border-gray-700">
				<div className="text-xs text-gray-600 dark:text-gray-400">
					<div className="flex items-center justify-between mb-1">
						<span>Module Version</span>
						<span className="font-semibold">v1.0.0</span>
					</div>
					<div className="flex items-center justify-between">
						<span>Templates</span>
						<span className="font-semibold">9 Active</span>
					</div>
				</div>
			</div>
		</>
	);

	return (
		<div className="flex h-full">
			{/* Desktop Sidebar */}
			<aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full">
				{renderSidebarContent()}
			</aside>

			{/* Mobile Toggle Button */}
			<button
				onClick={() => setMobileSidebarOpen(true)}
				className="md:hidden fixed bottom-4 right-4 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
				<Menu className="h-6 w-6" />
			</button>

			{/* Mobile Sidebar */}
			{mobileSidebarOpen && (
				<div className="md:hidden fixed inset-0 z-50 flex">
					{/* Backdrop */}
					<div
						className="fixed inset-0 bg-black/50 backdrop-blur-sm"
						onClick={() => setMobileSidebarOpen(false)}
					/>

					{/* Sidebar Content */}
					<aside className="relative w-64 max-w-[80vw] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full shadow-xl">
						{renderSidebarContent()}
					</aside>
				</div>
			)}

			{/* Main Content */}
			<div className="flex-1 overflow-y-auto h-full">{children}</div>
		</div>
	);
}
