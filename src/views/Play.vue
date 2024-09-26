<template>
  <div class="my-36 flex justify-center">
    <Loading v-bind:loading="loading" />
    <div v-show="!loading" class="main-card bg-white shadow">
      <p class="font-bold text-xl pl-2 pt-1">{{ title }}</p>

      <div class="flex items-end">
        <div class="text-left px-2 text-xl">
          間違い:{{ clearedCountArray.length }}/{{ differencesNum }}
        </div>
        <div class="px-4">Timer:{{ displayTimer }}</div>
        <div class="ml-auto text-sm pl-2 pr-2">{{ name }}</div>
      </div>
      <hr />

      <div v-if="!isStart" class="start-cover">
        <div class="flex flex-col bg-white rounded-2xl p-6">
          <div class="my-2">
            間違いは<span class="text-lg font-bold">{{ differencesNum }}個</span
            >あります。<br />
            上の画像と見比べて、<span class="text-lg font-bold">下の画像</span
            >の間違いを<br />タップ・クリックしよう！！
          </div>
          <button class="start_button" @click="gameStart">スタート</button>
          <p class="font-bold text-red-400">※ 音が鳴ります</p>
        </div>
      </div>
      <div class="mt-2">
        <div class="mx-auto">
          <p class="text-left text-xl font-bold px-2">みほん</p>
          <img :src="correctImgPath" class="border-2 w-[400px] mx-auto" />
        </div>
        <p class="pt-2">
          <span class="font-bold">下の画像の間違い</span
          >をタップ・クリックしよう!
        </p>
        <div class="mx-auto relative">
          <p class="text-left text-xl font-bold px-2">まちがい</p>
          <div
            class="bg-yellow-300 flex items-center w-[416px] h-[240px] mx-auto"
          >
            <div class="relative w-[400px] h-[225px] mx-auto">
              <div
                v-for="(classObject, index, key) in classObjects"
                :key="key"
                v-show="clearedCountArray.includes(index + 1)"
                class="
                  absolute
                  border-red-400 border-[6px]
                  rounded-full
                  mx-auto
                  w-[40px]
                  h-[40px]
                "
                v-bind:style="classObject"
              ></div>

              <img
                id="incorrectImg"
                :src="incorrectImgPath"
                @mousedown="downStart"
              />
            </div>
          </div>
          <div v-show="false">
            <img ref="labelImg" class="" width="400" height="225" />
          </div>
        </div>
      </div>
      <div class="flex justify-end mt-1 mx-2 text-xs">音源：OtoLogic</div>
      <div class="flex justify-end items-center mt-1">
        <button class="delete-button" @click="openDeleteModal">
          この問題を削除
        </button>
        <QRCode :QRCodeTitle="title" :url="location" />
      </div>
    </div>
    <ResultDisplay v-bind:show="isIncorrect">
      <div class="lg:w-1/3 md:w-2/3 mx-auto px-8">
        <img class="relative" src="@/assets/incorrect.png" />
        <div class="absolute left-1/2 bottom-[30%] transform -translate-x-1/2">
          <div class="text-3xl font-bold text-stroke">
            残り{{ differencesNum - clearedCountArray.length }}個
          </div>
        </div>
      </div>
    </ResultDisplay>
    <ResultDisplay v-bind:show="isCorrect">
      <div class="lg:w-1/3 md:w-2/3 mx-auto px-8">
        <img class="relative" src="@/assets/correct.png" />
        <div class="absolute left-1/2 bottom-[30%] transform -translate-x-1/2">
          <div class="text-3xl font-bold text-stroke">
            残り{{ differencesNum - clearedCountArray.length }}個
          </div>
        </div>
      </div>
    </ResultDisplay>
    <Modal
      v-bind:show="isShowDeleteModal"
      v-bind:klass="'w-5/6 md:w-2/3 lg:w-1/3'"
    >
      <p class="text-xl">削除パスワードを入力してください</p>
      <div class="mx-auto my-4">
        <input
          type="text"
          v-model="password"
          class="input-form"
          placeholder="削除用パスワード"
          required
        />
        <div class="text-sm mt-2">
          <p class="text-left text-red-500">※削除した作品は復元できません。</p>
        </div>
      </div>
      <div class="ml-auto">
        <button class="delete-button" @click="deleteQuiz">
          この問題を削除
        </button>
        <button class="main_button mx-2" @click="closeDeleteModal">
          キャンセル
        </button>
      </div>
    </Modal>
    <Modal v-bind:show="isCrear" v-bind:klass="'w-5/6 md:w-2/3 lg:w-1/3'">
      <img src="@/assets/CLEAR.png" />

      <p class="mx-auto my-2 text-xl">
        <span class="font-bold text-2xl">{{ displayTimer }}秒</span
        >で見つけられました！
      </p>
      <div class="mx-auto flex flex-col justify-center items-center mt-2">
        <button
          class="clear_button w-40"
          @click="tweet"
          v-bind:disabled="!isCrear"
        >
          ツイートする
        </button>
        <button
          class="clear_button w-40 mt-1"
          @click="resetGame"
          v-bind:disabled="!isCrear"
        >
          もう一度遊ぶ
        </button>
        <button
          class="clear_button w-40 mt-1"
          @click="gotoHome"
          v-bind:disabled="!isCrear"
        >
          戻る
        </button>
      </div>
    </Modal>
  </div>
</template>

<script>
import firebase from 'firebase/app'
import 'firebase/firestore'

import Loading from '@/components/Loading'
import Modal from '@/components/Modal'
import ResultDisplay from '@/components/ResultDisplay'
import QRCode from '@/components/QRCode'
import { getAuthor } from '@/utils/get_author'
//import { getFunctions, httpsCallable } from 'firebase/functions'

export default {
  data: function () {
    return {
      correctImgPath: '', //正解画像のパスを入れる
      incorrectImgPath: '', //不正解画像のパスを入れる
      differencesImagePath: '', //間違い位置の画像
      title: null,
      name: null,
      differences: [], //ラベリングされた配列
      differencesNum: 0,
      db: null,
      loading: true,
      timer: 0.0,
      timerId: null,
      displayTimer: '0.00',
      score: 0,
      isCrear: false,
      isStart: false,
      isIncorrect: false,
      incorrectTime: 0,
      isCorrect: false,
      centroids: [],
      clearedCountArray: [],
      ImgPositionX: null, // 間違い画像の位置(x)
      ImgPositionY: null, // 間違い画像の位置(y)
      isLoggedQuiz: false, // ログインされた状態で投稿されたクイズかどうか
      isShowDeleteModal: false,
      password: '',
    }
  },
  components: {
    Loading,
    Modal,
    QRCode,
    ResultDisplay,
  },
  created: function () {
    this.db = firebase.firestore() // dbインスタンスを初期化
  },
  computed: {
    id: function () {
      return this.$route.params.id
    },
    location: function () {
      return location.href
    },
    tweetURL: function () {
      const url = encodeURI(`${location.href}`)
      return `http://twitter.com/intent/tweet?text=${this.displayTimer}秒で間違えを\n見つけられました！%20%23まちがいさがしメーカー&url=${url}`
    },
    //正解の〇を出すためのクラス
    classObjects: function () {
      let array = []
      for (let i = 0; i < this.centroids.length; i++) {
        array.push({
          top: `${this.centroids[i]?.x}px`,
          left: `${this.centroids[i]?.y}px`,
        })
      }
      return array
    },
  },
  mounted: async function () {
    //スクロール位置を指定
    if (window.innerWidth < 770) scrollTo(0, 78)
    else scrollTo(0, 0)
    //間違え位置の取得
    let docRef = await this.db.collection('quizzes').doc(this.id)
    docRef
      .get()
      .then(async (doc) => {
        if (doc.exists) {
          if (doc.data().authorRef) {
            let author = await getAuthor(doc)
            this.name = author.displayName
            this.isLoggedQuiz = true
          } else {
            this.name = doc.data().name
            this.isLoggedQuiz = false
          }

          this.title = doc.data().title
          this.correctImgPath = doc.data().quiz[0].images.correct
          this.incorrectImgPath = doc.data().quiz[0].images.incorrect
          this.differencesImagePath = doc.data().quiz[0].differencesImage //間違い位置の画像

          let labelImg = this.$refs.labelImg
          let self = this
          //画像を読み込んだ後にラベリングを行う
          await this.loadImage(this.differencesImagePath, labelImg).then(() => {
            self.labelling()
          })
        } else {
          // doc.data() が未定義の場合
          console.log('No such document!')
          this.$router.push({ name: 'Home', query: this.$route.query })
        }
      })
      .catch((error) => {
        console.log('Error getting document:', error)
        this.$router.push({ name: 'Home', query: this.$route.query })
      })
      .finally(() => {
        this.loading = false
      })
  },
  methods: {
    tweet() {
      location.href = this.tweetURL
    },
    gotoHome() {
      this.$router.push({ name: 'Home', query: this.$route.query })
    },
    async labelling() {
      let src = await this.$cv.imread(this.$refs.labelImg)
      let dst = new this.$cv.Mat()
      let gray = new this.$cv.Mat()
      let markers = new this.$cv.Mat()
      let stats = new this.$cv.Mat()
      let floatCentroids = new this.$cv.Mat()
      // gray and threshold image
      this.$cv.cvtColor(src, gray, this.$cv.COLOR_RGBA2GRAY, 0)
      this.$cv.threshold(
        gray,
        gray,
        0,
        255,
        this.$cv.THRESH_BINARY_INV + this.$cv.THRESH_OTSU
      )
      //白黒を反転
      this.$cv.bitwise_not(gray, gray)
      //ラベリング
      this.differencesNum =
        this.$cv.connectedComponentsWithStats(
          gray,
          markers,
          stats,
          floatCentroids
        ) - 1
      //重心を取得
      await this.getCenters(floatCentroids)
      //ラベリングのカラー付け
      this.getDifferences(markers)

      src.delete()
      dst.delete()
      gray.delete()
      markers.delete()
      stats.delete()
      floatCentroids.delete()
    },
    getDifferences(markers) {
      for (let i = 0; i < markers.rows; i++) {
        let col = []
        for (let j = 0; j < markers.cols; j++) {
          let num = markers.intPtr(i, j)[0]
          col.push(num)
        }
        this.differences.push(col)
      }
    },
    loadImage(src, img) {
      return new Promise((resolve, reject) => {
        img.onload = () => resolve(img)
        img.onerror = (e) => reject(e)
        img.src = src
      })
    },
    async getCenters(markers) {
      for (let i = 1; i < markers.rows; i++) {
        this.centroids.push({
          x: parseInt(markers.doublePtr(i, 1)[0]) - 20,
          y: parseInt(markers.doublePtr(i, 0)[0]) - 20,
        })
      }
    },
    downStart(e) {
      let x = e.layerX
      let y = e.layerY
      //console.log(`x:${x},y:${y}`)
      if (x <= 399 && x >= 0 && y <= 224 && y >= 0) {
        let label = this.differences[y][x]
        //ラベルが0では無く、回答済みでない場合に追加
        if (label !== 0) {
          if (!this.clearedCountArray.includes(label)) {
            this.clearedCountArray.push(label)
            //ゲームクリア判定
            if (this.clearedCountArray.length === this.differencesNum) {
              const audio = new Audio(require('@/assets/crear.mp3'))
              audio.play()
              this.stopTimer()
              this.isCrear = true
            } else {
              const audio = new Audio(require('@/assets/correct.mp3'))
              audio.play()
              this.isCorrect = true
              setTimeout(() => {
                this.isCorrect = false
              }, 600)
            }
          }
        } else {
          const audio = new Audio(require('@/assets/incorrect.mp3'))
          audio.play()
          this.isIncorrect = true
          setTimeout(() => {
            this.isIncorrect = false
          }, 600)
        }
      }
    },
    gameStart() {
      this.isStart = true
      this.timerId = setInterval(() => {
        this.timer += 0.01
        this.displayTimer = this.timer.toFixed(2)
      }, 10)
    },
    stopTimer() {
      clearInterval(this.timerId)
    },
    resetGame() {
      this.isCrear = false
      this.isStart = false
      this.timer = 0.0
      this.displayTimer = '0.00'
      this.clearedCountArray = []
    },
    closeDeleteModal() {
      this.isShowDeleteModal = false
    },
    openDeleteModal() {
      this.isShowDeleteModal = true
    },
    deleteQuiz() {
      const functions = firebase.app().functions('asia-northeast1')
      console.log(functions)
      if (this.password) {
        var onDeleteQuiz = firebase.functions().httpsCallable('onDeleteQuiz')
        onDeleteQuiz().then((result) => {
          // Read result of the Cloud Function.
          var sanitizedMessage = result.data.text
          console.log(sanitizedMessage)
        })

        // const functions = getFunctions()
        // const onDeleteQuiz = httpsCallable(functions, 'onDeleteQuiz')
        // console.log('2')
        // onDeleteQuiz()
        //   .then((result) => {
        //     // Read result of the Cloud Function.
        //     /** @type {any} */
        //     const data = result.data
        //     const sanitizedMessage = data.text
        //     console.log(data)
        //     console.log(sanitizedMessage)
        //   })
        //   .catch((err) => {
        //     console.log(err)
        //   })
      } else {
        this.$message.warning('パスワードを入力してください', {
          showClose: false,
          type: 'error',
        })
      }
    },
  },
}
</script>

<style>
.main-card {
  width: 424px;
  @apply border-4;
}
.start-cover {
  background-color: rgb(50, 50, 50, 0.95);
  width: 416px;
  height: 565px;
  @apply absolute z-10 flex justify-center items-center;
}
.clear_button {
  @apply px-4 py-1 text-sm font-medium leading-6 text-center text-white bg-blue-400 rounded-full shadow hover:shadow-lg focus:bg-indigo-500 focus:outline-none;
}
.start_button {
  transition: all 0.25s ease;
  cursor: pointer;
  @apply border-2 border-blue-400 text-5xl text-blue-400 font-extrabold font-sans bg-white mx-auto mt-4 py-2 px-8 rounded-full hover:bg-blue-400 hover:text-white focus:outline-none md:hover:tracking-widest;
}
.text-stroke {
  text-shadow: 1px 0 0 white, 0 1px 0 white, -1px 0 0 white, 0 -1px 0 white;
}
</style>
