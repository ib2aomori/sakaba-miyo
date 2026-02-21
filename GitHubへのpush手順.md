# GitHub に push する手順（やさしく）

「push（プッシュ）」＝ あなたのパソコンにある最新のファイルを、GitHub のサイト上に送って更新することです。

---

## 準備：ターミナルを開く

1. Mac で **Spotlight** を開く（キーボードで **Command + スペース**）
2. 「**ターミナル**」と入力して **Enter**
3. 黒い（または白い）画面が開く → ここにこれからコマンドを打ちます

---

## 手順 1：プロジェクトのフォルダに移動する

ターミナルに **次の1行をそのままコピーして貼り付け**、**Enter** を押します。

```
cd /Users/yukiito/Desktop/programing/sakaba_miyo
```

- **意味**：「sakaba_miyo というフォルダの中に入る」という指示です。
- 何も表示されなくても、次の行に `$` や `%` が出ていればOKです。

---

## 手順 2：変更したファイルを「ステージング」する

次に **次の1行** をコピーして貼り付け、**Enter** を押します。

```
git add order.html redirect.html Code_latest.gs PAGES_SETUP.md GitHubへのpush手順.md
```

- **意味**：「このファイルたちを、次に送る仲間にする」という登録です。
- まだ GitHub には送っていません。

---

## 手順 3：コミット（「この内容で保存します」と記録する）

次に **次の1行** をコピーして貼り付け、**Enter** を押します。

```
git commit -m "注文ページをGitHub Pages化（order.html追加・redirect変更・GAS API）"
```

- **意味**：「今ステージングした内容を、ひとまとまりの変更として記録する」ことです。
- 「〜 files changed」のような表示が出れば成功です。

---

## 手順 4：GitHub に push する

次に **次の1行** をコピーして貼り付け、**Enter** を押します。

```
git push -u origin main
```

- **意味**：「記録した変更を、GitHub の ib2aomori/sakaba-miyo に送る」ことです。
- **初回だけ**、GitHub の「ユーザー名」と「パスワード」を聞かれることがあります。  
  - パスワードは **Personal Access Token** を入れる場合があります（普通のログイン用パスワードでは通らないことがあります）。
- 「Writing objects: 100%」や「Branch 'main' set up to track...」のような表示が出れば **push 完了** です。

---

## うまくいかないとき

### 「Permission denied」や「Authentication failed」と出る

- GitHub にログインするための認証が通っていません。
- GitHub のサイトで **Settings → Developer settings → Personal access tokens** からトークンを作り、そのトークンを「パスワード」のところに入れてみてください。

### 「branch 'main' does not exist」と出る

- ブランチ名が `master` の可能性があります。次のように打ちます。
  ```
  git push -u origin master
  ```

### ほかのエラーが出る

- 出たメッセージをそのままコピーして、誰かに見てもらうか、検索すると原因が分かることが多いです。

---

## push が終わったあと

- 数分以内に、GitHub Pages の内容が更新されます。
- 次のURLで注文ページが開けるか確認してみてください。
  - **席指定**：https://ib2aomori.github.io/sakaba-miyo/redirect.html?seat=A1
  - **共通（席選択）**：https://ib2aomori.github.io/sakaba-miyo/redirect.html

ここまでできていれば、QRコードの行き先をこの URL にすれば、Safari でも Chrome でもインアプリでも同じ注文ページが開きます。
