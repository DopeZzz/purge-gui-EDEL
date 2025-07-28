import cv2
import numpy as np
from ultralytics import YOLO

MODEL_PATH = "model.pt"
model = YOLO(MODEL_PATH)
CONF_TH = 0.25
IOU_TH = 0.45


def infer(raw: bytes) -> list[dict]:
    """Return detection list with label, confidence and bbox."""
    img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("invalid image")
    res = model(img, conf=CONF_TH, iou=IOU_TH, verbose=False)[0]
    out = []
    for b in res.boxes:
        x1, y1, x2, y2 = map(int, b.xyxy[0])
        out.append({
            "label": model.names[int(b.cls)].strip(),
            "conf": round(float(b.conf), 4),
            "bbox": [x1, y1, x2 - x1, y2 - y1],
        })
    return out
