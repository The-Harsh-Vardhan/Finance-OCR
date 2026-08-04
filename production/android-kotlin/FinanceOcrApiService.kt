package com.gramiq.financeocr.api

import com.gramiq.financeocr.api.models.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

/**
 * Retrofit 2 API Service for GramIQ Finance OCR Backend
 */
interface FinanceOcrApiService {

    @Multipart
    @POST("api/v1/notebooks/upload")
    suspend fun uploadNotebook(
        @Part("farmer_id") farmerId: RequestBody,
        @Part file: MultipartBody.Part
    ): Response<NotebookResponse>

    @POST("api/v1/notebooks/process/{notebook_id}")
    suspend fun processNotebook(
        @Path("notebook_id") notebookId: String,
        @Body request: ProcessNotebookRequest
    ): Response<Map<String, Any>>

    @GET("api/v1/notebooks")
    suspend fun listNotebooks(): Response<List<NotebookResponse>>

    @GET("api/v1/notebooks/{notebook_id}")
    suspend fun getNotebook(
        @Path("notebook_id") notebookId: String
    ): Response<NotebookResponse>

    @GET("api/v1/notebooks/{notebook_id}/transactions")
    suspend fun getNotebookTransactions(
        @Path("notebook_id") notebookId: String
    ): Response<List<TransactionResponse>>

    @POST("api/v1/transactions/verify")
    suspend fun batchVerifyTransactions(
        @Body request: BatchVerifyRequest
    ): Response<Map<String, Any>>

    @GET("api/v1/analytics/summary")
    suspend fun getAnalyticsSummary(): Response<AnalyticsSummaryResponse>
}
