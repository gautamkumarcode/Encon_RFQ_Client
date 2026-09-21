"use client";

import { CostingPageTemplate } from "@/components/automation/CostingPageTemplate";
import { Calculator, Droplet } from "lucide-react";
import { useState } from "react";

export default function HPUCostingPage() {
	const [specifications, setSpecifications] = useState({
		variant: "DUPLEX_1",
		kw: "",
		fuel: "LDO",
		lph: "",
		qty: 1,
	});

	const SpecificationsComponent = (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
				Specifications
			</h2>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						HPU Variant
					</label>
					<select
						value={specifications.variant}
						onChange={(e) =>
							setSpecifications({ ...specifications, variant: e.target.value })
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
						<option value="SIMPLEX">Simplex</option>
						<option value="DUPLEX_1">Duplex-I (2 Pumps, 1 Heater)</option>
						<option value="DUPLEX_2">Duplex-II (2 Pumps, 2 Heaters)</option>
					</select>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Heating Capacity (kW)
					</label>
					<input
						type="number"
						value={specifications.kw}
						onChange={(e) =>
							setSpecifications({ ...specifications, kw: e.target.value })
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						placeholder="e.g., 45"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Flow Rate (LPH)
					</label>
					<input
						type="number"
						value={specifications.lph}
						onChange={(e) =>
							setSpecifications({ ...specifications, lph: e.target.value })
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						placeholder="e.g., 500"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Fuel Type
					</label>
					<select
						value={specifications.fuel}
						onChange={(e) =>
							setSpecifications({ ...specifications, fuel: e.target.value })
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
						<option value="LDO">LDO</option>
						<option value="HFO">HFO</option>
						<option value="FO">FO</option>
						<option value="HSD">HSD</option>
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
			title="HPU Costing"
			subtitle="Heating & Pumping Unit - Cost Calculation & BOM"
			icon={Droplet}
			iconColor="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
			specificationsComponent={SpecificationsComponent}
			initialBOMItems={[
				{
					id: "1",
					particular: "Oil Pump with Motor",
					category: "Pump",
					qty: 2,
					unit: "Nos",
					rate: 28000,
					amount: 56000,
				},
				{
					id: "2",
					particular: "Electric Oil Preheater",
					category: "Heater",
					qty: 1,
					unit: "Nos",
					rate: 45000,
					amount: 45000,
				},
				{
					id: "3",
					particular: "Duplex Filter Set",
					category: "Filter",
					qty: 2,
					unit: "Set",
					rate: 12000,
					amount: 24000,
				},
				{
					id: "4",
					particular: "Pressure Regulating Valve",
					category: "Control",
					qty: 1,
					unit: "Nos",
					rate: 8500,
					amount: 8500,
				},
				{
					id: "5",
					particular: "Control Panel",
					category: "Electrical",
					qty: 1,
					unit: "Set",
					rate: 18000,
					amount: 18000,
				},
			]}
			initialCosts={{
				materialTotal: 151500,
				laborTotal: 12000,
				overheadPercent: 12,
				markupPercent: 25,
			}}
		/>
	);
}
