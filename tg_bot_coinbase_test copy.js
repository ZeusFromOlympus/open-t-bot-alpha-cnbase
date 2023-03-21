const { Bot } = require('grammy')
const { Menu } = require('@grammyjs/menu')
const axios = require('axios');
require('dotenv').config()

const serviceAccount = require('./tg-bot-ai-40691-firebase-adminsdk-xfyxr-70f5dfa027.json')
const admin = require('firebase-admin');

const coinbaseCommerceAPIKey = process.env.COINBASE_API_KEY;
const bot = new Bot(process.env.TG_KEY)


const myGroupId = '-1001973926307';
paymentAmount = '6'
paymentCurrency = 'USD'
let paymentURL; // Declare paymentURL variable outside of the menus
let chargeCode; // Declare chargeCode variable outside of the menus


// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});
const db = admin.firestore();

async function sendPrivateMessage(text) {
  await bot.telegram.sendMessage(myGroupId, text);
}

const mainMenu = new Menu('main-menu')
  .text('Option 1', (ctx) => ctx.reply('You selected Option 1!'))
  .row()
  .submenu('Submenu', 'submenu-menu', async (ctx) => {
    // Edit message to display submenu photo and caption
    await ctx.editMessageMedia({
      type: 'photo',
      media: 'AgACAgIAAxkBAAIBWWQYzCjyfj_4kgavMYYeSVsWZsAvAALYxTEbZkrBSFsmAusWTW3jAQADAgADcwADLwQ',
      caption: 'Submenu'
    });
   
   // Call generatePaymentLink function here to generate the payment link when user navigates from main menu to submenu
   await generatePaymentLink();
 })
 .row()
 .text('Option 2', (ctx) => ctx.reply('You selected Option 2!'));

 console.log('Before submenu block: ' + paymentURL)

async function generatePaymentLink() {

  // Generate payment link here
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
  chargeCode = chargeResponse.data.data.code;
  paymentURL = `https://commerce.coinbase.com/charges/${chargeCode}`;
  console.log(paymentURL)

  const submenuMenu = new Menu('submenu-menu')
 .text('Submenu Option 1', (ctx) => ctx.reply('You selected Submenu Option 1!'))
 .row()
 .url('Pay Now', )
 .url('Pay Now', 'https://commerce.coinbase.com/checkout/14688e2b-38c5-4cd5-be27-68c36260797c') // Add this line to create a URL button with the payment link
 .row()
 .text('Submenu Option 2', (ctx) => ctx.reply('You selected Submenu Option 2!'))
 .row()
// Add a back button with an action that updates the main menu's photo and caption
.back('< Back', async (ctx) => {
    await ctx.editMessageMedia({
      type: 'photo',
      media: 'https://i.imgur.com/QW1p79O.jpeg',
      caption: 'Main Menu'
    });
});

// Register submenu to main menu
mainMenu.register(submenuMenu);
  // // Periodically check for payment status updates
  // const intervalId = setInterval(async () => {
  //   const paymentSuccessful = await checkPaymentStatus(chargeCode);
  //   if (paymentSuccessful) {
  //     clearInterval(intervalId);
  //   }
  // }, 5000);
}

async function checkPaymentStatus(chargeCode) {
  // Check for payment status updates
  let paymentSuccessful = false;
  
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


    // Mark user as paid in Firebase
    const userId = ctx.from.id;
    await db.collection('users').doc(userId).set({ paid: true });

    // Get credentials from Firebase
    const credentialsDoc = await db.collection('credentials').doc('99ls1DH4CPfJG0OCSSjU').get();
    const e = credentialsDoc.data().email;
    const p = credentialsDoc.data().password;

    // Send account credentials to user
    await ctx.reply(`Here are your account credentials:\nEmail: ${e}\nPassword: ${p}`);
    
   } else if (chargeStatusData === 'CANCELED' || chargeStatusData === 'EXPIRED') { 
     clearInterval(intervalId); 
     // Handle expired payments here
     await ctx.reply(`Transaction expired. Please try again.`);

      // Dynamically update menu to show Generate New Payment Link button
      submenuMenu.text('Generate New Payment Link', async (ctx) => {
        // Call generatePaymentLink function here to generate a new payment link when user clicks on this button
        await generatePaymentLink();
        submenuMenu.editMenu(ctx);
      });
   }

   return paymentSuccessful;
}




// const M_INIT_MENU_OBJECT= {
//   photo: 'https://imgur.com/9UUyyUf',
//   caption: 'Hello for GPT-4',
//   reply_markup: {
//     inline_keyboard: [
//       [{text: 'Pay For Subscription', callback_data: 'PAY_FOR_SUBSCRIPTION'}],
//       [{text: 'FAQ', callback_data: 'FAQ'}]
//     ]
//   }
// }

// const M_PAY_FOR_SUBSCRIPTION_OBJECT = {
//   photo: 'https://imgur.com/TwaZjSj',
//   caption: 'Hey, its Payment page',
//   reply_markup: {
//       inline_keyboard: [
//           [{ text: 'Pay Now', callback_data: 'PAY_FOR_SUBSCRIPTION' }],
//       ]
//   }
// };

// bot.action('BACK_TO_INIT_MENU', async (ctx) => {
//   console.log(ctx)
//   ctx.editMessageMedia({
//       type: 'photo',
//       media: {
//         source: M_INIT_MENU_OBJECT.photo
//       },
//       caption: M_INIT_MENU_OBJECT.caption
//   }, M_INIT_MENU_OBJECT.reply_markup);
// });

// bot.action('FAQ', (ctx) => {
//   ctx.reply('LOL')
// })



// const mainMenu = new Menu('main-menu')
//   .text('Option 1', (ctx) => ctx.reply('You selected Option 1!'))
//   .row()
//   .submenu('Subscribe now', 'submenu-menu', async (ctx) => {
//     // Edit message to display submenu photo and caption
//     await ctx.editMessageMedia({
//       type: 'photo',
//       media: 'AgACAgIAAxkBAAIBWWQYzCjyfj_4kgavMYYeSVsWZsAvAALYxTEbZkrBSFsmAusWTW3jAQADAgADcwADLwQ',
//       caption: 'Subscribe to GPT-4 now!'
//     });
//   })
//   .row()
//   .text('Option 2', (ctx) => ctx.reply('You selected Option 2!'));

// const mainMenu = new Menu('main-menu')
//   .text('Option 1', (ctx) => ctx.reply('You selected Option 1!'))
//   .row()
//   .submenu('Submenu', 'submenu-menu', async (ctx) => {
//     // Edit message to display submenu photo and caption
//     await ctx.editMessageMedia({
//       type: 'photo',
//       media: 'AgACAgIAAxkBAAIBWWQYzCjyfj_4kgavMYYeSVsWZsAvAALYxTEbZkrBSFsmAusWTW3jAQADAgADcwADLwQ',
//       caption: 'Submenu'
//     });
   
//    // Call generatePaymentLink function here to generate the payment link when user navigates from main menu to submenu
//    await generatePaymentLink();
//  })
//  .row()
//  .text('Option 2', (ctx) => ctx.reply('You selected Option 2!'));

 console.log('Before submenu block: ' + paymentURL)
//  const submenuMenu = new Menu('submenu-menu')
//  .text('Submenu Option 1', (ctx) => ctx.reply('You selected Submenu Option 1!'))
//  .row()
//  .url('Pay Now', )
//  .url('Pay Now', 'https://commerce.coinbase.com/checkout/14688e2b-38c5-4cd5-be27-68c36260797c') // Add this line to create a URL button with the payment link
//  .row()
//  .text('Submenu Option 2', (ctx) => ctx.reply('You selected Submenu Option 2!'))
//  .row()
// // Add a back button with an action that updates the main menu's photo and caption
// .back('< Back', async (ctx) => {
//     await ctx.editMessageMedia({
//       type: 'photo',
//       media: 'https://i.imgur.com/QW1p79O.jpeg',
//       caption: 'Main Menu'
//     });
// });

// // Register submenu to main menu
// mainMenu.register(submenuMenu);

// Make menus interactive
bot.use(mainMenu);
bot.use(submenuMenu);


bot.command('start', async (ctx) => {
    await ctx.replyWithPhoto('AgACAgIAAxkBAAIBPmQYa5DeqLCRKXs2T7lGbqpM_HStAALXxTEbZkrBSFp-sJ4LFg2vAQADAgADcwADLwQ' , {
      caption: 'Main Menu',
      reply_markup: mainMenu,
    });
  });

bot.start()

  // bot.on('message', (ctx) => {
  //   const fileId = ctx.message.photo[0].file_id;
  //   ctx.reply(`File ID: ${fileId}`);
  // });
  

// bot.command('start', (ctx) => {
//     ctx.replyWithHTML(
//       'Welcome!',
//       {
//         reply_markup: {
//           keyboard: [
//             [{ text: 'My Button' }]
//           ],
//           resize_keyboard: true,
//           one_time_keyboard: false
//         }
//       }
//     );

  //   ctx.replyWithPhoto(
  //       { source: 'src/https___editors.dexerto.com_wp-content_uploads_2023_03_14_OpenAI-GPT-4.jpg' },
  //       {
  //         caption: M_INIT_MENU_OBJECT.caption,
  //         reply_markup: M_INIT_MENU_OBJECT.reply_markup
  //       }
  //     );
  // });

// bot.action('NEED_HELP', (ctx) => {
//     ctx.editMessageText(`If you need help, please contact @YourUsername on Telegram.`,
//       Telegraf.Extra.markup((markup) => {
//         return markup.inlineKeyboard([
//           markup.callbackButton('Back', 'BACK')
//         ]);
//       })
//     );
//   });

//   bot.action('BACK_TO_MAIN_MENU', (ctx) => {
    
//     ctx.editMessageMedia({
//       type: 'photo',
//       media: 'https://imgur.com/9UUyyUf',
//       caption: M_INIT_MENU_OBJECT.caption
//   } , M_INIT_MENU_OBJECT.reply_markup);
//   })

//sendPhoto('1063973980', '/Users/markcohen/vscode/OpenAI-TG-Bot/src/OpenAi.jpg');

// async function getFile(fileId) {
//   try {
//     const file = await bot.api.getFile(fileId);
//     console.log(file);
//   } catch (error) {
//     console.error(error);
//   }
// }

// getFile('AgACAgIAAxkBAAIBPmQYa5DeqLCRKXs2T7lGbqpM_HStAALXxTEbZkrBSFp-sJ4LFg2vAQADAgADcwADLwQ');


// bot.action('PAY_FOR_SUBSCRIPTION', async (ctx) => {

//   let paymentURL

  
//     // Create a charge
//     const chargeData = {
//       name: 'Subscription',
//       description: 'Pay for subscription',
//       local_price: {
//         amount: paymentAmount,
//         currency: paymentCurrency
//       },
//       pricing_type: 'fixed_price'
//     };
//     const chargeResponse = await axios.post(
//       'https://api.commerce.coinbase.com/charges',
//       chargeData,
//       {
//         headers: {
//           'X-CC-Api-Key': coinbaseCommerceAPIKey,
//           'X-CC-Version': '2018-03-22'
//         }
//       }
//     );
//     const chargeCode = chargeResponse.data.data.code;
//     paymentURL = `https://commerce.coinbase.com/charges/${chargeCode}`
  
//     // Send payment instructions to user
//     //https://commerce.coinbase.com/charges/${chargeCode}
//     //await ctx.reply(`Please follow this link to complete your payment: ${paymentURL}`);

//     console.log(ctx)
    
//     ctx.editMessageMedia({
//       type: 'photo',
//       media: M_PAY_FOR_SUBSCRIPTION_OBJECT.photo,
//       caption: M_PAY_FOR_SUBSCRIPTION_OBJECT.caption,
  
//     }, {
//       reply_markup: {
//         inline_keyboard: [
//           [{ text: 'Pay Now', url: paymentURL }],
//           [{text: 'Back To Main Menu', callback_data: 'BACK_TO_INIT_MENU'}]
//         ]
//       }
//     })
  
//     // Check for payment status updates
//     let paymentSuccessful = false;
//     while (!paymentSuccessful) {
//       const chargeStatusResponse = await axios.get(
//         `https://api.commerce.coinbase.com/charges/${chargeCode}`,
//         {
//           headers: {
//             'X-CC-Api-Key': coinbaseCommerceAPIKey,
//             'X-CC-Version': '2018-03-22'
//           }
//         }
//       );
      
//       const chargeStatusData = chargeStatusResponse.data.data;
      
//       if (chargeStatusData.timeline.pop().status === 'COMPLETED') {
//         paymentSuccessful = true;
        
//         // Send private message with transaction details
//         const transactionDetails = `Charge code: ${chargeCode}\nPayment method: ${chargeStatusData.payments[0].payment_method}\nValue: ${chargeStatusData.payments[0].value.local.amount} ${chargeStatusData.payments[0].value.local.currency}`;
//         await sendPrivateMessage(`New transaction performed:\n\n${transactionDetails}`);
        
//         // Send account credentials to user. Testing only!!!
//         // const email = 'mark@mark.com';
//         // const password = 'lalaland';
//         // await ctx.telegram.sendMessage(ctx.chat.id, `Here are your account credentials:\nEmail: ${email}\nPassword: ${password}`);
        
//         break;
//       } else if (chargeStatusData === 'CANCELED' || chargeStatusData === 'EXPIRED') {
//         break;
//       }
  
//       // Wait before checking again
//       await new Promise(resolve => setTimeout(resolve, 5000));
//     }
    
//      // Mark user as paid in Firebase
//         const userDocRef = db.collection('users').doc(ctx.from.id.toString());
//         await userDocRef.set({ paid: true }, { merge: true });


//     // Get credentials from Firebase
//         const credentialsDocRef = db.collection('credentials').doc('99ls1DH4CPfJG0OCSSjU');
//         const credentialsDocSnapshot = await credentialsDocRef.get();
//         const credentialsData = credentialsDocSnapshot.data();

//     // Send account credentials to user
//         await ctx.telegram.sendMessage(ctx.chat.id, `Here are your account credentials:\nEmail: ${credentialsData.email}\nPassword: ${credentialsData.password}`);

//   });


  // bot.action('BACK', (ctx) => {
  //   ctx.editMessageText(`Your message text here`, {
  //     reply_markup: {
  //       inline_keyboard: [
  //         [{ text: 'Pay for subscription', callback_data: 'PAY_FOR_SUBSCRIPTION' }]
  //       ]
  //     }
  //   });
  // });
