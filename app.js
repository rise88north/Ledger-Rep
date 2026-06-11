var currentLanguage = 'en'

function setLanguage(lang) {
  currentLanguage = lang
  if (lang === 'en') {
    document.getElementById("title").innerHTML = "LedgerRep"
    document.getElementById("subtitle").innerHTML = "XRPL Wallet Trust Score"
    document.getElementById("walletInput").placeholder = "Enter Wallet address"
    document.getElementById("scoreBtn").innerHTML = "Check Score"
  } else {
    document.getElementById("title").innerHTML = "レジャーレップ"
    document.getElementById("subtitle").innerHTML = "XRPLウォレット信頼スコア"
    document.getElementById("walletInput").placeholder = "ウォレットアドレスを入力"
    document.getElementById("scoreBtn").innerHTML = "スコアを確認"
  }
}

async function checkWallet(address) {
  const client = new xrpl.Client("wss://xrplcluster.com")
  await client.connect()
  const response = await client.request({
    command: "account_info",
    account: address,
    ledger_index: "validated"
  })
  const txHistory = await client.request({
    command: "account_tx",
    account: address,
    limit: 1,
    forward: true
  })
  await client.disconnect()
  const accountData = response.result.account_data
  const firstTx = txHistory.result.transactions[0]
  const firstDate = (firstTx.tx_json ? (firstTx.tx_json.date + 946684800) * 1000 : (firstTx.tx.date + 946684800) * 1000)
  const ageInDays = Math.floor((Date.now() - firstDate) / (1000 * 60 * 60 * 24))
  accountData.ageInDays = ageInDays
  return accountData
}

async function checkScore() {
  var isJP = currentLanguage === 'jp'
  var wallet = document.getElementById("walletInput").value
  if (wallet === "") {
    document.getElementById("result").innerHTML = isJP ? "⚠️ ウォレットアドレスを入力してください" : "⚠️ Please enter a wallet address!"
    return
  }
  document.getElementById("result").innerHTML = isJP ? "🔍 ウォレットを検索中..." : "🔍 Looking up wallet..."
  try {
    var data = await checkWallet(wallet)
    var balance = data.Balance / 1000000
    var ownerCount = data.OwnerCount
    var ageInDays = data.ageInDays
    var scoreBalance = Math.min(balance / 20, 20)
    var scoreAge = Math.min(ageInDays / 2, 50)
    var scoreObjects = Math.min(ownerCount * 5, 15)
    var totalScore = Math.floor(scoreBalance + scoreAge + scoreObjects)
    if (ageInDays < 30) totalScore = Math.min(totalScore, 40)
    else if (ageInDays < 90) totalScore = Math.min(totalScore, 65)
    var recommendation
    if (isJP) {
      if (totalScore >= 80) recommendation = "✅ 取引安全"
      else if (totalScore >= 60) recommendation = "⚠️ 注意して進む"
      else if (totalScore >= 40) recommendation = "🔴 高リスク"
      else recommendation = "🚫 送金禁止"
    } else {
      if (totalScore >= 80) recommendation = "✅ Safe to Transact"
      else if (totalScore >= 60) recommendation = "⚠️ Proceed with Caution"
      else if (totalScore >= 40) recommendation = "🔴 High Risk"
      else recommendation = "🚫 Do Not Send Funds"
    }
    var newWalletWarning = ""
    if (ageInDays < 30) {
      newWalletWarning = "<div style='background:#1a0a0a; border:1px solid #ff4444; padding:15px; border-radius:10px; margin-bottom:15px; text-align:left;'>" +
        "<p style='color:#ff4444; font-size:16px; margin:0 0 10px 0;'>" + (isJP ? "🆕 新しいウォレットが検出されました" : "🆕 New Wallet Detected") + "</p>" +
        "<p style='color:white; font-size:14px; margin:0 0 10px 0;'>" + (isJP ? "このウォレットは " + ageInDays + " 日です" : "This wallet is " + ageInDays + " days old — limited history available") + "</p>" +
        "<p style='color:#00b4d8; font-size:14px; margin:0 0 5px 0;'>" + (isJP ? "💡 提案:" : "💡 Suggestions:") + "</p>" +
        "<p style='color:#ccc; font-size:13px; margin:0 0 3px 0;'>• " + (isJP ? "主要ウォレットアドレスを確認する" : "Ask for their primary wallet address") + "</p>" +
        "<p style='color:#ccc; font-size:13px; margin:0 0 3px 0;'>• " + (isJP ? "少額のテスト送金をリクエスト" : "Request a small test transaction first") + "</p>" +
        "<p style='color:#ccc; font-size:13px; margin:0 0 3px 0;'>• " + (isJP ? "XやDiscordでのソーシャル証明を確認" : "Check their social proof on X or Discord") + "</p>" +
        "<p style='color:#ccc; font-size:13px; margin:0;'>• " + (isJP ? "高額取引にはエスクローを使用" : "Use an escrow service for high value deals") + "</p>" +
        "</div>"
    }
    document.getElementById("result").innerHTML =
      newWalletWarning +
      "<div style='background:#0f3460; padding:30px; border-radius:15px; display:inline-block; min-width:300px;'>" +
      "<h2 style='color:#00b4d8;'>" + (isJP ? "✅ ウォレットが見つかりました" : "✅ Wallet Found") + "</h2>" +
      "<h3 style='font-size:22px; margin:10px 0;'>" + recommendation + "</h3>" +
      "<p>💰 " + (isJP ? "残高" : "Balance") + ": <strong>" + balance + " XRP</strong> <span style='color:#888; font-size:13px;'>— " + (isJP ? "保有XRP量" : "amount of XRP held") + "</span></p>" +
      "<p>🔑 " + (isJP ? "所有オブジェクト" : "Owned Objects") + ": <strong>" + ownerCount + "</strong> <span style='color:#888; font-size:13px;'>— " + (isJP ? "トラストライン、NFT、オファー" : "trust lines, NFTs and offers on ledger") + "</span></p>" +
      "<p>📅 " + (isJP ? "アカウント年齢" : "Account Age") + ": <strong>" + ageInDays + (isJP ? " 日" : " days") + "</strong> <span style='color:#888; font-size:13px;'>— " + (isJP ? "ウォレットの存在期間" : "how long this wallet has existed") + "</span></p>" +
      "<p>⭐ " + (isJP ? "信頼スコア" : "Trust Score") + ": <strong style='color:" + (totalScore >= 80 ? '#00ff88' : totalScore >= 60 ? '#ffd700' : totalScore >= 40 ? '#ff8c00' : '#ff4444') + "; font-size:24px;'>" + totalScore + "/100</strong> <span style='color:#888; font-size:13px;'>— " + (isJP ? "残高、年齢、活動から計算" : "calculated from balance, age and activity") + "</span></p>" +
      "</div>"
  } catch (error) {
    document.getElementById("result").innerHTML = "❌ Error: " + error.message
  }
}

document.getElementById("scoreBtn").addEventListener("click", checkScore)