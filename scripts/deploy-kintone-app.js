const { KintoneRestAPIClient } = require('@kintone/rest-api-client');
require('dotenv').config();

/**
 * kintoneアプリのプレビュー環境を本番環境にデプロイするスクリプト
 */

async function deployKintoneApp() {
  const { KINTONE_BASE_URL, KINTONE_API_TOKEN, KINTONE_APP_ID } = process.env;

  if (!KINTONE_BASE_URL || !KINTONE_API_TOKEN || !KINTONE_APP_ID) {
    console.error('❌ 環境変数が設定されていません');
    process.exit(1);
  }

  const baseUrl = KINTONE_BASE_URL.replace(/\/$/, '');

  const client = new KintoneRestAPIClient({
    baseUrl: baseUrl,
    auth: {
      apiToken: KINTONE_API_TOKEN,
    },
  });

  console.log('🚀 kintoneアプリを本番環境にデプロイします...');
  console.log('BASE_URL:', baseUrl);
  console.log('APP_ID:', KINTONE_APP_ID);

  try {
    // アプリをデプロイ
    await client.app.deployApp({
      apps: [
        {
          app: KINTONE_APP_ID,
        },
      ],
    });

    console.log('✅ デプロイが開始されました');
    console.log('');
    console.log('📢 デプロイ状況を確認中...');

    // デプロイ状況を確認
    let deployed = false;
    let attempts = 0;
    const maxAttempts = 30; // 最大30秒待つ

    while (!deployed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待つ

      const status = await client.app.getDeployStatus({
        apps: [KINTONE_APP_ID],
      });

      const appStatus = status.apps[0];
      console.log(`状態: ${appStatus.status}`);

      if (appStatus.status === 'SUCCESS') {
        deployed = true;
        console.log('');
        console.log('✅ デプロイが完了しました！');
        console.log('');
        console.log('📢 次のステップ:');
        console.log('1. http://localhost:3000/test-api.html でフィールドが表示されることを確認');
        console.log('2. http://localhost:3000/test.html でフォーム送信テスト');
        console.log('3. 成功したら http://localhost:3000 で本番フォームをテスト');
      } else if (appStatus.status === 'FAIL') {
        throw new Error('デプロイに失敗しました');
      }

      attempts++;
    }

    if (!deployed) {
      console.log('⚠️ デプロイに時間がかかっています。kintoneアプリで手動で確認してください。');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.error('詳細:', error);
    process.exit(1);
  }
}

deployKintoneApp();
