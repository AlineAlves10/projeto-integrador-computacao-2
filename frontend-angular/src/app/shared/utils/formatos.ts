/** "+5511987654321" -> "(11) 98765-4321"; outros valores são exibidos como estão. */
export function formatarTelefone(valor: string | null | undefined): string {
  const m = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(valor || '');
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : valor || '';
}

/** 1536 -> "2 KB"; 5242880 -> "5 MB" */
export function formatarTamanho(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Número com casas decimais fixas no padrão brasileiro; null para valores ausentes. */
export function formatarNumero(valor: number | null | undefined, casas: number): string | null {
  return valor === null || valor === undefined
    ? null
    : Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
