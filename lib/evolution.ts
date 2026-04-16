const baseUrl = process.env.EVOLUTION_API_URL;
const apiKey = process.env.EVOLUTION_API_KEY;

type EvolutionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function evolutionRequest<T>(path: string, init?: RequestInit): Promise<EvolutionResult<T>> {
  if (!baseUrl || !apiKey) {
    return {
      success: false,
      error: "EVOLUTION_API_URL ou EVOLUTION_API_KEY não configuradas."
    };
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Evolution API respondeu ${response.status}`
      };
    }

    const data = (await response.json()) as T;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido na Evolution API"
    };
  }
}

export function sendText(instance: string, phone: string, text: string) {
  return evolutionRequest(`/message/sendText/${instance}`, {
    method: "POST",
    body: JSON.stringify({
      number: phone,
      text
    })
  });
}

export function sendImage(instance: string, phone: string, imageUrl: string, caption?: string) {
  return evolutionRequest(`/message/sendMedia/${instance}`, {
    method: "POST",
    body: JSON.stringify({
      number: phone,
      mediatype: "image",
      media: imageUrl,
      caption
    })
  });
}

export function sendDocument(instance: string, phone: string, documentUrl: string, fileName: string) {
  return evolutionRequest(`/message/sendMedia/${instance}`, {
    method: "POST",
    body: JSON.stringify({
      number: phone,
      mediatype: "document",
      media: documentUrl,
      fileName
    })
  });
}

export function sendReaction(instance: string, phone: string, messageId: string, emoji: string) {
  return evolutionRequest(`/message/sendReaction/${instance}`, {
    method: "POST",
    body: JSON.stringify({
      number: phone,
      reactionMessage: {
        key: {
          id: messageId
        },
        reaction: emoji
      }
    })
  });
}

export function getQRCode(instance: string) {
  return evolutionRequest(`/instance/connect/${instance}`, {
    method: "GET"
  });
}

export function createInstance(instanceName: string, webhookUrl: string) {
  return evolutionRequest(`/instance/create`, {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
      webhook: {
        url: webhookUrl,
        byEvents: true,
        base64: false,
        events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "QRCODE_UPDATED"]
      }
    })
  });
}
