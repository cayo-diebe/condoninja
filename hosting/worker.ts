import handler from "vinext/server/fetch-handler";

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const response = await handler.fetch(request, env, ctx);
      const url = new URL(request.url);
      if (url.pathname.startsWith("/app") || url.pathname.startsWith("/api") || url.pathname === "/login" || url.pathname === "/cadastro") {
        const headers = new Headers(response.headers);
        headers.set("Cache-Control", "private, no-store");
        headers.set("X-Content-Type-Options", "nosniff");
        return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
      }
      return response;
    } catch (error) {
      console.error("request_failed", error instanceof Error ? error.message : "unknown");
      if (new URL(request.url).pathname.startsWith("/api/")) return Response.json({ error: "O serviço está temporariamente indisponível. Tente novamente." }, { status: 503, headers: { "Cache-Control": "no-store" } });
      return new Response("Serviço temporariamente indisponível. Tente novamente.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
    }
  },
};
