<template>
  <div>
    <FullScreenLoading v-bind:loading="loading" />
    <div>
      <h3 class="description">問題の情報を入力してください</h3>
      <hr />
      <div>
        <p class="px-4 text-left pt-2">作品名を入力してください</p>
        <input
          type="text"
          v-model="title"
          class="input-form"
          placeholder="作品名"
          required
        />

        <div v-if="!userStatus">
          <p class="px-4 text-left pt-2">ハンドルネームを入力してください</p>
          <input
            type="text"
            v-model="name"
            class="input-form"
            placeholder="ハンドルネーム"
            required
          />
          <p class="px-4 text-left pt-2">
            削除用パスワードを入力してください<br /><span class="text-xs"
              >(6文字以上)</span
            >
          </p>
          <input
            type="text"
            v-model="password"
            class="input-form"
            placeholder="削除用パスワード"
            required
          />
          <input
            type="text"
            v-model="retypePassword"
            class="input-form"
            placeholder="再入力"
            required
          />
        </div>
        <p class="mt-4">問題を公開するか選択してください</p>
        <el-radio v-model="radio" label="1">公開</el-radio>
        <el-radio v-model="radio" label="2">非公開</el-radio>
        <br />
        <button
          class="text-xs text-blue-400 focus:outline-none"
          @click="description"
        >
          <i class="el-icon-question pr-1 pl-40"></i>公開とは？
        </button>
      </div>
      <div class="mt-1 centerize">
        <button class="main_button mx-2" @click="gotoBack">戻る</button>
        <button class="submit_button mx-2" @click="submit">
          保存して投稿完了
        </button>
      </div>
      <Modal
        v-bind:show="isShowModal"
        v-bind:klass="'w-5/6 md:w-2/3 lg:w-1/3'"
        @close="description"
      >
        <p class="text-xl">公開とは?</p>
        <div class="text-sm mt-2">
          <p class="text-left">
            公開に設定すると、当サイトのトップページから誰でもこの問題を遊ぶことができます。
            非公開へ設定すると、問題のURLを知っている方のみ遊ぶことができます。
          </p>
        </div>
        <div class="ml-auto">
          <button class="main_button mx-2" @click="description">OK</button>
        </div>
      </Modal>
    </div>
  </div>
</template>

<script>
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/storage'

import Modal from '@/components/Modal'
import Firebase from './../../firebase'
import FullScreenLoading from '@/components/FullScreenLoading'
export default {
  name: 'setInformations',
  components: { Modal, FullScreenLoading },
  data() {
    return {
      db: null,
      title: '',
      name: '匿名さん',
      id: String,
      radio: '1',
      isShowModal: false,
      storageRef: null,
      loading: false,
      password: '',
      retypePassword: '',
    }
  },
  computed: {
    isPublic() {
      return this.radio === '1'
    },
    userStatus() {
      // ログインするとtrue
      return this.$store.getters.isSignedIn
    },
    user() {
      // ログインするとtrue
      return this.$store.getters.user
    },
  },
  props: {
    correctImage: String,
    incorrectImage: String,
    defaltCorrect: String,
    defaltIncorrect: String,
    differencesImage: String,
  },
  created: function () {
    Firebase.onAuth()
    this.db = firebase.firestore() // dbインスタンスを初期化
    this.storageRef = firebase.storage().ref()
  },
  mounted() {
    scrollTo(0, 0)
    //画像が渡されてない場合は、アップロード画面へ飛ばす
    if (!this.correctImage || !this.incorrectImage) {
      this.$router.push({ name: 'imageUpload', query: this.$route.query })
    }
  },
  methods: {
    async submit() {
      if (!this.title) {
        this.$message.warning('作品タイトルを入力してください', {
          showClose: false,
          type: 'error',
        })
        return
      }
      if (!this.userStatus) {
        if (!this.name) {
          this.$message.warning('ハンドルネームを入力してください', {
            showClose: false,
            type: 'error',
          })
          return
        }
        if (this.password.length < 6 || this.retypePassword.length < 6) {
          this.$message.warning('パスワードが短すぎます', {
            showClose: false,
            type: 'error',
          })
          return
        }
        if (this.password.length !== this.password.length) {
          this.$message.warning(
            'パスワードと再入力されたパスワードが異なります',
            {
              showClose: false,
              type: 'error',
            }
          )
          return
        }
      }

      this.loading = true
      let uid,
        userRef = null
      if (this.userStatus) {
        uid = this.user?.uid
        userRef = this.db.collection('users').doc(uid)
      }
      let quizzesCollection = this.db.collection('quizzes')
      let images = {
        correct: this.correctImage,
        incorrect: this.incorrectImage,
      }
      let quiz = [
        {
          differencesImage: this.differencesImage,
          images: images,
        },
      ]
      // 「quizzes」というコレクションに対して {} で定義した情報を add する
      /*FireStoreへの保存*/
      const quizRef = await quizzesCollection
        .add({
          createdAt: new Date(),
          isPublic: this.isPublic,
          name: this.name ?? '',
          title: this.title,
          authorRef: userRef ?? '',
          quiz: quiz,
          playedCount: 0,
          imageURL: '',
        })
        .catch((err) => {
          this.$rollbar.error(err)
          this.$message.warning(
            '作品の投稿に失敗しました。時間を置いて再度お試しください。',
            {
              showClose: false,
              type: 'error',
            }
          )
          return false
        })
      this.id = quizRef.id
      //storageへ見本画像を保存&URLの取得
      const imageURL = await this.saveImage(this.id)
      //firestoreへURLを保存
      await quizzesCollection
        .doc(this.id)
        .update({
          imageURL: imageURL,
        })
        .catch((err) => {
          this.$rollbar.error(err)
        })

      // ログインしているのであれば、usersコレクションへ作品情報を追加
      if (this.userStatus) {
        await userRef
          .update({
            works: firebase.firestore.FieldValue.arrayUnion(quizRef),
          })
          .catch((err) => {
            this.$rollbar.error(err)
          })
      } else {
        // ログインしていない時は、削除パスワードを保存する
        let deletePasswordCollection = this.db.collection('deletePassword')
        await deletePasswordCollection
          .add({
            password: this.password,
            quizId: this.id,
          })
          .catch((err) => {
            this.$rollbar.error(err)
          })
      }
      this.loading = false
      this.gotoNext()
    },
    async saveImage(id) {
      let image_url = this.correctImage
      let ref = this.storageRef.child(`${id}/correct.png`)
      await ref.putString(image_url, 'data_url').catch((err) => {
        this.$rollbar.error(err)
      })
      return await ref.getDownloadURL()
    },
    description() {
      this.isShowModal = !this.isShowModal
    },
    gotoNext() {
      this.$router.push({
        name: 'completed',
        query: this.$route.query,
        params: {
          completedFlag: true,
          id: this.id,
          title: this.title,
        },
      })
    },
    gotoBack() {
      this.$router.push({
        name: 'setDifferences',
        query: this.$route.query,
        params: {
          correctImage: this.correctImage,
          incorrectImage: this.incorrectImage,
          defaltCorrect: this.defaltCorrect,
          defaltIncorrect: this.defaltIncorrect,
        },
      })
    },
  },
}
</script>
