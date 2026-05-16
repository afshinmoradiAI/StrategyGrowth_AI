export type SseHandler = (event: string, data: Record<string, unknown>) => void;

export async function streamSse(
  url: string,
  body: unknown,
  onEvent: SseHandler,
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    throw new Error(`${res.status}: ${await res.text()}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      let evName = "message";
      let dataLine = "";
      for (const line of block.split("\n")) {
        if (line.startsWith("event: ")) evName = line.slice(7);
        else if (line.startsWith("data: ")) dataLine = line.slice(6);
      }
      if (dataLine) onEvent(evName, JSON.parse(dataLine));
    }
  }
}
