from flask import Flask, jsonify, request, url_for
from flask_cors import CORS
from PIL import Image
import base64, datetime
from io import BytesIO


########################################
# Model Load - Blip2
########################################
import torch
import time
from PIL import Image
from transformers import Blip2Processor, Blip2ForConditionalGeneration
from peft import PeftConfig, PeftModel

# Processor / Model
load_start = time.perf_counter()
processor = Blip2Processor.from_pretrained("salesforce/blip2-opt-2.7b")

config = PeftConfig.from_pretrained("blip2_itt")
model = Blip2ForConditionalGeneration.from_pretrained(
    config.base_model_name_or_path)
model = PeftModel.from_pretrained(model, "blip2_itt")

# Device
device = "cuda" if torch.cuda.is_available() else (
    "mps" if torch.backends.mps.is_available() else "cpu")
model.to(device)
load_end = time.perf_counter()
print(f"BLIP2 Loaded on : {device}, {load_end - load_start} sec")


########################################
# Model Load - Diffusion
########################################
from diffusers import StableDiffusionPipeline

load_start = time.perf_counter()
device = "cuda" if torch.cuda.is_available() else (
    "mps" if torch.backends.mps.is_available() else "cpu")

# pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
#     "nitrosocke/Ghibli-Diffusion", torch_dtype=torch.float16, 
#     use_safetensors=True).to(device)
# pipe.enable_attention_slicing()
# generator = torch.Generator(device=device).manual_seed(1024)

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5", torch_dtype=torch.float16).to(device)


load_end = time.perf_counter()
print(f"Diffusion Loaded on : {device}, {load_end - load_start} sec")


########################################
# App
########################################
app = Flask(__name__)

CORS(app)

@app.route("/", methods=["POST"])
def run_model():
    # Handle Image
    ID = str(datetime.datetime.now())

    image_file = request.form["img"].split(',')[1]
    img_data = base64.b64decode(image_file)

    image = Image.open(BytesIO(img_data))
    image.resize((256, 256))
    image.save(f"history/input_{ID}.png")
    
    
    # Generate Text
    gen_start = time.perf_counter()
    inputs = processor(image, return_tensors="pt").to(device)

    generated_ids = model.generate(**inputs, max_new_tokens=20)
    generated_text = processor.batch_decode(
        generated_ids, skip_special_tokens=True)[0].strip()
    gen_end = time.perf_counter()

    print(f"[CAPTION] Generated in {gen_end - gen_start} sec")
    print(f"[CONTENT] {generated_text}")
    
    # Generate Image
    # generated_image = pipe(prompt=generated_text, image=image, strength=0.95, 
    #                        guidance_scale= 10.5, generator=generator).images[0]
    generated_image = pipe(generated_text).images[0]
    generated_image.save(f"static/{ID}.png")


    resp = {
        "content": generated_text,
        "img": url_for("static", filename=f"{ID}.png")
    }
    return jsonify(resp)
    
