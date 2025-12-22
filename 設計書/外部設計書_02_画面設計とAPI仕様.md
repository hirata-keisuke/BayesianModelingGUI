# 外部設計書 - 画面設計とAPI仕様

## 1. 画面設計

### 1.1 画面一覧

| 画面ID | 画面名 | パス | 説明 |
|--------|--------|------|------|
| S01 | モデル構築画面 | `/` | ベイズモデルを視覚的に構築 |
| S02 | 推論設定画面 | `/inference/config` | 推論パラメータの設定 |
| S03 | 推論結果画面 | `/inference/results` | 推論結果の表示と可視化 |

### 1.2 S01: モデル構築画面

#### レイアウト構成

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Compact Bayesian Model GUI                         │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────┬───────────────────────────┬─────────────────┐ │
│ │           │                           │                 │ │
│ │  Panels   │      Canvas Area          │   Properties    │ │
│ │  (Left)   │      (Center)             │   Panel (Right) │ │
│ │           │                           │                 │ │
│ │ - Nodes   │  [Node-based Graph]       │  - Node Details │ │
│ │ - Data    │                           │  - Parameters   │ │
│ │ - Tools   │  [Drag & Drop Interface]  │  - Validation   │ │
│ │           │                           │                 │ │
│ └───────────┴───────────────────────────┴─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### 主要コンポーネント

**左パネル（Panels）**
1. **Nodesパネル**
   - 変数ノード追加ボタン
   - 決定論的ノード追加ボタン
   - サンプルモデル読み込み

2. **Dataパネル**
   - CSVファイルアップロード
   - データノード一覧
   - 列情報とrole設定（observed/feature/unused）

3. **Toolsパネル**
   - モデル検証ボタン
   - コード生成ボタン
   - 推論実行ボタン

**中央エリア（Canvas）**
- React Flowによるノードグラフ
- ノードタイプ:
  - Variable（確率変数）: 紫色
  - Computed（決定論的）: 緑色
  - Data: 青色
- エッジ: 依存関係を矢印で表示

**右パネル（Properties）**
- ノード選択時に詳細を表示
- 編集項目:
  - ノード名
  - 分布の選択（Variableノードのみ）
  - パラメータ設定
  - 式の入力（Computedノードのみ）
  - Observed設定

#### インタラクション

1. **ノード追加**
   - 左パネルからボタンクリック → キャンバスに新規ノード配置

2. **ノード接続**
   - ノードのハンドルをドラッグ → 他ノードへ接続 → エッジ生成

3. **ノード編集**
   - ノードをダブルクリック → モーダル表示 → パラメータ編集

4. **バリデーション**
   - "Validate Model"ボタン → API呼び出し → エラー/警告表示

5. **コード生成**
   - "Generate Code"ボタン → モーダルにPyMCコード表示 → コピー可能

### 1.3 S02: 推論設定画面

#### レイアウト構成

```
┌─────────────────────────────────────────────────────────────┐
│ Header: 推論設定                          [モデル構築に戻る]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 推論手法: [MCMC ▼]                                   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                     │   │
│  │ [MCMC設定]                                           │   │
│  │   サンプラー: [NUTS ▼]                               │   │
│  │   サンプリング数 (draws): [1000]                      │   │
│  │   チューニング数 (tune): [1000]                       │   │
│  │   チェーン数 (chains): [4]                           │   │
│  │   コア数 (cores): [4]                                │   │
│  │   HDI区間: [0.95]                                    │   │
│  │                                                     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 事前予測チェック（推奨）                               │   │
│  │   [事前予測チェックを実行]                            │   │
│  │                                                     │   │
│  │   [Prior Predictive Plot表示エリア]                  │   │
│  │                                                     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                 [推論を実行]                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 設定項目

**MCMC設定**
- サンプラー: NUTS（推奨）/ Metropolis
- draws: 100〜100,000（デフォルト1000）
- tune: 100〜100,000（デフォルト1000）
- chains: 1〜16（デフォルト4）
- cores: 1〜16（デフォルト4）
- HDI区間: 0.5〜0.99（デフォルト0.95）

**VI設定**
- VI手法: ADVI / FullRank ADVI
- iterations: 1,000〜100,000（デフォルト10,000）
- draws: 100〜100,000（デフォルト1000）
- HDI区間: 0.5〜0.99（デフォルト0.95）

#### インタラクション

1. **推論手法切り替え**
   - ドロップダウンで選択 → 設定フォームが切り替わる

2. **事前予測チェック**
   - ボタンクリック → API呼び出し → プロット表示

3. **推論実行**
   - "推論を実行"ボタン → ローディング表示 → 結果画面へ遷移

### 1.4 S03: 推論結果画面

#### レイアウト構成

```
┌─────────────────────────────────────────────────────────────┐
│ Header: 推論結果                          [モデル構築に戻る]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 推論情報                                             │   │
│  │   手法: MCMC (NUTS)                                  │   │
│  │   サンプル数: 4000 (4 chains × 1000 draws)           │   │
│  │   実行時間: 45.2秒                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ トレースプロット                                      │   │
│  │   [Trace Plot画像]                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 事後分布                                             │   │
│  │   [Posterior Plot画像]                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ サマリー統計量                                        │   │
│  │   [統計量テーブル: mean, sd, HDI, R-hat, ESS]         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 表示内容

**推論情報**
- 使用した推論手法
- サンプリングパラメータ
- 実行時間

**可視化**
1. トレースプロット: サンプリングの時系列推移
2. 事後分布プロット: KDEによる分布推定
3. ペアプロット（オプション）

**統計量テーブル**
- 変数名
- 平均値（mean）
- 標準偏差（sd）
- HDI区間（下限・上限）
- R-hat（収束診断）
- 有効サンプルサイズ（ESS）

## 2. API仕様

### 2.1 エンドポイント一覧

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/api/validate` | モデルのバリデーション |
| POST | `/api/generate-code` | PyMCコード生成 |
| POST | `/api/inference/run` | 推論実行 |
| POST | `/api/inference/prior-predictive` | 事前予測チェック |
| POST | `/api/data/upload` | CSVファイルアップロード |
| GET | `/api/distributions` | 利用可能な分布一覧 |

### 2.2 API詳細仕様

#### 2.2.1 POST /api/validate

**概要**: モデルのバリデーション

**リクエスト**
```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "variable",
      "name": "mu",
      "distribution": "Normal",
      "parameters": {
        "mu": "0",
        "sigma": "1"
      },
      "shape": null,
      "observed": false
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2"
    }
  ],
  "csvMetadata": null
}
```

**レスポンス（成功）**
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

**レスポンス（エラー）**
```json
{
  "valid": false,
  "errors": [
    {
      "node_id": "node-2",
      "type": "constraint_violation",
      "message": "Parameter 'sigma' = -1 violates constraint: > 0"
    }
  ],
  "warnings": [
    {
      "node_id": "node-3",
      "type": "unknown_constraint",
      "message": "Parameter 'alpha' has constraint 'custom' which cannot be automatically validated"
    }
  ]
}
```

#### 2.2.2 POST /api/generate-code

**概要**: PyMCコード生成

**リクエスト**: `/api/validate`と同じ形式

**レスポンス**
```json
{
  "code": "import pymc as pm\nimport numpy as np\n\n# Model definition\nwith pm.Model() as model:\n    mu = pm.Normal('mu', mu=0, sigma=1)\n    ...",
  "success": true
}
```

#### 2.2.3 POST /api/inference/run

**概要**: 推論実行

**リクエスト**
```json
{
  "model": {
    "nodes": [...],
    "edges": [...],
    "csvMetadata": {...}
  },
  "config": {
    "method": "MCMC",
    "sampler": "NUTS",
    "draws": 1000,
    "tune": 1000,
    "chains": 4,
    "cores": 4,
    "hdi_prob": 0.95
  }
}
```

**レスポンス**
```json
{
  "success": true,
  "execution_time": 45.2,
  "trace_plot": "base64_encoded_image",
  "posterior_plot": "base64_encoded_image",
  "summary": {
    "mu": {
      "mean": 0.52,
      "sd": 0.31,
      "hdi_3%": 0.01,
      "hdi_97%": 1.05,
      "r_hat": 1.00,
      "ess_bulk": 3542,
      "ess_tail": 3201
    }
  }
}
```

#### 2.2.4 POST /api/inference/prior-predictive

**概要**: 事前予測チェック

**リクエスト**
```json
{
  "model": {
    "nodes": [...],
    "edges": [...],
    "csvMetadata": {...}
  },
  "samples": 1000
}
```

**レスポンス**
```json
{
  "success": true,
  "prior_predictive_plot": "base64_encoded_image",
  "prior_trace_plot": "base64_encoded_image"
}
```

#### 2.2.5 POST /api/data/upload

**概要**: CSVファイルアップロード

**リクエスト**: multipart/form-data
- `file`: CSVファイル

**レスポンス**
```json
{
  "file_id": "abc123",
  "filename": "data.csv",
  "columns": [
    {
      "name": "age",
      "dtype": "int64",
      "role": "unused"
    },
    {
      "name": "height",
      "dtype": "float64",
      "role": "unused"
    }
  ]
}
```

#### 2.2.6 GET /api/distributions

**概要**: 利用可能な分布一覧取得

**リクエスト**: なし

**レスポンス**
```json
{
  "Normal": {
    "description": "Normal distribution",
    "params": {
      "mu": {
        "type": "float",
        "description": "Mean",
        "default": 0,
        "required": true,
        "constraint": null
      },
      "sigma": {
        "type": "float",
        "description": "Standard deviation",
        "default": 1,
        "required": true,
        "constraint": "> 0"
      }
    },
    "support": "continuous"
  },
  "Poisson": {
    "description": "Poisson distribution",
    "params": {
      "mu": {
        "type": "float",
        "description": "Expected number of events",
        "default": 1,
        "required": true,
        "constraint": "> 0"
      }
    },
    "support": "discrete"
  }
}
```

### 2.3 エラーレスポンス

全APIで共通のエラーフォーマット:

```json
{
  "detail": "エラーメッセージ"
}
```

HTTPステータスコード:
- 200: 成功
- 400: リクエストエラー（バリデーション失敗等）
- 500: サーバーエラー（推論実行失敗等）

## 3. モーダル・ダイアログ

### 3.1 ノード編集モーダル

**表示タイミング**: ノードをダブルクリック時

**コンテンツ**
- ノード名入力
- 分布選択（Variableノードのみ）
- パラメータ入力フォーム
  - Value/Reference切り替え
  - デフォルト値表示
  - 制約表示
- Observed設定
  - チェックボックス
  - データソース選択
- 式入力（Computedノードのみ）

**ボタン**
- Save: 変更を保存してモーダルを閉じる
- Cancel: 変更を破棄してモーダルを閉じる

### 3.2 コード表示モーダル

**表示タイミング**: "Generate Code"ボタンクリック時

**コンテンツ**
- 生成されたPyMCコード（シンタックスハイライト）
- コピーボタン

### 3.3 ローディングモーダル

**表示タイミング**: 推論実行中

**コンテンツ**
- スピナーアニメーション
- 実行中の推論設定情報
- 進捗メッセージ
