export const statusLabels: Record<string, string> = {
  NEW: "Novo",
  PROPOSAL: "Proposta",
  AWAITING_ACCEPTANCE: "Aguardando Aceite",
  CONTRACTED: "Contratado",
  PLANNING: "Planejamento",
  PRODUCTION: "Produção",
  APPROVAL: "Aprovação",
  WORK: "Em Obra",
  AWAITING_CLIENT: "Aguardando Cliente",
  PAUSED: "Pausado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

export const taskStatusLabels: Record<string, string> = {
  PLANNING: "Planejamento",
  PRODUCTION: "Em Produção",
  DELIVERED: "Entregue",
  CANCELED: "Cancelada",
};

export const statusColors: Record<string, string> = {
  NEW: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  PROPOSAL: "bg-blue-50 text-blue-700 ring-blue-200",
  AWAITING_ACCEPTANCE: "bg-amber-50 text-amber-700 ring-amber-200",
  CONTRACTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PLANNING: "bg-violet-50 text-violet-700 ring-violet-200",
  PRODUCTION: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  APPROVAL: "bg-orange-50 text-orange-700 ring-orange-200",
  WORK: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  AWAITING_CLIENT: "bg-teal-50 text-teal-700 ring-teal-200",
  PAUSED: "bg-zinc-50 text-zinc-600 ring-zinc-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELED: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const taskStatusColors: Record<string, string> = {
  PLANNING: "bg-violet-50 text-violet-700 ring-violet-200",
  PRODUCTION: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELED: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const typeLabels: Record<string, string> = {
  TECHNICAL_PROJECT: "Projeto Técnico",
  REGULARIZATION: "Regularização",
  WORK_EXECUTION: "Execução de Obra",
  CONSULTING: "Consultoria",
  FIRE_SAFETY: "Prevenção de Incêndio",
  PROJECT_APPROVAL_WORK: "Aprovação de Projeto",
};
