const TARGET = 'https://aichat-1-d1gggjoqz366324b4.ap-shanghai.tcb-api.tencentcloudapi.com';

export default {
  async fetch(request) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-TCB-Source, X-SDK-Version, x-device-id',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const qs = url.search; // 完整的 ?... 部分

      // 支持两种模式：
      // 1. 查询参数代理: ?https://target-url（GitHub Pages 使用）
      // 2. 路径代理: /web?env=xxx（直接转发）
      let targetUrl;
      if (qs && qs.length > 1 && qs.startsWith('?http')) {
        // 查询参数模式：?https://target-url
        targetUrl = decodeURIComponent(qs.slice(1));
      } else {
        // 路径模式：直接拼接
        targetUrl = TARGET + url.pathname + url.search;
      }

      // 转发请求头（保留 Authorization、x-device-id 等）
      const fwdHeaders = {};
      request.headers.forEach((v, k) => {
        if (['content-type','authorization','x-device-id','x-tcb-source','x-sdk-version'].includes(k.toLowerCase())) {
          fwdHeaders[k] = v;
        }
      });
      if (!fwdHeaders['Content-Type']) fwdHeaders['Content-Type'] = 'application/json';

      const resp = await fetch(targetUrl, {
        method: request.method,
        headers: fwdHeaders,
        body: request.method === 'POST' ? await request.text() : undefined,
      });

      return new Response(await resp.text(), {
        status: resp.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
