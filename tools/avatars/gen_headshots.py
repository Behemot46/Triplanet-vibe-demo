#!/usr/bin/env python3
"""Generate photoreal headshots of the demo's FICTIONAL staff on CPU (no API key).

Model: Realistic Vision V5.1 (SD 1.5 fine-tune, CreativeML OpenRAIL-M) + LCM-LoRA sdv1-5 (OpenRAIL++)
+ sd-vae-ft-mse (MIT). Fixed seeds, so the run is repeatable. These are images of people who do not exist.
Usage (any venv with torch-cpu, diffusers, transformers, accelerate, peft):
  python gen_headshots.py OUT_DIR [name ...]      -> OUT_DIR/<Name>_<seed>.png, 3 seeds per person
"""
import sys, os, time, torch
from diffusers import StableDiffusionPipeline, LCMScheduler, AutoencoderKL

STYLE = ("professional corporate headshot photograph of {d}, warm genuine smile, head and shoulders, facing the camera, "
         "soft even studio lighting, plain light grey seamless studio backdrop, 85mm lens, shallow depth of field, "
         "sharp focus on the eyes, natural skin texture, high quality photo")
NEG = ("cartoon, illustration, painting, drawing, 3d render, anime, cgi, deformed, distorted face, asymmetric eyes, "
       "bad teeth, hands, fingers, blurry, low quality, jpeg artifacts, watermark, text, logo, name tag, hat, sunglasses, "
       "heavy makeup, cropped head, multiple people, busy background, outdoors")
PEOPLE = {
  'Ella':   "a 45 year old white American woman, auburn shoulder-length hair, navy blazer over a white blouse",
  'Priya':  "a 32 year old South Asian American woman, long dark brown hair, charcoal blazer",
  'Dana':   "a 40 year old white American woman, blonde chin-length bob haircut, light blue sweater",
  'Marcus': "a 38 year old Black American man, short cropped hair, short neat beard, dark grey suit jacket, open-collar white shirt",
  'Grace':  "a 35 year old Nigerian American woman, natural curly black hair, coral blouse",
  'Luis':   "a 42 year old Hispanic American man, short wavy dark hair, trimmed beard, navy sweater over a collared shirt",
  'Tom':    "a 29 year old white American man, short light brown hair, round thin-frame glasses, grey crewneck sweater",
  'Maya':   "a 30 year old woman with olive skin, dark wavy shoulder-length hair, small stud earrings, brand blue blouse",
}
SEEDS = [11, 23, 47]
EXTRA_SEEDS = {'Maya': [5, 71, 88]}   # Maya, the AI assistant, gets more candidates

def main():
    out = sys.argv[1]; names = sys.argv[2:] or list(PEOPLE)
    os.makedirs(out, exist_ok=True); torch.set_num_threads(os.cpu_count() or 4)
    vae = AutoencoderKL.from_pretrained('stabilityai/sd-vae-ft-mse', torch_dtype=torch.float32)
    pipe = StableDiffusionPipeline.from_pretrained('SG161222/Realistic_Vision_V5.1_noVAE', vae=vae, torch_dtype=torch.float32,
                                                   safety_checker=None, requires_safety_checker=False)
    pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
    pipe.load_lora_weights('latent-consistency/lcm-lora-sdv1-5', weight_name='pytorch_lora_weights.safetensors'); pipe.fuse_lora()
    pipe.set_progress_bar_config(disable=True)
    for n in names:
        for s in SEEDS + EXTRA_SEEDS.get(n, []):
            f = os.path.join(out, f'{n}_{s}.png')
            if os.path.exists(f): continue
            t = time.time()
            img = pipe(STYLE.format(d=PEOPLE[n]), negative_prompt=NEG, num_inference_steps=6, guidance_scale=1.5,
                       width=512, height=512, generator=torch.Generator().manual_seed(s)).images[0]
            img.save(f); print(n, s, f'{time.time()-t:.0f}s', flush=True)

if __name__ == '__main__':
    main()
