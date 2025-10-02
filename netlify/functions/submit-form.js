const { KintoneRestAPIClient } = require('@kintone/rest-api-client');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const FormData = require('form-data');
const axios = require('axios');
const { PassThrough } = require('stream');

/**
 * Netlify Function: フォームデータをkintoneに保存（PDF生成・添付機能付き）
 *
 * 環境変数:
 * - KINTONE_BASE_URL: kintoneのベースURL (例: https://yoursubdomain.cybozu.com)
 * - KINTONE_API_TOKEN: kintoneアプリのAPIトークン
 * - KINTONE_APP_ID: kintoneアプリのID
 *
 * ※ PDF生成は常に実行されます
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

    // PDF生成とkintoneアップロード（常に実行）
    let pdfGenerated = false;
    let pdfFileKey = null;

    try {
      console.log('PDF生成を開始...');

      // PDF生成
      const pdfBuffer = await generatePDF(formData);
      console.log('PDF生成完了:', pdfBuffer.length, 'bytes');

      // kintoneにPDFアップロード
      pdfFileKey = await uploadFileToKintone(pdfBuffer, formData);
      console.log('kintoneにPDFアップロード完了 fileKey:', pdfFileKey);

      // レコードにPDFを添付
      await client.record.updateRecord({
        app: KINTONE_APP_ID,
        id: result.id,
        record: {
          PDFファイル: {
            value: [{ fileKey: pdfFileKey }]
          }
        }
      });
      console.log('レコードにPDF添付完了');

      pdfGenerated = true;
    } catch (pdfError) {
      console.error('PDF処理エラー（レコード作成は成功）:', pdfError);
      // PDFエラーでもレコード作成は成功しているので処理継続
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'フォームの送信が完了しました',
        recordId: result.id,
        pdfGenerated,
        pdfFileKey,
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

/**
 * PDF生成（Puppeteer使用）
 * @param {Object} formData - フォームデータ
 * @returns {Buffer} PDF Buffer
 */
async function generatePDF(formData) {
  let browser = null;

  try {
    // HTMLテンプレート生成
    const html = generateFormHTML(formData);

    // Puppeteerでブラウザ起動
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // PDF生成
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();
    return pdfBuffer;

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

/**
 * フォームデータからHTMLを生成
 * @param {Object} data - フォームデータ
 * @returns {String} HTML文字列
 */
function generateFormHTML(data) {
  // 家族メンバーを抽出
  const familyMembers = [];
  let index = 1;
  while (data[`familyLastName${index}`]) {
    familyMembers.push({
      lastName: data[`familyLastName${index}`] || '',
      firstName: data[`familyFirstName${index}`] || '',
      lastNameKana: data[`familyLastNameKana${index}`] || '',
      firstNameKana: data[`familyFirstNameKana${index}`] || '',
      relationship: data[`familyRelationship${index}`] || '',
      age: data[`familyAge${index}`] || '',
      occupation: data[`familyOccupation${index}`] || '',
    });
    index++;
  }

  const familyHTML = familyMembers.map((member, idx) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${idx + 1}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${member.lastName} ${member.firstName}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${member.lastNameKana} ${member.firstNameKana}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${member.relationship}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${member.age}歳</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${member.occupation}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Yu Gothic', 'Hiragino Kaku Gothic Pro', sans-serif;
      padding: 20px;
      line-height: 1.6;
    }
    h1 {
      color: #2c5282;
      border-bottom: 3px solid #2c5282;
      padding-bottom: 10px;
      text-align: center;
    }
    h2 {
      color: #2c5282;
      border-left: 4px solid #2c5282;
      padding-left: 10px;
      margin-top: 30px;
      margin-bottom: 15px;
      font-size: 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #2c5282;
      color: white;
      font-weight: bold;
    }
    .info-row {
      margin-bottom: 10px;
    }
    .label {
      font-weight: bold;
      color: #555;
      display: inline-block;
      width: 180px;
    }
    .value {
      display: inline-block;
    }
    .date {
      text-align: right;
      color: #666;
      font-size: 12px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>日田市移住定住相談フォーム</h1>
  <div class="date">受付日時: ${new Date().toLocaleString('ja-JP')}</div>

  <h2>申請者情報</h2>
  <div class="info-row"><span class="label">氏名:</span><span class="value">${data.lastName || ''} ${data.firstName || ''}</span></div>
  <div class="info-row"><span class="label">フリガナ:</span><span class="value">${data.lastNameKana || ''} ${data.firstNameKana || ''}</span></div>
  <div class="info-row"><span class="label">郵便番号:</span><span class="value">${data.postalCode || ''}</span></div>
  <div class="info-row"><span class="label">住所:</span><span class="value">${data.prefecture || ''} ${data.city || ''} ${data.address || ''} ${data.building || ''}</span></div>
  <div class="info-row"><span class="label">電話番号:</span><span class="value">${data.phone || ''}</span></div>
  <div class="info-row"><span class="label">メールアドレス:</span><span class="value">${data.email || ''}</span></div>

  <h2>移住情報</h2>
  <div class="info-row"><span class="label">移住人数:</span><span class="value">${data.immigrantCount || ''}名</span></div>
  <div class="info-row"><span class="label">申請者年齢:</span><span class="value">${data.applicantAge || ''}歳</span></div>
  <div class="info-row"><span class="label">申請者職業:</span><span class="value">${data.applicantOccupation || ''}</span></div>
  <div class="info-row"><span class="label">出身地:</span><span class="value">${data.birthPrefecture || ''} ${data.birthCity || ''}</span></div>

  ${familyMembers.length > 0 ? `
  <h2>家族構成</h2>
  <table>
    <thead>
      <tr>
        <th>No.</th>
        <th>氏名</th>
        <th>フリガナ</th>
        <th>続柄</th>
        <th>年齢</th>
        <th>職業</th>
      </tr>
    </thead>
    <tbody>
      ${familyHTML}
    </tbody>
  </table>
  ` : ''}

  <h2>移住に関する情報</h2>
  <div class="info-row"><span class="label">移住希望時期:</span><span class="value">${data.desiredTime || ''}</span></div>
  <div class="info-row"><span class="label">日田市を選んだ理由:</span><span class="value">${data.reason || ''}</span></div>
  <div class="info-row"><span class="label">やりたいこと:</span><span class="value">${data.plans || ''}</span></div>
  <div class="info-row"><span class="label">就業形態:</span><span class="value">${data.employmentType || ''}</span></div>
  <div class="info-row"><span class="label">相談内容:</span><span class="value">${data.consultation || ''}</span></div>
  <div class="info-row"><span class="label">情報提供許可:</span><span class="value">${data.mailPermission || ''}</span></div>

  <h2>空き家バンク情報</h2>
  <div class="info-row"><span class="label">利用目的:</span><span class="value">${data.usagePurpose || ''}</span></div>
  <div class="info-row"><span class="label">希望物件番号:</span><span class="value">${data.propertyNumber || ''}</span></div>
  <div class="info-row"><span class="label">希望地域:</span><span class="value">${Array.isArray(data.area) ? data.area.join(', ') : (data.area || '')}</span></div>
  <div class="info-row"><span class="label">取引種別:</span><span class="value">${data.transactionType || ''}</span></div>
  <div class="info-row"><span class="label">間取り希望:</span><span class="value">${data.layout || ''}</span></div>
  <div class="info-row"><span class="label">駐車場:</span><span class="value">${data.parkingSpaces || ''}台</span></div>
  <div class="info-row"><span class="label">ペット:</span><span class="value">${data.hasPet || ''}</span></div>
  ${data.hasPet === 'yes' ? `
  <div class="info-row"><span class="label">ペット種類:</span><span class="value">${data.petType || ''}</span></div>
  <div class="info-row"><span class="label">ペット数:</span><span class="value">${data.petCount || ''}匹</span></div>
  <div class="info-row"><span class="label">飼育場所:</span><span class="value">${data.petLocation || ''}</span></div>
  ` : ''}
  <div class="info-row"><span class="label">その他希望条件:</span><span class="value">${data.otherConditions || ''}</span></div>

  <h2>アンケート</h2>
  <div class="info-row"><span class="label">重要視する要件:</span><span class="value">${Array.isArray(data.priority) ? data.priority.join(', ') : (data.priority || '')}</span></div>
  <div class="info-row"><span class="label">場所希望:</span><span class="value">${data.location || ''}</span></div>
  <div class="info-row"><span class="label">水道希望:</span><span class="value">${data.water || ''}</span></div>
  <div class="info-row"><span class="label">建屋希望:</span><span class="value">${data.buildingType || ''}</span></div>
  <div class="info-row"><span class="label">階数希望:</span><span class="value">${data.floors || ''}</span></div>
  <div class="info-row"><span class="label">温泉希望:</span><span class="value">${data.onsen || ''}</span></div>
  <div class="info-row"><span class="label">菜園希望:</span><span class="value">${data.garden || ''}</span></div>
  <div class="info-row"><span class="label">その他要件:</span><span class="value">${data.surveyOther || ''}</span></div>
  <div class="info-row"><span class="label">学校規模希望:</span><span class="value">${data.schoolSize || ''}</span></div>
</body>
</html>
  `;
}

/**
 * kintoneにファイルをアップロード
 * @param {Buffer} fileBuffer - ファイルのBuffer
 * @param {Object} formData - フォームデータ（ファイル名生成用）
 * @returns {String} fileKey
 */
async function uploadFileToKintone(fileBuffer, formData) {
  const { KINTONE_BASE_URL, KINTONE_API_TOKEN } = process.env;

  // ファイル名生成
  const fileName = `移住相談_${formData.lastName || ''}${formData.firstName || ''}_${new Date().toISOString().slice(0, 10)}.pdf`;

  // FormDataを使用してmultipart/form-dataリクエストを作成
  const form = new FormData();

  // BufferをPassThroughストリームに変換（form-data 4.x対応）
  const stream = new PassThrough();
  stream.end(fileBuffer);

  // Streamをform-dataに追加
  form.append('file', stream, {
    filename: fileName,
    contentType: 'application/pdf',
    knownLength: fileBuffer.length,
  });

  // kintone File Upload API
  const uploadUrl = `${KINTONE_BASE_URL}/k/v1/file.json`;

  const response = await axios.post(uploadUrl, form, {
    headers: {
      'X-Cybozu-API-Token': KINTONE_API_TOKEN,
      ...form.getHeaders(),
    },
  });

  return response.data.fileKey;
}
