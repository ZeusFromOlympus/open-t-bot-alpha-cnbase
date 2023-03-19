const {Telegraf} = require('telegraf');
const { Markup } = require('telegraf');
const admin = require('firebase-admin');
require('dotenv').config()
const axios = require('axios');
const coinbaseCommerceAPIKey = process.env.COINBASE_API_KEY;

const bot = new Telegraf(process.env.TG_KEY)


const myGroupId = '-1001973926307';
paymentAmount = '1'
paymentCurrency = 'USD'

const serviceAccount = require('./tg-bot-ai-40691-firebase-adminsdk-xfyxr-70f5dfa027.json')

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});
const db = admin.firestore();

async function sendPrivateMessage(text) {
  await bot.telegram.sendMessage(myGroupId, text);
}

bot.action('PAY_FOR_SUBSCRIPTION', async (ctx) => {
    // Create a charge
    const chargeData = {
      name: 'Subscription',
      description: 'Pay for subscription',
      local_price: {
        amount: paymentAmount,
        currency: paymentCurrency
      },
      pricing_type: 'fixed_price'
    };
    const chargeResponse = await axios.post(
      'https://api.commerce.coinbase.com/charges',
      chargeData,
      {
        headers: {
          'X-CC-Api-Key': coinbaseCommerceAPIKey,
          'X-CC-Version': '2018-03-22'
        }
      }
    );
    const chargeCode = chargeResponse.data.data.code;
  
    // Send payment instructions to user
    await ctx.reply(`Please follow this link to complete your payment: https://commerce.coinbase.com/charges/${chargeCode}`);

  
    // Check for payment status updates
    let paymentSuccessful = false;
    while (!paymentSuccessful) {
      const chargeStatusResponse = await axios.get(
        `https://api.commerce.coinbase.com/charges/${chargeCode}`,
        {
          headers: {
            'X-CC-Api-Key': coinbaseCommerceAPIKey,
            'X-CC-Version': '2018-03-22'
          }
        }
      );
      
      const chargeStatusData = chargeStatusResponse.data.data;
      
      if (chargeStatusData.timeline.pop().status === 'COMPLETED') {
        paymentSuccessful = true;
        
        // Send private message with transaction details
        const transactionDetails = `Charge code: ${chargeCode}\nPayment method: ${chargeStatusData.payments[0].payment_method}\nValue: ${chargeStatusData.payments[0].value.local.amount} ${chargeStatusData.payments[0].value.local.currency}`;
        await sendPrivateMessage(`New transaction performed:\n\n${transactionDetails}`);
        
        // Send account credentials to user. Testing only!!!
        // const email = 'mark@mark.com';
        // const password = 'lalaland';
        // await ctx.telegram.sendMessage(ctx.chat.id, `Here are your account credentials:\nEmail: ${email}\nPassword: ${password}`);
        
        break;
      } else if (chargeStatusData === 'CANCELED' || chargeStatusData === 'EXPIRED') {
        break;
      }
  
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
     // Mark user as paid in Firebase
        const userDocRef = db.collection('users').doc(ctx.from.id.toString());
        await userDocRef.set({ paid: true }, { merge: true });


    // Get credentials from Firebase
        const credentialsDocRef = db.collection('credentials').doc('99ls1DH4CPfJG0OCSSjU');
        const credentialsDocSnapshot = await credentialsDocRef.get();
        const credentialsData = credentialsDocSnapshot.data();

    // Send account credentials to user
        await ctx.telegram.sendMessage(ctx.chat.id, `Here are your account credentials:\nEmail: ${credentialsData.email}\nPassword: ${credentialsData.password}`);

  });

// bot.action('PAY_FOR_SUBSCRIPTION', async (ctx) => {

//   await ctx.reply('Please enter your wallet address:');
    
//     bot.on('text', async (ctx) => {
//       const userWalletAddress = ctx.message.text;

//       //Validate user's wallet
//       if(!ethers.utils.isAddress(userWalletAddress)) {
//         ctx.reply('Invalid wallet address. Please enter a valid Ethereum or BSC wallet address.')
//       }

    
      
//       // Your /pay command logic here
//       if (!userWalletAddress) {
//         ctx.reply('Please enter your wallet address after the !pay or /pay command');
//         return;
//       }

//       await ctx.reply(`Send ${paymentAmount} ${paymentCurrency} to the specified address: ${wallet.address}\nNote: You have 30 minutes to complete this transaction before it times out.`)

//        // Set a timeout for the transaction
//     const transactionTimeout = setTimeout(() => {
//         provider.removeAllListeners('block');
//         ctx.reply('Transaction timed out. Please try again.', {
//           reply_markup: {
//             inline_keyboard: [[{ text: 'Try Again', callback_data: 'tryAgain' }]]
//           }
//         });
//       }, 30 * 60 * 1000); // Timeout after 30 minutes
      
//       // Listen for new blocks on Ethereum blockchain
//       provider.on('block', async (blockNumber) => {
//         // Get block data
//         const block = await provider.getBlockWithTransactions(blockNumber);
        
//         // Check if any transactions in block are from user's wallet address and sent to our wallet address
//         for (const transaction of block.transactions) {
//           if (transaction.from === userWalletAddress && transaction.to === wallet.address) {
//             // Clear the transaction timeout
//             clearTimeout(transactionTimeout);
            
//             // Check transaction value
//             const formattedValue = ethers.utils.formatEther(transaction.value);
//             if (parseFloat(formattedValue) >= 0.01) {
//               // Transaction found and has correct value
//               ctx.reply('Transaction confirmed!');
              
  
//               if (parseFloat(formattedValue) >= 0.01) {
//                   const exeededAmount = parseFloat(formattedValue) - 0.01
//                   ctx.reply(`You have sent ${exeededAmount} ETH more than required. Thank you, those money will be used to renew subscription in OpenAI account automatically!`)
//               }
  
//               provider.removeAllListeners('block');
//               // Send private message
//               const transactionDetails = `From: ${transaction.from}\nTo: ${transaction.to}\nValue: ${formattedValue} GoerliETH`;
//               await sendPrivateMessage(`New transaction performed:\n\n${transactionDetails}`);
  
            
  
  
//               // Send account credentials to user
//               const email = 'mark@mark.com'
//               const password = 'lalaland'
//               await ctx.telegram.sendMessage(ctx.chat.id, `Here are your account credentials:\nEmail: ${email}\nPassword: ${password}`);
//           }
//       }
//     }
//   });

//     });
//   });

  bot.action('BACK', (ctx) => {
    ctx.editMessageText(`Your message text here`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Pay for subscription', callback_data: 'PAY_FOR_SUBSCRIPTION' }]
        ]
      }
    });
  });
bot.command('start', (ctx) => {
    ctx.replyWithHTML(
      'Welcome!',
      {
        reply_markup: {
          keyboard: [
            [{ text: 'My Button' }]
          ],
          resize_keyboard: true,
          one_time_keyboard: false
        }
      }
    );

    ctx.replyWithPhoto(
        { source: 'src/https___editors.dexerto.com_wp-content_uploads_2023_03_14_OpenAI-GPT-4.jpg' },
        {
          caption: 'Your message text here',
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Pay for subscription', callback_data: 'PAY_FOR_SUBSCRIPTION' }]
            ]
          }
        }
      );
  });

bot.action('NEED_HELP', (ctx) => {
    ctx.editMessageText(`If you need help, please contact @YourUsername on Telegram.`,
      Telegraf.Extra.markup((markup) => {
        return markup.inlineKeyboard([
          markup.callbackButton('Back', 'BACK')
        ]);
      })
    );
  });

  bot.action('BACK', (ctx) => {
    ctx.editMessageText(`Send ${paymentAmount} ${paymentCurrency} to the specified address: ${wallet.address}\nNote: You have 30 minutes to complete this transaction before it times out.`,
      Telegraf.Extra.markup((markup) => {
        return markup.inlineKeyboard([
          markup.callbackButton('Need help?', 'NEED_HELP')
        ]);
      })
    );
  });



bot.launch();

//const nodemailer = require('nodemailer')

// const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert({
//     projectId: 'YOUR_FIREBASE_PROJECT_ID',
//     clientEmail: 'YOUR_FIREBASE_CLIENT_EMAIL',
//     privateKey: 'YOUR_FIREBASE_PRIVATE_KEY'
//   }),
//   databaseURL: 'YOUR_FIREBASE_DATABASE_URL'
// });
// const db = admin.firestore();



// bot.hears('!users', async (ctx) => {
// // Check if user has successfully completed a transaction
// const userWalletAddress = ctx.from.id.toString();
// const userDocRef = db.collection('users').doc(userWalletAddress);
// const userDocSnapshot = await userDocRef.get();
// if (!userDocSnapshot.exists || !userDocSnapshot.data().gotCredentials) {
// // User has not successfully completed a transaction
// await ctx.reply('You must successfully complete a transaction before using this command');
// return;
// }

// // Fetch all documents from users collection
// const usersRef = db.collection('users');
// const snapshot = await usersRef.get();
// const usersArray = [];
// snapshot.forEach(doc => {
// usersArray.push({ id: doc.id, data: doc.data() });
// });

// // Count how many users are using each set of credentials
// const credentialsCount = {};
// for (const user of usersArray) {
// if (user.data.credentialsId) {
// if (!credentialsCount[user.data.credentialsId]) {
// credentialsCount[user.data.credentialsId] = 0;
// }
// credentialsCount[user.data.credentialsId]++;
// }
// }

// // Build response message
// let responseMessage = 'Here is the list of how many users are using each set of credentials:\n';
// for (const [credentialsId, count] of Object.entries(credentialsCount)) {
// responseMessage += `Credentials ID ${credentialsId}: ${count} users\n`;
// }

// // Send response message to user
// await ctx.reply(responseMessage);
// });

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'YOUR_EMAIL_ADDRESS',
//         pass: 'YOUR_PASS'
//     }
// })

// async function sendNotification(notificationDetails) {
//     const mailOptions = {
//         from: 'YOUR_EMAIL_ADDRESS',
//         to: 'YOUR_EMAIL_ADDRESS',
//         subject: 'New Transaction performed!',
//         text: `A new transaction was performed: \n \n ${notificationDetails}`
//     }

//     await transporter.sendMail(mailOptions)
// }

  // Send email notification
              // const transactionsDetails = `From ${transaction.from}\n To: ${transaction.to}\n Value: ${formattedValue}`
  
              // await sendNotification(transactionsDetails)


            //   bot.hears(/^(!|\/)pay (.+)/i, async (ctx) => {
            //     const userWalletAddress = ctx.match[2];
            //     if (!userWalletAddress) {
            //       ctx.reply('Please enter your wallet address after the !pay or /pay command');
            //       return;
            //     } 
                
            //     await ctx.reply(`Send ${paymentAmount} ${paymentCurrency} to the specified address: ${wallet.address}\nNote: You have 30 minutes to complete this transaction before it times out.`
            //   );
               
                
            //     // Set a timeout for the transaction
            //     const transactionTimeout = setTimeout(() => {
            //       provider.removeAllListeners('block');
            //       ctx.reply('Transaction timed out. Please try again.', {
            //         reply_markup: {
            //           inline_keyboard: [[{ text: 'Try Again', callback_data: 'tryAgain' }]]
            //         }
            //       });
            //     }, 30 * 60 * 1000); // Timeout after 30 minutes
                
            //     // Listen for new blocks on Ethereum blockchain
            //     provider.on('block', async (blockNumber) => {
            //       // Get block data
            //       const block = await provider.getBlockWithTransactions(blockNumber);
                  
            //       // Check if any transactions in block are from user's wallet address and sent to our wallet address
            //       for (const transaction of block.transactions) {
            //         if (transaction.from === userWalletAddress && transaction.to === wallet.address) {
            //           // Clear the transaction timeout
            //           clearTimeout(transactionTimeout);
                      
            //           // Check transaction value
            //           const formattedValue = ethers.utils.formatEther(transaction.value);
            //           if (parseFloat(formattedValue) >= 0.01) {
            //             // Transaction found and has correct value
            //             ctx.reply('Transaction confirmed!');
                        
            
            //             if (parseFloat(formattedValue) >= 0.01) {
            //                 const exeededAmount = parseFloat(formattedValue) - 0.01
            //                 ctx.reply(`You have sent ${exeededAmount} ETH more than required. Thank you, those money will be used to renew subscription in OpenAI account automatically!`)
            //             }
            
            //             provider.removeAllListeners('block');
            //             // Send private message
            //             const transactionDetails = `From: ${from}\nTo: ${to}\nValue: ${formattedValue} GoerliETH`;
            //             await sendPrivateMessage(`New transaction performed:\n\n${transactionDetails}`);
            
            //             // Send email notification
            //             // const transactionsDetails = `From ${transaction.from}\n To: ${transaction.to}\n Value: ${formattedValue}`
            
            //             // await sendNotification(transactionsDetails)
            
            
            //             // Send account credentials to user
            //             const email = 'mark@mark.com'
            //             const password = 'lalaland'
            //             await ctx.telegram.sendMessage(ctx.chat.id, `Here are your account credentials:\nEmail: ${email}\nPassword: ${password}`);
            //         }
            //     }
            //   }
            // });
            // });