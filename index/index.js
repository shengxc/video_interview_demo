Page({
  onLoad() {
    this.interviewing = false
    this.setData({
      interviewing: this.interviewing
    })
    this.ctx = wx.createCameraContext()
    this.timer = null

    var plugin = requirePlugin("WechatSI")
    this.manager = plugin.getRecordRecognitionManager()
    this.manager.onRecognize = function (res) {
      console.log("on recognize voice", res.result)
      this.setData({
        "caption": res.result
      })
    }
    this.manager.onStop = function (res) {
      console.log("on stop recognize voice, result:", res.result)
    }
    this.manager.onStart = function (res) {
      console.log("on start recognize voice", res)
    }
    this.manager.onError = function (res) {
      console.error("recognize voice error", res.msg)
    }
  },
  toggle() {
    if (this.interviewing) {
      this.stopInterview()
    } else {
      this.startInterview()
    }
  },
  startInterview() {
    console.log('start interview')
    this.interviewing = true
    this.setData({
      interviewing: this.interviewing
    })
    this.timer = setInterval(
      ()=> {
        this.ctx.takePhoto({
          success: (res)=>{
            wx.uploadFile({
              url: 'https://api-cn.faceplusplus.com/facepp/v3/detect',
              filePath: res.tempImagePath,
              name: "image_file",
              formData: {
                return_landmark: 0,
                return_attributes: "headpose,eyegaze,emotion,gender,blur,eyestatus",
                api_key: "M-FGrKlScWclZJFm6EJCvmIZ4DqYiYa_",
                api_secret: "ifzBnOh7gYYvLypgILwfO6jk3SvGpNPz"
              },
              success: (res) => {
                var result = JSON.parse(res.data)
                if (result == null) {
                  return
                }
                if(result.faces.length == 0) {
                  this.setData({
                    error_tips: "你人呢？",
                    emotion: ""
                  })
                } else if (result.faces.length > 1){
                  this.setData({
                    error_tips: "怎么多了{0}个人".format(result.faces.length - 1),
                    emotion: ""
                  })
                } else {
                  var face = result.faces[0]
                  var headpose = face.attributes.headpose
                  if (Math.abs(headpose.pitch_angle) > 20 ||
                      Math.abs(headpose.roll_angle) > 20 ||
                      Math.abs(headpose.yaw_angle) > 20) {
                    this.setData({
                      error_tips: "请正视摄像头",
                      emotion: ""
                    })
                  } else {
                    var max = -1
                    var emotion = null
                    var emotion_map = {
                      "anger": "生气",
                      "disgust": "厌恶",
                      "fear": "恐惧",
                      "happiness": "高兴",
                      "neutral": "平静",
                      "sadness": "伤心",
                      "suprise": "惊讶"
                    }
                    for(let em in face.attributes.emotion) {
                      if (face.attributes.emotion[em] > max) {
                        max = face.attributes.emotion[em]
                        emotion = em
                      }
                    }
                    this.setData({
                      error_tips: "",
                      emotion: emotion_map[emotion]
                    })
                  }
                }
              }
            })
          }
        })
      },
      500
    )
    this.manager.start()
  },
  stopInterview() {
    console.log("stop interview")
    this.interviewing = false
    this.setData({
      interviewing: this.interviewing
    })
    if(this.timer!=null) {
      clearInterval(this.timer)
      this.timer=null
    }
    this.manager.stop()
  },
  error(e) {
    console.log(e.detail)
  }
})