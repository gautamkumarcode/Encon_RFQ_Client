"use client";

import { ArrowLeft, Calculator, FileSpreadsheet, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface BOMItem {
	sNo: number;
	itemCode?: string;
	particular: string;
	category: string;
	qty: number;
	unit: string;
	rate: number;
	totalAmount: number;
}

export default function CalculateBOMPage() {
	const [isCalculating, setIsCalculating] = useState(false);
	const [bomResult, setBomResult] = useState<any>(null);
	const [formData, setFormData] = useState({
		productType: "VLPH",
		capacity: 0,
		specifications: {
			burnerCount: 2,
			fuelType: "GAS",
			controlType: "PLC",
		},
	});

	const productTypes = [
		{ value: "VLPH", label: "Vertical Ladle Preheater" },
		{ value: "HLPH", label: "Horizontal Ladle Preheater" },
		{ value: "BRF", label: "Billet Reheating Furnace" },
		{ value: "BURNER", label: "Burner (Standalone)" },
	];

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSpecChange = (key: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			specifications: {
				...prev.specifications,
				[key]: value,
			},
		}));
	};

	const handleCalculate = async () => {
		setIsCalculating(true);
		setBomResult(null);

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/automation/bom/calculate`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(formData),
					credentials: "include",
				},
			);

			if (!response.ok) {
				throw new Error("Failed to calculate BOM");
			}

			const result = await response.json();
			setBomResult(result.data);
		} catch (error) {
			console.error("Error calculating BOM:", error);
			alert("Failed to calculate BOM. Please try again.");
		} finally {
			setIsCalculating(false);
		}
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: "INR",
			maximumFractionDigits: 0,
		}).format(amount);
	};

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center space-x-4">
				<Link
					href="/automation"
					className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
					<ArrowLeft className="h-5 w-5" />
				</Link>
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
						Calculate BOM
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-2">
						Bill of Materials and cost estimation
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Input Form */}
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
						Product Specifications
					</h2>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Product Type
						</label>
						<select
							name="productType"
							value={formData.productType}
							onChange={handleInputChange}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
							{productTypes.map((type) => (
								<option key={type.value} value={type.value}>
									{type.label}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Capacity
						</label>
						<input
							type="number"
							name="capacity"
							value={formData.capacity}
							onChange={handleInputChange}
							placeholder="Enter capacity"
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						/>
					</div>

					{formData.productType === "VLPH" && (
						<>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Number of Burners
								</label>
								<input
									type="number"
									value={formData.specifications.burnerCount}
									onChange={(e) =>
										handleSpecChange("burnerCount", parseInt(e.target.value))
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Fuel Type
								</label>
								<select
									value={formData.specifications.fuelType}
									onChange={(e) => handleSpecChange("fuelType", e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
									<option value="GAS">Gas</option>
									<option value="OIL">Oil</option>
									<option value="DUAL">Dual Fuel</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Control Type
								</label>
								<select
									value={formData.specifications.controlType}
									onChange={(e) =>
										handleSpecChange("controlType", e.target.value)
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
									<option value="MANUAL">Manual</option>
									<option value="PLC">PLC</option>
									<option value="SCADA">SCADA</option>
								</select>
							</div>
						</>
					)}

					<button
						onClick={handleCalculate}
						disabled={isCalculating}
						className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
						{isCalculating ? (
							<>
								<Loader2 className="h-5 w-5 animate-spin" />
								<span>Calculating...</span>
							</>
						) : (
							<>
								<Calculator className="h-5 w-5" />
								<span>Calculate BOM</span>
							</>
						)}
					</button>
				</div>

				{/* Results */}
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
						Cost Summary
					</h2>

					{bomResult ? (
						<div className="space-y-6">
							{/* Summary Cards */}
							<div className="grid grid-cols-2 gap-4">
								<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
									<p className="text-sm text-gray-600 dark:text-gray-400">
										Material Total
									</p>
									<p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
										{formatCurrency(bomResult.materialTotal)}
									</p>
								</div>
								<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
									<p className="text-sm text-gray-600 dark:text-gray-400">
										Labor Total
									</p>
									<p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
										{formatCurrency(bomResult.laborTotal)}
									</p>
								</div>
								<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
									<p className="text-sm text-gray-600 dark:text-gray-400">
										Overhead
									</p>
									<p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
										{formatCurrency(bomResult.overhead)}
									</p>
								</div>
								<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
									<p className="text-sm text-gray-600 dark:text-gray-400">
										Total Cost
									</p>
									<p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
										{formatCurrency(bomResult.totalCost)}
									</p>
								</div>
							</div>

							{/* Selling Price */}
							<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
								<p className="text-sm text-blue-600 dark:text-blue-400">
									Suggested Selling Price (with {bomResult.markup}% markup)
								</p>
								<p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
									{formatCurrency(bomResult.suggestedSellingPrice)}
								</p>
							</div>

							{/* BOM Items Table */}
							<div>
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
									Bill of Materials
								</h3>
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead className="bg-gray-50 dark:bg-gray-700">
											<tr>
												<th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
													Item
												</th>
												<th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
													Qty
												</th>
												<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
													Rate
												</th>
												<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
													Amount
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
											{bomResult.items.map((item: BOMItem) => (
												<tr key={item.sNo}>
													<td className="px-3 py-2 text-gray-900 dark:text-white">
														{item.particular}
													</td>
													<td className="px-3 py-2 text-gray-600 dark:text-gray-400">
														{item.qty} {item.unit}
													</td>
													<td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
														{formatCurrency(item.rate)}
													</td>
													<td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
														{formatCurrency(item.totalAmount)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>

							{/* Export Button */}
							<button className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center justify-center space-x-2">
								<FileSpreadsheet className="h-5 w-5" />
								<span>Export to Excel</span>
							</button>
						</div>
					) : (
						<div className="text-center py-12">
							<Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
							<p className="text-gray-600 dark:text-gray-400">
								Configure product specifications and click Calculate BOM to see
								cost breakdown
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
