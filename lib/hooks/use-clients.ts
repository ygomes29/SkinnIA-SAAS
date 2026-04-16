"use client";

import { useEffect, useMemo, useState } from "react";

import type { Client } from "@/types/skinnia";

export function useClients(initialClients: Client[]) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [tag, setTag] = useState("all");
  const [professionalId, setProfessionalId] = useState("all");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const filteredClients = useMemo(() => {
    return initialClients.filter((client) => {
      const matchesQuery =
        debouncedQuery.length === 0 ||
        client.name.toLowerCase().includes(debouncedQuery) ||
        client.phone.toLowerCase().includes(debouncedQuery);

      const matchesStatus = status === "all" || client.status === status;
      const matchesTag = tag === "all" || client.tags.includes(tag);
      const matchesProfessional =
        professionalId === "all" || client.preferred_professional_id === professionalId;

      return matchesQuery && matchesStatus && matchesTag && matchesProfessional;
    });
  }, [debouncedQuery, initialClients, professionalId, status, tag]);

  return {
    filteredClients,
    professionalId,
    query,
    setProfessionalId,
    setQuery,
    setStatus,
    setTag,
    status,
    tag
  };
}
