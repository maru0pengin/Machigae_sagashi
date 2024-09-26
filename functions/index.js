const functions = require("firebase-functions");
const admin = require('firebase-admin')
admin.initializeApp()
//require('dotenv').config()
//const firebaseConfigObj = JSON.parse(process.env.VUE_APP_FIREBASE_CONFIG)

//const app_domain = "machigaesagashi-dev.web.app"
const app_domain = "machigaesagashi.site"
const OGP_IMG_WIDTH = 1200
const OGP_IMG_HEIGHT = 630

// データベースの参照を作成
let db = admin.firestore()
//const bucket = admin.storage().bucket("machigaesagashi-dev.appspot.com")
const bucket = admin.storage().bucket("game-test-project-3785f.appspot.com")

exports.addUser = functions.auth.user().onCreate((user) => {
  db.collection("users")
    .doc(user.uid)
    .set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      displayName: user.displayName,
      twitterId: "",
      photoURL: user.photoURL,
    })
});

exports.onDeleteStorageImage = functions.firestore.document('/quizzes/{quizId}').onDelete((snap, context) => {
  //snapを引数に入れてないとエラー
  const { quizId } = context.params
  return bucket.deleteFiles({
    prefix: `${quizId}`
  })
})

//匿名ユーザーがパスワードを使って削除
exports.onDeleteQuiz = functions.https.onCall((data, context) => {
  return{data:data,context:context}
});

exports.playpage = functions.https.onRequest((req, res) => {
  const [, , playid] = req.path.split('/')
  db.collection('quizzes').doc(playid).get().then(snap => {
    if (!snap) {
      res.status(404).end('404 Not Found')
      return
    }
    const playItem = snap ? snap.data() : {}
    const title = playItem.title || ''
    const imageURL = playItem.imageURL || `https://${app_domain}/image/ogp.png`
    const html = createHtml(title, playid, imageURL)

    res.set('Cache-Control', 'public, max-age=600, s-maxage=600')
    res.status(200).end(html)
    return
  }).catch((err) => {
    //エラー時はデフォルトのhtml（固定のOGP）を返す
    console.warn(err)
    const imageURL = `https://${app_domain}/image/ogp.png`
    const html = createHtml("まちがいさがしメーカー", playid, imageURL)
    res.set('Cache-Control', 'public, max-age=600, s-maxage=600')
    res.status(200).end(html)
    return
  })
});

const createHtml = (title, playid , imageURL) => {
  const SITEURL = `https://${app_domain}`
  const PAGEURL = `${SITEURL}/play/${playid}`
  const DESCRIPTION = 'まちがいさがしメーカーは、誰でも間違い探しクイズを作成、投稿、シェアできるWebアプリケーションです。'
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>まちがいさがしメーカー</title>
    <meta property="og:title" content="${title}|まちがいさがしメーカー">
    <meta property="og:image" content="${imageURL}">
    <meta property="og:image:width" content="${OGP_IMG_WIDTH}">
    <meta property="og:image:height" content="${OGP_IMG_HEIGHT}">
    <meta property="og:description" content="${DESCRIPTION}">
    <meta property="og:url" content="${PAGEURL}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="まちがいさがしメーカー">
    <meta name="twitter:site" content="${SITEURL}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}|まちがいさがしメーカー">
    <meta name="twitter:image" content="${imageURL}">
    <meta name="twitter:description" content="${DESCRIPTION}">
  </head>
  <body>
    <script type="text/javascript">window.location="/_play/${playid}";</script>
  </body>
</html>
`
}
