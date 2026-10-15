// Models vLLM 0.31.0 will not load, read from their config.
//
// The sizing follows vLLM's rules, but some architectures it has dropped
// (_PREVIOUSLY_SUPPORTED_MODELS in vllm/model_executor/models/registry.py: Llama
// 3.2 Vision, MiniMax-Text-01/M1, MPT, the first Qwen) and some configs its model
// code cannot build. Their figures still show what the model would hold, beside a
// warning, so nobody plans a deployment that will not start (audit B15).
//
// React-free: hf.ts reads it and the tests run it.

// Configs are free-form JSON.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

/** Architecture classes vLLM 0.31.0 refuses, with the last release that served them. */
export const VLLM_REMOVED: Record<string, string> = {
  MotifForCausalLM: "0.10.2",
  Phi3SmallForCausalLM: "0.9.2",
  Phi4FlashForCausalLM: "0.10.2",
  Phi4MultimodalForCausalLM: "0.12.0",
  JAISLMHeadModel: "0.22.0",
  InternLM2VEForCausalLM: "0.23.0",
  QWenLMHeadModel: "0.23.0",
  QwenVLForConditionalGeneration: "0.23.0",
  InternLMForCausalLM: "0.23.0",
  DonutForConditionalGeneration: "0.10.2",
  MllamaForConditionalGeneration: "0.10.2",
  XverseForCausalLM: "0.23.0",
  Dots1ForCausalLM: "0.23.0",
  BambaForCausalLM: "0.23.0",
  MiniMaxForCausalLM: "0.23.0",
  MiniMaxText01ForCausalLM: "0.23.0",
  MiniMaxM1ForCausalLM: "0.23.0",
  MiniMaxVL01ForConditionalGeneration: "0.23.0",
  BaiChuanForCausalLM: "0.23.0",
  BaichuanForCausalLM: "0.23.0",
  AquilaModel: "0.24.0",
  AquilaForCausalLM: "0.24.0",
  Grok1ModelForCausalLM: "0.24.0",
  Grok1ForCausalLM: "0.24.0",
  TarsierForConditionalGeneration: "0.24.0",
  Tarsier2ForConditionalGeneration: "0.23.0",
  MantisForConditionalGeneration: "0.24.0",
  AyaVisionForConditionalGeneration: "0.24.0",
  TeleChatForCausalLM: "0.25.0",
  PersimmonForCausalLM: "0.25.0",
  FuyuForCausalLM: "0.25.0",
  Plamo2ForCausalLM: "0.26.0",
  OuroForCausalLM: "0.26.0",
  ArcticForCausalLM: "0.28.0",
  ChameleonForConditionalGeneration: "0.28.0",
  MPTForCausalLM: "0.28.0",
  MptForCausalLM: "0.28.0",
  RWForCausalLM: "0.28.0",
  StableLMEpochForCausalLM: "0.28.0",
};

/** Why vLLM 0.31.0 will not load this config, or undefined when it will (as far as
 *  the config tells). `arch` is the class it would load; `until`, the last release
 *  that served it, when it was dropped; `linear`, when its model code cannot build
 *  the config's layers: Nemotron NAS blocks that replace attention or the MLP with
 *  a linear layer, which nemotron_nas.py has no module for. */
export function vllmRefuses(cfg: Json): { arch: string; until?: string; linear?: boolean } | undefined {
  const arch: unknown = Array.isArray(cfg?.architectures) ? cfg.architectures[0] : undefined;
  if (typeof arch !== "string") return undefined;
  if (VLLM_REMOVED[arch]) return { arch, until: VLLM_REMOVED[arch] };
  const c = cfg?.text_config ?? cfg;
  if (Array.isArray(c?.block_configs) && c.block_configs.some((b: Json) => b?.attention?.replace_with_linear || b?.ffn?.replace_with_linear)) {
    return { arch, linear: true };
  }
  return undefined;
}
