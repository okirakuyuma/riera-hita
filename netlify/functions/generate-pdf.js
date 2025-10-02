const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const nodemailer = require('nodemailer');

/**
 * Netlify Function: フォーム内容をPDFに変換してメール送信
 *
 * 環境変数:
 * - EMAIL_HOST: SMTPホスト（例: smtp.gmail.com）
 * - EMAIL_PORT: SMTPポート（例: 587）
 * - EMAIL_USER: SMTPユーザー名
 * - EMAIL_PASS: SMTPパスワード
 * - EMAIL_TO: 送信先メールアドレス
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

  let browser = null;

  try {
    const formData = JSON.parse(event.body);
    console.log('PDF生成開始:', new Date().toISOString());

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
    browser = null;

    console.log('PDF生成完了:', pdfBuffer.length, 'bytes');

    // メール送信（環境変数が設定されている場合）
    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_TO } = process.env;

    if (EMAIL_HOST && EMAIL_USER && EMAIL_PASS && EMAIL_TO) {
      await sendEmail(pdfBuffer, formData, {
        host: EMAIL_HOST,
        port: EMAIL_PORT || 587,
        user: EMAIL_USER,
        pass: EMAIL_PASS,
        to: EMAIL_TO,
      });
      console.log('メール送信完了');
    }

    // PDFをBase64で返す（ダウンロード用）
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'PDFが生成されました',
        pdf: pdfBuffer.toString('base64'),
        size: pdfBuffer.length,
      }),
    };

  } catch (error) {
    console.error('エラー:', error);

    if (browser) {
      await browser.close();
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'PDF生成に失敗しました',
        error: error.message,
      }),
    };
  }
};

/**
 * フォームデータからHTMLを生成
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
  <div class="info-row"><span class="label">希望地域:</span><span class="value">${data.area || ''}</span></div>
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
  <div class="info-row"><span class="label">重要視する要件:</span><span class="value">${data.priority || ''}</span></div>
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
 * メール送信
 */
async function sendEmail(pdfBuffer, formData, config) {
  const transporter = nodemailer.createTransporter({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const mailOptions = {
    from: config.user,
    to: config.to,
    subject: `【日田市移住定住相談】新規申請 - ${formData.lastName || ''}${formData.firstName || ''}様`,
    text: `
日田市移住定住相談フォームから新しい申請がありました。

申請者: ${formData.lastName || ''} ${formData.firstName || ''}
電話番号: ${formData.phone || ''}
メールアドレス: ${formData.email || ''}
移住人数: ${formData.immigrantCount || ''}名

詳細は添付のPDFをご確認ください。
    `,
    attachments: [
      {
        filename: `移住相談_${formData.lastName || ''}${formData.firstName || ''}_${new Date().toISOString().slice(0, 10)}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}
