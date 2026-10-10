// The one place the newsroom talks to the Claude API. Everything else takes an
// `Ask` function, so the steps can be tested without a key or a network.
//
// Credentials come from the environment, as the SDK reads them: ANTHROPIC_API_KEY,
// and ANTHROPIC_BASE_URL when the calls should go through a gateway (LiteLLM's
// Anthropic pass-through) instead of straight to the API.

import Anthropic from "@anthropic-ai/sdk";
import type { Ask } from "./draft.ts";

export const DEFAULT_MODEL = "claude-opus-5-5";
/** Where a declined request gets one more try. Anthropic sends cyber-category
 *  declines — the likeliest kind in LLM news — to this model. */
export const FALLBACK_MODEL = "claude-opus-4-8";

type Params = Anthropic.Beta.MessageCreateParamsNonStreaming;
export type Create = (params: Params) => Promise<Anthropic.Beta.BetaMessage>;

export function claudeAsk(
  model = process.env.NEWSROOM_MODEL ?? DEFAULT_MODEL,
  opts: { fallback?: string; create?: Create } = {}
): Ask {
  const fallback = opts.fallback ?? process.env.NEWSROOM_FALLBACK_MODEL ?? FALLBACK_MODEL;
  let create = opts.create;
  if (!create) {
    const client = new Anthropic();
    create = (params) => client.beta.messages.create(params);
  }
  const send = create;
  return async ({ system, user, schema, effort, maxTokens }) => {
    const ask = (m: string) =>
      send({
        model: m,
        max_tokens: maxTokens,
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: user }],
        output_config: { effort, format: { type: "json_schema", schema } },
      } as Params);
    // A safety classifier can decline a request. The API's own `fallbacks` cannot
    // be used here: LiteLLM takes that field for its own routing and drops beta
    // headers and fallback credit tokens. So a declined request gets one more try
    // on the fallback model, sent as it was; if that declines too, the draft fails.
    const first = await ask(model);
    const res = first.stop_reason === "refusal" && fallback && fallback !== model ? await ask(fallback) : first;
    if (res.stop_reason === "refusal") throw new Error(`declined (${res.stop_details?.category ?? "no category"})`);
    if (res.stop_reason === "max_tokens") throw new Error(`ran out of output tokens at ${maxTokens}`);
    const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    // A declined attempt is counted too, for an honest running cost.
    const tokens = (r: Anthropic.Beta.BetaMessage) => ({
      input: r.usage.input_tokens + (r.usage.cache_read_input_tokens ?? 0) + (r.usage.cache_creation_input_tokens ?? 0),
      output: r.usage.output_tokens,
    });
    const used = res === first ? [tokens(res)] : [tokens(first), tokens(res)];
    return {
      json: JSON.parse(text) as unknown,
      inputTokens: used.reduce((n, t) => n + t.input, 0),
      outputTokens: used.reduce((n, t) => n + t.output, 0),
      model: res.model,
    };
  };
}
