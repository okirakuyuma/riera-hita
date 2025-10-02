const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

/**
 * kintone接続テスト用Function
 * 最小限のデータでレコード追加をテストします
 */

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { KINTONE_BASE_URL, KINTONE_API_TOKEN, KINTONE_APP_ID } = process.env;

    console.log('=== kintone接続テスト ===');
    console.log('KINTONE_BASE_URL:', KINTONE_BASE_URL);
    console.log('KINTONE_APP_ID:', KINTONE_APP_ID);
    console.log('API Token exists:', !!KINTONE_API_TOKEN);

    if (!KINTONE_BASE_URL || !KINTONE_API_TOKEN || !KINTONE_APP_ID) {
      throw new Error('環境変数が設定されていません');
    }

    // BASE_URLから末尾のスラッシュを削除
    const baseUrl = KINTONE_BASE_URL.replace(/\/$/, '');
    console.log('Cleaned BASE_URL:', baseUrl);

    // kintone APIクライアント初期化
    const client = new KintoneRestAPIClient({
      baseUrl: baseUrl,
      auth: {
        apiToken: KINTONE_API_TOKEN,
      },
    });

    // まず、アプリの情報を取得してフィールド一覧を確認
    console.log('アプリ情報を取得中...');
    try {
      const appInfo = await client.app.getFormFields({
        app: KINTONE_APP_ID,
      });
      console.log('アプリのフィールド一覧:', JSON.stringify(appInfo, null, 2));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'kintoneアプリ情報の取得に成功しました',
          fields: appInfo.properties,
        }),
      };
    } catch (error) {
      console.error('アプリ情報取得エラー:', error);
      throw error;
    }

  } catch (error) {
    console.error('エラー:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'エラーが発生しました',
        error: error.message,
        stack: error.stack,
      }),
    };
  }
};
