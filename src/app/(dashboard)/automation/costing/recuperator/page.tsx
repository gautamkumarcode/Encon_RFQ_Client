"use client";

import { CostingPageTemplate } from "@/components/automation/CostingPageTemplate";
import { Calculator, Gauge } from "lucide-react";
import { useState } from "react";

export default function RecuperatorCostingPage() {
	const [specifications, setSpecifications] = useState({
		airFlow: "",
		exhaustTemp: "",
		preheatTemp: "",
		tubeType: "SS",
		efficiency: "",
	});

	const SpecificationsComponent = (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
				Specifications
			</h2>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Air Flow (Nm³/hr)
					</label>
					<input
						type="number"
						value={specifications.airFlow}
						onChange={(e) =>
							setSpecifications({ ...specifications, airFlow: e.target.value })
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						placeholder="e.g., 5000"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Exhaust Temp (°C)
					</label>
					<input
						type="number"
						value={specifications.exhaustTemp}
						onChange={(e) =>
							setSpecifications({
								...specifications,
								exhaustTemp: e.target.value,
							})
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						placeholder="e.g., 1200"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Preheat Temp (°C)
					</label>
					<input
						type="number"
						value={specifications.preheatTemp}
						onChange={(e) =>
							setSpecifications({
								...specifications,
								preheatTemp: e.target.value,
							})
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						placeholder="e.g., 600"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Tube Material
					</label>
					<select
						value={specifications.tubeType}
						onChange={(e) =>
							setSpecifications({ ...specifications, tubeType: e.target.value })
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
						<option value="SS">Stainless Steel</option>
						<option value="CERAMIC">Ceramic</option>
						<option value="CAST_IRON">Cast Iron</option>
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
			title="Recuperator Costing"
			subtitle="Air Preheating System - Cost Calculation & BOM"
			icon={Gauge}
			iconColor="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
			specificationsComponent={SpecificationsComponent}
			initialBOMItems={[
				{
					id: "1",
					particular: "SS Tube Bundle",
					category: "Heat Exchanger",
					qty: 1,
					unit: "Set",
					rate: 320000,
					amount: 320000,
				},
				{
					id: "2",
					particular: "Outer Casing",
					category: "Structure",
					qty: 1,
					unit: "Set",
					rate: 85000,
					amount: 85000,
				},
				{
					id: "3",
					particular: "Expansion Joint",
					category: "Accessory",
					qty: 2,
					unit: "Nos",
					rate: 25000,
					amount: 50000,
				},
				{
					id: "4",
					particular: "Insulation",
					category: "Insulation",
					qty: 1,
					unit: "Set",
					rate: 45000,
					amount: 45000,
				},
			]}
			initialCosts={{
				materialTotal: 500000,
				laborTotal: 30000,
				overheadPercent: 15,
				markupPercent: 25,
			}}
		/>
	);
}
