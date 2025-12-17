# Ktst 3D Herb Viewer

北里大学薬学部 生薬学研究室で利用する **生薬 3D デジタル標本ビューア** です。
3D Gaussian Splatting (3DGS) で作成した生薬標本モデルを Web ブラウザ上で閲覧し、生薬情報や簡単なクイズとあわせて学習に利用することを目的としています。

* Raspberry Pi + GitHub Pages でホスト可能
* 3DGS モデル（.ply / .splat）を表示
* 生薬情報パネル + クイズ機能
* 学内 LAN からのアクセスや学会デモでの利用を想定

---

## デモ

* **GitHub Pages:** [https://oinari-nkmr.github.io/ktst-3d-herb-viewer/](https://oinari-nkmr.github.io/ktst-3d-herb-viewer/)

---

## 構成概要

リポジトリ直下（GitHub Pages 用）:

```text
.
├ index.html             # メインのビューアページ
├ js/
│  └ viewer.js           # three.js + Spark を使った描画・UI ロジック
├ data/
│  └ herbs.json          # 生薬ごとのメタデータ（名前・基原・クイズなど）
├ models/                # 公開してよい 3D モデル（.ply / .splat など）
├ img/
│  └ herbs/              # 生薬写真・構造式画像など
└ (今後追加予定)
   └ THIRD_PARTY_LICENSES/
```

将来的には、ラズパイ専用のローカルモデル置き場として以下を追加する予定です:

```text
models-local/            # ローカル専用モデル（Git には含めない）
```

## セットアップ（ローカル / Raspberry Pi）

### 1. リポジトリをクローン

```bash
git clone git@github.com:oinari-nkmr/ktst-3d-herb-viewer.git
cd ktst-3d-herb-viewer
```

### 2. ローカルでの簡易動作確認

Python の簡易 Web サーバなどでホストします。

```bash
python -m http.server 8080
```

ブラウザで `http://localhost:8080/` を開くと 3D ビューアが表示されます。

### 3. Raspberry Pi + nginx でのホスト（例）

Raspberry Pi 上で `/srv/3dgs/site` 以下に本リポジトリを配置し、nginx の root をそのディレクトリに設定します。

```nginx
server {
    listen 80;
    server_name <raspi-hostname>;

    root /srv/3dgs/site;
    index index.html;
}
```

設定後、ブラウザから `http://<raspi-hostname>/` にアクセスします。

## データ構造

**data/herbs.json**

生薬ごとの情報は JSON で管理します。

```json
[
  {
    "id": "genti_radix_demo",
    "nameJa": "ゲンチアナ（根・デモ）",
    "latinName": "Gentianae Radix",
    "sourcePlant": "リンドウ科 Gentiana lutea",
    "part": "根",
    "extra": "刻み根を 3DGS モデル化したデモ標本",
    "fileUrl": "models/gentiana_demo.splat",
    "photoUrl": "img/herbs/gentiana_photo.jpg",
    "structureUrl": "img/herbs/gentiopicroside.jpg",
    "visibility": "public",
    "tags": ["ゲンチアナ", "苦味健胃薬"],
    "quiz": {
      "question": "ゲンチアナ根の代表的な効能として正しいのはどれ？",
      "options": ["鎮咳去痰", "健胃", "止瀉", "利尿"],
      "correctIndex": 1,
      "explanation": "ゲンチアナ根は苦味健胃薬として利用されます。"
    }
  }
]
```

* `fileUrl`：3D モデル（.ply / .splat）のパス
* `photoUrl`：生薬写真
* `structureUrl`：代表成分の構造式
* `visibility`：
    * `"public"`：GitHub Pages など外部公開してよいモデル
    * `"local"`：ラズパイ等のローカル専用モデル（将来的に導入予定）

## 使用している主なライブラリとライセンス

本ビューアでは、以下のオープンソースソフトウェアを利用しています。

* **three.js** (MIT License)
    * 3D 描画のための JavaScript ライブラリ。
* **Spark** (@sparkjsdev/spark) (MIT License)
    * Gaussian Splatting モデルを three.js 上で扱うためのライブラリ。
* **SuperSplat** (MIT License)
    * 3DGS モデルの編集・軽量化に利用するデスクトップ／Web ツール（本リポジトリにはバイナリ等は含まず、オフラインツールとして利用）。

※ ライブラリ本体のソースコードやビルド済みファイルを同梱する場合、それぞれの MIT License テキストを `THIRD_PARTY_LICENSES/` などに同梱します。

## 著作権・利用について

**生薬 3D モデル・写真・説明テキスト・クイズ等のコンテンツ**は、北里大学薬学部 生薬学研究室（および関係者）による著作物です。

研究・教育のための利用を想定しており、**無断での再配布・商用利用はご遠慮ください**。

## 今後の拡張予定（メモ）

* [ ] `visibility` フラグによる「ローカル専用モデル」と「外部公開モデル」の切り替え
* [ ] クイズ部分を LLM API（ChatGPT / Gemini 等）と連携させた動的出題
* [ ] 生薬情報検索・タグフィルタの強化
* [ ] 3D モデル数拡充とパフォーマンス最適化
