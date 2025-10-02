# PDF生成・メール送信の設定ガイド

## 📄 機能概要

フォーム送信時に以下の処理を自動実行できます：

1. **PDF生成**: フォーム内容を整形したPDFファイルを自動生成
2. **メール送信**: 生成したPDFを指定のメールアドレスに送信
3. **ダウンロード**: ユーザーがPDFをダウンロード可能

## 🛠️ セットアップ

### 方法1: PDFダウンロードのみ（推奨・簡単）

フォーム送信後、ユーザーがPDFをダウンロードできるようにします。

**メリット:**
- サーバー設定不要
- メール設定不要
- すぐに使える

**手順:**
1. 環境変数は不要
2. Netlifyにデプロイするだけ
3. フロントエンドで`/.netlify/functions/generate-pdf`を呼び出す

### 方法2: 自動メール送信（管理者向け）

フォーム送信時に、管理者のメールアドレスに自動でPDF添付メールを送信します。

**必要なもの:**
- SMTPサーバー（Gmail、SendGrid、AWSなど）

#### Gmail を使用する場合

1. **アプリパスワードの生成**
   - https://myaccount.google.com/apppasswords にアクセス
   - 「メール」→「その他」を選択
   - 名前を入力（例: Netlify移住フォーム）
   - 16桁のパスワードをコピー

2. **環境変数を設定**

`.env`ファイルに追加：

```bash
ENABLE_PDF=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=生成した16桁のアプリパスワード
EMAIL_TO=担当者のメールアドレス@example.com
```

3. **Netlifyに環境変数を設定**

```bash
netlify env:set ENABLE_PDF "true"
netlify env:set EMAIL_HOST "smtp.gmail.com"
netlify env:set EMAIL_PORT "587"
netlify env:set EMAIL_USER "your-email@gmail.com"
netlify env:set EMAIL_PASS "your-app-password"
netlify env:set EMAIL_TO "recipient@example.com"
```

または、Netlifyダッシュボード:
- Site settings → Environment variables
- 上記の環境変数を追加

#### SendGrid を使用する場合（商用推奨）

SendGridは月12,000通まで無料、到達率が高く、ビジネス利用に最適です。

1. **SendGridアカウント作成**
   - https://sendgrid.com/ja/ で無料登録

2. **APIキー取得**
   - Settings → API Keys → Create API Key
   - Full Access を選択
   - APIキーをコピー

3. **環境変数を設定**

```bash
ENABLE_PDF=true
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=取得したAPIキー
EMAIL_TO=担当者のメールアドレス
```

## 📋 PDFの内容

生成されるPDFには以下の情報が含まれます：

- ✅ 受付日時
- ✅ 申請者情報（氏名、住所、連絡先）
- ✅ 移住情報（人数、年齢、職業、出身地）
- ✅ 家族構成（テーブル形式）
- ✅ 移住に関する情報（希望時期、理由、やりたいこと）
- ✅ 空き家バンク情報（利用目的、希望条件）
- ✅ アンケート回答

## 🧪 テスト方法

### ローカル環境

```bash
# 開発サーバー起動
npm run dev

# ブラウザで開く
http://localhost:3000/test-pdf.html
```

**注意**: ローカル環境ではChromiumが利用できないため、**PDF生成はエラーになります**。
**Netlify本番環境でのみ動作します。**

### Netlify環境

1. デプロイ後、本番URLにアクセス
2. フォームを送信
3. PDFがダウンロードされる（ENABLE_PDF=trueの場合、メールも送信される）

## 🎨 PDFデザインのカスタマイズ

`netlify/functions/generate-pdf.js`の`generateFormHTML`関数を編集：

```javascript
// スタイルを変更
<style>
  body {
    font-family: 'Yu Gothic', sans-serif;
    // カスタマイズ...
  }
</style>

// レイアウトを変更
<div class="info-row">...</div>
```

## 🔐 セキュリティ

- **環境変数**: `.env`ファイルは絶対にGitにコミットしない（`.gitignore`に含まれています）
- **APIキー**: Netlify環境変数で安全に管理
- **メール**: SPF/DKIM/DMARCを設定して到達率を向上
- **PDF内容**: 個人情報が含まれるため、メール送信先は慎重に設定

## 💡 その他のオプション

### 方法3: kintoneの通知機能を使う

kintone側でレコード追加時にメール通知を設定することもできます：

1. kintoneアプリ設定 → 通知
2. 「レコード追加時」のトリガーを設定
3. 送信先メールアドレスを設定

**メリット:**
- PDF生成不要
- サーバーレス
- kintone標準機能

**デメリット:**
- PDFは生成されない
- メール本文のカスタマイズに制限

### 方法4: kintone プラグインで PDF生成

kintone プラグイン（有料）を使用してPDF生成する方法もあります。

## 📊 トラブルシューティング

### PDF生成エラー

**症状**: `PDF生成失敗`エラー
**原因**: ローカル環境ではChromiumが利用できない
**解決**: Netlifyにデプロイして本番環境でテスト

### メールが届かない

**症状**: PDF生成は成功するがメールが届かない
**原因1**: 環境変数が設定されていない
**解決**: Netlify環境変数を確認

**原因2**: Gmailのセキュリティブロック
**解決**: アプリパスワードを使用

**原因3**: スパムフォルダに振り分けられている
**解決**: 迷惑メールフォルダを確認

### PDF内容が文字化け

**症状**: 日本語が表示されない
**原因**: フォント設定の問題
**解決**: `generateFormHTML`関数のfont-familyを確認

## 📞 サポート

問題が解決しない場合は、`docs/DEPLOYMENT.md`のトラブルシューティングセクションも参照してください。
