from flask import Flask, request, jsonify
from food_calorie_estimator.detector import FoodDetector
from food_calorie_estimator.calorie_estimator import hitung_total_kalori
from food_calorie_estimator.kalori_reference import kalori_dict
import threading
import tempfile
import os

app = Flask(__name__)
detector = FoodDetector()
model_lock = threading.Lock() 

@app.route("/detect", methods=["POST"])
def detect():
    if 'image' not in request.files:
        return jsonify({"error": "Image file is required"}), 400

    image = request.files['image']
    
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f".{image.filename.rsplit('.', 1)[-1]}")
    temp_path = tmp.name
    tmp.close() 
    image.save(temp_path)

    try:

        with model_lock:
            result = detector.detect_food(temp_path)
            total_kalori, detail = hitung_total_kalori(result, kalori_dict)
        
        return jsonify({
            "total_calorie": total_kalori,
            "items": [{
                "name": x['class'],
                "confidence": x['confidence'],
                "boxX1": x['bbox'][0],
                "boxY1": x['bbox'][1],
                "boxX2": x['bbox'][2],
                "boxY2": x['bbox'][3] 
            } for x in result]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    app.run(debug=True)
