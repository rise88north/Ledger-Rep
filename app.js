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
var scoreBalance = Math.min(balance / 10, 40)
var scoreAge = Math.min(ageInDays / 3, 40)
var scoreObjects = Math.min(ownerCount * 5, 20)
var totalScore = Math.floor(scoreBalance + scoreAge + scoreObjects)

// Grade
var grade
if (totalScore >= 80) grade = "A — Highly Trusted ✅"
else if (totalScore >= 60) grade = "B — Trusted 🟡"
else if (totalScore >= 40) grade = "C — Moderate ⚠️"
else if (totalScore >= 20) grade = "D — Low Trust 🔴"
else grade = "F — Untrusted ❌"
    document.getElementById("result").innerHTML = 
  "<div style='background:#0f3460; padding:30px; border-radius:15px; display:inline-block; min-width:300px;'>" +
  "<h2 style='color:#00b4d8;'>✅ Wallet Found</h2>" +
  "<p>💰 Balance: <strong>" + balance + " XRP</strong></p>" +
  "<p>🔑 Owned Objects: <strong>" + ownerCount + "</strong></p>" +
  "<p>📅 Account Age: <strong>" + ageInDays + " days</strong></p>" +
  "<h1 style='font-size:60px; color:" + (totalScore >= 80 ? '#00ff88' : totalScore >= 60 ? '#ffd700' : totalScore >= 40 ? '#ff8c00' : '#ff4444') + ";'>" + totalScore + "/100</h1>" +
  "<p style='font-size:20px;'>🏆 " + grade + "</p>" +
  "</div>"
  } catch (error) {
    document.getElementById("result").innerHTML = "❌ Error: " + error.message
  }
}

document.getElementById("scoreBtn").addEventListener("click", checkScore)