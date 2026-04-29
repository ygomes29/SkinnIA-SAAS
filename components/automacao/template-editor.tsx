"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

interface Template {
  id: string;
  key: string;
  title: string;
  body: string;
  variables: string[];
}

export function TemplateEditor({ templates: initial }: { templates: Template[] }) {
  const [templates, setTemplates] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startEdit(t: Template) {
    setEditingId(t.id);
    setEditBody(t.body);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditBody("");
    setError(null);
  }

  async function saveEdit(id: string) {
    setSaving(id);
    setError(null);

    try {
      const res = await fetch(`/api/message-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, body: updated.body } : t)));
        setEditingId(null);
      } else {
        setError("Erro ao salvar template.");
      }
    } catch {
      setError("Erro de rede.");
    } finally {
      setSaving(null);
    }
  }

  if (templates.length === 0) return null;

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-2xl bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{error}</p>
      )}
      {templates.map((t) => {
        const isEditing = editingId === t.id;

        return (
          <div
            className={cn(
              "rounded-3xl border p-4",
              "border-[var(--sk-border)] bg-[var(--sk-bg-soft)]"
            )}
            key={t.id}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[var(--sk-text-primary)]">{t.title}</p>
                <p className="mt-0.5 text-[10px] font-mono text-[var(--sk-text-muted)]">{t.key}</p>
              </div>
              {!isEditing && (
                <Button
                  onClick={() => startEdit(t)}
                  size="sm"
                  variant="ghost"
                  className="shrink-0"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={5}
                  className="font-mono text-xs"
                />
                <div className="flex items-center gap-2">
                  <Button
                    disabled={saving === t.id}
                    onClick={() => saveEdit(t.id)}
                    size="sm"
                    variant="secondary"
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    {saving === t.id ? "Salvando…" : "Salvar"}
                  </Button>
                  <Button onClick={cancelEdit} size="sm" variant="ghost">
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className={cn(
                  "mt-3 whitespace-pre-line rounded-2xl p-3 text-sm",
                  "bg-[var(--sk-bg-panel)] text-[var(--sk-text-secondary)]"
                )}>
                  {t.body}
                </p>
                {t.variables.length > 0 && (
                  <p className="mt-2 text-xs text-[var(--sk-text-muted)]">
                    Variáveis: {t.variables.map((v) => `{${v}}`).join(", ")}
                  </p>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
