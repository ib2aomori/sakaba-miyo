# GitHub Pages で redirect を公開する（あなたがやること）

このフォルダはすでに git の初期化と初回コミットまで済んでいます。

## 1. redirect.html のURLを書き換える（あなただけ）

- `redirect.html` を開き、**2か所** の GAS のURLを、あなたの注文用URL（`https://script.google.com/.../exec` まで）に書き換える。
  - 9行目: `<meta id="meta-refresh" ... content="0;url=ここ">` の `url=` の後
  - 20行目: `var GAS_BASE = "ここ";`
- 書き換えたら保存し、コミットする:
  ```bash
  git add redirect.html && git commit -m "GASのURLを自分のものに変更"
  ```

## 2. GitHub でリポジトリを作る（あなただけ）

1. [GitHub](https://github.com) にログイン
2. 右上の **+** → **New repository**
3. リポジトリ名を入力（例: `sakaba-miyo` や `sakaba-redirect`）
4. **Create repository** をクリック（README 等は追加しなくてOK）

## 3. リモートを追加して push（ターミナル）

GitHub の「Quick setup」に表示されているURLを使って、**あなたのユーザー名・リポジトリ名**に書き換えて実行:

```bash
cd /Users/yukiito/Desktop/programing/sakaba_miyo
git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git
git branch -M main
git push -u origin main
```

## 4. GitHub Pages を有効にする（あなただけ）

1. そのリポジトリの **Settings** → 左の **Pages**
2. **Source** で **Deploy from a branch** を選択
3. **Branch** で `main` を選び、フォルダは **/ (root)** のまま **Save**
4. 数分後、`https://あなたのユーザー名.github.io/リポジトリ名/` で公開される

## 5. QRの行き先にする

- 席別の例: `https://あなたのユーザー名.github.io/リポジトリ名/redirect.html?seat=A1`
- 共通なら: `https://あなたのユーザー名.github.io/リポジトリ名/redirect.html`
- このURLをQRコード（または短縮URLの行き先）にすれば、iPhone標準カメラ・Instagramでも「ファイルを開けません」を避けられる。
