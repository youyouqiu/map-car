Component({
  /**
   * 组件的方法列表
   */
  methods: {
    refresh(){
      console.log("222222")
      this.triggerEvent("refresh", {})
    }
  }
})
