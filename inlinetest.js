const { Bot, InputFile } = require('grammy')
const { Menu } = require('@grammyjs/menu')
const admin = require('firebase-admin');
require('dotenv').config()
const axios = require('axios');
const coinbaseCommerceAPIKey = process.env.COINBASE_API_KEY;

const bot = new Bot(process.env.TG_KEY)


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

// bot.on('message', async (ctx) => {
//   if (ctx.message.photo) {
//     const fileId = ctx.message.photo[0].file_id;
//     console.log(`The file_id of your photo is: ${fileId}`);
//   }
// });


// Create main menu
const mainMenu = new Menu('main-menu')
  .text('Option 1', (ctx) => ctx.reply('You selected Option 1!'))
  .row()
  .submenu('Submenu', 'submenu-menu', async (ctx) => {
    // Edit message to display submenu photo and caption
    await ctx.editMessageMedia({
      type: 'photo',
      media: {
        source: 'src/https___editors.dexerto.com_wp-content_uploads_2023_03_14_OpenAI-GPT-4.jpg'
      },
      caption: 'Submenu'
    });
  })
  .row()
  .text('Option 2', (ctx) => ctx.reply('You selected Option 2!'));

// Create submenu
const submenuMenu = new Menu('submenu-menu')
  .text('Submenu Option 1', (ctx) => ctx.reply('You selected Submenu Option 1!'))
  .row()
  .text('Submenu Option 2', (ctx) => ctx.reply('You selected Submenu Option 2!'))
  .row()
  .back('< Back');

// Register submenu to main menu
mainMenu.register(submenuMenu);

// Make menus interactive
bot.use(mainMenu);
bot.use(submenuMenu);

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

  bot.command('start', async (ctx) => {
    await ctx.replyWithPhoto({
        source: 'src/https___editors.dexerto.com_wp-content_uploads_2023_03_14_OpenAI-GPT-4.jpg'
    }, {
        caption: 'Main Menu',
        reply_markup: mainMenu,
    });
});


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

bot.start()
