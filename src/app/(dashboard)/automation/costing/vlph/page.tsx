"use client";

import {
	Calculator,
	FileText,
	Flame,
	Save,
	Settings,
	Wind,
} from "lucide-react";
import { useState } from "react";

interface VlphCalculationForm {
	// Mode
	mode: "calc" | "direct";

	// Customer Details
	customerName: string;
	customerCompany: string;
	customerEmail: string;
	customerPhone: string;

	// Process Parameters (Calc Mode)
	ladleTons: number;
	Ti: number;
	Tf: number;
	refractoryWeight: number;
	timeTakenHr: number;
	efficiency: number;
	refractoryHeatFactor: number;

	// Direct Mode
	directBurnerCapacity: number;
	directHeatInputKcalHr: number;

	// Fuel Configuration
	fuel1Type: string;
	fuel1Cv: number;
	fuel2Type: string;
	fuel2Cv: number;

	// Equipment
	hoodType: "up_down" | "swivel_manual" | "swivel_geared";
	blowerPressure: "28" | "40";
	numBurners: number;

	// Control System
	controlMode: "automatic" | "manual";
	autoControlType: "plc" | "plc_agr" | "pid" | "ppid_ratio";

	// Vendors
	controlValveVendor: string;
	butterflyValveVendor: string;
	shutoffValveVendor: string;
	pressureGaugeVendor: string;

	// Options
	pilotBurner: string;
	pilotLineFuel: string;
	purgingLine: "yes" | "no";
	specialAutoIgnition: boolean;
	useOxygen: boolean;
	oxygenEnrichmentPct: number;
}

const DEFAULT_CALORIFIC_VALUES: Record<string, number> = {
	ng: 8500,
	lpg: 22000,
	cog: 4200,
	bg: 800,
	rlng: 8500,
	mg: 3500,
	ldo: 10200,
	fo: 10000,
	lshs: 10200,
	hsd: 10800,
	sko: 10300,
};

export default function VlphCostingPage() {
	const [activeStep, setActiveStep] = useState(1);
	const [calculating, setCalculating] = useState(false);
	const [results, setResults] = useState<any>(null);

	const [formData, setFormData] = useState<VlphCalculationForm>({
		mode: "calc",
		customerName: "",
		customerCompany: "",
		customerEmail: "",
		customerPhone: "",
		ladleTons: 10,
		Ti: 25,
		Tf: 1000,
		refractoryWeight: 5000,
		timeTakenHr: 2,
		efficiency: 75,
		refractoryHeatFactor: 0.25,
		directBurnerCapacity: 0,
		directHeatInputKcalHr: 0,
		fuel1Type: "ng",
		fuel1Cv: 8500,
		fuel2Type: "none",
		fuel2Cv: 0,
		hoodType: "up_down",
		blowerPressure: "28",
		numBurners: 1,
		controlMode: "automatic",
		autoControlType: "plc",
		controlValveVendor: "dembla",
		butterflyValveVendor: "lt_lever",
		shutoffValveVendor: "aira",
		pressureGaugeVendor: "baumer",
		pilotBurner: "auto",
		pilotLineFuel: "lpg",
		purgingLine: "no",
		specialAutoIgnition: false,
		useOxygen: false,
		oxygenEnrichmentPct: 0,
	});

	const handleInputChange = (field: keyof VlphCalculationForm, value: any) => {
		setFormData((prev) => {
			const updated = { ...prev, [field]: value };

			// Auto-update CV when fuel type changes
			if (field === "fuel1Type" && DEFAULT_CALORIFIC_VALUES[value]) {
				updated.fuel1Cv = DEFAULT_CALORIFIC_VALUES[value];
			}
			if (field === "fuel2Type" && DEFAULT_CALORIFIC_VALUES[value]) {
				updated.fuel2Cv = DEFAULT_CALORIFIC_VALUES[value];
			}

			return updated;
		});
	};

	const handleCalculate = async () => {
		setCalculating(true);
		try {
			const response = await fetch("http://localhost:5000/api/vlph/calculate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "Calculation failed");
			}

			const data = await response.json();
			setResults(data);
			setActiveStep(3); // Move to results step
		} catch (error: any) {
			alert(`Error: ${error.message}`);
		} finally {
			setCalculating(false);
		}
	};

	const steps = [
		{ num: 1, name: "Customer Details", icon: FileText },
		{ num: 2, name: "Parameters", icon: Settings },
		{ num: 3, name: "Results & BOM", icon: Calculator },
	];

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b sticky top-0 z-10 shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
								<Flame className="w-6 h-6 text-white" />
							</div>
							<div>
								<h1 className="text-xl font-bold text-gray-900">
									VLPH Offer Generator
								</h1>
								<p className="text-sm text-gray-500">
									Vertical Ledge Preheater System
								</p>
							</div>
						</div>
					</div>

					{/* Steps */}
					<div className="flex space-x-8 border-t">
						{steps.map((step) => {
							const Icon = step.icon;
							const isActive = activeStep === step.num;
							const isDone = activeStep > step.num;

							return (
								<button
									key={step.num}
									onClick={() => setActiveStep(step.num)}
									className={`
                    flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors
                    ${isActive ? "border-blue-600 text-blue-600" : ""}
                    ${isDone ? "border-green-600 text-green-600" : ""}
                    ${!isActive && !isDone ? "border-transparent text-gray-500 hover:text-gray-700" : ""}
                  `}>
									<span
										className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${isActive ? "bg-blue-600 text-white" : ""}
                    ${isDone ? "bg-green-600 text-white" : ""}
                    ${!isActive && !isDone ? "bg-gray-200 text-gray-600" : ""}
                  `}>
										{step.num}
									</span>
									<span className="font-medium text-sm">{step.name}</span>
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Step 1: Customer Details */}
				{activeStep === 1 && (
					<div className="bg-white rounded-lg shadow p-6 space-y-6">
						<h2 className="text-lg font-semibold text-gray-900">
							Customer & Enquiry Details
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Customer Name *
								</label>
								<input
									type="text"
									value={formData.customerName}
									onChange={(e) =>
										handleInputChange("customerName", e.target.value)
									}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="John Doe"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Company Name *
								</label>
								<input
									type="text"
									value={formData.customerCompany}
									onChange={(e) =>
										handleInputChange("customerCompany", e.target.value)
									}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="ABC Steel Ltd"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Email
								</label>
								<input
									type="email"
									value={formData.customerEmail}
									onChange={(e) =>
										handleInputChange("customerEmail", e.target.value)
									}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="john@abcsteel.com"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Phone
								</label>
								<input
									type="tel"
									value={formData.customerPhone}
									onChange={(e) =>
										handleInputChange("customerPhone", e.target.value)
									}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="+91 98765 43210"
								/>
							</div>
						</div>

						<div className="flex justify-end pt-4">
							<button
								onClick={() => setActiveStep(2)}
								className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
								Next Step →
							</button>
						</div>
					</div>
				)}

				{/* Step 2: Parameters */}
				{activeStep === 2 && (
					<div className="space-y-6">
						{/* Calculation Mode Toggle */}
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								Calculation Mode
							</h3>
							<div className="flex space-x-4">
								<button
									onClick={() => handleInputChange("mode", "calc")}
									className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
										formData.mode === "calc"
											? "border-blue-600 bg-blue-50 text-blue-700"
											: "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
									}`}>
									Calculate from Process Parameters
								</button>
								<button
									onClick={() => handleInputChange("mode", "direct")}
									className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
										formData.mode === "direct"
											? "border-blue-600 bg-blue-50 text-blue-700"
											: "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
									}`}>
									Direct Input (Known Capacity)
								</button>
							</div>
						</div>

						{/* Process Parameters (Calc Mode) */}
						{formData.mode === "calc" && (
							<div className="bg-white rounded-lg shadow p-6 space-y-6">
								<h3 className="text-lg font-semibold text-gray-900">
									Process Parameters
								</h3>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Ladle Capacity (Tons) *
										</label>
										<input
											type="number"
											value={formData.ladleTons}
											onChange={(e) =>
												handleInputChange(
													"ladleTons",
													parseFloat(e.target.value),
												)
											}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
											min="1"
											step="0.1"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Initial Temp (Ti) °C *
										</label>
										<input
											type="number"
											value={formData.Ti}
											onChange={(e) =>
												handleInputChange("Ti", parseFloat(e.target.value))
											}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Final Temp (Tf) °C *
										</label>
										<input
											type="number"
											value={formData.Tf}
											onChange={(e) =>
												handleInputChange("Tf", parseFloat(e.target.value))
											}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Refractory Weight (kg) *
										</label>
										<input
											type="number"
											value={formData.refractoryWeight}
											onChange={(e) =>
												handleInputChange(
													"refractoryWeight",
													parseFloat(e.target.value),
												)
											}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Time Taken (hours) *
										</label>
										<input
											type="number"
											value={formData.timeTakenHr}
											onChange={(e) =>
												handleInputChange(
													"timeTakenHr",
													parseFloat(e.target.value),
												)
											}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
											min="0.1"
											step="0.1"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Efficiency (%) *
										</label>
										<input
											type="number"
											value={formData.efficiency}
											onChange={(e) =>
												handleInputChange(
													"efficiency",
													parseFloat(e.target.value),
												)
											}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
											min="1"
											max="100"
										/>
									</div>
								</div>
							</div>
						)}

						{/* Direct Mode */}
						{formData.mode === "direct" && (
							<div className="bg-white rounded-lg shadow p-6 space-y-6">
								<h3 className="text-lg font-semibold text-gray-900">
									Direct Input
								</h3>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Ladle Capacity (Tons) *
										</label>
										<input
											type="number"
											value={formData.ladleTons}
											onChange={(e) =>
												handleInputChange(
													"ladleTons",
													parseFloat(e.target.value),
												)
											}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
											min="1"
											step="0.1"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Burner Capacity (kW)
										</label>
										<input
											type="number"
											value={formData.directBurnerCapacity}
											onChange={(e) =>
												handleInputChange(
													"directBurnerCapacity",
													parseFloat(e.target.value),
												)
											}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
											placeholder="or leave blank and use heat input"
										/>
									</div>

									<div className="md:col-span-2">
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Heat Input (kcal/hr)
										</label>
										<input
											type="number"
											value={formData.directHeatInputKcalHr}
											onChange={(e) =>
												handleInputChange(
													"directHeatInputKcalHr",
													parseFloat(e.target.value),
												)
											}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
											placeholder="Alternative to burner capacity"
										/>
									</div>
								</div>
							</div>
						)}

						{/* Fuel Configuration */}
						<div className="bg-white rounded-lg shadow p-6 space-y-6">
							<h3 className="text-lg font-semibold text-gray-900">
								Fuel Configuration
							</h3>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Fuel 1 Type *
									</label>
									<select
										value={formData.fuel1Type}
										onChange={(e) =>
											handleInputChange("fuel1Type", e.target.value)
										}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
										<option value="ng">Natural Gas (NG)</option>
										<option value="lpg">LPG</option>
										<option value="cog">Coke Oven Gas (COG)</option>
										<option value="bg">Blast Furnace Gas (BG)</option>
										<option value="rlng">RLNG</option>
										<option value="mg">Mixed Gas</option>
										<option value="ldo">Light Diesel Oil (LDO)</option>
										<option value="fo">Furnace Oil (FO)</option>
										<option value="hsd">High Speed Diesel (HSD)</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Calorific Value (kcal/Nm³ or kcal/kg) *
									</label>
									<input
										type="number"
										value={formData.fuel1Cv}
										onChange={(e) =>
											handleInputChange("fuel1Cv", parseFloat(e.target.value))
										}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>
						</div>

						{/* Equipment Configuration */}
						<div className="bg-white rounded-lg shadow p-6 space-y-6">
							<h3 className="text-lg font-semibold text-gray-900">
								Equipment Configuration
							</h3>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Hood Type *
									</label>
									<select
										value={formData.hoodType}
										onChange={(e) =>
											handleInputChange("hoodType", e.target.value)
										}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
										<option value="up_down">Up & Down (Hydraulic)</option>
										<option value="swivel_manual">Swivel (Manual)</option>
										<option value="swivel_geared">Swivel (Geared)</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Blower Pressure *
									</label>
									<select
										value={formData.blowerPressure}
										onChange={(e) =>
											handleInputChange("blowerPressure", e.target.value)
										}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
										<option value="28">28" WC</option>
										<option value="40">40" WC</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Number of Burners
									</label>
									<input
										type="number"
										value={formData.numBurners}
										onChange={(e) =>
											handleInputChange("numBurners", parseInt(e.target.value))
										}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
										min="1"
									/>
								</div>
							</div>
						</div>

						{/* Control System */}
						<div className="bg-white rounded-lg shadow p-6 space-y-6">
							<h3 className="text-lg font-semibold text-gray-900">
								Control System
							</h3>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Control Mode *
									</label>
									<select
										value={formData.controlMode}
										onChange={(e) =>
											handleInputChange("controlMode", e.target.value)
										}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
										<option value="automatic">Automatic</option>
										<option value="manual">Manual</option>
									</select>
								</div>

								{formData.controlMode === "automatic" && (
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Auto Control Type *
										</label>
										<select
											value={formData.autoControlType}
											onChange={(e) =>
												handleInputChange("autoControlType", e.target.value)
											}
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
											<option value="plc">PLC</option>
											<option value="plc_agr">PLC + AGR</option>
											<option value="pid">PID</option>
											<option value="ppid_ratio">
												P.PID + Ratio Controller
											</option>
										</select>
									</div>
								)}
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex justify-between items-center pt-4">
							<button
								onClick={() => setActiveStep(1)}
								className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
								← Previous
							</button>

							<button
								onClick={handleCalculate}
								disabled={calculating}
								className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
								{calculating ? (
									<>
										<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
										<span>Calculating...</span>
									</>
								) : (
									<>
										<Calculator className="w-5 h-5" />
										<span>Calculate</span>
									</>
								)}
							</button>
						</div>
					</div>
				)}

				{/* Step 3: Results */}
				{activeStep === 3 && results && (
					<div className="space-y-6">
						{/* Cost Banner */}
						<div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm opacity-80 mb-1">
										Total Equipment Cost
									</p>
									<p className="text-4xl font-bold">
										₹{" "}
										{results.calculations?.grandTotal?.toLocaleString() || "0"}
									</p>
								</div>
								<div className="flex space-x-8">
									<div>
										<p className="text-xs opacity-80 mb-1">Bought Out</p>
										<p className="text-xl font-semibold">
											₹{" "}
											{results.calculations?.boughtOutTotal?.toLocaleString() ||
												"0"}
										</p>
									</div>
									<div>
										<p className="text-xs opacity-80 mb-1">ENCON Items</p>
										<p className="text-xl font-semibold">
											₹{" "}
											{results.calculations?.enconTotal?.toLocaleString() ||
												"0"}
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Calculation Results */}
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								Calculation Results
							</h3>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								<div className="border rounded-lg p-4">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm text-gray-600">Heat Required</span>
										<Flame className="w-4 h-4 text-orange-500" />
									</div>
									<p className="text-2xl font-bold text-gray-900">
										{results.calculations.heatRequired?.toFixed(0) || "0"}
									</p>
									<p className="text-xs text-gray-500 mt-1">kcal</p>
								</div>

								<div className="border rounded-lg p-4">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm text-gray-600">Gas Flow Rate</span>
										<Wind className="w-4 h-4 text-blue-500" />
									</div>
									<p className="text-2xl font-bold text-gray-900">
										{results.calculations.fuel1FlowRate?.toFixed(2) || "0"}
									</p>
									<p className="text-xs text-gray-500 mt-1">
										{results.calculations.fuel1FlowRateUnit}
									</p>
								</div>

								<div className="border rounded-lg p-4">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm text-gray-600">Air Flow Rate</span>
										<Wind className="w-4 h-4 text-green-500" />
									</div>
									<p className="text-2xl font-bold text-gray-900">
										{results.calculations.airFlowRate?.toFixed(2) || "0"}
									</p>
									<p className="text-xs text-gray-500 mt-1">Nm³/hr</p>
								</div>

								<div className="border rounded-lg p-4">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm text-gray-600">
											Burner Capacity
										</span>
										<Calculator className="w-4 h-4 text-red-500" />
									</div>
									<p className="text-2xl font-bold text-gray-900">
										{results.calculations.burnerCapacityKw?.toFixed(2) || "0"}
									</p>
									<p className="text-xs text-gray-500 mt-1">kW</p>
								</div>

								<div className="border rounded-lg p-4">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm text-gray-600">Gas Pipe NB</span>
									</div>
									<p className="text-2xl font-bold text-gray-900">
										{results.calculations.gasPipeNb || "0"}
									</p>
									<p className="text-xs text-gray-500 mt-1">mm</p>
								</div>

								<div className="border rounded-lg p-4">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm text-gray-600">Air Pipe NB</span>
									</div>
									<p className="text-2xl font-bold text-gray-900">
										{results.calculations.airPipeNb || "0"}
									</p>
									<p className="text-xs text-gray-500 mt-1">mm</p>
								</div>
							</div>
						</div>

						{/* Equipment Selection */}
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								Selected Equipment
							</h3>

							<div className="space-y-4">
								<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div>
										<p className="font-medium text-gray-900">Burner</p>
										<p className="text-sm text-gray-600">
											{results.calculations.selectedBurner?.model || "N/A"}
										</p>
									</div>
									<p className="font-semibold text-gray-900">
										₹{" "}
										{results.calculations.selectedBurner?.price?.toLocaleString() ||
											"0"}
									</p>
								</div>

								<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
									<div>
										<p className="font-medium text-gray-900">Blower</p>
										<p className="text-sm text-gray-600">
											{results.calculations.selectedBlower?.model || "N/A"} (
											{results.calculations.selectedBlower?.hp || 0} HP)
										</p>
									</div>
									<p className="font-semibold text-gray-900">
										₹{" "}
										{results.calculations.selectedBlower?.price?.toLocaleString() ||
											"0"}
									</p>
								</div>

								{results.calculations.selectedGasTrain && (
									<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
										<div>
											<p className="font-medium text-gray-900">Gas Train</p>
											<p className="text-sm text-gray-600">
												{results.calculations.selectedGasTrain.model}
											</p>
										</div>
										<p className="font-semibold text-gray-900">
											₹{" "}
											{results.calculations.selectedGasTrain.price?.toLocaleString() ||
												"0"}
										</p>
									</div>
								)}
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex space-x-4">
							<button
								onClick={() => setActiveStep(2)}
								className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
								← Modify Parameters
							</button>

							<button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center space-x-2">
								<Save className="w-5 h-5" />
								<span>Save Calculation</span>
							</button>

							<button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center space-x-2">
								<FileText className="w-5 h-5" />
								<span>Generate Offer</span>
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
