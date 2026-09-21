"use client";

import {
	Calculator,
	Download,
	Factory,
	Plus,
	Save,
	Trash2,
} from "lucide-react";
import { useState } from "react";

interface BOMItem {
	id: string;
	particular: string;
	category: string;
	qty: number;
	unit: string;
	rate: number;
	amount: number;
}

export default function BRFCostingPage() {
	const [specifications, setSpecifications] = useState({
		furnaceLength: "",
		furnaceWidth: "",
		furnaceHeight: "",
		zoneCount: 3,
		burnersPerZone: 4,
		fuelType: "GAS",
		recuperator: false,
		capacityTPH: "",
	});

	const [bomItems, setBomItems] = useState<BOMItem[]>([
		{
			id: "1",
			particular: "Furnace Structure - Heavy Duty",
			category: "Structure",
			qty: 1,
			unit: "Set",
			rate: 350000,
			amount: 350000,
		},
		{
			id: "2",
			particular: "Refractory Lining",
			category: "Refractory",
			qty: 1,
			unit: "Set",
			rate: 180000,
			amount: 180000,
		},
		{
			id: "3",
			particular: "Zone Burners with Blocks",
			category: "Burner",
			qty: 12,
			unit: "Nos",
			rate: 42000,
			amount: 504000,
		},
		{
			id: "4",
			particular: "Recuperator System",
			category: "Heat Recovery",
			qty: 1,
			unit: "Set",
			rate: 250000,
			amount: 250000,
		},
		{
			id: "5",
			particular: "PLC Control Panel",
			category: "Control",
			qty: 1,
			unit: "Set",
			rate: 150000,
			amount: 150000,
		},
	]);

	const [costs] = useState({
		materialTotal: 1434000,
		laborTotal: 85000,
		overheadPercent: 12,
		markupPercent: 25,
	});

	const handleSpecChange = (field: string, value: any) => {
		setSpecifications((prev) => ({ ...prev, [field]: value }));
	};

	const addBOMItem = () => {
		setBomItems([
			...bomItems,
			{
				id: Date.now().toString(),
				particular: "",
				category: "Raw Material",
				qty: 1,
				unit: "Nos",
				rate: 0,
				amount: 0,
			},
		]);
	};

	const updateBOMItem = (id: string, field: string, value: any) => {
		setBomItems(
			bomItems.map((item) => {
				if (item.id === id) {
					const updated = { ...item, [field]: value };
					if (field === "qty" || field === "rate") {
						updated.amount = updated.qty * updated.rate;
					}
					return updated;
				}
				return item;
			}),
		);
	};

	const deleteBOMItem = (id: string) => {
		setBomItems(bomItems.filter((item) => item.id !== id));
	};

	const calculateTotals = () => {
		const materialTotal = bomItems.reduce((sum, item) => sum + item.amount, 0);
		const overhead = materialTotal * (costs.overheadPercent / 100);
		const totalCost = materialTotal + costs.laborTotal + overhead;
		const markup = totalCost * (costs.markupPercent / 100);
		const sellingPrice = totalCost + markup;

		return {
			materialTotal,
			laborTotal: costs.laborTotal,
			overhead,
			totalCost,
			markup,
			sellingPrice,
		};
	};

	const totals = calculateTotals();

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: "INR",
			maximumFractionDigits: 0,
		}).format(amount);
	};

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
						<Factory className="h-6 w-6 text-red-600 dark:text-red-400" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
							BRF Costing System
						</h1>
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Billet Reheating Furnace - Cost Calculation & BOM
						</p>
					</div>
				</div>
				<div className="flex space-x-2">
					<button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors">
						<Save className="h-4 w-4" />
						<span>Save</span>
					</button>
					<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors">
						<Download className="h-4 w-4" />
						<span>Export</span>
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-1 space-y-6">
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
							Specifications
						</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Furnace Length (mm)
								</label>
								<input
									type="number"
									value={specifications.furnaceLength}
									onChange={(e) =>
										handleSpecChange("furnaceLength", e.target.value)
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
									placeholder="e.g., 12000"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Furnace Width (mm)
								</label>
								<input
									type="number"
									value={specifications.furnaceWidth}
									onChange={(e) =>
										handleSpecChange("furnaceWidth", e.target.value)
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
									placeholder="e.g., 3000"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Furnace Height (mm)
								</label>
								<input
									type="number"
									value={specifications.furnaceHeight}
									onChange={(e) =>
										handleSpecChange("furnaceHeight", e.target.value)
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
									placeholder="e.g., 2500"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Number of Zones
								</label>
								<input
									type="number"
									value={specifications.zoneCount}
									onChange={(e) =>
										handleSpecChange("zoneCount", parseInt(e.target.value))
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Burners per Zone
								</label>
								<input
									type="number"
									value={specifications.burnersPerZone}
									onChange={(e) =>
										handleSpecChange("burnersPerZone", parseInt(e.target.value))
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Capacity (TPH)
								</label>
								<input
									type="number"
									value={specifications.capacityTPH}
									onChange={(e) =>
										handleSpecChange("capacityTPH", e.target.value)
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
									placeholder="e.g., 20"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Fuel Type
								</label>
								<select
									value={specifications.fuelType}
									onChange={(e) => handleSpecChange("fuelType", e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
									<option value="GAS">Gas</option>
									<option value="OIL">Oil</option>
									<option value="DUAL">Dual Fuel</option>
								</select>
							</div>
							<div className="flex items-center">
								<input
									type="checkbox"
									id="recuperator"
									checked={specifications.recuperator}
									onChange={(e) =>
										handleSpecChange("recuperator", e.target.checked)
									}
									className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
								/>
								<label
									htmlFor="recuperator"
									className="ml-2 text-sm text-gray-700 dark:text-gray-300">
									Include Recuperator
								</label>
							</div>
						</div>

						<button className="w-full mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors">
							<Calculator className="h-4 w-4" />
							<span>Calculate BOM</span>
						</button>
					</div>

					<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
							Cost Summary
						</h2>
						<div className="space-y-3">
							<div className="flex justify-between text-sm">
								<span className="text-gray-600 dark:text-gray-400">
									Material Total
								</span>
								<span className="font-semibold text-gray-900 dark:text-white">
									{formatCurrency(totals.materialTotal)}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-gray-600 dark:text-gray-400">
									Labor Total
								</span>
								<span className="font-semibold text-gray-900 dark:text-white">
									{formatCurrency(totals.laborTotal)}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-gray-600 dark:text-gray-400">
									Overhead ({costs.overheadPercent}%)
								</span>
								<span className="font-semibold text-gray-900 dark:text-white">
									{formatCurrency(totals.overhead)}
								</span>
							</div>
							<div className="border-t border-gray-200 dark:border-gray-700 pt-3">
								<div className="flex justify-between text-sm">
									<span className="text-gray-600 dark:text-gray-400">
										Total Cost
									</span>
									<span className="font-semibold text-gray-900 dark:text-white">
										{formatCurrency(totals.totalCost)}
									</span>
								</div>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-gray-600 dark:text-gray-400">
									Markup ({costs.markupPercent}%)
								</span>
								<span className="font-semibold text-gray-900 dark:text-white">
									{formatCurrency(totals.markup)}
								</span>
							</div>
							<div className="border-t border-gray-200 dark:border-gray-700 pt-3">
								<div className="flex justify-between">
									<span className="text-lg font-semibold text-gray-900 dark:text-white">
										Selling Price
									</span>
									<span className="text-lg font-bold text-blue-600 dark:text-blue-400">
										{formatCurrency(totals.sellingPrice)}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="lg:col-span-2">
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
								Bill of Materials
							</h2>
							<button
								onClick={addBOMItem}
								className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 text-sm transition-colors">
								<Plus className="h-4 w-4" />
								<span>Add Item</span>
							</button>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead className="bg-gray-50 dark:bg-gray-700">
									<tr>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
											Particular
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
											Category
										</th>
										<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
											Qty
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
											Unit
										</th>
										<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
											Rate
										</th>
										<th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
											Amount
										</th>
										<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
											Action
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
									{bomItems.map((item) => (
										<tr key={item.id}>
											<td className="px-4 py-3">
												<input
													type="text"
													value={item.particular}
													onChange={(e) =>
														updateBOMItem(item.id, "particular", e.target.value)
													}
													className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
												/>
											</td>
											<td className="px-4 py-3">
												<input
													type="text"
													value={item.category}
													onChange={(e) =>
														updateBOMItem(item.id, "category", e.target.value)
													}
													className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
												/>
											</td>
											<td className="px-4 py-3">
												<input
													type="number"
													value={item.qty}
													onChange={(e) =>
														updateBOMItem(
															item.id,
															"qty",
															parseFloat(e.target.value) || 0,
														)
													}
													className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
												/>
											</td>
											<td className="px-4 py-3">
												<select
													value={item.unit}
													onChange={(e) =>
														updateBOMItem(item.id, "unit", e.target.value)
													}
													className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm">
													<option value="Nos">Nos</option>
													<option value="Set">Set</option>
													<option value="Kg">Kg</option>
													<option value="Mtr">Mtr</option>
													<option value="Sqm">Sqm</option>
												</select>
											</td>
											<td className="px-4 py-3">
												<input
													type="number"
													value={item.rate}
													onChange={(e) =>
														updateBOMItem(
															item.id,
															"rate",
															parseFloat(e.target.value) || 0,
														)
													}
													className="w-28 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
												/>
											</td>
											<td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
												{formatCurrency(item.amount)}
											</td>
											<td className="px-4 py-3 text-center">
												<button
													onClick={() => deleteBOMItem(item.id)}
													className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
													<Trash2 className="h-4 w-4" />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
