# PDF生成・kintoneアップロード機能のセットアップガイド

## 📄 機能概要

フォーム送信時に以下の処理を自動実行します：

1. **フォームデータ送信**: kintoneアプリにレコード作成
2. **PDF生成**: フォーム内容を整形したPDFファイルを自動生成（オプション）
3. **kintoneアップロード**: 生成したPDFをkintoneレコードに自動添付（オプション）

## 🎯 処理フロー

```
フォーム送信
  ↓
kintoneレコード作成
  ↓
[ENABLE_PDF=true の場合]
  ↓
PDF生成（Puppeteer）
  ↓
kintone File Upload API
  ↓
fileKey取得
  ↓
レコード更新（PDF添付）
```

## 🛠️ セットアップ手順

### 1. kintoneアプリの設定

#### 1.1 添付ファイルフィールドの追加

**方法1: スクリプトで自動追加（推奨）**

```bash
# .envファイルを設定後、以下を実行
node scripts/add-pdf-field.js
```

このスクリプトは以下を自動実行します：
- フィールドコード: `PDFファイル`
- フィールド名: `申請書PDF`
- フィールドタイプ: 添付ファイル
- 本番環境への自動デプロイ

**方法2: 手動で追加**

1. kintoneアプリの設定画面を開く
2. **フィールド追加** → **添付ファイル** を選択
3. フィールドコード: `PDFファイル`
4. フィールド名: `申請書PDF` （任意）
5. 保存してアプリを更新

#### 1.2 APIトークンの権限確認

kintoneアプリのAPIトークンに以下の権限が必要です：

- ✅ レコード追加
- ✅ レコード編集
- ✅ **ファイル書き出し** （重要：PDF添付に必須）

### 2. 環境変数の設定

#### 2.1 .envファイルの作成

`.env.example` をコピーして `.env` を作成：

```bash
cp .env.example .env
```

#### 2.2 kintone設定

`.env` ファイルで以下を設定（PDF生成は常に有効です）：

```bash
# kintone設定
KINTONE_BASE_URL=https://yoursubdomain.cybozu.com
KINTONE_API_TOKEN=your-api-token
KINTONE_APP_ID=your-app-id
```

### 3. Netlifyへのデプロイ

#### 3.1 環境変数の設定

Netlifyダッシュボードで環境変数を設定：

```bash
# CLI経由
netlify env:set KINTONE_BASE_URL "https://yoursubdomain.cybozu.com"
netlify env:set KINTONE_API_TOKEN "your-api-token"
netlify env:set KINTONE_APP_ID "your-app-id"
```

または、Netlify Web UI:
1. Site settings → Environment variables
2. 上記の環境変数を追加

#### 3.2 デプロイ実行

```bash
# 本番デプロイ
npm run deploy

# または Git push でも自動デプロイされます
git add .
git commit -m "PDF生成機能を追加"
git push origin main
```

## 📋 PDFの内容

生成されるPDFには以下の情報が含まれます：

### 含まれる情報
- ✅ 受付日時
- ✅ 申請者情報（氏名、住所、連絡先）
- ✅ 移住情報（人数、年齢、職業、出身地）
- ✅ 家族構成（テーブル形式）
- ✅ 移住に関する情報（希望時期、理由、やりたいこと）
- ✅ 空き家バンク情報（利用目的、希望条件）
- ✅ アンケート回答

### PDFファイル名形式
```
移住相談_[申請者氏名]_[YYYY-MM-DD].pdf

例: 移住相談_山田太郎_2025-10-02.pdf
```

## 🧪 テスト方法

### ローカル環境での確認

```bash
# 開発サーバー起動
npm run dev

# ブラウザで開く
http://localhost:8888
```

**⚠️ 注意**: ローカル環境ではChromiumが利用できないため、**PDF生成はエラーになります**。
**Netlify本番環境でのみ動作します。**

### Netlify環境でのテスト

1. デプロイ後、本番URLにアクセス
2. フォームに入力して送信
3. kintoneアプリでレコードを確認
4. 添付ファイルフィールドにPDFが保存されているか確認

## ⚙️ カスタマイズ

### PDFデザインの変更

`netlify/functions/submit-form.js` の `generateFormHTML` 関数を編集：

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

### ファイル名の変更

`netlify/functions/submit-form.js` の `uploadFileToKintone` 関数内：

```javascript
// ファイル名生成をカスタマイズ
const fileName = `移住相談_${formData.lastName || ''}${formData.firstName || ''}_${new Date().toISOString().slice(0, 10)}.pdf`;
```

## 🔐 セキュリティ

- **環境変数**: `.env`ファイルは絶対にGitにコミットしない（`.gitignore`に含まれています）
- **APIトークン**: Netlify環境変数で安全に管理
- **PDF内容**: 個人情報が含まれるため、kintoneのアクセス権限を適切に設定
- **S3禁止**: S3操作はhandler内のみ。handler外でのS3操作は禁止

## 📊 トラブルシューティング

### PDF生成エラー

**症状**: `PDF生成失敗`エラー
**原因**: ローカル環境ではChromiumが利用できない
**解決**: Netlifyにデプロイして本番環境でテスト

### PDFが添付されない

**症状**: レコードは作成されるがPDFが添付されない
**原因1**: kintoneアプリに「PDFファイル」フィールドがない
**解決**: `node scripts/add-pdf-field.js` を実行、または手動でフィールド追加

**原因2**: APIトークンに「ファイル書き出し」権限がない
**解決**: kintoneアプリ設定でAPIトークンの権限を確認

### ファイルアップロードエラー

**症状**: `File upload failed` エラー
**原因**: kintone API認証エラー
**解決**: `KINTONE_BASE_URL` と `KINTONE_API_TOKEN` を確認

## 💡 注意事項

- PDF生成機能は常に有効です（無効化できません）
- ローカル環境ではPDF生成が失敗しますが、Netlify本番環境では正常に動作します
- kintoneアプリには必ず「PDFファイル」フィールド（フィールドコード: `PDFファイル`）を追加してください
- フィールド追加は `node scripts/add-pdf-field.js` で自動実行できます

## 📞 サポート

問題が解決しない場合は、以下を確認してください：

1. Netlify Function のログ: Site → Functions → submit-form → Logs
2. ブラウザのコンソール（開発者ツール）
3. kintoneアプリのフィールド設定とAPIトークン権限

## 🔄 バージョン履歴

- **v1.0** (2025-10-02): PDF生成・kintoneアップロード機能を実装
  - Puppeteer を使用したPDF生成
  - kintone File Upload API を使用したアップロード
  - レコード更新による添付ファイル統合
