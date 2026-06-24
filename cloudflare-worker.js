const TARGET = 'https://aichat-1-d1gggjoqz366324b4.ap-shanghai.tcb-api.tencentcloudapi.com';

export default {
  async fetch(request) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-TCB-Source, X-SDK-Version, x-device-id',
    };

    if (request.method === 'OPTIONS') {
      // 回显所有请求的自定义头，解决 CORS 预检问题
      const reqHeaders = request.headers.get('Access-Control-Request-Headers');
      const headers = { ...corsHeaders };
      if (reqHeaders) headers['Access-Control-Allow-Headers'] = reqHeaders;
      return new Response(null, { status: 204, headers });
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

      // 转发所有请求头
      const fwdHeaders = {};
      request.headers.forEach((v, k) => { fwdHeaders[k] = v; });
      if (!fwdHeaders['Content-Type'] && !fwdHeaders['content-type']) fwdHeaders['Content-Type'] = 'application/json';

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
