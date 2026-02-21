# GitHub Pages で注文サイトを公開する（あなたがやること）

このフォルダはすでに git の初期化と初回コミットまで済んでいます。

**構成（B: 普通のサイト）**
- **order.html** … 注文画面。GitHub Pages 上で表示され、メニュー・注文送信は GAS に JSONP / POST で取得・送信します。Safari / Chrome / インアプリブラウザのどれでも同じように開けます。
- **redirect.html** … QR の行き先。`?seat=A1` を付けたまま **order.html** にリダイレクトします。最初に開くのは GitHub のページだけなので「ファイルを開けません」が出ません。
- **GAS** … 管理画面・メニューAPI・注文受付のまま。スプレッドシート連携は変更なし。

## 1. order.html の GAS のURL（あなただけ）

注文データは **order.html** が GAS の API に取りに行きます。別の GAS デプロイURLを使う場合は、**order.html** を開き、先頭の `<script>` 内にある **`var GAS_BASE = "https://script.google.com/.../exec";`** を、あなたの GAS の「exec まで」のURLに書き換えてください。

書き換えたら保存し、コミット:
```bash
git add order.html && git commit -m "GASのURLを自分のものに変更"
```

## 2. GitHub でリポジトリを作る（あなただけ）

1. [GitHub](https://github.com) にログイン
2. 右上の **+** → **New repository**
3. リポジトリ名を入力（例: `sakaba-miyo` や `sakaba-redirect`）
4. **Create repository** をクリック（README 等は追加しなくてOK）

## 3. リモートを追加して push（ターミナル）

**リモート** = 「push したときにコードを送る先」＝ GitHub のリポジトリのURLです。いまはすでに `https://github.com/ib2aomori/sakaba-miyo.git` に設定済みです。

あとは push するだけ:

```bash
cd /Users/yukiito/Desktop/programing/sakaba_miyo
git push -u origin main
```

## 4. GitHub Pages を有効にする（あなただけ）

1. そのリポジトリの **Settings** → 左の **Pages**
2. **Source** で **Deploy from a branch** を選択
3. **Branch** で `main` を選び、フォルダは **/ (root)** のまま **Save**
4. 数分後、`https://あなたのユーザー名.github.io/リポジトリ名/` で公開される

## 5. QRの行き先にする

- 席別の例: `https://ib2aomori.github.io/sakaba-miyo/redirect.html?seat=A1`
- 共通なら: `https://ib2aomori.github.io/sakaba-miyo/redirect.html`
- このURLをQRコード（または短縮URLの行き先）にすれば、iPhone標準カメラ・Instagramでも「ファイルを開けません」を避けられる。
