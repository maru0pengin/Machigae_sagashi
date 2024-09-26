import firebase from "firebase/app"
import 'firebase/functions'
import store from "./store";


require('dotenv').config();

export default {
  init() {
    firebase.initializeApp(JSON.parse(process.env.VUE_APP_FIREBASE_CONFIG))
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
  },
  login() {
    const provider = new firebase.auth.TwitterAuthProvider()
    firebase.auth().signInWithRedirect(provider).then((userCredential) => {
      console.log(userCredential.additionalUserInfo.username)
      store.commit('onTwitterIDChanged', userCredential.additionalUserInfo.username);
    })
  },
  logout() {
    firebase.auth().signOut()
  },
  onAuth() {
    firebase.auth().onAuthStateChanged(user => {
      user = user ? user : {};
      store.commit('onAuthStateChanged', user);
      store.commit('onUserStatusChanged', user.uid ? true : false);
    })
  }
}