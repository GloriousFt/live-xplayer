Component({
  properties : {
    liveList : {
      type : Array,
      value : [],
      observer : function(newLiveList, oldLiveList) {
        if (newLiveList.length === 0) {
          console.warn('直播地址列表为空');
          return;
        }
        if (this.currentLiveIndex >= newLiveList) {
          console.warn('默认设置播放直播列表的第一个');
          this.setData({
            currentLiveIndex : 0
          });
        }
      }
    },
    currentLiveIndex : {
      type : Number,
      value : 0
    },
    autoplay : {
      type : Boolean,
      value : false
    },
    muted : {
      type : Boolean,
      value : false
    },
    panelDuration : {
      type : Number,
      value : 3000
    }
  },
  data : {
    // display live player controller panel
    showLiveControlPanel: true,
    // current live player status, full screen or normal
    isFullScreen: false,
    // status : 0 for ready, 1 for playing, 2 for pausing, 3 for stopping
    liveStatus: 0,
    // default hide the resolution list panel
    showResolutionPanel: false
  },
  ready: function () {
    var that = this;
    // get live player context
    this.videoCtx = wx.createLivePlayerContext('livePlayer', this);
    // initialize the timer of panel controller
    this.timer = setTimeout(() => {
      that.setData({ showLiveControlPanel: false });
    }, this.data.panelDuration);
    if (this.data.autoplay) {
      this.livePlay();
    }
    if (this.data.muted) {
      this.liveMuted();
    }
  },
  detached: function () {
    if (this.data.liveStatus !== 3) {
      this.liveStop();
    }
  },
  methods : {
    resetTimer: function () {
      var that = this;
      clearTimeout(this.timer);
      this.timer = setTimeout(function () {
        that.setData({
          showLiveControlPanel: false,
          showResolutionPanel: false
        });
      }, this.data.panelDuration);
    },

    liveStateChange : function(e) {
      this.triggerEvent('statechange',{event : e});
    },

    // mute the live player
    liveMuted : function(e) {
      this.videoCtx.mute({
        success : (res) => {
          console.log('播放器静音成功！');
        },
        fail : (res) => {
          console.error('播放器静音失败！');
        }
      });
    },

    // play online streaming
    livePlay : function () {
      var that = this;
      this.resetTimer();
      this.videoCtx.play({
        success: res => {
          that.setData({
            liveStatus: 1
          });
          console.log('play success');
          console.log(res);
        },
        fail: res => {
          console.log('play fail');
          console.log(res);
        }
      });
    },

    livePause: function () {
      this.resetTimer();
      this.videoCtx.pause({
        success: res => {
          this.setData({
            liveStatus: 2
          });
          console.log('pause success');
        },
        fail: res => {
          console.log('pause fail');
        }
      });
    },

    liveStop: function () {
      this.resetTimer();
      this.videoCtx.stop({
        success: res => {
          this.setData({
            liveStatus: 3
          });
          console.log('stop success');
        },
        fail: res => {
          console.log('stop fail');
        }
      });
    },

    liveResume: function () {
      this.resetTimer();
      this.videoCtx.resume({
        success: res => {
          this.setData({
            liveStatus: 1
          });
          console.log('resume success');
        },
        fail: res => {
          console.log('resume fail');
        }
      })
    },

    liveFullScreen: function () {
      this.resetTimer();
      this.videoCtx.requestFullScreen({
        direction: -90,
        success: res => {
          console.log('full screen success');
        },
        fail: res => {
          console.log('full screen fail');
        }
      });
    },

    // listener of net status changing
    netStatus : function(e) {
      this.triggerEvent('netstatus', { e : e });
    },

    //listener of live player screen changing
    fullscreenchange: function (e) {
      var state = e.detail;
      if (state && state.fullScreen !== undefined) {
        this.setData({
          isFullScreen: state.fullScreen
        });
      }
      this.triggerEvent('fullscreenchange', {e : e});
    },

    exitLiveFullScreen: function () {
      this.videoCtx.exitFullScreen();
      this.setData({
        showResolutionPanel: false
      });
    },

    panelControl: function () {
      this.resetTimer();
      this.setData({
        showLiveControlPanel: !this.data.showLiveControlPanel,
        showResolutionPanel: false
      });
    },

    resolutionChange: function (e) {
      var that = this;
      if (e.currentTarget && e.currentTarget.id) {
        var index = parseInt(e.currentTarget.id);
        if (index === this.data.currentLiveIndex) {
          return;
        }
        if (this.data.liveStatus === 1 || this.data.liveStatus === 2) {
          this.liveStop();
        }
        setTimeout(() => {
          that.livePlay();
        }, 200);
        this.setData({
          currentLiveIndex : index
        });
      } else {
        console.error("切换直播清晰度出错！");
      }
    },

    toggleResolutionPanel: function () {
      this.resetTimer();
      this.setData({
        showResolutionPanel: !this.data.showResolutionPanel
      });
    },

    liveErrorCallback: function (e) {
      this.triggerEvent('error', { errMsg : e.detail.errMsg });
    }
  }
})