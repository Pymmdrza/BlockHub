export interface Env {
  __STATIC_CONTENT: KVNamespace;
  __STATIC_CONTENT_MANIFEST: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Get the URL from the request
      const url = new URL(request.url);
      const path = url.pathname;

      // Handle API proxying
      if (path.startsWith('/api/')) {
        return handleApiProxy(request, url);
      }

      // Handle block_api proxying
      if (path.startsWith('/block_api/')) {
        return handleBlockchainInfoProxy(request, url);
      }

      // Try to serve static assets
      const staticResponse = await serveStaticAsset(request, env, ctx);
      if (staticResponse) {
        return staticResponse;
      }

      // If no static asset is found, serve the index.html for client-side routing
      return serveIndex(request, env, ctx);
    } catch (e) {
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};

async function serveStaticAsset(request: Request, env: Env, ctx: ExecutionContext): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Try to get the asset from KV
  try {
    // Create a cache key based on the path
    const cacheKey = new Request(url.toString(), request);
    
    // Get the asset from KV
    const asset = await env.__STATIC_CONTENT.get(path, 'arrayBuffer');
    
    if (asset) {
      // Determine the content type based on the file extension
      const contentType = getContentType(path);
      
      // Return the asset with the appropriate content type
      return new Response(asset, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

async function serveIndex(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    // Get the index.html from KV
    const indexHtml = await env.__STATIC_CONTENT.get('/index.html', 'text');
    
    if (indexHtml) {
      return new Response(indexHtml, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    
    return new Response('Not Found', { status: 404 });
  } catch (e) {
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function handleApiProxy(request: Request, url: URL): Promise<Response> {
  // Extract the API path
  const apiPath = url.pathname.replace(/^\/api\/v2/, '');
  
  // Create a new request to the Bitcoin API
  const apiUrl = new URL(`https://btcbook.guarda.co/api/v2${apiPath}`);
  
  // Copy query parameters
  url.searchParams.forEach((value, key) => {
    apiUrl.searchParams.set(key, value);
  });
  
  // Create a new request with the same method, headers, and body
  const apiRequest = new Request(apiUrl.toString(), {
    method: request.method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
    body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.clone().arrayBuffer() : undefined,
  });
  
  // Fetch the API response
  const apiResponse = await fetch(apiRequest);
  
  // Create a new response with the API response body and headers
  const response = new Response(apiResponse.body, {
    status: apiResponse.status,
    statusText: apiResponse.statusText,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
  
  return response;
}

async function handleBlockchainInfoProxy(request: Request, url: URL): Promise<Response> {
  // Extract the API path
  const apiPath = url.pathname.replace(/^\/block_api/, '');
  
  // Create a new request to the Blockchain.info API
  const apiUrl = new URL(`https://blockchain.info${apiPath}`);
  
  // Copy query parameters
  url.searchParams.forEach((value, key) => {
    apiUrl.searchParams.set(key, value);
  });
  
  // Create a new request with the same method, headers, and body
  const apiRequest = new Request(apiUrl.toString(), {
    method: request.method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
    body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.clone().arrayBuffer() : undefined,
  });
  
  // Fetch the API response
  const apiResponse = await fetch(apiRequest);
  
  // Create a new response with the API response body and headers
  const response = new Response(apiResponse.body, {
    status: apiResponse.status,
    statusText: apiResponse.statusText,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
  
  return response;
}

function getContentType(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'js':
      return 'application/javascript';
    case 'json':
      return 'application/json';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'svg':
      return 'image/svg+xml';
    case 'ico':
      return 'image/x-icon';
    default:
      return 'text/plain';
  }
}
