"use client";

import {
	ArrowRight,
	Calculator,
	CheckCircle2,
	Clock,
	Download,
	FileText,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AutomationPage() {
	const [stats] = useState({
		offersGenerated: 145,
		avgGenerationTime: "2.3",
		costSheets: 89,
		templatesAvailable: 9,
	});

	const templates = [
		{
			id: "VLPH",
			name: "Vertical Ladle Preheater",
			description: "Standard VLPH offer with burners and control system",
			icon: "🔥",
		},
		{
			id: "HLPH",
			name: "Horizontal Ladle Preheater",
			description: "Horizontal ladle preheating system",
			icon: "🏭",
		},
		{
			id: "BRF",
			name: "Billet Reheating Furnace",
			description: "BRF with zone control and recuperator",
			icon: "⚙️",
		},
		{
			id: "BTF",
			name: "Bogie Type Furnace",
			description: "Bogie furnace with heavy structure",
			icon: "🔧",
		},
		{
			id: "REGEN",
			name: "Regenerative Burner System",
			description: "Dual regenerative burner with valve control",
			icon: "♻️",
		},
		{
			id: "RECUP",
			name: "Recuperator System",
			description: "Air preheating recuperator",
			icon: "🌡️",
		},
		{
			id: "BURNER",
			name: "Burner (Standalone)",
			description: "Oil/Gas/Dual fuel burners",
			icon: "🔥",
		},
		{
			id: "BLOWER",
			name: "Blower (Standalone)",
			description: "Centrifugal blowers with motor",
			icon: "💨",
		},
		{
			id: "HPU",
			name: "Hydraulic Power Unit",
			description: "HPU with pumps and cylinders",
			icon: "⚡",
		},
	];

	const recentOffers = [
		{
			id: 1,
			offerNo: "ENCON/2026/09/143",
			customer: "ABC Steel Industries",
			product: "Vertical Ladle Preheater",
			date: "2026-09-15",
			status: "completed",
		},
		{
			id: 2,
			offerNo: "ENCON/2026/09/142",
			customer: "XYZ Manufacturing",
			product: "BRF System",
			date: "2026-09-14",
			status: "completed",
		},
		{
			id: 3,
			offerNo: "ENCON/2026/09/141",
			customer: "PQR Metals",
			product: "Regenerative Burner",
			date: "2026-09-13",
			status: "completed",
		},
	];

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
					Offer Automation
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-2">
					Automated offer generation and BOM calculation system
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Offers Generated
							</p>
							<p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
								{stats.offersGenerated}
							</p>
						</div>
						<FileText className="h-10 w-10 text-blue-600" />
					</div>
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Avg. Generation Time
							</p>
							<p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
								{stats.avgGenerationTime}s
							</p>
						</div>
						<Clock className="h-10 w-10 text-green-600" />
					</div>
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Cost Sheets
							</p>
							<p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
								{stats.costSheets}
							</p>
						</div>
						<Calculator className="h-10 w-10 text-purple-600" />
					</div>
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Templates
							</p>
							<p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
								{stats.templatesAvailable}
							</p>
						</div>
						<Zap className="h-10 w-10 text-orange-600" />
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Link
					href="/automation/generate-offer"
					className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 flex items-center justify-between transition-colors">
					<div>
						<h3 className="text-xl font-semibold">Generate New Offer</h3>
						<p className="text-blue-100 mt-1">
							Create comprehensive offer documents
						</p>
					</div>
					<ArrowRight className="h-6 w-6" />
				</Link>

				<Link
					href="/automation/calculate-bom"
					className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-6 flex items-center justify-between transition-colors">
					<div>
						<h3 className="text-xl font-semibold">Calculate BOM</h3>
						<p className="text-purple-100 mt-1">
							Bill of materials and cost estimation
						</p>
					</div>
					<ArrowRight className="h-6 w-6" />
				</Link>
			</div>

			{/* Templates Section */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
					Available Templates
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{templates.map((template) => (
						<div
							key={template.id}
							className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer">
							<div className="flex items-start space-x-3">
								<span className="text-3xl">{template.icon}</span>
								<div className="flex-1">
									<h3 className="font-semibold text-gray-900 dark:text-white">
										{template.name}
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
										{template.description}
									</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Recent Offers */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
						Recent Offers
					</h2>
					<Link
						href="/automation/history"
						className="text-blue-600 hover:text-blue-700 text-sm font-medium">
						View All
					</Link>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50 dark:bg-gray-700">
							<tr>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Offer No
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Customer
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Product
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Date
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Status
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
							{recentOffers.map((offer) => (
								<tr
									key={offer.id}
									className="hover:bg-gray-50 dark:hover:bg-gray-700">
									<td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
										{offer.offerNo}
									</td>
									<td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
										{offer.customer}
									</td>
									<td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
										{offer.product}
									</td>
									<td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
										{new Date(offer.date).toLocaleDateString()}
									</td>
									<td className="px-4 py-3">
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
											<CheckCircle2 className="h-3 w-3 mr-1" />
											{offer.status}
										</span>
									</td>
									<td className="px-4 py-3">
										<button className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center">
											<Download className="h-4 w-4 mr-1" />
											Download
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
