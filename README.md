# 微信小程序开发-直播功能

多媒体视频功能在微信小程序开发中有如下原生组件支持：

- video
- live-player

`video`组件是用来视频播放的，组件功能非常健全，拥有播放暂停、进度条、静音和全屏等多个功能UI。它包含`src`等多个属性，具体属性名可见[微信开发组件文档](https://developers.weixin.qq.com/miniprogram/dev/component/video.html)。

`live-player`组件则是用来实时音视频播放的，它除了可以做直播功能外，还可以做实时通话。但是它不像`video`组件，它对直播功能的支持非常少，甚至播放功能都需要调用API才能实现。因此，可以用`live-xplayer`来代替`live-player`组件使用。

`live-xplayer`是利用微信小程序开发的自定义组件功能封装的基于`live-player`的组件。

下面第一部分是`live-xplayer`组件的说明，第二部分是微信小程序原生直播功能开发的说明。

## 1.live-xplayer组件说明

`live-xplayer`拥有大部分`live-player`组件提供的常用功能，除此之外，还支持不同清晰度直播流的切换，添加了直播控制面板。

### 1.1组件使用方法

在此处下载`live-xplayer`组件。

将`components/live-player`放到开发者的组件中，如果没有`components`目录则在`pages`新建后放入。

在调用组件页面的json文件中加入：
```javascript
{
  "usingComponents" : {
    "live-xplayer" : "/pages/components/live-player/live-player"
  }
}
```
在页面的wxml中直接添加组件即可，如：
```javascript
<view class="live-player">
  <live-xplayer id="livePlayer" live-list="{{resolutionList}}" 
  bindstatechange="liveStateChange" binderror="liveError" 
  bindfullscreenchange="screenChange" bindnetstatus="netStatusChange" 
  autoplay panel-duration="3000" current-live-index="1" muted></live-xplayer>
</view>
```
在调用页面的javascript文件中，要先定义好以上各个属性的值。

### 1.2组件属性说明

`live-xplayer`组件支持大部分`live-player`原有的属性，同时添加了一部分新属性，具体如下表所示：

| 属性名        | 类型    |  默认值   |      说明     | 
| --------    | -----   | ------ | --------- | 
| live-list         | Array      |          |  音视频地址列表，目前仅支持flv，rtmp
| current-live-index         | Number      |    0      |  直播列表中默认播放的直播源数组下标
| autoplay    | Boolean      |   false   |  自动播放
| muted       | Boolean      |   false   |  是否静音
| bindstatechange       | EventHandler      |      |  播放状态变化事件
| bindfullscreenchange       | EventHandler      |      |  全屏变化事件
| bindnetstatus       | EventHandler      |      |  网络状态通知
| binderror         | EventHandler   |       |  播放出错时回调事件
| panel-duration       | Number      |    3000  |  直播控制面板空闲状态下消失时间

`live-list`是直播地址列表，固定对象格式为
```javascript
[
    {
        name : 'blue-ray',
        src : 'https://xxx.xx.com/xx/xx/flv'
    },
    ...
]
```
`name`是显示在直播控制面板的清晰度名称，`src`对应的是相应清晰度的直播地址。

`panel-duration`是控制直播面板在无用户触碰状态下自动消失的时间，默认为3秒钟。

上述其余属性可以在[微信小程序官方开发文档](https://developers.weixin.qq.com/miniprogram/dev/component/live-player.html)中找到，它们与`live-player`组件属性相同。

> **部分`live-player`属性如`orientation`还不支持，同时自定义组件样式将在后续支持**

### 1.3组件方法说明

在调用页面中，可以通过获取`live-xplayer`对象来进行一系列方法操作。

获取方法为`selectComponent`，通常会在页面`ready`的生命周期进行。
```javascript
onReady: function() {
  this.livePlayer = this.selectComponent("#livePlayer");
}
```
`live-xplayer`对象提供了如下表所示的方法：

| 方法名       | 参数    |      说明     | 
| --------    | -----   | --------- | 
| livePlay     | Object      |   音视频播放
| liveStop     | Object      |   音视频停止
| liveMuted    | Object      |   音视频静音
| livePause    | Object      |   音视频暂停
| liveResume   | Object      |   音视频继续播放
| requestFullScreen  | Object     |   全屏
| exitFullScreen     | Object     |   退出全屏

例如，在页面进入后台时想要停止播放，则可以在`onHide`中调用`liveStop`，如：
```javascript
onHide: function() {
    this.livePlayer.liveStop();
}
```

组件自己维护了一个直播组件的状态，初始值如下：
```javascript
// status : 0 for ready, 1 for playing, 2 for pausing, 3 for stopping
liveStatus: 0
```

这个是根据原生组件`live-player`的播放、停止等回调函数来进行赋值的，但是因为原生组件播放等功能会出现成功调用播放`play`等方法但是直播并未播放的情况，因此此状态变量并不能完全代表播放状态，**建议不直接使用**。

> 同时需要注意，如果直播并未播放，但是调用了停止方法，可能会出现不确定的异常问题，这个也是原生live-player组件已有问题。

## 2.微信小程序原生直播功能开发

小程序的直播组件是`live-player`，它有两种模式，live模式，也就是直播模式，和RTC实时通话模式。直播模式是没有任何控制界面的，需要开发者自行添加播放、暂停和全屏等功能的控制面板。

小程序的组件中，只有`cover-view`和`image-view`能够覆盖到`live-player`上，所以所有在`live-player`上的组件都只能为这两种:
```html
<live-player id="livePlayer" mode="live" src="xxx" bindfullscreenchange="fullscreenchange" bindstatechange="liveStateChange" binderror="liveErrorCallback" bindnetstatus="netStatus">
  <cover-view class="xxx">
    <image-view class="img"></image-view>
  </cover-view>
  <cover-view class="xxx"></cover-view>
</live-player>
```

在做好wxml后，就可以通过js来实现UI控制功能了，首先要获取`live-player`的对象：
```javascript
this.videoCtx = wx.createLivePlayerContext('livePlayer', this);
```



`livePlayer`是组件标签的`id`属性，它可以为任意值，由开发者在wxml中定义。

对象有很多方法，[官方文档](https://developers.weixin.qq.com/miniprogram/dev/api/api-live-player.html)有说明，但是一些方法运行时有一些异常问题。

比如播放等功能的回调中，在`play`方法中回调对象中有`success`，`fail`和`complete`属性，这也是大多数方法都有的回调对象属性，分别表示操作成功，失败和无论成功失败后都执行的方法。但是经常会出现直播流并未播放成功，但是也执行了`success`方法。

原因可能是网络，或者是多个方法同时调用的原因。

所以极不建议连续调用多个api方法，比如停止后立即调用播放：
```javascript
this.videoCtx.stop({
  success: function() {
      ...
  }
  ...
});
this.videoCtx.play({
  success: function() {}
  ...
});
```
这样会导致卡顿和视频无法正常播放，但是`play`方法的`success`回调依然执行。

即便将`play`方法写入`stop`的回调中，这种情况依然不稳定的存在着。

解决方法可以是手动设置执行间隔，如：
```javascript
this.videoCtx.stop();
setTimeout(this.videoCtx.play,200);
```

