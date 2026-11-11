export async function readBoundedText(message: Request | Response, maxBytes: number): Promise<string> {
  if (Number(message.headers.get("content-length")) > maxBytes) {
    await message.body?.cancel();
    throw new Error("Payload limit exceeded.");
  }
  if (!message.body) return "";
  const reader = message.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return text + decoder.decode();
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new Error("Payload limit exceeded.");
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
