"use client";

import { CostingPageTemplate } from "@/components/automation/CostingPageTemplate";
import { Calculator, Factory } from "lucide-react";
import { useState } from "react";

export default function BTFCostingPage() {
	const [specifications, setSpecifications] = useState({
		bogieLength: "",
		bogieWidth: "",
		bogieHeight: "",
		burnerCount: 6,
		fuelType: "GAS",
		controlType: "PLC",
		loadCapacity: "",
	});

	const SpecificationsComponent = (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
				Specifications
			</h2>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Bogie Length (mm)
					</label>
					<input
						type="number"
						value={specifications.bogieLength}
						onChange={(e) =>
							setSpecifications({
								...specifications,
								bogieLength: e.target.value,
							})
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						placeholder="e.g., 5000"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Bogie Width (mm)
					</label>
					<input
						type="number"
						value={specifications.bogieWidth}
						onChange={(e) =>
							setSpecifications({
								...specifications,
								bogieWidth: e.target.value,
							})
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						placeholder="e.g., 3000"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Load Capacity (Tons)
					</label>
					<input
						type="number"
						value={specifications.loadCapacity}
						onChange={(e) =>
							setSpecifications({
								...specifications,
								loadCapacity: e.target.value,
							})
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						placeholder="e.g., 15"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Number of Burners
					</label>
					<input
						type="number"
						value={specifications.burnerCount}
						onChange={(e) =>
							setSpecifications({
								...specifications,
								burnerCount: parseInt(e.target.value),
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
						<option value="DUAL">Dual Fuel</option>
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
			title="BTF Costing System"
			subtitle="Bogie Type Furnace - Cost Calculation & BOM"
			icon={Factory}
			iconColor="bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
			specificationsComponent={SpecificationsComponent}
			initialBOMItems={[
				{
					id: "1",
					particular: "Bogie Structure - Heavy Frame",
					category: "Structure",
					qty: 1,
					unit: "Set",
					rate: 280000,
					amount: 280000,
				},
				{
					id: "2",
					particular: "Rail Track & Wheels",
					category: "Structure",
					qty: 1,
					unit: "Set",
					rate: 120000,
					amount: 120000,
				},
				{
					id: "3",
					particular: "Burner Assembly",
					category: "Burner",
					qty: 6,
					unit: "Nos",
					rate: 40000,
					amount: 240000,
				},
				{
					id: "4",
					particular: "Refractory Lining",
					category: "Refractory",
					qty: 1,
					unit: "Set",
					rate: 150000,
					amount: 150000,
				},
			]}
			initialCosts={{
				materialTotal: 790000,
				laborTotal: 50000,
				overheadPercent: 15,
				markupPercent: 25,
			}}
		/>
	);
}
