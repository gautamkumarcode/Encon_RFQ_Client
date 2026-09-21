"use client";

import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GenerateOfferPage() {
	const router = useRouter();
	const [isGenerating, setIsGenerating] = useState(false);
	const [formData, setFormData] = useState({
		// Customer Details
		companyName: "",
		contactPerson: "",
		address: "",
		city: "",
		state: "",
		pincode: "",
		phone: "",
		email: "",
		gstNo: "",

		// Enquiry Details
		enquiryRef: "",
		enquiryDate: new Date().toISOString().split("T")[0],
		subject: "",

		// Product Details
		productType: "VLPH",
		productName: "",
		capacity: "",

		// Pricing
		subtotal: 0,
		gstPercent: 18,

		// Options
		includeSupervision: false,
		includeCostSheet: false,
		currency: "INR",
	});

	const productTypes = [
		{ value: "VLPH", label: "Vertical Ladle Preheater" },
		{ value: "HLPH", label: "Horizontal Ladle Preheater" },
		{ value: "BRF", label: "Billet Reheating Furnace" },
		{ value: "BTF", label: "Bogie Type Furnace" },
		{ value: "REGEN", label: "Regenerative Burner System" },
		{ value: "RECUP", label: "Recuperator System" },
		{ value: "BURNER", label: "Burner (Standalone)" },
		{ value: "BLOWER", label: "Blower (Standalone)" },
		{ value: "HPU", label: "Hydraulic Power Unit" },
	];

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value, type } = e.target;
		const checked = (e.target as HTMLInputElement).checked;

		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsGenerating(true);

		try {
			// Calculate GST and Grand Total
			const gstAmount = (formData.subtotal * formData.gstPercent) / 100;
			const grandTotal = formData.subtotal + gstAmount;

			const requestData = {
				customer: {
					companyName: formData.companyName,
					contactPerson: formData.contactPerson,
					address: formData.address,
					city: formData.city,
					state: formData.state,
					pincode: formData.pincode,
					phone: formData.phone,
					email: formData.email,
					gstNo: formData.gstNo,
				},
				enquiry: {
					enquiryRef: formData.enquiryRef,
					enquiryDate: new Date(formData.enquiryDate),
					subject: formData.subject,
				},
				productType: formData.productType,
				productName: formData.productName,
				capacity: formData.capacity,
				items: [
					{
						sNo: 1,
						particular: formData.productName,
						category: "Equipment",
						qty: 1,
						unit: "Set",
						rate: formData.subtotal,
						totalAmount: formData.subtotal,
					},
				],
				subtotal: formData.subtotal,
				gstPercent: formData.gstPercent,
				gstAmount,
				grandTotal,
				includeSupervision: formData.includeSupervision,
				includeCostSheet: formData.includeCostSheet,
				currency: formData.currency,
			};

			const response = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/automation/offers/generate`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestData),
					credentials: "include",
				},
			);

			if (!response.ok) {
				throw new Error("Failed to generate offer");
			}

			const result = await response.json();

			// Show success message
			alert(
				`Offer generated successfully!\nOffer Number: ${result.offerNumber}\nFile: ${result.fileName}`,
			);

			// Redirect back to automation page
			router.push("/automation");
		} catch (error) {
			console.error("Error generating offer:", error);
			alert("Failed to generate offer. Please try again.");
		} finally {
			setIsGenerating(false);
		}
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
						Generate New Offer
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-2">
						Create a comprehensive offer document
					</p>
				</div>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Customer Details */}
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
						Customer Details
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Company Name *
							</label>
							<input
								type="text"
								name="companyName"
								value={formData.companyName}
								onChange={handleInputChange}
								required
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Contact Person
							</label>
							<input
								type="text"
								name="contactPerson"
								value={formData.contactPerson}
								onChange={handleInputChange}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Address
							</label>
							<input
								type="text"
								name="address"
								value={formData.address}
								onChange={handleInputChange}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								City
							</label>
							<input
								type="text"
								name="city"
								value={formData.city}
								onChange={handleInputChange}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								State
							</label>
							<input
								type="text"
								name="state"
								value={formData.state}
								onChange={handleInputChange}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Email
							</label>
							<input
								type="email"
								name="email"
								value={formData.email}
								onChange={handleInputChange}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Phone
							</label>
							<input
								type="tel"
								name="phone"
								value={formData.phone}
								onChange={handleInputChange}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
					</div>
				</div>

				{/* Enquiry Details */}
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
						Enquiry Details
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Enquiry Reference *
							</label>
							<input
								type="text"
								name="enquiryRef"
								value={formData.enquiryRef}
								onChange={handleInputChange}
								required
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Enquiry Date *
							</label>
							<input
								type="date"
								name="enquiryDate"
								value={formData.enquiryDate}
								onChange={handleInputChange}
								required
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Subject *
							</label>
							<input
								type="text"
								name="subject"
								value={formData.subject}
								onChange={handleInputChange}
								required
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
					</div>
				</div>

				{/* Product Details */}
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
						Product Details
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Product Type *
							</label>
							<select
								name="productType"
								value={formData.productType}
								onChange={handleInputChange}
								required
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
								Product Name *
							</label>
							<input
								type="text"
								name="productName"
								value={formData.productName}
								onChange={handleInputChange}
								required
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Capacity
							</label>
							<input
								type="text"
								name="capacity"
								value={formData.capacity}
								onChange={handleInputChange}
								placeholder="e.g., 10 Ton, 500 kW"
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Subtotal (₹) *
							</label>
							<input
								type="number"
								name="subtotal"
								value={formData.subtotal}
								onChange={handleInputChange}
								required
								min="0"
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
							/>
						</div>
					</div>
				</div>

				{/* Options */}
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
						Options
					</h2>
					<div className="space-y-3">
						<label className="flex items-center space-x-2">
							<input
								type="checkbox"
								name="includeSupervision"
								checked={formData.includeSupervision}
								onChange={handleInputChange}
								className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<span className="text-sm text-gray-700 dark:text-gray-300">
								Include Supervision Charges
							</span>
						</label>
						<label className="flex items-center space-x-2">
							<input
								type="checkbox"
								name="includeCostSheet"
								checked={formData.includeCostSheet}
								onChange={handleInputChange}
								className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<span className="text-sm text-gray-700 dark:text-gray-300">
								Generate Excel Cost Sheet
							</span>
						</label>
					</div>
				</div>

				{/* Submit Button */}
				<div className="flex justify-end space-x-4">
					<Link
						href="/automation"
						className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
						Cancel
					</Link>
					<button
						type="submit"
						disabled={isGenerating}
						className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2">
						{isGenerating ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								<span>Generating...</span>
							</>
						) : (
							<>
								<FileText className="h-4 w-4" />
								<span>Generate Offer</span>
							</>
						)}
					</button>
				</div>
			</form>
		</div>
	);
}
