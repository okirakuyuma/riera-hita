require('dotenv').config();
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

/**
 * kintoneアプリに「PDFファイル」添付ファイルフィールドを追加するスクリプト
 *
 * 実行方法:
 * node scripts/add-pdf-field.js
 */

async function addPdfFileField() {
  try {
    // 環境変数チェック
    const { KINTONE_BASE_URL, KINTONE_API_TOKEN, KINTONE_APP_ID } = process.env;

    if (!KINTONE_BASE_URL || !KINTONE_API_TOKEN || !KINTONE_APP_ID) {
      throw new Error('環境変数が設定されていません。.envファイルを確認してください。');
    }

    console.log('=== kintoneアプリ設定 ===');
    console.log('BASE_URL:', KINTONE_BASE_URL);
    console.log('APP_ID:', KINTONE_APP_ID);
    console.log('');

    // kintone APIクライアント初期化
    const client = new KintoneRestAPIClient({
      baseUrl: KINTONE_BASE_URL,
      auth: {
        apiToken: KINTONE_API_TOKEN,
      },
    });

    // 現在のフォーム設定を取得
    console.log('現在のフォーム設定を取得中...');
    const formFields = await client.app.getFormFields({
      app: KINTONE_APP_ID,
    });

    console.log('取得完了。現在のフィールド数:', Object.keys(formFields.properties).length);

    // 既に「PDFファイル」フィールドが存在するかチェック
    if (formFields.properties['PDFファイル']) {
      console.log('');
      console.log('⚠️  「PDFファイル」フィールドは既に存在します。');
      console.log('フィールド情報:', formFields.properties['PDFファイル']);
      console.log('');
      console.log('処理を終了します。');
      return;
    }

    // 「PDFファイル」フィールドを追加
    console.log('');
    console.log('「PDFファイル」フィールドを追加中...');

    const updateResult = await client.app.addFormFields({
      app: KINTONE_APP_ID,
      properties: {
        PDFファイル: {
          type: 'FILE',
          code: 'PDFファイル',
          label: '申請書PDF',
          noLabel: false,
          required: false,
          thumbnailSize: '150',
        },
      },
    });

    console.log('✅ フィールド追加成功！');
    console.log('リビジョン:', updateResult.revision);
    console.log('');

    // アプリ設定を本番環境に反映
    console.log('アプリ設定を本番環境に反映中...');
    const deployResult = await client.app.deployApp({
      apps: [
        {
          app: KINTONE_APP_ID,
        },
      ],
    });

    console.log('✅ デプロイ成功！');
    console.log('');
    console.log('=== 完了 ===');
    console.log('「PDFファイル」フィールドが追加されました。');
    console.log('フィールドコード: PDFファイル');
    console.log('フィールド名: 申請書PDF');
    console.log('');
    console.log('次のステップ:');
    console.log('1. kintoneアプリのフォームを確認してください');
    console.log('2. netlify/functions/submit-form.js のフィールドコードを確認してください');

  } catch (error) {
    console.error('');
    console.error('❌ エラーが発生しました:');
    console.error(error.message);
    console.error('');

    if (error.response) {
      console.error('APIレスポンス:', error.response.data);
    }

    process.exit(1);
  }
}

// スクリプト実行
addPdfFileField();
