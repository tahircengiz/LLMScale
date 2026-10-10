// The one place the newsroom talks to the Claude API. Everything else takes an
// `Ask` function, so the steps can be tested without a key or a network.
//
// Credentials come from the environment, as the SDK reads them: ANTHROPIC_API_KEY,
// and ANTHROPIC_BASE_URL when the calls should go through a gateway (LiteLLM's
// Anthropic pass-through) instead of straight to the API.

import Anthropic from "@anthropic-ai/sdk";
import type { Ask } from "./draft.ts";

export const DEFAULT_MODEL = "claude-opus-5-5";

export function claudeAsk(model = process.env.NEWSROOM_MODEL ?? DEFAULT_MODEL): Ask {
  const client = new Anthropic();
  return async ({ system, user, schema, effort, maxTokens }) => {
    // fallbacks: "default" re-runs a request a safety classifier declines on the
    // model Anthropic recommends for that case, instead of failing the draft.
    const res = await client.beta.messages.create({
      model,
      max_tokens: maxTokens,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: user }],
      output_config: { effort, format: { type: "json_schema", schema } },
    } as Anthropic.Beta.MessageCreateParamsNonStreaming);
    if (res.stop_reason === "refusal") throw new Error(`declined (${res.stop_details?.category ?? "no category"})`);
    if (res.stop_reason === "max_tokens") throw new Error(`ran out of output tokens at ${maxTokens}`);
    const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const u = res.usage;
    return {
      json: JSON.parse(text) as unknown,
      inputTokens: u.input_tokens + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0),
      outputTokens: u.output_tokens,
      model: res.model,
    };
  };
}
