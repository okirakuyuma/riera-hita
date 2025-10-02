const { KintoneRestAPIClient } = require('@kintone/rest-api-client');
require('dotenv').config();

/**
 * kintoneアプリのフィールド構造を確認するスクリプト
 * 特に「家族」テーブルが正しく設定されているかチェック
 */

async function checkFields() {
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

  console.log('📋 kintoneアプリのフィールド構造を確認中...\n');

  try {
    // フィールド情報を取得
    const appInfo = await client.app.getFormFields({
      app: KINTONE_APP_ID,
    });

    // 家族フィールドを確認
    const familyField = appInfo.properties['家族'];

    if (!familyField) {
      console.error('❌ 「家族」フィールドが見つかりません！');
      console.log('\n利用可能なフィールド:');
      Object.keys(appInfo.properties).forEach(key => {
        console.log(`  - ${key}`);
      });
      process.exit(1);
    }

    console.log('✅ 「家族」フィールドが存在します\n');
    console.log('📊 フィールドタイプ:', familyField.type);

    if (familyField.type !== 'SUBTABLE') {
      console.error('❌ 「家族」フィールドがサブテーブルではありません！');
      console.error('   現在のタイプ:', familyField.type);
      console.error('   期待されるタイプ: SUBTABLE');
      process.exit(1);
    }

    console.log('✅ 「家族」フィールドはサブテーブルです\n');
    console.log('📝 サブテーブル内のフィールド:');

    if (familyField.fields) {
      const expectedFields = [
        '家族氏',
        '家族名',
        '家族氏フリガナ',
        '家族名フリガナ',
        '続柄',
        '年齢',
        '職業'
      ];

      expectedFields.forEach(fieldName => {
        if (familyField.fields[fieldName]) {
          console.log(`  ✅ ${fieldName}: ${familyField.fields[fieldName].type}`);
        } else {
          console.log(`  ❌ ${fieldName}: 見つかりません`);
        }
      });

      // 想定外のフィールドをチェック
      Object.keys(familyField.fields).forEach(fieldName => {
        if (!expectedFields.includes(fieldName)) {
          console.log(`  ⚠️  ${fieldName}: 想定外のフィールド`);
        }
      });
    } else {
      console.error('❌ サブテーブル内のフィールド情報が取得できません');
    }

    console.log('\n📊 その他の主要フィールド:');
    const mainFields = [
      '申請者氏',
      '申請者名',
      '電話番号',
      'メールアドレス',
      '移住人数',
      '利用目的'
    ];

    mainFields.forEach(fieldName => {
      if (appInfo.properties[fieldName]) {
        console.log(`  ✅ ${fieldName}: ${appInfo.properties[fieldName].type}`);
      } else {
        console.log(`  ❌ ${fieldName}: 見つかりません`);
      }
    });

    console.log('\n✅ フィールド構造の確認が完了しました');
    console.log('\n📢 次のステップ:');
    console.log('1. http://localhost:3000/test-full.html でテスト送信');
    console.log('2. kintoneで家族テーブルにデータが保存されることを確認');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.error('詳細:', error);
    process.exit(1);
  }
}

checkFields();
