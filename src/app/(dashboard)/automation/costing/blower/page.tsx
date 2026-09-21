"use client";

import { CostingPageTemplate } from "@/components/automation/CostingPageTemplate";
import { Calculator, Wind } from "lucide-react";
import { useState } from "react";

export default function BlowerCostingPage() {
	const [specifications, setSpecifications] = useState({
		model: "",
		cfm: "",
		hp: "",
		motorType: "ELECTRIC",
		withMotor: true,
	});

	const SpecificationsComponent = (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
				Specifications
			</h2>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Blower Model
					</label>
					<input
						type="text"
						value={specifications.model}
						onChange={(e) =>
							setSpecifications({ ...specifications, model: e.target.value })
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						placeholder="e.g., PERKIN-5HP"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Air Flow (CFM)
					</label>
					<input
						type="number"
						value={specifications.cfm}
						onChange={(e) =>
							setSpecifications({ ...specifications, cfm: e.target.value })
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						placeholder="e.g., 1000"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Motor HP
					</label>
					<input
						type="number"
						value={specifications.hp}
						onChange={(e) =>
							setSpecifications({ ...specifications, hp: e.target.value })
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
						placeholder="e.g., 5"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Motor Type
					</label>
					<select
						value={specifications.motorType}
						onChange={(e) =>
							setSpecifications({
								...specifications,
								motorType: e.target.value,
							})
						}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
						<option value="ELECTRIC">Electric</option>
						<option value="DIESEL">Diesel</option>
					</select>
				</div>
				<div className="flex items-center">
					<input
						type="checkbox"
						id="withMotor"
						checked={specifications.withMotor}
						onChange={(e) =>
							setSpecifications({
								...specifications,
								withMotor: e.target.checked,
							})
						}
						className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<label
						htmlFor="withMotor"
						className="ml-2 text-sm text-gray-700 dark:text-gray-300">
						Include Motor
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
			title="Blower Costing"
			subtitle="Centrifugal Blower - Cost Calculation & BOM"
			icon={Wind}
			iconColor="bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400"
			specificationsComponent={SpecificationsComponent}
			initialBOMItems={[
				{
					id: "1",
					particular: "Blower Housing",
					category: "Blower",
					qty: 1,
					unit: "Set",
					rate: 18000,
					amount: 18000,
				},
				{
					id: "2",
					particular: "Impeller Assembly",
					category: "Blower",
					qty: 1,
					unit: "Set",
					rate: 12000,
					amount: 12000,
				},
				{
					id: "3",
					particular: "Electric Motor",
					category: "Motor",
					qty: 1,
					unit: "Nos",
					rate: 15000,
					amount: 15000,
				},
				{
					id: "4",
					particular: "Belt & Pulley Set",
					category: "Transmission",
					qty: 1,
					unit: "Set",
					rate: 5000,
					amount: 5000,
				},
			]}
			initialCosts={{
				materialTotal: 50000,
				laborTotal: 5000,
				overheadPercent: 15,
				markupPercent: 25,
			}}
		/>
	);
}
