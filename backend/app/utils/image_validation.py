from PIL import Image
from io import BytesIO

def validate_image(image_bytes: bytes):
    if(len(image_bytes) == 0):
        raise ValueError("Image buffer is empty")

    max_size_bytes = 10_000_000

    if len(image_bytes) > max_size_bytes:
        raise ValueError("Image is too large")

    try:
        img = Image.open(BytesIO(image_bytes))
        img.verify()
    except Exception as e:
        raise ValueError(f"Invalid image:{e}")

