import cv2
import numpy as np


def decode_qr_codes(image_path: str) -> list[str]:
    """
    Decode all QR codes found in an image. Applies multiple rotations and
    contrast enhancements to maximize detection chances.
    """
    image = cv2.imread(image_path)
    if image is None:
        return []

    detector = cv2.QRCodeDetector()
    decoded_values = set()

    def attempt_decode(img):
        if img is None:
            return
        try:
            retval, decoded_info, _, _ = detector.detectAndDecodeMulti(img)
            if retval and decoded_info:
                for info in decoded_info:
                    if info:
                        decoded_values.add(info.strip())
        except Exception:
            pass

        try:
            data, _, _ = detector.detectAndDecode(img)
            if data:
                decoded_values.add(data.strip())
        except Exception:
            pass

    candidates = [image]
    candidates.append(cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE))
    candidates.append(cv2.rotate(image, cv2.ROTATE_180))
    candidates.append(cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE))

    for img in candidates:
        attempt_decode(img)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        attempt_decode(gray)

        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        attempt_decode(enhanced)

        h, w = img.shape[:2]
        if max(h, w) < 1200:
            scaled = cv2.resize(img, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)
            attempt_decode(scaled)

    return list(decoded_values)
