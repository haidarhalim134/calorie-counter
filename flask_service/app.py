from flask import Flask, request, jsonify
import threading
import tempfile
import os

app = Flask(__name__)
model_lock = threading.Lock() 

@app.route("/detect", methods=["POST"])
def detect():
    if 'image' not in request.files:
        return jsonify({"error": "Image file is required"}), 400

    image = request.files['image']
    
    tmp = tempfile.NamedTemporaryFile(delete=False)
    temp_path = tmp.name
    tmp.close() 
    image.save(temp_path)

    try:

        with model_lock:
            pass # panggil model
        
        return jsonify({
            "total_calorie": 200,
            "items": [{
                "name": "Name",
                "confidence": 90,
                "boxX": 12,
                "boxY": 12,
                "boxW": 12,
                "boxH": 12 
            }]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    app.run(debug=True)
