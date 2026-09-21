"use client";

import { Calendar, Download, Eye, History, Search, Trash2 } from "lucide-react";
import { useState } from "react";

interface OfferHistory {
	id: string;
	offerNo: string;
	customer: string;
	productType: string;
	amount: number;
	date: string;
	status: "completed" | "draft" | "sent";
}

export default function OfferHistoryPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState("all");
	const [filterProduct, setFilterProduct] = useState("all");

	const offers: OfferHistory[] = [
		{
			id: "1",
			offerNo: "ENCON/2026/09/143",
			customer: "ABC Steel Industries",
			productType: "VLPH",
			amount: 750000,
			date: "2026-09-15",
			status: "completed",
		},
		{
			id: "2",
			offerNo: "ENCON/2026/09/142",
			customer: "XYZ Manufacturing Pvt Ltd",
			productType: "BRF",
			amount: 1850000,
			date: "2026-09-14",
			status: "sent",
		},
		{
			id: "3",
			offerNo: "ENCON/2026/09/141",
			customer: "PQR Metals Corporation",
			productType: "REGEN",
			amount: 1250000,
			date: "2026-09-13",
			status: "completed",
		},
		{
			id: "4",
			offerNo: "ENCON/2026/09/140",
			customer: "LMN Industries",
			productType: "HLPH",
			amount: 820000,
			date: "2026-09-12",
			status: "draft",
		},
		{
			id: "5",
			offerNo: "ENCON/2026/09/139",
			customer: "DEF Forgings Ltd",
			productType: "BTF",
			amount: 980000,
			date: "2026-09-11",
			status: "completed",
		},
	];

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: "INR",
			maximumFractionDigits: 0,
		}).format(amount);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "sent":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "draft":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
						<History className="h-6 w-6 text-purple-600 dark:text-purple-400" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
							Offer History
						</h1>
						<p className="text-sm text-gray-600 dark:text-gray-400">
							View and manage generated offers
						</p>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="md:col-span-2">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Search
						</label>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search by offer no, customer..."
								className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Status
						</label>
						<select
							value={filterStatus}
							onChange={(e) => setFilterStatus(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
							<option value="all">All Status</option>
							<option value="completed">Completed</option>
							<option value="sent">Sent</option>
							<option value="draft">Draft</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Product Type
						</label>
						<select
							value={filterProduct}
							onChange={(e) => setFilterProduct(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
							<option value="all">All Products</option>
							<option value="VLPH">VLPH</option>
							<option value="HLPH">HLPH</option>
							<option value="BRF">BRF</option>
							<option value="BTF">BTF</option>
							<option value="REGEN">Regen</option>
						</select>
					</div>
				</div>
			</div>

			{/* Offers Table */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50 dark:bg-gray-700">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Offer No
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Customer
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Product Type
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Amount
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Date
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Status
								</th>
								<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
							{offers.map((offer) => (
								<tr
									key={offer.id}
									className="hover:bg-gray-50 dark:hover:bg-gray-700">
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
										{offer.offerNo}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
										{offer.customer}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
										<span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
											{offer.productType}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
										{formatCurrency(offer.amount)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
										<div className="flex items-center">
											<Calendar className="h-4 w-4 mr-2 text-gray-400" />
											{new Date(offer.date).toLocaleDateString("en-IN")}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span
											className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
											{offer.status.charAt(0).toUpperCase() +
												offer.status.slice(1)}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-center">
										<div className="flex items-center justify-center space-x-2">
											<button className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
												<Eye className="h-4 w-4" />
											</button>
											<button className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors">
												<Download className="h-4 w-4" />
											</button>
											<button className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-600">
					<div className="text-sm text-gray-600 dark:text-gray-400">
						Showing 1 to 5 of 5 results
					</div>
					<div className="flex space-x-2">
						<button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50">
							Previous
						</button>
						<button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50">
							Next
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
