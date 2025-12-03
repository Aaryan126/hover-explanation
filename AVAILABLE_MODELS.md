# Available WebLLM Models

## Current Model

The extension is configured to use:
- **Model ID**: `phi-2-q4f32_1-MLC`
- **Size**: ~1.2GB
- **Parameters**: 2.7B
- **Good for**: Short explanations, technical terms

## All Available Phi Models

### Phi-2 (Smallest)
- `phi-2-q4f16_1-MLC` (~800MB) - Faster, less memory
- `phi-2-q4f32_1-MLC` (~1.2GB) - Better quality ✓ **(Current)**
- `phi-2-q4f16_1-MLC-1k` (~800MB, 1k context)
- `phi-2-q4f32_1-MLC-1k` (~1.2GB, 1k context)

### Phi-1.5 (Even Smaller)
- `phi-1_5-q4f16_1-MLC` (~600MB)
- `phi-1_5-q4f32_1-MLC` (~900MB)
- `phi-1_5-q4f16_1-MLC-1k` (~600MB, 1k context)
- `phi-1_5-q4f32_1-MLC-1k` (~900MB, 1k context)

### Phi-3 Mini (Newer, Larger)
- `Phi-3-mini-4k-instruct-q4f16_1-MLC` (~1.2GB)
- `Phi-3-mini-4k-instruct-q4f32_1-MLC` (~1.8GB)
- `Phi-3-mini-4k-instruct-q4f16_1-MLC-1k`
- `Phi-3-mini-4k-instruct-q4f32_1-MLC-1k`

### Phi-3.5 Mini (Latest)
- `Phi-3.5-mini-instruct-q4f16_1-MLC` (~1.3GB)
- `Phi-3.5-mini-instruct-q4f32_1-MLC` (~2.0GB)
- `Phi-3.5-mini-instruct-q4f16_1-MLC-1k`
- `Phi-3.5-mini-instruct-q4f32_1-MLC-1k`

### Phi-3.5 Vision (With Image Understanding)
- `Phi-3.5-vision-instruct-q4f16_1-MLC`
- `Phi-3.5-vision-instruct-q4f32_1-MLC`

## Model Naming Convention

```
[model]-[variant]-[quantization]-MLC[-context]

Examples:
- phi-2-q4f32_1-MLC
  ├─ phi-2: Model name
  ├─ q4f32_1: Quantization (4-bit, float32 accumulation)
  └─ MLC: MLC format

- phi-2-q4f16_1-MLC-1k
  ├─ Same as above
  └─ 1k: 1k token context window
```

## Quantization Types

- **q4f16_1**: 4-bit quantization, float16 accumulation
  - Smaller size (~30% less)
  - Faster inference
  - Slightly lower quality

- **q4f32_1**: 4-bit quantization, float32 accumulation
  - Larger size
  - Better quality
  - Current default

## How to Change Models

Edit `webllm-service.js`:

```javascript
const MODEL_ID = "phi-2-q4f32_1-MLC"; // Change this line
```

### Recommended Models by Use Case

**Fastest / Smallest**
```javascript
const MODEL_ID = "phi-1_5-q4f16_1-MLC"; // ~600MB
```

**Best Balance** (Current)
```javascript
const MODEL_ID = "phi-2-q4f32_1-MLC"; // ~1.2GB
```

**Best Quality (Small)**
```javascript
const MODEL_ID = "Phi-3-mini-4k-instruct-q4f32_1-MLC"; // ~1.8GB
```

**Latest Model**
```javascript
const MODEL_ID = "Phi-3.5-mini-instruct-q4f32_1-MLC"; // ~2.0GB
```

## After Changing Model

1. Edit `webllm-service.js`
2. Rebuild: `npm run build`
3. Reload extension in Chrome
4. Clear browser cache if needed
5. Model will download on first use

## Performance Comparison

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| phi-1_5-q4f16_1 | ~600MB | Fastest | Good | Quick explanations |
| phi-2-q4f16_1 | ~800MB | Fast | Better | Balanced |
| phi-2-q4f32_1 ✓ | ~1.2GB | Medium | Good | Current default |
| Phi-3-mini-q4f32_1 | ~1.8GB | Slower | Better | Detailed explanations |
| Phi-3.5-mini-q4f32_1 | ~2.0GB | Slower | Best | Most accurate |

## Other Model Families

WebLLM also supports:
- **Llama 3** series
- **Qwen (通义千问)** series
- **Gemma** series
- **Mistral** series

See full list: https://github.com/mlc-ai/web-llm/blob/main/src/config.ts

## Common Issues

### "Cannot find model record"
- Model ID is case-sensitive
- Check spelling carefully
- Use lowercase for phi models: `phi-2`, not `Phi-2`

### Model Won't Download
- Check internet connection
- Ensure enough disk space
- Try clearing browser cache

### Out of Memory
- Use smaller model (phi-1_5 or q4f16 variant)
- Close other Chrome tabs
- Restart browser

## Model Source

All models compiled from:
- Microsoft Phi series: https://huggingface.co/microsoft/phi-2
- MLC-AI prebuilt models: https://mlc.ai/models

## Resources

- Full model list: https://github.com/mlc-ai/web-llm/blob/main/src/config.ts
- WebLLM docs: https://webllm.mlc.ai/
- Model cards: https://huggingface.co/microsoft
