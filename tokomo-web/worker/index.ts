export default {
  async fetch() {
    // This is a placeholder worker for the SPA
    // All requests will be handled by Cloudflare's built-in asset serving
    return new Response("OK", { status: 200 });
  },
} satisfies ExportedHandler<Env>;
