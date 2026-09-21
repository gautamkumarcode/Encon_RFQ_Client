"use client";

import { CostingPageTemplate } from "@/components/automation/CostingPageTemplate";
import { Calculator, Flame } from "lucide-react";
import { useState } from "react";

export default function BurnerCostingPage() {
	const [specifications, setSpecifications] = useState({
		model: "",
		capacityKW: "",
		fuelType: "GAS",
		airBlower: true,
		controlType: "MODULATING",
	});

	const SpecificationsComponent = (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
				Specifications
			</h2>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Burner Model
					</label>
					<input
						type="text"
						value={specifications.model}
						onChange={(e) =>
							setSpecifications({ ...specifications, model: e.target.value })
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						placeholder="e.g., ENCON-7A"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Capacity (kW / kcal/hr)
					</label>
					<input
						type="number"
						value={specifications.capacityKW}
						onChange={(e) =>
							setSpecifications({
								...specifications,
								capacityKW: e.target.value,
							})
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						placeholder="e.g., 350"
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
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Control Type
					</label>
					<select
						value={specifications.controlType}
						onChange={(e) =>
							setSpecifications({
								...specifications,
								controlType: e.target.value,
							})
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
						<option value="ON_OFF">On/Off</option>
						<option value="HIGH_LOW">High/Low</option>
						<option value="MODULATING">Modulating</option>
					</select>
				</div>
				<div className="flex items-center">
					<input
						type="checkbox"
						id="airBlower"
						checked={specifications.airBlower}
						onChange={(e) =>
							setSpecifications({
								...specifications,
								airBlower: e.target.checked,
							})
						}
						className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<label
						htmlFor="airBlower"
						className="ml-2 text-sm text-gray-700 dark:text-gray-300">
						Include Air Blower
					</label>
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
			title="Burner Costing"
			subtitle="Industrial Burner - Cost Calculation & BOM"
			icon={Flame}
			iconColor="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
			specificationsComponent={SpecificationsComponent}
			initialBOMItems={[
				{
					id: "1",
					particular: "Burner Body & Block",
					category: "Burner",
					qty: 1,
					unit: "Set",
					rate: 35000,
					amount: 35000,
				},
				{
					id: "2",
					particular: "Gas Train Assembly",
					category: "Control",
					qty: 1,
					unit: "Set",
					rate: 45000,
					amount: 45000,
				},
				{
					id: "3",
					particular: "Ignition Transformer",
					category: "Electrical",
					qty: 1,
					unit: "Nos",
					rate: 5500,
					amount: 5500,
				},
				{
					id: "4",
					particular: "UV Flame Sensor",
					category: "Control",
					qty: 1,
					unit: "Nos",
					rate: 8500,
					amount: 8500,
				},
			]}
			initialCosts={{
				materialTotal: 94000,
				laborTotal: 8000,
				overheadPercent: 15,
				markupPercent: 30,
			}}
		/>
	);
}
