# 日田市移住定住相談フォーム

日田市への移住を検討されている方向けの相談フォームアプリケーション。フォームデータはNetlify Functionsを経由してkintoneに保存されます。

## 📋 機能

- 移住相談フォーム（申請者情報、移住人数、家族構成など）
- 空き家バンク利用者登録申請
- 利用者事前アンケート
- Netlify Functionsを使用したサーバーレスアーキテクチャ
- kintoneへのデータ自動保存

## 🚀 クイックスタート

### 必要なもの

- Node.js v18以上
- Netlifyアカウント
- kintoneアカウント

### セットアップ

1. リポジトリのクローン:
```bash
git clone <repository-url>
cd riera-hita
```

2. 依存関係のインストール:
```bash
npm install
```

3. 環境変数の設定:
```bash
cp .env.example .env
# .envファイルを編集してkintoneの認証情報を設定
```

4. ローカルサーバーの起動:
```bash
npm run dev
```

5. ブラウザで http://localhost:8888 を開く

## 📁 プロジェクト構造

```
riera-hita/
├── index.html              # メインのフォームページ
├── netlify/
│   └── functions/
│       └── submit-form.js  # kintone連携ハンドラー
├── docs/
│   └── DEPLOYMENT.md       # デプロイ手順書
├── package.json            # Node.js依存関係
├── netlify.toml           # Netlify設定
├── .env.example           # 環境変数のサンプル
└── README.md              # このファイル
```

## 🔧 開発コマンド

```bash
# ローカル開発サーバー起動
npm run dev

# Netlifyにデプロイ
npm run deploy
```

## 📝 デプロイ方法

詳細なデプロイ手順は [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) を参照してください。

### 簡易デプロイ手順

1. kintoneアプリを作成してフィールドを設定
2. APIトークンを発行
3. Netlifyで環境変数を設定:
   - `KINTONE_BASE_URL`
   - `KINTONE_API_TOKEN`
   - `KINTONE_APP_ID`
4. `npm run deploy` でデプロイ

## 🔒 セキュリティ

- APIトークンは環境変数で管理（絶対にコミットしない）
- `.env`ファイルは`.gitignore`に含まれています
- Netlify Functionsでサーバー側処理を実行
- **重要**: S3などの外部ストレージ操作は必ずハンドラー内で実行してください

## 🏗️ アーキテクチャ

```
ユーザー → フォーム(index.html)
         → Netlify Function(submit-form.js)
         → kintone API
         → kintoneアプリ
```

- **フロントエンド**: 静的HTML/CSS/JavaScript
- **バックエンド**: Netlify Functions (Node.js)
- **データストレージ**: kintone
- **ホスティング**: Netlify

## 📚 kintoneアプリ設定

必要なフィールド一覧は [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) を参照してください。

主なフィールド:
- 申請者情報（氏名、住所、連絡先など）
- 移住情報（人数、時期、理由など）
- 空き家バンク情報（利用目的、希望条件など）
- 家族情報（サブテーブル）

## 🐛 トラブルシューティング

### フォーム送信時のエラー

1. ブラウザの開発者ツールでコンソールを確認
2. Netlify Functionsのログを確認: `netlify functions:log submit-form`
3. 環境変数が正しく設定されているか確認

### kintoneにデータが保存されない

1. APIトークンの権限を確認（レコード追加権限が必要）
2. kintoneアプリのフィールド名が正しいか確認
3. アプリIDが正しいか確認

## 📄 ライセンス

ISC

## 🤝 サポート

問題が発生した場合は、[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) のトラブルシューティングセクションを参照してください。
