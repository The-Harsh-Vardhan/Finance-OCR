import cv2
import numpy as np
import os
from typing import Dict, Any

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
        coords = np.column_stack(np.where(gray < 128))
        if len(coords) < 10:
            return image
        
        angle = cv2.minAreaRect(coords)[-1]
        angle = -(90 + angle) if angle < -45 else -angle

        if abs(angle) < 0.5 or abs(angle) > 30:
            return image

        (h, w) = image.shape[:2]
        M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
        return cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    @staticmethod
    def enhance_image(image_path: str, output_path: str) -> Dict[str, Any]:
        """OpenCV Enhancement: Blur Check, Deskew, and Adaptive Contrast Thresholding."""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not decode image at {image_path}")

        h, w = img.shape[:2]
        blur_score = ImageProcessor.calculate_blur_score(img)
        is_acceptable = (w >= 300 and h >= 300) and (blur_score >= 15.0)

        gray = cv2.cvtColor(ImageProcessor.deskew(img), cv2.COLOR_BGR2GRAY)
        enhanced = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 10)
        cv2.imwrite(output_path, enhanced)

        return {
            "is_acceptable": is_acceptable,
            "blur_score": round(blur_score, 2),
            "width": w,
            "height": h,
            "enhanced_path": output_path
        }
