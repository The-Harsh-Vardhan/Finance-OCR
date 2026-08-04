package com.gramiq.financeocr.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import androidx.exifinterface.media.ExifInterface
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

/**
 * Utility for client-side image resizing and compression before upload.
 * Prevents payload bloat and speeds up OCR processing time.
 */
object ImageCompressor {

    private const val MAX_DIMENSION = 1600 // max long edge in pixels
    private const val JPEG_QUALITY = 85   // 85% compression quality

    fun compressAndSaveImage(context: Context, imageUriFile: File): File {
        val options = BitmapFactory.Options().apply {
            inJustDecodeBounds = true
        }
        BitmapFactory.decodeFile(imageUriFile.absolutePath, options)

        var sampleSize = 1
        val origWidth = options.outWidth
        val origHeight = options.outHeight

        if (origWidth > MAX_DIMENSION || origHeight > MAX_DIMENSION) {
            val halfWidth = origWidth / 2
            val halfHeight = origHeight / 2
            while ((halfWidth / sampleSize) >= MAX_DIMENSION || (halfHeight / sampleSize) >= MAX_DIMENSION) {
                sampleSize *= 2
            }
        }

        val decodeOptions = BitmapFactory.Options().apply {
            inSampleSize = sampleSize
        }
        var bitmap = BitmapFactory.decodeFile(imageUriFile.absolutePath, decodeOptions)
            ?: return imageUriFile

        // Rotate bitmap according to EXIF orientation
        val rotation = getExifRotation(imageUriFile.absolutePath)
        if (rotation != 0) {
            val matrix = Matrix().apply { postRotate(rotation.toFloat()) }
            bitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
        }

        val compressedFile = File(context.cacheDir, "compressed_${imageUriFile.name}")
        val outputStream = FileOutputStream(compressedFile)
        bitmap.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, outputStream)
        outputStream.flush()
        outputStream.close()

        return compressedFile
    }

    private fun getExifRotation(filePath: String): Int {
        return try {
            val exif = ExifInterface(filePath)
            when (exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_UNDEFINED)) {
                ExifInterface.ORIENTATION_ROTATE_90 -> 90
                ExifInterface.ORIENTATION_ROTATE_180 -> 180
                ExifInterface.ORIENTATION_ROTATE_270 -> 270
                else -> 0
            }
        } catch (e: Exception) {
            0
        }
    }
}
