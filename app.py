import pathlib
import torch
from fastai.vision.all import *
from flask import Flask, request, jsonify
import os
from flask_cors import CORS  # Import CORS

# Redirect PosixPath to WindowsPath
pathlib.PosixPath = pathlib.WindowsPath

app = Flask(__name__)
CORS(app)  # Enable CORS

model = load_learner(r"C:\Users\Preetham\Desktop\Recycling App\modelFile.pkl")

# Directory to save images
image_save_dir = r'C:\Users\Preetham\Desktop\Recycling App'
os.makedirs(image_save_dir, exist_ok=True)

@app.route('/classify', methods=['POST'])
def classify_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        # Save the image with a new filename
        filename = 'uploaded_image.jpg'
        image_path = os.path.join(image_save_dir, filename)
        file.seek(0)  # Go back to the start of the file
        file.save(image_path)

        # Use the file path for prediction
        pred,_,_ = model.predict(image_path)
        return jsonify({'prediction': str(pred)})

if __name__ == '__main__':
    app.run(debug=True)
