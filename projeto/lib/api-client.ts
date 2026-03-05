const API_URL = import.meta.env.VITE_API_URL || 'https://four54-backend.onrender.com';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  console.log(`[API-CLIENT] Requisição para: ${endpoint}`);
  console.log(`[API-CLIENT] Método: ${options.method || "GET"}`);

  const token = localStorage.getItem("authToken");
  console.log(
    `[API-CLIENT] Token encontrado: ${token ? "Sim (length: " + token.length + ")" : "Não"}`,
  );

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log(`[API-CLIENT] Header Authorization adicionado`);
  }

  console.log(`[API-CLIENT] URL completa: ${API_URL}${endpoint}`);
  console.log(`[API-CLIENT] Headers:`, headers);

  if (options.body) {
    console.log(`[API-CLIENT] Body:`, options.body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  console.log(
    `[API-CLIENT] Status da resposta: ${response.status} ${response.statusText}`,
  );

  if (!response.ok) {
    const responseText = await response.text();
    console.log(`[API-CLIENT] Resposta de erro:`, responseText);

    if (response.status === 401) {
      console.log(`[API-CLIENT] Status 401 - Limpando auth e redirecionando`);
      // Token inválido, limpar localStorage
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    throw new Error(`API Error: ${response.statusText}`);
  }

  // 204 No Content - não tem body para parsear
  if (response.status === 204) {
    console.log(`[API-CLIENT] Status 204 - No Content`);
    return null as T;
  }

  const data = await response.json();
  console.log(`[API-CLIENT] Resposta de sucesso:`, data);
  return data;
}
