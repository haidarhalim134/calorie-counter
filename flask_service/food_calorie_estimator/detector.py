from ultralytics import YOLO

class FoodDetector:
    def __init__(self, model_path="food_calorie_estimator/model/yolo_food.pt"):
        self.model = YOLO(model_path)

    def detect_food(self, image_path, conf=0.3):
        results = self.model.predict(image_path, conf=conf)
        detections = []

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                conf_score = float(box.conf[0])
                xyxy = box.xyxy[0].tolist()  # bbny
                class_name = r.names[cls_id]
                detections.append({
                    "class": class_name,
                    "bbox": xyxy,
                    "confidence": conf_score
                })

        return detections
