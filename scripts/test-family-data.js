const { KintoneRestAPIClient } = require('@kintone/rest-api-client');
require('dotenv').config();

/**
 * 家族データを含むテストレコードを送信してみる
 */

async function testFamilyData() {
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

  console.log('🧪 家族データを含むテストレコードを送信します...\n');

  try {
    // テストレコードを作成
    const record = {
      申請者氏: { value: 'テスト' },
      申請者名: { value: '太郎' },
      申請者氏フリガナ: { value: 'テスト' },
      申請者名フリガナ: { value: 'タロウ' },
      郵便番号: { value: '123-4567' },
      都道府県: { value: 'テスト県' },
      市区町村: { value: 'テスト市' },
      番地: { value: '1-2-3' },
      電話番号: { value: '090-1234-5678' },
      移住人数: { value: '3' },
      申請者年齢: { value: '35' },
      利用目的: { value: 'permanent' },

      // 家族データ（サブテーブル）
      家族: {
        value: [
          {
            value: {
              家族氏: { value: 'テスト' },
              家族名: { value: '花子' },
              家族氏フリガナ: { value: 'テスト' },
              家族名フリガナ: { value: 'ハナコ' },
              続柄: { value: '配偶者' },
              年齢: { value: '33' },
              職業: { value: '会社員' },
            },
          },
          {
            value: {
              家族氏: { value: 'テスト' },
              家族名: { value: '一郎' },
              家族氏フリガナ: { value: 'テスト' },
              家族名フリガナ: { value: 'イチロウ' },
              続柄: { value: '子' },
              年齢: { value: '5' },
              職業: { value: '幼稚園児' },
            },
          },
        ],
      },
    };

    console.log('📝 送信するレコード:');
    console.log(JSON.stringify(record, null, 2));
    console.log('\n送信中...\n');

    // レコードを追加
    const result = await client.record.addRecord({
      app: KINTONE_APP_ID,
      record,
    });

    console.log('✅ レコード作成成功！');
    console.log('レコードID:', result.id);
    console.log('リビジョン:', result.revision);
    console.log('');
    console.log('📊 kintoneでレコードを確認してください:');
    console.log(`https://9ir8t6lkrod2.cybozu.com/k/14/show#record=${result.id}`);
    console.log('');
    console.log('✓ 確認ポイント:');
    console.log('  1. レコード詳細画面で「家族」テーブルが表示されているか');
    console.log('  2. 家族テーブルに2行（花子さんと一郎さん）が保存されているか');
    console.log('  3. 各フィールドの値が正しく表示されているか');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    if (error.errors) {
      console.error('詳細エラー:', JSON.stringify(error.errors, null, 2));
    }
    console.error('スタック:', error.stack);
    process.exit(1);
  }
}

testFamilyData();
