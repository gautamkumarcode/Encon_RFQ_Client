"use client";

import {
	CheckCircle2,
	Download,
	Edit2,
	Eye,
	FileText,
	Trash2,
	Upload,
} from "lucide-react";
import { useState } from "react";

interface Template {
	id: string;
	name: string;
	productType: string;
	description: string;
	version: string;
	lastModified: string;
	status: "active" | "draft";
}

export default function TemplatesPage() {
	const [templates] = useState<Template[]>([
		{
			id: "1",
			name: "VLPH_Offer_Template.docx",
			productType: "VLPH",
			description: "Standard vertical ladle preheater offer template",
			version: "v2.3",
			lastModified: "2026-09-10",
			status: "active",
		},
		{
			id: "2",
			name: "HLPH_Offer_Template.docx",
			productType: "HLPH",
			description: "Horizontal ladle preheater offer template",
			version: "v2.1",
			lastModified: "2026-09-08",
			status: "active",
		},
		{
			id: "3",
			name: "BRF_Offer_Template.docx",
			productType: "BRF",
			description: "Billet reheating furnace with zone control",
			version: "v1.8",
			lastModified: "2026-09-05",
			status: "active",
		},
		{
			id: "4",
			name: "Regen_Offer_Template.docx",
			productType: "REGEN",
			description: "Regenerative burner system template",
			version: "v3.0",
			lastModified: "2026-09-01",
			status: "active",
		},
		{
			id: "5",
			name: "Burner_Offer_Template.docx",
			productType: "BURNER",
			description: "Standalone burner offer template",
			version: "v2.5",
			lastModified: "2026-08-28",
			status: "draft",
		},
	]);

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
						<FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
							Offer Templates
						</h1>
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Manage Word document templates for offer generation
						</p>
					</div>
				</div>
				<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors">
					<Upload className="h-4 w-4" />
					<span>Upload Template</span>
				</button>
			</div>

			{/* Templates Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{templates.map((template) => (
					<div
						key={template.id}
						className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
						<div className="flex items-start justify-between mb-4">
							<div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
								<FileText className="h-8 w-8 text-gray-600 dark:text-gray-400" />
							</div>
							{template.status === "active" ? (
								<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
									<CheckCircle2 className="h-3 w-3 mr-1" />
									Active
								</span>
							) : (
								<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
									Draft
								</span>
							)}
						</div>

						<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
							{template.name}
						</h3>
						<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
							{template.description}
						</p>

						<div className="space-y-2 mb-4">
							<div className="flex items-center justify-between text-sm">
								<span className="text-gray-600 dark:text-gray-400">
									Product Type
								</span>
								<span className="font-medium text-gray-900 dark:text-white">
									{template.productType}
								</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-gray-600 dark:text-gray-400">
									Version
								</span>
								<span className="font-medium text-gray-900 dark:text-white">
									{template.version}
								</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-gray-600 dark:text-gray-400">
									Last Modified
								</span>
								<span className="font-medium text-gray-900 dark:text-white">
									{new Date(template.lastModified).toLocaleDateString("en-IN")}
								</span>
							</div>
						</div>

						<div className="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
							<button className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center space-x-2 text-sm">
								<Eye className="h-4 w-4" />
								<span>Preview</span>
							</button>
							<button className="flex-1 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex items-center justify-center space-x-2 text-sm">
								<Download className="h-4 w-4" />
								<span>Download</span>
							</button>
							<button className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
								<Edit2 className="h-4 w-4" />
							</button>
							<button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
								<Trash2 className="h-4 w-4" />
							</button>
						</div>
					</div>
				))}
			</div>

			{/* Template Variables */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
					Common Template Variables
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
						<h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
							Customer Info
						</h3>
						<ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
							<li>
								<code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
									{"{{company_name}}"}
								</code>
							</li>
							<li>
								<code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
									{"{{contact_person}}"}
								</code>
							</li>
							<li>
								<code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
									{"{{address}}"}
								</code>
							</li>
						</ul>
					</div>
					<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
						<h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
							Pricing
						</h3>
						<ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
							<li>
								<code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
									{"{{subtotal}}"}
								</code>
							</li>
							<li>
								<code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
									{"{{grand_total}}"}
								</code>
							</li>
							<li>
								<code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
									{"{{total_in_words}}"}
								</code>
							</li>
						</ul>
					</div>
					<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
						<h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
							Product Details
						</h3>
						<ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
							<li>
								<code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
									{"{{product_name}}"}
								</code>
							</li>
							<li>
								<code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
									{"{{capacity}}"}
								</code>
							</li>
							<li>
								<code className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
									{"{{specifications}}"}
								</code>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
