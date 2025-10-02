const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

/**
 * Netlify Function: フォームデータをkintoneに保存
 *
 * 環境変数:
 * - KINTONE_BASE_URL: kintoneのベースURL (例: https://yoursubdomain.cybozu.com)
 * - KINTONE_API_TOKEN: kintoneアプリのAPIトークン
 * - KINTONE_APP_ID: kintoneアプリのID
 */

exports.handler = async (event, context) => {
  // CORSヘッダー設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // プリフライトリクエスト対応
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // POSTメソッドのみ許可
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // 環境変数チェック
    const { KINTONE_BASE_URL, KINTONE_API_TOKEN, KINTONE_APP_ID } = process.env;

    console.log('=== デバッグ情報 ===');
    console.log('KINTONE_BASE_URL:', KINTONE_BASE_URL);
    console.log('KINTONE_APP_ID:', KINTONE_APP_ID);
    console.log('API Token exists:', !!KINTONE_API_TOKEN);

    if (!KINTONE_BASE_URL || !KINTONE_API_TOKEN || !KINTONE_APP_ID) {
      throw new Error('環境変数が設定されていません');
    }

    // リクエストボディをパース
    const formData = JSON.parse(event.body);
    console.log('受信したフォームデータ:', JSON.stringify(formData, null, 2));

    // kintone APIクライアント初期化
    const client = new KintoneRestAPIClient({
      baseUrl: KINTONE_BASE_URL,
      auth: {
        apiToken: KINTONE_API_TOKEN,
      },
    });

    // 家族メンバーデータを配列に変換
    const familyMembers = extractFamilyMembers(formData);

    // kintone用のレコードデータ構築
    const record = {
      // Q1: 申請者情報
      申請者氏: { value: formData.lastName || '' },
      申請者名: { value: formData.firstName || '' },
      申請者氏フリガナ: { value: formData.lastNameKana || '' },
      申請者名フリガナ: { value: formData.firstNameKana || '' },
      郵便番号: { value: formData.postalCode || '' },
      都道府県: { value: formData.prefecture || '' },
      市区町村: { value: formData.city || '' },
      番地: { value: formData.address || '' },
      建物名: { value: formData.building || '' },
      電話番号: { value: formData.phone || '' },
      メールアドレス: { value: formData.email || '' },

      // Q2-Q3: 移住人数と申請者情報
      移住人数: { value: formData.immigrantCount || '' },
      申請者年齢: { value: formData.applicantAge || '' },
      申請者職業: { value: formData.applicantOccupation || '' },

      // Q5-Q10: その他情報
      出身都道府県: { value: formData.birthPrefecture || '' },
      出身市区町村: { value: formData.birthCity || '' },
      移住希望時期: { value: formData.desiredTime || '' },
      日田市を選んだ理由: { value: formData.reason || '' },
      やりたいこと: { value: formData.plans || '' },
      就業形態: { value: formData.employmentType || '' },
      相談内容: { value: formData.consultation || '' },

      // Q11: 情報提供許可
      情報提供許可: { value: formData.mailPermission || '' },

      // Q13-Q20: 空き家バンク情報
      利用目的: { value: formData.usagePurpose || '' },
      希望物件番号: { value: formData.propertyNumber || '' },
      希望地域: { value: Array.isArray(formData.area) ? formData.area.join(', ') : (formData.area || '') },
      取引種別: { value: formData.transactionType || '' },
      間取り希望: { value: formData.layout || '' },
      駐車場台数: { value: formData.parkingSpaces || '' },
      ペット有無: { value: formData.hasPet || '' },
      ペット種類: { value: formData.petType || '' },
      ペット数: { value: formData.petCount || '' },
      ペット飼育場所: { value: formData.petLocation || '' },
      その他希望条件: { value: formData.otherConditions || '' },

      // Q21-Q29: アンケート
      重要要件: { value: Array.isArray(formData.priority) ? formData.priority.join(', ') : (formData.priority || '') },
      場所希望: { value: formData.location || '' },
      水道希望: { value: formData.water || '' },
      建屋希望: { value: formData.buildingType || '' },
      階数希望: { value: formData.floors || '' },
      温泉希望: { value: formData.onsen || '' },
      菜園希望: { value: formData.garden || '' },
      その他要件: { value: formData.surveyOther || '' },
      学校規模希望: { value: formData.schoolSize || '' },

      // 家族情報（サブテーブル形式）
      家族: { value: familyMembers },
    };

    console.log('kintoneに送信するレコード:', JSON.stringify(record, null, 2));

    // kintoneにレコード追加
    const result = await client.record.addRecord({
      app: KINTONE_APP_ID,
      record,
    });

    console.log('kintoneレコード作成成功:', result.id);

    // PDF生成とメール送信（オプション）
    let pdfGenerated = false;
    try {
      if (process.env.ENABLE_PDF === 'true') {
        console.log('PDF生成を開始...');
        // 別のFunctionを呼び出すのではなく、ここで直接PDF生成することも可能
        // 今回はシンプルにレコードIDを返すのみ
        pdfGenerated = true;
      }
    } catch (pdfError) {
      console.error('PDF生成エラー（処理は継続）:', pdfError);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'フォームの送信が完了しました',
        recordId: result.id,
        pdfGenerated,
      }),
    };

  } catch (error) {
    console.error('エラー:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'フォームの送信に失敗しました',
        error: error.message,
      }),
    };
  }
};

/**
 * 家族メンバーデータを抽出
 * @param {Object} formData - フォームデータ
 * @returns {Array} 家族メンバーの配列
 */
function extractFamilyMembers(formData) {
  const members = [];
  let index = 1;

  // 動的に追加された家族メンバーを抽出
  while (formData[`familyLastName${index}`]) {
    members.push({
      value: {
        家族氏: { value: formData[`familyLastName${index}`] || '' },
        家族名: { value: formData[`familyFirstName${index}`] || '' },
        家族氏フリガナ: { value: formData[`familyLastNameKana${index}`] || '' },
        家族名フリガナ: { value: formData[`familyFirstNameKana${index}`] || '' },
        続柄: { value: formData[`familyRelationship${index}`] || '' },
        年齢: { value: formData[`familyAge${index}`] || '' },
        職業: { value: formData[`familyOccupation${index}`] || '' },
      },
    });
    index++;
  }

  return members;
}
