from flask import Flask, request, jsonify
from predict import predict_xray
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from frontend

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    prediction, confidence = predict_xray(file)
    return jsonify({"prediction": prediction, "confidence": confidence})

if __name__ == "__main__":
    app.run(debug=True)
