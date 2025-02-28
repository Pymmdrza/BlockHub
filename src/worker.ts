import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    try {
      // Try to get the asset from KV
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
        }
      );
    } catch (e) {
      // If the page is not found, return the index.html for client-side routing
      try {
        const url = new URL(request.url);
        const newRequest = new Request(`${url.origin}/index.html`, request);
        return await getAssetFromKV(
          {
            request: newRequest,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
          }
        );
      } catch (e) {
        return new Response('Not Found', { status: 404 });
      }
    }
  },
};