// ============================================================
//  一献（いっこん）注文システム - Code.gs  v5
//  メニューをスプレッドシートで管理するバージョン
// ============================================================

var CONFIG = {
  SHEET_NAME: "一献_注文DB",
  SEATS: ["A1","A2","A3","A4","A5","B1","B2"],
  NOMIHODAI: {
    duration_min: 120,
    lo_min:       90
  }
  // ★ メニューはスプレッドシートの "menu" シートで管理します
};

// ============================================================
// カスタムメニュー（スプレッドシートを開いたときに表示）
// ============================================================
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    if (!ui) return;
    ui.createMenu("一献")
      .addItem("新規スプレッドシートを作成", "setupSpreadsheet")
      .addItem("既存スプレッドシートをIDで登録（ダイアログ）", "registerSpreadsheetIdByDialog")
      .addItem("A1セルに書いたIDで登録", "registerSpreadsheetIdFromCell")
      .addToUi();
  } catch (e) {
    // スタンドアロンスクリプトでは getUi() が使えない場合がある
  }
}

// ダイアログでスプレッドシートIDを入力して登録（メニューから呼ぶ用）
function registerSpreadsheetIdByDialog() {
  var ui;
  try {
    ui = SpreadsheetApp.getUi();
    if (!ui) { Logger.log("getUi() が使えません。このスクリプトはスプレッドシートに紐づけて開いてください。"); return; }
    var response = ui.prompt("既存スプレッドシートを登録", "スプレッドシートのIDを入力してください。\n（URLの /d/ と /edit の間の英数字）", ui.ButtonSet.OK_CANCEL);
    if (response.getSelectedButton() !== ui.Button.OK) return;
    var ssId = (response.getResponseText() || "").trim();
    if (!ssId) {
      ui.alert("IDが空です。");
      return;
    }
    SpreadsheetApp.openById(ssId);
    PropertiesService.getScriptProperties().setProperty("SS_ID", ssId);
    Logger.log("登録しました: " + ssId);
    ui.alert("登録しました。\nID: " + ssId);
  } catch (e) {
    Logger.log("registerSpreadsheetIdByDialog エラー: " + e.message);
    if (ui) try { ui.alert("エラー: " + e.message); } catch (e2) {}
  }
}

// このブックの「現在のシート」の A1 セルに書いたIDで登録（スプレッドシートにIDを記入してからメニューで実行）
function registerSpreadsheetIdFromCell() {
  var ui;
  try {
    ui = SpreadsheetApp.getUi();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) { showAlert(ui, "このスクリプトはスプレッドシートに紐づけて開いてください。"); return; }
    var sheet = ss.getActiveSheet();
    var cell = sheet.getRange("A1");
    var ssId = (cell.getValue() || "").toString().trim();
    if (!ssId) {
      showAlert(ui, "A1セルにスプレッドシートのIDを記入してから、もう一度メニューを実行してください。");
      return;
    }
    SpreadsheetApp.openById(ssId);
    PropertiesService.getScriptProperties().setProperty("SS_ID", ssId);
    Logger.log("A1から登録しました: " + ssId);
    showAlert(ui, "登録しました。\nID: " + ssId);
  } catch (e) {
    Logger.log("registerSpreadsheetIdFromCell エラー: " + e.message);
    showAlert(ui, "エラー: " + e.message + "\n\n※ 表示 → ログ で詳細を確認できます。");
  }
}

function showAlert(ui, msg) {
  if (ui) try { ui.alert(msg); } catch (e) { Logger.log(msg); }
  else Logger.log(msg);
}

// ============================================================
// セットアップ（初回1回のみ実行）
// ============================================================
function setupSpreadsheet() {
  var ss   = SpreadsheetApp.create(CONFIG.SHEET_NAME);
  var ssId = ss.getId();

  var sSheet = ss.getActiveSheet();
  sSheet.setName("sessions");
  sSheet.appendRow(["session_id","seat","started_at","closed_at","party_size",
                    "total","status","nomihodai","nomihodai_started_at"]);
  sSheet.getRange(1,1,1,9).setBackground("#1B3A5C").setFontColor("#FFFFFF").setFontWeight("bold");

  var oSheet = ss.insertSheet("orders");
  oSheet.appendRow(["order_id","session_id","seat","ordered_at","items_json","subtotal"]);
  oSheet.getRange(1,1,1,6).setBackground("#1B3A5C").setFontColor("#FFFFFF").setFontWeight("bold");

  var dSheet = ss.insertSheet("day_closings");
  dSheet.appendRow(["closed_at","date","total_sessions","total_pax","total_sales"]);
  dSheet.getRange(1,1,1,5).setBackground("#1B3A5C").setFontColor("#FFFFFF").setFontWeight("bold");

  setupMenuSheet(ss);

  try {
    PropertiesService.getScriptProperties().setProperty("SS_ID", ssId);
  } catch(e) {
    Logger.log("setSsId() を手動実行してください。ID: " + ssId);
  }
  Logger.log("完了 URL: " + ss.getUrl() + " ID: " + ssId);
}

// ★ 既存環境: menuシートだけ追加
function addMenuSheet() {
  setupMenuSheet();
  Logger.log("menuシートを追加しました。スプレッドシートを確認してください。");
}

// ★ 既存環境: 飲み放題列を追加
function addNomihodaiColumns() {
  var sSheet  = getSheet("sessions");
  var headers = sSheet.getRange(1, 1, 1, sSheet.getLastColumn()).getValues()[0];
  if (headers.indexOf("nomihodai") === -1) {
    var nextCol = sSheet.getLastColumn() + 1;
    sSheet.getRange(1, nextCol  ).setValue("nomihodai").setBackground("#1B3A5C").setFontColor("#FFFFFF").setFontWeight("bold");
    sSheet.getRange(1, nextCol+1).setValue("nomihodai_started_at").setBackground("#1B3A5C").setFontColor("#FFFFFF").setFontWeight("bold");
    Logger.log("飲み放題列を追加しました");
  } else {
    Logger.log("飲み放題列はすでに存在します");
  }
}

// ★ 既存環境: メニュー適用日列を追加（日替わりメニュー用）
function addMenuApplyDateColumn() {
  var mSheet = getSheet("menu");
  if (!mSheet) { Logger.log("menuシートがありません"); return; }
  var headers = mSheet.getRange(1, 1, 1, mSheet.getLastColumn()).getValues()[0];
  if (headers.indexOf("適用日") !== -1) { Logger.log("適用日列はすでに存在します"); return; }
  var nextCol = mSheet.getLastColumn() + 1;
  mSheet.getRange(1, nextCol).setValue("適用日").setBackground("#1B3A5C").setFontColor("#FFFFFF").setFontWeight("bold");
  if (mSheet.getColumnWidth(nextCol) < 80) mSheet.setColumnWidth(nextCol, 100);
  Logger.log("適用日列を追加しました。空=毎日表示、日付(yyyy/MM/dd)=その日のみ表示");
}

function setupMenuSheet(ss) {
  if (!ss) ss = getSS();
  if (ss.getSheetByName("menu")) { Logger.log("menuシートはすでに存在します"); return; }

  var mSheet  = ss.insertSheet("menu");
  var headers = ["category","name","price","cost","nomihodai_target","is_active","note"];
  mSheet.appendRow(headers);
  mSheet.getRange(1,1,1,headers.length).setBackground("#1B3A5C").setFontColor("#FFFFFF").setFontWeight("bold");

  var data = [
    ["ドリンク","生ビール",               550,120,true, true, ""],
    ["ドリンク","ハイボール",              480,80, true, true, ""],
    ["ドリンク","梅酒ソーダ",             480,80, true, true, ""],
    ["ドリンク","緑茶ハイ",               480,80, true, true, ""],
    ["ドリンク","ウーロンハイ",           480,80, true, true, ""],
    ["ドリンク","日本酒（冷・1合）",      680,200,false,true, "飲み放題対象外"],
    ["ドリンク","焼酎水割り",             480,80, true, true, ""],
    ["ドリンク","ソフトドリンク",         300,30, false,true, "飲み放題対象外"],
    ["フード",  "枝豆",                   280,60, false,true, ""],
    ["フード",  "唐揚げ（5個）",          580,150,false,true, ""],
    ["フード",  "焼き鳥盛り合わせ（5本）",780,220,false,true, ""],
    ["フード",  "だし巻き玉子",           480,100,false,true, ""],
    ["フード",  "冷奴",                   320,40, false,true, ""],
    ["フード",  "海鮮サラダ",             680,180,false,true, ""],
    ["フード",  "鶏の塩焼き",             680,160,false,true, ""],
    ["フード",  "肉じゃが",               580,120,false,true, ""],
    ["フード",  "たこわさ",               480,90, false,true, ""],
    ["フード",  "〆の鶏雑炊",             480,100,false,true, ""],
    ["フード",  "本日のおすすめ①",        0,  0,  false,false,"← 価格を入力してis_activeをTRUEにすると表示"],
    ["フード",  "本日のおすすめ②",        0,  0,  false,false,"← 価格を入力してis_activeをTRUEにすると表示"],
  ];
  mSheet.getRange(2,1,data.length,headers.length).setValues(data);

  // 書式
  mSheet.setColumnWidth(1,100); mSheet.setColumnWidth(2,220); mSheet.setColumnWidth(3,80);
  mSheet.setColumnWidth(4,80);  mSheet.setColumnWidth(5,130); mSheet.setColumnWidth(6,100);
  mSheet.setColumnWidth(7,250);
  mSheet.getRange(2,3,data.length,2).setNumberFormat("#,##0");
  mSheet.getRange(2,6,data.length,1).setBackground("#E8F5E9");

  // 使い方メモ
  mSheet.getRange("I1").setValue("【menuシートの使い方】").setFontWeight("bold").setFontColor("#555");
  var tips = [
    "is_active = TRUE  → 注文画面に表示される",
    "is_active = FALSE → 注文画面に表示されない（行は残してOK）",
    "nomihodai_target = TRUE → 飲み放題の対象ドリンクになる",
    "行を追加すれば新メニューを追加できる",
    "name（商品名）を変えると過去の注文ログに影響しない",
    "price=0 のまま is_active=TRUE にすると「¥0」表示になるので注意"
  ];
  tips.forEach(function(t, i) {
    mSheet.getRange(i+1, 9).setValue(t).setFontColor("#888").setFontStyle("italic");
  });
  mSheet.setColumnWidth(9, 320);
  Logger.log("menuシート作成完了");
}

function setSsId() {
  var ssId = "1VRjISIIEdEolRD68LDgofevubXGX5ZaxuKNZYgcdmig";
  if (!ssId) { Logger.log("ssIdが空です"); return; }
  PropertiesService.getScriptProperties().setProperty("SS_ID", ssId);
  Logger.log("登録完了: " + ssId);
}
function checkSsId() {
  var id = PropertiesService.getScriptProperties().getProperty("SS_ID");
  Logger.log(id ? "登録済み: " + id : "未登録");
}

// ============================================================
// ルーティング
// ============================================================
function doGet(e) {
  e = e || {};
  var params = e.parameter || {};
  var page = params.page || "order";
  var seat = params.seat || "";
  var gateway = params.gateway === "1" || params.gateway === "true";

  if (page === "admin") {
    return HtmlService.createTemplateFromFile("Admin_latest")
      .evaluate().setTitle("【管理】一献 注文管理")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // iPhone標準カメラ・Instagram等のインアプリブラウザ対策: 一度だけ最小HTMLでリダイレクトしてから本ページを返す
  if (gateway) {
    var baseUrl = "";
    try { baseUrl = ScriptApp.getService().getUrl(); } catch (err) {}
    var qs = (e.queryString || "").replace(/&?gateway=1&?/gi, "&").replace(/&?gateway=true&?/gi, "&").replace(/^&|&$/g, "");
    var targetUrl = baseUrl + (qs ? "?" + qs : "");
    var html = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
      "<meta http-equiv=\"refresh\" content=\"0;url=" + escapeHtmlAttr(targetUrl) + "\">" +
      "<title>移動中...</title></head><body><p>注文ページへ移動しています...</p>" +
      "<script>location.replace(" + JSON.stringify(targetUrl) + ");</script>" +
      "<p><a href=\"" + escapeHtmlAttr(targetUrl) + "\">開かない場合はここをタップ</a></p></body></html>";
    return HtmlService.createHtmlOutput(html)
      .setTitle("【注文】一献")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  var tmpl = HtmlService.createTemplateFromFile("Order_latest");
  tmpl.seat = seat;
  return tmpl.evaluate().setTitle("【注文】一献（いっこん）")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function escapeHtmlAttr(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ============================================================
// ヘルパー
// ============================================================
function getSS() {
  var id = PropertiesService.getScriptProperties().getProperty("SS_ID");
  if (!id) throw new Error("SS_IDが未登録です");
  return SpreadsheetApp.openById(id);
}
function getSheet(name) { return getSS().getSheetByName(name); }

function getSessionColMap(sSheet) {
  var headers = sSheet.getRange(1,1,1,sSheet.getLastColumn()).getValues()[0];
  var map = {};
  headers.forEach(function(h,i){ map[h]=i; });
  return {
    session_id:           map["session_id"]           !== undefined ? map["session_id"]           : 0,
    seat:                 map["seat"]                 !== undefined ? map["seat"]                 : 1,
    started_at:           map["started_at"]           !== undefined ? map["started_at"]           : 2,
    closed_at:            map["closed_at"]            !== undefined ? map["closed_at"]            : 3,
    party_size:           map["party_size"]           !== undefined ? map["party_size"]           : 4,
    total:                map["total"]                !== undefined ? map["total"]                : 5,
    status:               map["status"]               !== undefined ? map["status"]               : 6,
    nomihodai:            map["nomihodai"]            !== undefined ? map["nomihodai"]            : -1,
    nomihodai_started_at: map["nomihodai_started_at"] !== undefined ? map["nomihodai_started_at"] : -1
  };
}

// ============================================================
// ★ メニューをシートから動的取得（適用日で日替わり対応）
// ============================================================
function getMenu() {
  var mSheet = getSheet("menu");
  if (!mSheet) throw new Error("menuシートがありません。addMenuSheet()を実行してください。");
  var data    = mSheet.getDataRange().getValues();
  var headers = data[0];
  var colIdx  = {};
  headers.forEach(function(h,i){ colIdx[h]=i; });
  var applyDateCol = colIdx["適用日"] !== undefined ? colIdx["適用日"] : -1;
  var today   = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd");
  var menu = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[colIdx["is_active"]]) continue;
    if (!row[colIdx["name"]])      continue;
    if (applyDateCol >= 0 && row[applyDateCol]) {
      var rowDate = "";
      if (row[applyDateCol] instanceof Date) rowDate = Utilities.formatDate(row[applyDateCol], "Asia/Tokyo", "yyyy/MM/dd");
      else rowDate = String(row[applyDateCol]).trim().replace(/-/g, "/");
      if (rowDate && rowDate !== today) continue;
    }
    menu.push({
      category:         String(row[colIdx["category"]] || "その他"),
      name:             String(row[colIdx["name"]]),
      price:            Number(row[colIdx["price"]]) || 0,
      cost:             Number(row[colIdx["cost"]])  || 0,
      nomihodai_target: !!row[colIdx["nomihodai_target"]],
      note:             String(row[colIdx["note"]] || "")
    });
  }
  return menu;
}

function getNomihodaiTargets() {
  return getMenu().filter(function(i){ return i.nomihodai_target; }).map(function(i){ return i.name; });
}

function getNomihodaiConfig() {
  return { duration_min: CONFIG.NOMIHODAI.duration_min, lo_min: CONFIG.NOMIHODAI.lo_min,
           target_items: getNomihodaiTargets() };
}

function getSeats() { return CONFIG.SEATS; }

/** 現在のWebアプリのURL（QRコード用）。デプロイ済みの場合のみ取得可能。 */
function getBaseUrl() {
  try {
    var url = ScriptApp.getService().getUrl();
    return url ? url.replace(/\?.*$/, "") : "";
  } catch (e) {
    return "";
  }
}

/** QR用に登録した短いURL（iPhoneカメラ対応用）。Script Properties に JSON で保存。 */
function getShortUrlsForQr() {
  try {
    var json = PropertiesService.getScriptProperties().getProperty("QR_SHORT_URLS");
    return json ? JSON.parse(json) : {};
  } catch (e) {
    return {};
  }
}

function setShortUrlsForQr(jsonObj) {
  if (jsonObj && typeof jsonObj === "object") {
    PropertiesService.getScriptProperties().setProperty("QR_SHORT_URLS", JSON.stringify(jsonObj));
    return true;
  }
  return false;
}

// ============================================================
// セッション状態取得（注文画面起動時）
// ============================================================
function getSessionStatus(seat) {
  var sSheet    = getSheet("sessions");
  var data      = sSheet.getDataRange().getValues();
  var cols      = getSessionColMap(sSheet);
  var nomiCfg   = getNomihodaiConfig();
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[cols.seat] !== seat || row[cols.status] !== "open") continue;
    var nomihodai  = cols.nomihodai !== -1 ? !!row[cols.nomihodai] : false;
    var nomStarted = (cols.nomihodai_started_at !== -1 && row[cols.nomihodai_started_at])
                     ? new Date(row[cols.nomihodai_started_at]).getTime() : null;
    return { sessionId: row[cols.session_id], nomihodai: nomihodai,
             nomihodaiStartedAt: nomStarted, duration_min: nomiCfg.duration_min,
             lo_min: nomiCfg.lo_min, target_items: nomiCfg.target_items };
  }
  return { sessionId: null, nomihodai: false, nomihodaiStartedAt: null,
           duration_min: nomiCfg.duration_min, lo_min: nomiCfg.lo_min,
           target_items: nomiCfg.target_items };
}

// ============================================================
// 注文送信
// ============================================================
function submitOrder(seat, items, note) {
  try {
    var ss     = getSS();
    var sSheet = ss.getSheetByName("sessions");
    var oSheet = ss.getSheetByName("orders");
    var cols   = getSessionColMap(sSheet);
    var sessionId = findOrCreateSession(sSheet, seat, cols);
    var subtotal  = items.reduce(function(s,i){ return s+i.price*i.qty; }, 0);
    oSheet.appendRow([Utilities.getUuid(), sessionId, seat, new Date(), JSON.stringify(items), subtotal]);
    updateSessionTotal(sSheet, sessionId, ss, cols);
    // 飲み放題初回注文時刻を記録
    var data = sSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][cols.session_id] !== sessionId) continue;
      if (cols.nomihodai !== -1 && data[i][cols.nomihodai] === true &&
          cols.nomihodai_started_at !== -1 && !data[i][cols.nomihodai_started_at]) {
        sSheet.getRange(i+1, cols.nomihodai_started_at+1).setValue(new Date());
      }
      break;
    }
    return { ok:true, sessionId:sessionId, subtotal:subtotal };
  } catch(e) { return { ok:false, error:e.message }; }
}

function findOrCreateSession(sSheet, seat, cols) {
  var data = sSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][cols.seat] === seat && data[i][cols.status] === "open") return data[i][cols.session_id];
  }
  var sessionId = seat + "-" + Utilities.formatDate(new Date(), "Asia/Tokyo", "MMddHHmm");
  var newRow = new Array(Math.max(cols.nomihodai_started_at+1, 9)).fill("");
  newRow[cols.session_id] = sessionId;
  newRow[cols.seat]       = seat;
  newRow[cols.started_at] = new Date();
  newRow[cols.status]     = "open";
  newRow[cols.total]      = 0;
  if (cols.nomihodai !== -1)            newRow[cols.nomihodai]            = false;
  if (cols.nomihodai_started_at !== -1) newRow[cols.nomihodai_started_at] = "";
  sSheet.appendRow(newRow);
  return sessionId;
}

function updateSessionTotal(sSheet, sessionId, ss, cols) {
  if (!ss)   ss   = getSS();
  if (!cols) cols = getSessionColMap(sSheet);
  var oSheet = ss.getSheetByName("orders");
  var orders = oSheet.getDataRange().getValues();
  var total  = 0;
  for (var i = 1; i < orders.length; i++) { if (orders[i][1]===sessionId) total+=Number(orders[i][5])||0; }
  var sessions = sSheet.getDataRange().getValues();
  for (var j = 1; j < sessions.length; j++) {
    if (sessions[j][cols.session_id]===sessionId) { sSheet.getRange(j+1,cols.total+1).setValue(total); break; }
  }
}

// ============================================================
// 管理画面API
// ============================================================
function setNomihodai(sessionId) {
  try {
    var sSheet = getSheet("sessions");
    var data   = sSheet.getDataRange().getValues();
    var cols   = getSessionColMap(sSheet);
    if (cols.nomihodai===-1) return {ok:false,error:"飲み放題列がありません。addNomihodaiColumns()を実行してください。"};
    for (var i=1;i<data.length;i++) {
      if (data[i][cols.session_id]!==sessionId) continue;
      sSheet.getRange(i+1,cols.nomihodai+1).setValue(true);
      return {ok:true};
    }
    return {ok:false,error:"セッションが見つかりません"};
  } catch(e){return{ok:false,error:e.message};}
}

function getOpenSessionsWithOrders() {
  var ss     = getSS();
  var sSheet = ss.getSheetByName("sessions");
  var oSheet = ss.getSheetByName("orders");
  var sData  = sSheet.getDataRange().getValues();
  var oData  = oSheet.getDataRange().getValues();
  var cols   = getSessionColMap(sSheet);
  var nomiCfg = getNomihodaiConfig();
  var result  = [];
  for (var i=1;i<sData.length;i++) {
    if (sData[i][cols.status]!=="open") continue;
    var sessionId = sData[i][cols.session_id];
    var nomihodai = cols.nomihodai!==-1 ? !!sData[i][cols.nomihodai] : false;
    var nomStart  = (cols.nomihodai_started_at!==-1 && sData[i][cols.nomihodai_started_at])
                    ? new Date(sData[i][cols.nomihodai_started_at]).getTime() : null;
    var orders = [];
    for (var j=1;j<oData.length;j++) {
      if (oData[j][1]!==sessionId) continue;
      var items=[];
      try{items=JSON.parse(oData[j][4]);}catch(e){}
      orders.push({orderId:oData[j][0],
        orderedAt:oData[j][3]?Utilities.formatDate(new Date(oData[j][3]),"Asia/Tokyo","HH:mm"):"-",
        items:items, subtotal:oData[j][5]});
    }
    result.push({sessionId:sessionId, seat:sData[i][cols.seat],
      startedAt:sData[i][cols.started_at]?Utilities.formatDate(new Date(sData[i][cols.started_at]),"Asia/Tokyo","HH:mm"):"-",
      total:sData[i][cols.total]||0, orderCount:orders.length, orders:orders, status:"open",
      nomihodai:nomihodai, nomihodaiStartedAt:nomStart,
      duration_min:nomiCfg.duration_min, lo_min:nomiCfg.lo_min, target_items:nomiCfg.target_items});
  }
  result.sort(function(a,b){return a.seat>b.seat?1:-1;});
  return result;
}

function closeSession(sessionId, partySize) {
  try {
    var sSheet=getSheet("sessions"); var data=sSheet.getDataRange().getValues(); var cols=getSessionColMap(sSheet);
    for (var i=1;i<data.length;i++) {
      if (data[i][cols.session_id]!==sessionId) continue;
      sSheet.getRange(i+1,cols.closed_at+1).setValue(new Date());
      sSheet.getRange(i+1,cols.party_size+1).setValue(partySize);
      sSheet.getRange(i+1,cols.status+1).setValue("closed");
      return {ok:true};
    }
    return {ok:false,error:"セッションが見つかりません"};
  } catch(e){return{ok:false,error:e.message};}
}

function getAllSessionsToday() {
  var today=Utilities.formatDate(new Date(),"Asia/Tokyo","yyyy/MM/dd");
  var sSheet=getSheet("sessions"); var data=sSheet.getDataRange().getValues(); var cols=getSessionColMap(sSheet);
  var result=[];
  for (var i=1;i<data.length;i++) {
    if (!data[i][cols.started_at]) continue;
    var day=Utilities.formatDate(new Date(data[i][cols.started_at]),"Asia/Tokyo","yyyy/MM/dd");
    if (day!==today) continue;
    result.push({sessionId:data[i][cols.session_id], seat:data[i][cols.seat],
      startedAt:Utilities.formatDate(new Date(data[i][cols.started_at]),"Asia/Tokyo","HH:mm"),
      closedAt:data[i][cols.closed_at]?Utilities.formatDate(new Date(data[i][cols.closed_at]),"Asia/Tokyo","HH:mm"):"-",
      partySize:data[i][cols.party_size]||"-", total:data[i][cols.total]||0,
      status:data[i][cols.status], nomihodai:cols.nomihodai!==-1?!!data[i][cols.nomihodai]:false});
  }
  result.sort(function(a,b){return a.seat>b.seat?1:-1;});
  return result;
}

function getTodaySummary() {
  var today=Utilities.formatDate(new Date(),"Asia/Tokyo","yyyy/MM/dd");
  var sSheet=getSheet("sessions"); var data=sSheet.getDataRange().getValues(); var cols=getSessionColMap(sSheet);
  var totalSales=0,sessionCount=0,totalPax=0;
  for (var i=1;i<data.length;i++) {
    if (!data[i][cols.started_at]) continue;
    var day=Utilities.formatDate(new Date(data[i][cols.started_at]),"Asia/Tokyo","yyyy/MM/dd");
    if (day!==today) continue;
    sessionCount++; totalSales+=Number(data[i][cols.total])||0; totalPax+=Number(data[i][cols.party_size])||0;
  }
  return {date:today,sessionCount:sessionCount,totalSales:totalSales,totalPax:totalPax,
          avgSpend:totalPax>0?Math.round(totalSales/totalPax):0};
}

function getSalesByDate(daysBack) {
  daysBack = daysBack || 31;
  var today = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd");
  var result = [];
  var dSheet = getSheet("day_closings");
  var closedMap = {};
  if (dSheet) {
    var dData = dSheet.getDataRange().getValues();
    var dateCol = -1, sessionsCol = 2, paxCol = 3, salesCol = 4;
    for (var c = 0; c < dData[0].length; c++) {
      if (dData[0][c] === "date") dateCol = c;
      if (dData[0][c] === "total_sessions") sessionsCol = c;
      if (dData[0][c] === "total_pax") paxCol = c;
      if (dData[0][c] === "total_sales") salesCol = c;
    }
    if (dateCol === -1 && dData[0].indexOf("date") !== -1) dateCol = dData[0].indexOf("date");
    if (dateCol === -1 && dData[0].length >= 2) dateCol = 1;
    for (var i = 1; i < dData.length; i++) {
      var d = dData[i][dateCol];
      var dateStr = d ? (d instanceof Date ? Utilities.formatDate(d, "Asia/Tokyo", "yyyy/MM/dd") : String(d).trim()) : "";
      if (!dateStr) continue;
      closedMap[dateStr] = {
        date: dateStr,
        sessionCount: Number(dData[i][sessionsCol]) || 0,
        totalPax: Number(dData[i][paxCol]) || 0,
        totalSales: Number(dData[i][salesCol]) || 0
      };
    }
  }
  var fromClosings = {};
  for (var k in closedMap) fromClosings[k] = true;
  var sSheet = getSheet("sessions");
  var cols = getSessionColMap(sSheet);
  var sData = sSheet.getDataRange().getValues();
  for (var j = 1; j < sData.length; j++) {
    var started = sData[j][cols.started_at];
    if (!started) continue;
    var day = Utilities.formatDate(new Date(started), "Asia/Tokyo", "yyyy/MM/dd");
    if (fromClosings[day]) continue;
    if (!closedMap[day]) closedMap[day] = { date: day, sessionCount: 0, totalPax: 0, totalSales: 0 };
    closedMap[day].sessionCount += 1;
    closedMap[day].totalPax += Number(sData[j][cols.party_size]) || 0;
    closedMap[day].totalSales += Number(sData[j][cols.total]) || 0;
  }
  var keys = Object.keys(closedMap);
  keys.sort();
  var start = keys.length > daysBack ? keys.length - daysBack : 0;
  for (var k = start; k < keys.length; k++) result.push(closedMap[keys[k]]);
  result.sort(function(a,b){ return a.date > b.date ? 1 : -1; });
  return result;
}

function getSpreadsheetUrl() {
  return getSS().getUrl();
}

function closeDaySales() {
  try {
    var sSheet = getSheet("sessions");
    var dSheet = getSheet("day_closings");
    var data = sSheet.getDataRange().getValues();
    var cols = getSessionColMap(sSheet);
    for (var i = 1; i < data.length; i++) {
      if (data[i][cols.status] === "open") {
        sSheet.getRange(i+1, cols.closed_at+1).setValue(new Date());
        sSheet.getRange(i+1, cols.status+1).setValue("closed");
      }
    }
    var summary = getTodaySummary();
    if (!dSheet) { dSheet = getSS().insertSheet("day_closings"); dSheet.appendRow(["closed_at","date","total_sessions","total_pax","total_sales"]); }
    dSheet.appendRow([new Date(), summary.date, summary.sessionCount, summary.totalPax, summary.totalSales]);
    return { ok: true, summary: summary };
  } catch(e) { return { ok: false, error: e.message }; }
}
