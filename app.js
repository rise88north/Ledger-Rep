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
  var wallet = document.getElementById("walletInput").value
  if (wallet === "") {
    document.getElementById("result").innerHTML = "⚠️ Please enter a wallet address!"
    return
  }
  
  document.getElementById("result").innerHTML = "🔍 Looking up wallet..."
  
  try {
    var data = await checkWallet(wallet)
    var balance = data.Balance / 1000000
    var ownerCount = data.OwnerCount
    var ageInDays = data.ageInDays
    // Calculate trust score
var scoreBalance = Math.min(balance / 20, 20)
var scoreAge = Math.min(ageInDays / 2, 50)
var scoreObjects = Math.min(ownerCount * 5, 15)
var totalScore = Math.floor(scoreBalance + scoreAge + scoreObjects)

// Score caps for new wallets
if (ageInDays < 30) totalScore = Math.min(totalScore, 40)
else if (ageInDays < 90) totalScore = Math.min(totalScore, 65)

// Simple recommendation
var recommendation
if (totalScore >= 80) recommendation = "✅ Safe to Transact"
else if (totalScore >= 60) recommendation = "⚠️ Proceed with Caution"
else if (totalScore >= 40) recommendation = "🔴 High Risk"
else recommendation = "🚫 Do Not Send Funds"

// Grade
var newWalletWarning = ""
if (ageInDays < 30) {
  newWalletWarning = "<div style='background:#1a0a0a; border:1px solid #ff4444; padding:15px; border-radius:10px; margin-bottom:15px; text-align:left;'>" +
    "<p style='color:#ff4444; font-size:16px; margin:0 0 10px 0;'>🆕 New Wallet Detected</p>" +
    "<p style='color:white; font-size:14px; margin:0 0 10px 0;'>This wallet is " + ageInDays + " days old — limited history available</p>" +
    "<p style='color:#00b4d8; font-size:14px; margin:0 0 5px 0;'>💡 Suggestions:</p>" +
    "<p style='color:#ccc; font-size:13px; margin:0 0 3px 0;'>• Ask for their primary wallet address</p>" +
    "<p style='color:#ccc; font-size:13px; margin:0 0 3px 0;'>• Request a small test transaction first</p>" +
    "<p style='color:#ccc; font-size:13px; margin:0 0 3px 0;'>• Check their social proof on X or Discord</p>" +
"<p style='color:#ccc; font-size:13px; margin:0;'>• Use an escrow service for high value deals</p>" +
"</div>"
}
    document.getElementById("result").innerHTML = 
    newWalletWarning +
  "<div style='background:#0f3460; padding:30px; border-radius:15px; display:inline-block; min-width:300px;'>" +
"<h2 style='color:#00b4d8;'>✅ Wallet Found</h2>" +
"<h3 style='font-size:22px; margin:10px 0;'>" + recommendation + "</h3>" +
"<p>💰 Balance: <strong>" + balance + " XRP</strong> <span style='color:#888; font-size:13px;'>— amount of XRP held</span></p>" +
"<p>🔑 Owned Objects: <strong>" + ownerCount + "</strong> <span style='color:#888; font-size:13px;'>— trust lines, NFTs and offers on ledger</span></p>" +
"<p>📅 Account Age: <strong>" + ageInDays + " days</strong> <span style='color:#888; font-size:13px;'>— how long this wallet has existed</span></p>" +
"<p>⭐ Trust Score: <strong style='color:" + (totalScore >= 80 ? '#00ff88' : totalScore >= 60 ? '#ffd700' : totalScore >= 40 ? '#ff8c00' : '#ff4444') + "; font-size:24px;'>" + totalScore + "/100</strong> <span style='color:#888; font-size:13px;'>— calculated from balance, age and activity</span></p>" +
"</div>"
  } catch (error) {
    document.getElementById("result").innerHTML = "❌ Error: " + error.message
  }
}

document.getElementById("scoreBtn").addEventListener("click", checkScore)