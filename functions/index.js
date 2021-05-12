const functions = require("firebase-functions");
const admin = require('firebase-admin')
admin.initializeApp()

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// データベースの参照を作成
var firestore = admin.firestore()

exports.addUser = functions.auth.user().onCreate((user) => {

  firestore.collection("users")
    .doc(user.uid)
    .set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      displayName:user.displayName,
      photoURL: user.photoURL,
    })
});