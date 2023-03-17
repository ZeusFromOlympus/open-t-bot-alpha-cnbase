const Telegraf = require('telegraf');
const ethers = require('ethers');
const admin = require('firebase-admin');
const bot = new Telegraf('YOUR_BOT_TOKEN');
const provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');

// Replace with your own wallet address
const myWalletAddress = 'YOUR_WALLET_ADDRESS';

// USDT contract address on BSC chain
const usdtContractAddress = '0x55d398326f99059ff775485246999027b3197955';
const usdtAbi = [
  'event Transfer(address indexed from, address indexed to, uint value)'
];
const usdtContract = new ethers.Contract(usdtContractAddress, usdtAbi, provider);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: 'YOUR_FIREBASE_PROJECT_ID',
    clientEmail: 'YOUR_FIREBASE_CLIENT_EMAIL',
    privateKey: 'YOUR_FIREBASE_PRIVATE_KEY'
  }),
  databaseURL: 'YOUR_FIREBASE_DATABASE_URL'
});
const db = admin.firestore();

bot.start((ctx) => ctx.reply(`Welcome, ${ctx.from.first_name}!`));

bot.hears(/^!pay (.+)/i, async (ctx) => {

  // Check if user has already paid
  const paidUserRef = db.collection('paidUsers').doc(ctx.from.id.toString());
  const paidUserDoc = await paidUserRef.get();
  if (paidUserDoc.exists) {
    ctx.reply('You have already paid. Thank you!');
    return;
  }

  const userWalletAddress = ctx.match[2];
  if (!userWalletAddress) {
    ctx.reply('Please enter your wallet address after the !pay or /pay command');
    return;
  }

  await ctx.reply(`Send ${paymentAmount} ${paymentCurrency} to the specified address: ${wallet.address}\nNote: You have 30 minutes to complete this transaction before it times out.`);

  
  
  // Listen for Transfer event on USDT contract
  usdtContract.on('Transfer', async (from, to, value) => {
    if (from === userWalletAddress && to === myWalletAddress) {
      // Check transaction value
      const formattedValue = ethers.utils.formatUnits(value);
      if (parseFloat(formattedValue) >= 5) {
          // Transaction found and has correct value
          ctx.reply('Transaction confirmed!');
          
        // Notify user if they sent more than required
      if (parseFloat(formattedValue) > 5) {
        const excessAmount = parseFloat(formattedValue) - 5;
        ctx.reply(`You sent ${excessAmount} USDT more than required.`);
      }
    
      usdtContract.removeAllListeners('Transfer');

        // Fetch all account credentials from Firebase database
        const credentialsRef = db.collection('credentials');
        const snapshot = await credentialsRef.get();
        const credentialsArray = [];
        snapshot.forEach(doc => {
          credentialsArray.push({ id: doc.id, data: doc.data() });
        });

        // Randomly pick a set of credentials
        const randomIndex = Math.floor(Math.random() * credentialsArray.length);
        const randomCredentials = credentialsArray[randomIndex];
        const email = randomCredentials.data.email;
const password = randomCredentials.data.password;

// Send account credentials to user
await ctx.telegram.sendMessage(ctx.chat.id, `Here are your account credentials:\nEmail: ${email}\nPassword: ${password}`);

// Update Firebase database to store which credentials the user got
await db.collection('users').doc(userWalletAddress).set({ gotCredentials: true, credentialsId: randomCredentials.id });
}
}
});
});

bot.hears('!users', async (ctx) => {
// Check if user has successfully completed a transaction
const userWalletAddress = ctx.from.id.toString();
const userDocRef = db.collection('users').doc(userWalletAddress);
const userDocSnapshot = await userDocRef.get();
if (!userDocSnapshot.exists || !userDocSnapshot.data().gotCredentials) {
// User has not successfully completed a transaction
await ctx.reply('You must successfully complete a transaction before using this command');
return;
}

// Fetch all documents from users collection
const usersRef = db.collection('users');
const snapshot = await usersRef.get();
const usersArray = [];
snapshot.forEach(doc => {
usersArray.push({ id: doc.id, data: doc.data() });
});

// Count how many users are using each set of credentials
const credentialsCount = {};
for (const user of usersArray) {
if (user.data.credentialsId) {
if (!credentialsCount[user.data.credentialsId]) {
credentialsCount[user.data.credentialsId] = 0;
}
credentialsCount[user.data.credentialsId]++;
}
}

// Build response message
let responseMessage = 'Here is the list of how many users are using each set of credentials:\n';
for (const [credentialsId, count] of Object.entries(credentialsCount)) {
responseMessage += `Credentials ID ${credentialsId}: ${count} users\n`;
}

// Send response message to user
await ctx.reply(responseMessage);
});

bot.launch();