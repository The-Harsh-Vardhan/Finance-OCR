import cv2
import numpy as np
import os
from typing import Tuple, Dict, Any

class ImageProcessor:
    @staticmethod
    def calculate_blur_score(image: np.ndarray) -> float:
        """Calculates Laplacian variance to measure image sharpness/blur."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        return float(cv2.Laplacian(gray, cv2.CV_64F).var())

    @staticmethod
    def deskew(image: np.ndarray) -> np.ndarray:
        """Corrects page rotation using minimum area rectangle contour bounds."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        blur = cv2.GaussianBlur(gray, (9, 9), 0)
        thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

        # Find coordinates of all white pixels
        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) < 10:
            return image
        
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

        # If angle is minor, don't rotate
        if abs(angle) < 0.5 or abs(angle) > 30:
            return image

        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        return rotated

    @staticmethod
    def enhance_image(image_path: str, output_path: str) -> Dict[str, Any]:
        """
        Full OpenCV Enhancement Pipeline:
        1. Blur Assessment
        2. Deskewing
        3. Denoising
        4. Adaptive Contrast & Thresholding
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found at {image_path}")

        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not decode image at {image_path}")

        h, w = img.shape[:2]
        blur_score = ImageProcessor.calculate_blur_score(img)

        # Quality check: min resolution (300x300) and blur score threshold
        is_acceptable = (w >= 300 and h >= 300) and (blur_score >= 15.0)

        # 1. Deskew
        deskewed = ImageProcessor.deskew(img)

        # 2. Convert to Grayscale & Non-local Means Denoising
        gray = cv2.cvtColor(deskewed, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, None, h=10, templateWindowSize=7, searchWindowSize=21)

        # 3. Morphological background subtraction (Shadow Removal)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
        tophat = cv2.morphologyEx(denoised, cv2.MORPH_TOPHAT, kernel)
        enhanced_gray = cv2.add(denoised, tophat)

        # 4. Adaptive Thresholding for crisp contrast
        adaptive_thresh = cv2.adaptiveThreshold(
            enhanced_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 10
        )

        # Save enhanced binary image
        cv2.imwrite(output_path, adaptive_thresh)

        return {
            "is_acceptable": is_acceptable,
            "blur_score": round(blur_score, 2),
            "width": w,
            "height": h,
            "enhanced_path": output_path
        }
