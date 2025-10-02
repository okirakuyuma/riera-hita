# デプロイ手順書

## 前提条件

- Node.js (v18以上推奨)
- Netlifyアカウント
- kintoneアカウントとアプリ

## 1. kintoneアプリの設定

### 1.1 kintoneアプリの作成

1. kintoneにログイン
2. 「アプリ」→「アプリを作成」をクリック
3. 「はじめから作成」を選択
4. アプリ名: `日田市移住定住相談フォーム`

### 1.2 フィールドの作成

以下のフィールドを作成してください：

#### 申請者情報
- `申請者氏` (文字列1行)
- `申請者名` (文字列1行)
- `申請者氏フリガナ` (文字列1行)
- `申請者名フリガナ` (文字列1行)
- `郵便番号` (文字列1行)
- `都道府県` (文字列1行)
- `市区町村` (文字列1行)
- `番地` (文字列1行)
- `建物名` (文字列1行)
- `電話番号` (文字列1行)
- `メールアドレス` (文字列1行)

#### 移住情報
- `移住人数` (文字列1行)
- `申請者年齢` (文字列1行)
- `申請者職業` (文字列1行)
- `出身都道府県` (文字列1行)
- `出身市区町村` (文字列1行)
- `移住希望時期` (文字列複数行)
- `日田市を選んだ理由` (文字列複数行)
- `やりたいこと` (文字列複数行)
- `就業形態` (文字列複数行)
- `相談内容` (文字列複数行)
- `情報提供許可` (文字列1行)

#### 空き家バンク情報
- `利用目的` (文字列1行)
- `希望物件番号` (文字列1行)
- `希望地域` (文字列複数行)
- `取引種別` (文字列1行)
- `間取り希望` (文字列複数行)
- `駐車場台数` (文字列1行)
- `ペット有無` (文字列1行)
- `ペット種類` (文字列1行)
- `ペット数` (文字列1行)
- `ペット飼育場所` (文字列1行)
- `その他希望条件` (文字列複数行)

#### アンケート
- `重要要件` (文字列複数行)
- `場所希望` (文字列1行)
- `水道希望` (文字列1行)
- `建屋希望` (文字列1行)
- `階数希望` (文字列1行)
- `温泉希望` (文字列1行)
- `菜園希望` (文字列1行)
- `その他要件` (文字列複数行)
- `学校規模希望` (文字列1行)

#### 家族情報（テーブル）
テーブル名: `家族`

テーブル内のフィールド：
- `家族氏` (文字列1行)
- `家族名` (文字列1行)
- `家族氏フリガナ` (文字列1行)
- `家族名フリガナ` (文字列1行)
- `続柄` (文字列1行)
- `年齢` (文字列1行)
- `職業` (文字列1行)

### 1.3 APIトークンの発行

1. アプリの設定画面を開く
2. 「APIトークン」タブをクリック
3. 「生成する」をクリック
4. トークン名: `Netlify連携`
5. アクセス権: 「レコード追加」にチェック
6. 「保存」→「アプリを更新」をクリック
7. **生成されたAPIトークンをメモしておく**

### 1.4 アプリIDの確認

- アプリのURL（例: `https://yoursubdomain.cybozu.com/k/123/`）の数字部分がアプリID

## 2. ローカル環境での動作確認

### 2.1 依存関係のインストール

```bash
npm install
```

### 2.2 環境変数の設定

1. `.env.example` をコピーして `.env` を作成：

```bash
cp .env.example .env
```

2. `.env` ファイルを編集してkintoneの情報を設定：

```
KINTONE_BASE_URL=https://yoursubdomain.cybozu.com
KINTONE_API_TOKEN=生成したAPIトークン
KINTONE_APP_ID=アプリID
```

### 2.3 ローカルサーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:8888` を開いて動作確認

### 2.4 テスト送信

フォームに適当なデータを入力して送信し、kintoneにレコードが作成されることを確認

## 3. Netlifyへのデプロイ

### 3.1 Netlify CLIのインストール（初回のみ）

```bash
npm install -g netlify-cli
```

### 3.2 Netlifyにログイン

```bash
netlify login
```

ブラウザが開くので、Netlifyアカウントでログイン

### 3.3 Netlifyサイトの初期化

```bash
netlify init
```

- 「Create & configure a new site」を選択
- チーム名を選択
- サイト名を入力（例: `hita-relocation-form`）
- ビルドコマンド: そのままEnter
- ディレクトリ: そのままEnter（`.`）
- Netlify Functions: そのままEnter（`netlify/functions`）

### 3.4 環境変数の設定

Netlifyの管理画面で環境変数を設定：

```bash
netlify open
```

または、CLIで設定：

```bash
netlify env:set KINTONE_BASE_URL "https://yoursubdomain.cybozu.com"
netlify env:set KINTONE_API_TOKEN "生成したAPIトークン"
netlify env:set KINTONE_APP_ID "アプリID"
```

### 3.5 デプロイ

```bash
npm run deploy
```

または

```bash
netlify deploy --prod
```

### 3.6 公開URLの確認

デプロイ完了後に表示されるURLでアクセスして動作確認

## 4. 継続的デプロイ（オプション）

GitHubリポジトリと連携すると、プッシュ時に自動デプロイされます。

### 4.1 GitHubリポジトリの作成

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/hita-relocation-form.git
git push -u origin main
```

### 4.2 Netlifyでリポジトリ連携

1. Netlifyの管理画面を開く
2. 「Site settings」→「Build & deploy」
3. 「Link repository」をクリック
4. GitHubリポジトリを選択

## 5. トラブルシューティング

### フォーム送信時にエラーが出る

1. ブラウザのコンソールでエラー内容を確認
2. Netlify Functionsのログを確認：`netlify functions:log submit-form`
3. 環境変数が正しく設定されているか確認

### kintoneにレコードが作成されない

1. APIトークンのアクセス権限を確認（レコード追加権限が必要）
2. kintoneアプリのフィールド名が正しいか確認
3. kintoneアプリIDが正しいか確認

### ローカルで動作するがNetlifyで動作しない

1. Netlifyの環境変数が正しく設定されているか確認
2. Netlify Functionsのログを確認
3. Node.jsのバージョンを確認（package.jsonに指定）

## 6. セキュリティ注意事項

- `.env` ファイルは絶対にGitにコミットしない（`.gitignore`に含まれています）
- APIトークンは定期的に更新することを推奨
- kintoneのアクセス権限は必要最小限に設定
