import type { AgentActionPayload, AgentContext, AgentResponse } from "@/types/skinnia";

function buildSystemPrompt(context: AgentContext) {
  const orgType = String(context.organization.settings.org_type ?? "salão");
  const city = String(context.organization.settings.city ?? "Brasil");
  const servicesList = String(context.organization.settings.services_list ?? "Consultar catálogo no sistema");
  const professionalsList = String(
    context.organization.settings.professionals_list ?? "Consultar profissionais ativos"
  );
  const workingHours = String(
    context.organization.settings.working_hours ?? "Segunda a sábado, em horário comercial"
  );
  const agentName = String(context.organization.settings.agent_name ?? "Luna");
  const tone = String(context.organization.settings.tone ?? "amigável");

  return `Você é ${agentName}, assistente virtual de ${context.organization.name}.
Negócio: ${orgType}.
Localização: ${city}.
Serviços disponíveis: ${servicesList}.
Profissionais: ${professionalsList}.
Horários de funcionamento: ${workingHours}.

Sua personalidade: ${tone}.

Regras:
- Responda SEMPRE em português brasileiro informal
- Máximo 3 parágrafos por resposta
- Se o cliente quer agendar, colete serviço, data/hora preferida e profissional opcional
- Nunca invente horários disponíveis; diga que vai verificar
- Se não souber responder, ofereça atendimento humano
- Nunca mencione que é uma IA a menos que perguntem diretamente
- Quando precisar de ação do sistema, retorne um bloco final no formato:
<action>{ "type": "schedule", "service_hint": "...", "date_hint": "...", "professional_hint": "..." }</action>

Ações disponíveis: ${context.available_actions.join(", ")}.`;
}

function parseAction(text: string): AgentActionPayload | undefined {
  const match = text.match(/<action>([\s\S]*?)<\/action>/i);
  if (!match) return undefined;

  try {
    return JSON.parse(match[1]) as AgentActionPayload;
  } catch {
    return undefined;
  }
}

function stripActionMarkup(text: string) {
  return text.replace(/<action>[\s\S]*?<\/action>/gi, "").trim();
}

export async function processMessage(context: AgentContext): Promise<AgentResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";

  if (!apiKey) {
    return {
      message:
        "Consigo te ajudar com isso. Vou verificar certinho no sistema e já te respondo com as opções disponíveis."
    };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      system: buildSystemPrompt(context),
      messages: [
        ...context.history.map((item) => ({
          role: item.direction === "inbound" ? "user" : "assistant",
          content: item.content ?? ""
        })),
        {
          role: "user",
          content: context.message
        }
      ]
    })
  });

  if (!response.ok) {
    const fallback =
      "Recebi sua mensagem e vou confirmar no sistema para não te passar nada errado. Se quiser, também posso te colocar com uma atendente agora.";

    return { message: fallback };
  }

  const payload = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const text = payload.content?.find((entry) => entry.type === "text")?.text?.trim() ?? "";
  const action = parseAction(text);

  return {
    message: stripActionMarkup(text),
    action
  };
}
