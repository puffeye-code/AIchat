// 腾讯云云函数代码 - 部署到 CloudBase
// 函数名：chatSync
const cloudbase = require('@cloudbase/node-sdk');

const app = cloudbase.init({
  env: 'aichat-1-d1gggjoqz366324b4',
});

const db = app.database();

exports.main = async (event) => {
  const { action, data } = event;

  try {
    if (action === 'read') {
      const res = await db.collection('chat_data').where({ _id: 'main' }).get();
      return { ok: true, data: res.data[0] || null };
    }

    if (action === 'write') {
      const { payload } = data;
      const existing = await db.collection('chat_data').where({ _id: 'main' }).get();
      if (existing.data.length) {
        await db.collection('chat_data').doc('main').set(payload);
      } else {
        await db.collection('chat_data').add(payload);
      }
      return { ok: true };
    }

    return { ok: false, error: 'Unknown action' };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};
