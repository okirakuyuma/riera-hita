const { KintoneRestAPIClient } = require('@kintone/rest-api-client');
require('dotenv').config();

/**
 * kintoneアプリにフォームフィールドを自動追加するスクリプト
 */

async function setupKintoneFields() {
  const { KINTONE_BASE_URL, KINTONE_API_TOKEN, KINTONE_APP_ID } = process.env;

  if (!KINTONE_BASE_URL || !KINTONE_API_TOKEN || !KINTONE_APP_ID) {
    console.error('❌ 環境変数が設定されていません');
    console.error('KINTONE_BASE_URL:', KINTONE_BASE_URL);
    console.error('KINTONE_APP_ID:', KINTONE_APP_ID);
    console.error('API Token exists:', !!KINTONE_API_TOKEN);
    process.exit(1);
  }

  const baseUrl = KINTONE_BASE_URL.replace(/\/$/, '');

  const client = new KintoneRestAPIClient({
    baseUrl: baseUrl,
    auth: {
      apiToken: KINTONE_API_TOKEN,
    },
  });

  console.log('📋 kintoneアプリにフィールドを追加します...');
  console.log('BASE_URL:', baseUrl);
  console.log('APP_ID:', KINTONE_APP_ID);

  try {
    // フィールド定義
    const properties = {
      // Q1: 申請者情報（index.htmlのrequired属性に合わせる）
      '申請者氏': {
        type: 'SINGLE_LINE_TEXT',
        code: '申請者氏',
        label: '申請者氏',
        required: false, // フロントエンドでバリデーション
      },
      '申請者名': {
        type: 'SINGLE_LINE_TEXT',
        code: '申請者名',
        label: '申請者名',
        required: false,
      },
      '申請者氏フリガナ': {
        type: 'SINGLE_LINE_TEXT',
        code: '申請者氏フリガナ',
        label: '申請者氏フリガナ',
        required: false,
      },
      '申請者名フリガナ': {
        type: 'SINGLE_LINE_TEXT',
        code: '申請者名フリガナ',
        label: '申請者名フリガナ',
        required: false,
      },
      '郵便番号': {
        type: 'SINGLE_LINE_TEXT',
        code: '郵便番号',
        label: '郵便番号',
        required: false,
      },
      '都道府県': {
        type: 'SINGLE_LINE_TEXT',
        code: '都道府県',
        label: '都道府県',
        required: false,
      },
      '市区町村': {
        type: 'SINGLE_LINE_TEXT',
        code: '市区町村',
        label: '市区町村',
        required: false,
      },
      '番地': {
        type: 'SINGLE_LINE_TEXT',
        code: '番地',
        label: '番地',
        required: false,
      },
      '建物名': {
        type: 'SINGLE_LINE_TEXT',
        code: '建物名',
        label: '建物名',
        required: false,
      },
      '電話番号': {
        type: 'SINGLE_LINE_TEXT',
        code: '電話番号',
        label: '電話番号',
        required: false,
      },
      'メールアドレス': {
        type: 'SINGLE_LINE_TEXT',
        code: 'メールアドレス',
        label: 'メールアドレス',
        required: false,
      },

      // Q2-Q3: 移住情報
      '移住人数': {
        type: 'SINGLE_LINE_TEXT',
        code: '移住人数',
        label: '移住人数',
        required: false,
      },
      '申請者年齢': {
        type: 'SINGLE_LINE_TEXT',
        code: '申請者年齢',
        label: '申請者年齢',
        required: false,
      },
      '申請者職業': {
        type: 'SINGLE_LINE_TEXT',
        code: '申請者職業',
        label: '申請者職業',
        required: false,
      },

      // Q5-Q10: その他移住情報
      '出身都道府県': {
        type: 'SINGLE_LINE_TEXT',
        code: '出身都道府県',
        label: '出身都道府県',
        required: false,
      },
      '出身市区町村': {
        type: 'SINGLE_LINE_TEXT',
        code: '出身市区町村',
        label: '出身市区町村',
        required: false,
      },
      '移住希望時期': {
        type: 'MULTI_LINE_TEXT',
        code: '移住希望時期',
        label: '移住希望時期',
        required: false,
      },
      '日田市を選んだ理由': {
        type: 'MULTI_LINE_TEXT',
        code: '日田市を選んだ理由',
        label: '日田市を選んだ理由',
        required: false,
      },
      'やりたいこと': {
        type: 'MULTI_LINE_TEXT',
        code: 'やりたいこと',
        label: 'やりたいこと',
        required: false,
      },
      '就業形態': {
        type: 'MULTI_LINE_TEXT',
        code: '就業形態',
        label: '就業形態',
        required: false,
      },
      '相談内容': {
        type: 'MULTI_LINE_TEXT',
        code: '相談内容',
        label: '相談内容',
        required: false,
      },
      '情報提供許可': {
        type: 'SINGLE_LINE_TEXT',
        code: '情報提供許可',
        label: '情報提供許可',
        required: false,
      },

      // Q13-Q20: 空き家バンク情報
      '利用目的': {
        type: 'SINGLE_LINE_TEXT',
        code: '利用目的',
        label: '利用目的',
        required: false,
      },
      '希望物件番号': {
        type: 'SINGLE_LINE_TEXT',
        code: '希望物件番号',
        label: '希望物件番号',
        required: false,
      },
      '希望地域': {
        type: 'MULTI_LINE_TEXT',
        code: '希望地域',
        label: '希望地域',
        required: false,
      },
      '取引種別': {
        type: 'SINGLE_LINE_TEXT',
        code: '取引種別',
        label: '取引種別',
        required: false,
      },
      '間取り希望': {
        type: 'MULTI_LINE_TEXT',
        code: '間取り希望',
        label: '間取り希望',
        required: false,
      },
      '駐車場台数': {
        type: 'SINGLE_LINE_TEXT',
        code: '駐車場台数',
        label: '駐車場台数',
        required: false,
      },
      'ペット有無': {
        type: 'SINGLE_LINE_TEXT',
        code: 'ペット有無',
        label: 'ペット有無',
        required: false,
      },
      'ペット種類': {
        type: 'SINGLE_LINE_TEXT',
        code: 'ペット種類',
        label: 'ペット種類',
        required: false,
      },
      'ペット数': {
        type: 'SINGLE_LINE_TEXT',
        code: 'ペット数',
        label: 'ペット数',
        required: false,
      },
      'ペット飼育場所': {
        type: 'SINGLE_LINE_TEXT',
        code: 'ペット飼育場所',
        label: 'ペット飼育場所',
        required: false,
      },
      'その他希望条件': {
        type: 'MULTI_LINE_TEXT',
        code: 'その他希望条件',
        label: 'その他希望条件',
        required: false,
      },

      // Q21-Q29: アンケート
      '重要要件': {
        type: 'MULTI_LINE_TEXT',
        code: '重要要件',
        label: '重要要件',
        required: false,
      },
      '場所希望': {
        type: 'SINGLE_LINE_TEXT',
        code: '場所希望',
        label: '場所希望',
        required: false,
      },
      '水道希望': {
        type: 'SINGLE_LINE_TEXT',
        code: '水道希望',
        label: '水道希望',
        required: false,
      },
      '建屋希望': {
        type: 'SINGLE_LINE_TEXT',
        code: '建屋希望',
        label: '建屋希望',
        required: false,
      },
      '階数希望': {
        type: 'SINGLE_LINE_TEXT',
        code: '階数希望',
        label: '階数希望',
        required: false,
      },
      '温泉希望': {
        type: 'SINGLE_LINE_TEXT',
        code: '温泉希望',
        label: '温泉希望',
        required: false,
      },
      '菜園希望': {
        type: 'SINGLE_LINE_TEXT',
        code: '菜園希望',
        label: '菜園希望',
        required: false,
      },
      'その他要件': {
        type: 'MULTI_LINE_TEXT',
        code: 'その他要件',
        label: 'その他要件',
        required: false,
      },
      '学校規模希望': {
        type: 'SINGLE_LINE_TEXT',
        code: '学校規模希望',
        label: '学校規模希望',
        required: false,
      },

      // 家族情報（テーブル）
      '家族': {
        type: 'SUBTABLE',
        code: '家族',
        label: '家族',
        fields: {
          '家族氏': {
            type: 'SINGLE_LINE_TEXT',
            code: '家族氏',
            label: '家族氏',
          },
          '家族名': {
            type: 'SINGLE_LINE_TEXT',
            code: '家族名',
            label: '家族名',
          },
          '家族氏フリガナ': {
            type: 'SINGLE_LINE_TEXT',
            code: '家族氏フリガナ',
            label: '家族氏フリガナ',
          },
          '家族名フリガナ': {
            type: 'SINGLE_LINE_TEXT',
            code: '家族名フリガナ',
            label: '家族名フリガナ',
          },
          '続柄': {
            type: 'SINGLE_LINE_TEXT',
            code: '続柄',
            label: '続柄',
          },
          '年齢': {
            type: 'SINGLE_LINE_TEXT',
            code: '年齢',
            label: '年齢',
          },
          '職業': {
            type: 'SINGLE_LINE_TEXT',
            code: '職業',
            label: '職業',
          },
        },
      },
    };

    console.log('📝 フィールドを追加中...');

    // フィールドを追加（プレビュー環境）
    // 注意: addFormFields ではなく、updateFormFields で properties を指定して追加
    const result = await client.app.addFormFields({
      app: KINTONE_APP_ID,
      properties,
    });

    console.log('✅ フィールドの追加が完了しました（プレビュー環境）');
    console.log('リビジョン:', result.revision);
    console.log('');
    console.log('📢 次のステップ:');
    console.log('1. kintoneアプリを開く');
    console.log('2. 右上の「アプリを更新」ボタンをクリック');
    console.log('3. 本番環境に反映されます');
    console.log('');
    console.log('または、以下のコマンドでプログラムからデプロイできます:');
    console.log('node scripts/deploy-kintone-app.js');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.error('詳細:', error);
    process.exit(1);
  }
}

setupKintoneFields();
