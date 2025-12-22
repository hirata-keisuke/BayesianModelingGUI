# Getting Started - PyMC Model Builder

## クイックスタート

### 1. セットアップ（初回のみ）

```bash
# セットアップスクリプトを実行
./setup.sh
```

このスクリプトは以下を実行します：
- `.env`ファイルの作成
- Dockerコンテナのビルドと起動

### 2. アクセス

ブラウザで以下のURLにアクセス：
- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000
- **API ドキュメント**: http://localhost:8000/docs

### 3. 基本的な使い方

#### ステップ1: ノードの追加
1. 左パネルの「+ Variable Node」ボタンをクリック
2. キャンバスにノードが追加される

#### ステップ2: ノードの編集
1. 追加されたノードをクリック
2. モーダルが開く
3. 変数名を入力（例: `mu`）
4. 分布を選択（例: `Normal`）
5. パラメータを設定:
   - `mu`: 0
   - `sigma`: 1
6. 「Save」をクリック

#### ステップ3: モデルの構築
1. さらにノードを追加
2. ノード間をドラッグして接続（依存関係を定義）
3. 画面下部でバリデーションエラーを確認

#### ステップ4: コード生成
1. ヘッダーの「Generate Code」ボタンをクリック
2. PyMCコードが表示される
3. 「Copy to Clipboard」または「Download」で取得

## 簡単なモデルの例

### 線形回帰モデル

1. **切片（alpha）ノードを作成**:
   - Name: `alpha`
   - Distribution: `Normal`
   - mu: 0
   - sigma: 10

2. **傾き（beta）ノードを作成**:
   - Name: `beta`
   - Distribution: `Normal`
   - mu: 0
   - sigma: 10

3. **ノイズ（sigma）ノードを作成**:
   - Name: `sigma`
   - Distribution: `HalfNormal`
   - sigma: 1

4. **尤度（y）ノードを作成**:
   - Name: `y`
   - Distribution: `Normal`
   - mu: （後で接続）
   - sigma: sigma（sigmaノードに接続）
   - Observed: チェック

5. **コード生成**して確認

## コマンド

### コンテナの起動
```bash
docker-compose up -d
```

### ログの確認
```bash
docker-compose logs -f
```

### コンテナの停止
```bash
docker-compose down
```

### コンテナの再ビルド
```bash
docker-compose up -d --build
```

## トラブルシューティング

### ポートが使用中
他のアプリケーションがポート3000や8000を使用している場合、`docker-compose.yml`のポート設定を変更してください。

### フロントエンドが起動しない
```bash
docker-compose logs frontend
```
でログを確認してください。

### バックエンドが起動しない
```bash
docker-compose logs backend
```
でログを確認してください。

### PyMCのインポートエラー
バックエンドコンテナを再ビルド:
```bash
docker-compose down
docker-compose up -d --build backend
```

## 次のステップ

- [README.md](README.md)でプロジェクト全体の概要を確認
- [要件定義書](docs/20251203_1400_PyMCモデル構築GUIツール要件定義.md)で詳細仕様を確認
- [実装計画](docs/20251203_1400_実装計画.md)でアーキテクチャを確認
