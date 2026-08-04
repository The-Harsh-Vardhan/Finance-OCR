package com.gramiq.financeocr.api.models

import com.google.gson.annotations.SerializedName

/**
 * Notebook Upload & Digitization Status
 */
data class NotebookResponse(
    @SerializedName("id") val id: String,
    @SerializedName("farmer_id") val farmerId: String,
    @SerializedName("original_filename") val originalFilename: String,
    @SerializedName("image_path") val imagePath: String,
    @SerializedName("enhanced_image_path") val enhancedImagePath: String?,
    @SerializedName("upload_time") val uploadTime: String?,
    @SerializedName("status") val status: String,
    @SerializedName("quality_score") val qualityScore: Double?,
    @SerializedName("error_message") val errorMessage: String?,
    @SerializedName("created_at") val createdAt: String?
)

/**
 * Extracted Financial Transaction
 */
data class TransactionResponse(
    @SerializedName("id") val id: String,
    @SerializedName("notebook_id") val notebookId: String,
    @SerializedName("transaction_date") val transactionDate: String?,
    @SerializedName("raw_date") val rawDate: String?,
    @SerializedName("ocr_text") val ocrText: String?,
    @SerializedName("description_en") val descriptionEn: String?,
    @SerializedName("description") val description: String,
    @SerializedName("category") val category: String,
    @SerializedName("subcategory") val subcategory: String?,
    @SerializedName("crop") val crop: String?,
    @SerializedName("type") val type: String, // "Income" or "Expense"
    @SerializedName("amount") val amount: Double,
    @SerializedName("unit") val unit: String?,
    @SerializedName("confidence") val confidence: Double?,
    @SerializedName("confidence_level") val confidenceLevel: String?,
    @SerializedName("verified") val verified: Boolean,
    @SerializedName("created_at") val createdAt: String?
)

/**
 * Process Notebook Request Body
 */
data class ProcessNotebookRequest(
    @SerializedName("crop_hint") val cropHint: String? = ""
)

/**
 * Batch Verify Transactions Request Body
 */
data class BatchVerifyRequest(
    @SerializedName("notebook_id") val notebookId: String,
    @SerializedName("transactions") val transactions: List<TransactionResponse>
)

/**
 * Category Financial Summary
 */
data class CategorySummary(
    @SerializedName("category") val category: String,
    @SerializedName("total_amount") val totalAmount: Double,
    @SerializedName("percentage") val percentage: Double,
    @SerializedName("transaction_count") val transactionCount: Int
)

/**
 * Crop Financial Summary
 */
data class CropSummary(
    @SerializedName("crop") val crop: String,
    @SerializedName("total_expense") val totalExpense: Double,
    @SerializedName("total_income") val totalIncome: Double,
    @SerializedName("net_profit") val netProfit: Double
)

/**
 * Comprehensive Farm Analytics Summary
 */
data class AnalyticsSummaryResponse(
    @SerializedName("total_notebooks") val totalNotebooks: Int,
    @SerializedName("total_transactions") val totalTransactions: Int,
    @SerializedName("verified_transactions") val verifiedTransactions: Int,
    @SerializedName("unverified_transactions") val unverifiedTransactions: Int,
    @SerializedName("total_expenses") val totalExpenses: Double,
    @SerializedName("total_income") val totalIncome: Double,
    @SerializedName("net_profit_loss") val netProfitLoss: Double,
    @SerializedName("category_breakdown") val categoryBreakdown: List<CategorySummary>,
    @SerializedName("crop_breakdown") val cropBreakdown: List<CropSummary>
)
