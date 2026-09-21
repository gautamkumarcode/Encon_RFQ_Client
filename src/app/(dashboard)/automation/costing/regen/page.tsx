"use client";

import { CostingPageTemplate } from "@/components/automation/CostingPageTemplate";
import { Calculator, Recycle } from "lucide-react";
import { useState } from "react";

export default function RegenCostingPage() {
	const [specifications, setSpecifications] = useState({
		dutyKW: "",
		fuelType: "GAS",
		airPreheatTemp: "",
		pairCount: 1,
		controlValveSize: "",
	});

	const SpecificationsComponent = (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
				Specifications
			</h2>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Duty (kW)
					</label>
					<input
						type="number"
						value={specifications.dutyKW}
						onChange={(e) =>
							setSpecifications({ ...specifications, dutyKW: e.target.value })
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						placeholder="e.g., 500"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Air Preheat Temp (°C)
					</label>
					<input
						type="number"
						value={specifications.airPreheatTemp}
						onChange={(e) =>
							setSpecifications({
								...specifications,
								airPreheatTemp: e.target.value,
							})
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						placeholder="e.g., 800"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Number of Pairs
					</label>
					<input
						type="number"
						value={specifications.pairCount}
						onChange={(e) =>
							setSpecifications({
								...specifications,
								pairCount: parseInt(e.target.value),
							})
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Fuel Type
					</label>
					<select
						value={specifications.fuelType}
						onChange={(e) =>
							setSpecifications({ ...specifications, fuelType: e.target.value })
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
						<option value="GAS">Gas</option>
						<option value="OIL">Oil</option>
					</select>
				</div>
			</div>
			<button className="w-full mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors">
				<Calculator className="h-4 w-4" />
				<span>Calculate BOM</span>
			</button>
		</div>
	);

	return (
		<CostingPageTemplate
			title="Regenerative Burner Costing"
			subtitle="Regen System - Cost Calculation & BOM"
			icon={Recycle}
			iconColor="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
			specificationsComponent={SpecificationsComponent}
			initialBOMItems={[
				{
					id: "1",
					particular: "Regenerative Burner Pair",
					category: "Burner",
					qty: 1,
					unit: "Set",
					rate: 450000,
					amount: 450000,
				},
				{
					id: "2",
					particular: "Reversing Valve System",
					category: "Control",
					qty: 1,
					unit: "Set",
					rate: 180000,
					amount: 180000,
				},
				{
					id: "3",
					particular: "Ceramic Media Bed",
					category: "Heat Exchanger",
					qty: 2,
					unit: "Set",
					rate: 120000,
					amount: 240000,
				},
				{
					id: "4",
					particular: "PLC Control System",
					category: "Control",
					qty: 1,
					unit: "Set",
					rate: 150000,
					amount: 150000,
				},
			]}
			initialCosts={{
				materialTotal: 1020000,
				laborTotal: 60000,
				overheadPercent: 12,
				markupPercent: 30,
			}}
		/>
	);
}
