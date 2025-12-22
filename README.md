# PyMC Model Builder GUI

ベイジアンモデルをグラフィカルに構築し、PyMCコードを生成するWebアプリケーション。

## 特徴

- **ビジュアルモデリング**: ドラッグ&ドロップでモデルを視覚的に構築
- **13種類の確率分布**: Normal, Beta, Gamma, Poisson等をサポート
- **ノード間参照**: 他のノードをパラメータとして参照可能
- **CSVデータ連携**: データをアップロードして観測変数・特徴量として利用
- **リアルタイムバリデーション**: 次元の整合性を即座にチェック
- **PyMCコード生成**: 構築したモデルを実行可能なPythonコードとして出力
- **サンプルモデル**: 4種類のサンプルモデルで学習可能
- **モデル保存/読込**: JSON形式でモデルを保存・共有

## 技術スタック

- **バックエンド**: FastAPI + PyMC
- **フロントエンド**: React + TypeScript + React Flow
- **インフラ**: Docker + Docker Compose

## セットアップ

### 前提条件

- Docker
- Docker Compose

### 起動方法

```bash
# リポジトリをクローン
git clone <repository-url>
cd BayesianModelGUI

# 環境変数ファイルをコピー
cp .env.example .env

# Dockerコンテナをビルド・起動
docker-compose up -d

# ログを確認
docker-compose logs -f
```

アプリケーションが起動したら、ブラウザで以下にアクセス:
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8000
- API ドキュメント: http://localhost:8000/docs

### 開発モード

```bash
# コンテナに入る
docker-compose exec backend bash
docker-compose exec frontend sh

# バックエンドテスト実行
docker-compose exec backend pytest

# フロントエンドテスト実行
docker-compose exec frontend npm test
```

## 使い方

### 基本的な流れ

1. **サンプルモデルで学習**（推奨）
   - ヘッダーの「Samples」ボタンをクリック
   - 4種類のサンプルモデルから選択

2. **CSVデータをアップロード**（オプション）
   - 左パネルの「Upload CSV」ボタンからアップロード
   - 各列の役割（Observed/Feature/Unused）を指定
   - 「Create Data Nodes」でデータノードを自動生成

3. **ノードを追加**
   - 左パネルの「+ Variable Node」ボタンをクリック
   - キャンバスにノードが追加される

4. **ノードを編集**
   - ノードをクリックしてモーダルを開く
   - 変数名、分布、パラメータを設定
   - パラメータは「Value」（固定値）または「Reference Node」（他ノード参照）を選択
   - 観測データの場合は「Observed」をON

5. **ノード間を接続**
   - ノードのハンドルをドラッグして他のノードに接続
   - 依存関係を視覚的に表現

6. **バリデーション確認**
   - 画面下部のエラーパネルでリアルタイムにチェック
   - エラーがあれば修正

7. **PyMCコード生成**
   - ヘッダーの「Generate Code」ボタンをクリック
   - 生成されたコードをコピーまたはダウンロード

### ショートカット

- **Delete**: 選択したノードやエッジを削除
- **Ctrl+Z**: 元に戻す（React Flow標準）
- **Ctrl+C/V**: コピー&ペースト（React Flow標準）

## プロジェクト構造

```
BayesianModelGUI/
├── frontend/          # Reactアプリケーション
├── backend/           # FastAPI アプリケーション
├── docs/              # ドキュメント
└── docker-compose.yml # Docker設定
```

## ライセンス

MIT
