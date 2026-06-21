# Hugging Face LLM Guide for Kairos

This project uses Hugging Face Inference Providers through the router endpoint to generate flashcards/slides.
The goal is to produce diverse, non-duplicated study items in French or in the language of the source text.

## How the app currently uses Hugging Face

The backend calls the Hugging Face router endpoint:

- `https://router.huggingface.co/v1/chat/completions`

It sends two generation passes:

1. Blueprint pass: the model first designs distinct slide blueprints.
2. Card pass: the model then generates one slide at a time from each blueprint.

This two-step process is important because it reduces repeated questions and forces the model to vary the angle, difficulty, and wording.

The active model can be configured with:

- `HF_MODEL_ID`

You can also provide a comma-separated fallback list with:

- `HF_MODEL_IDS`

If unset, the app uses `Qwen/Qwen2.5-7B-Instruct:cheapest` and falls back to the next model in the list when needed.

## Why Hugging Face is useful here

Hugging Face is not one model. It is a model hub plus an inference layer:

- The Hub hosts thousands of open and commercial models.
- Inference Providers let you call models through a single API.
- You can switch models without rewriting the application.
- You can also use local endpoints or dedicated inference endpoints later.

For this app, the most useful capability is the OpenAI-compatible chat endpoint plus provider selection.

## Recommended free or mostly free options

The best choice depends on the language and the quality you want.

### 1. Qwen/Qwen2.5-7B-Instruct

Why it is a strong default:

- Good instruction following.
- Strong structured output behavior.
- Good multilingual support, including French.
- Works well for generating JSON-like content.
- Fits the slide-generation use case very well.

Best use in Kairos:

- Default model for flashcards and grammar slides.
- Good balance between quality and speed.

Suggested env value:

```env
HF_MODEL_ID=Qwen/Qwen2.5-7B-Instruct:cheapest
HF_MODEL_IDS=Qwen/Qwen2.5-7B-Instruct:cheapest,Qwen/Qwen2.5-7B-Instruct:fastest,HuggingFaceH4/zephyr-7b-beta:cheapest
```

You can also try provider policies like:

```env
HF_MODEL_ID=Qwen/Qwen2.5-7B-Instruct:fastest
HF_MODEL_ID=Qwen/Qwen2.5-7B-Instruct:cheapest
```

### 2. HuggingFaceH4/zephyr-7b-beta

Why it is interesting:

- MIT license.
- Chat-oriented.
- Good for concise question/answer generation.
- Easy to use on providers that support it.

Limitations:

- Mostly English-centric.
- Less strong than Qwen for French grammar-style output.

Best use:

- Generic English study content.
- Lightweight conversational generation.

Suggested env value:

```env
HF_MODEL_ID=HuggingFaceH4/zephyr-7b-beta:cheapest
```

### 3. google/gemma-2-9b-it

Why it is strong:

- Very capable instruction model.
- Good reasoning and generation quality.
- Strong for structured study content.

Important note:

- Access requires accepting Google model terms on Hugging Face.
- Good option if you can accept the license conditions.

Best use:

- Higher quality generation when license access is fine.
- More advanced question design.

Suggested env value:

```env
HF_MODEL_ID=google/gemma-2-9b-it:cheapest
```

### 4. mistralai/Mistral-7B-Instruct-v0.3

Why it is interesting:

- Good instruction-following model.
- Apache 2.0 license.
- Supports chat and function-calling patterns.

Important note:

- It is a good model, but provider availability may vary depending on the inference route.
- If you want to use it reliably, local or dedicated deployment can be better.

Best use:

- Self-hosted or dedicated inference setups.
- General assistant behavior.

Suggested env value:

```env
HF_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.3
```

## Free-tier and provider notes

Hugging Face Inference Providers exposes many models through partner providers and gives a free tier with monthly credits.
That means:

- The model itself can be open-weight or access-controlled.
- The provider route matters.
- Some models are available on a provider but not on every provider.
- Performance and output quality can change depending on the provider behind the model.

Practical rule:

- If you want French content quality and structured answers, start with `Qwen/Qwen2.5-7B-Instruct:cheapest`.
- If you want a second option, test `google/gemma-2-9b-it:cheapest`.
- If you want a lightweight chat model, test `HuggingFaceH4/zephyr-7b-beta:cheapest`.

## Best prompt strategy for unique slides

To avoid duplicated slides, do not ask the model for 10 items in one flat list only.
Instead:

- First ask for different slide blueprints.
- Assign a different angle to each slide.
- Generate one slide at a time from each blueprint.
- Keep a local list of already used questions and reject similar ones.
- Ask for different cognitive styles: definition, example, correction, comparison, application, transformation, true/false, gap fill.

That is exactly why the backend was changed to a two-step generation flow.

### What makes slides different

The controller now tries to vary:

- the focus
- the angle
- the difficulty
- the question style

This helps produce 10 genuinely different slides instead of 5 questions repeated in another form.

## Good prompt examples

### Grammar in French

- "Generate 10 slides on French grammar about pronouns, but make each slide test a different rule or subskill."
- "Generate 10 slides on French grammar and vary the style between definition, correction, gap fill, comparison, and application."

### History

- "Generate 10 slides on the French Revolution with distinct themes such as causes, key dates, people, consequences, and vocabulary."

### Science

- "Generate 10 slides on cell biology with one concept per slide and no repeated subtopic."

## Tips for better quality in this app

- Prefer a precise topic instead of a very broad one.
- Provide source text when possible.
- Use the prompt mode when you want tighter control.
- Use the course text mode when you want the model to stay close to a document.
- Keep the deck focused on one domain at a time.
- If you want more variation, create smaller sets of 5 slides rather than one huge set of 50.

## Where to change the model

Set the variable in your API environment:

```env
HF_MODEL_ID=Qwen/Qwen2.5-7B-Instruct:cheapest
HF_MODEL_IDS=Qwen/Qwen2.5-7B-Instruct:cheapest,Qwen/Qwen2.5-7B-Instruct:fastest,HuggingFaceH4/zephyr-7b-beta:cheapest
```

You can also use a provider suffix if you want to bias routing:

```env
HF_MODEL_ID=Qwen/Qwen2.5-7B-Instruct:cheapest
```

The fallback order matters for a public application because the free tier can hit provider-side limits or temporary routing issues. When that happens, the app tries the next model automatically instead of failing immediately.

## Related Hugging Face concepts

- **Hub**: hosts the models.
- **Inference Providers**: managed inference through partner providers.
- **Inference Endpoints**: dedicated private deployment for production.
- **Local endpoints**: self-hosted servers such as vLLM, TGI, llama.cpp, or Ollama.

For this project, the simplest path is Inference Providers through the router endpoint.
