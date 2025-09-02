<!--化学式的只读模式-->
<template>
  <div>
    <img v-if="imgUrl" :src="imgUrl" style="width: 100%; height: 100%" />
  </div>
</template>

<script>
import { StandaloneStructService } from "ketcher-standalone";
import { Ketcher } from "ketcher-core";
let structService = new StandaloneStructService();
let ketcher = new Ketcher({}, structService, {});
export default {
  name: "ketcher-img",
  props: {
    /**
     * smiles
     */
    smiles: {
      type: String
    }
  },
  data() {
    return {
      imgUrl: ""
    };
  },
  created() {
    this.generateImgUrl();
  },
  watch: {
    smiles(newVal, oldVal) {
      console.log("smiles变了新值是:", newVal);
      this.imgUrl = null;
      this.generateImgUrl();
    }
  },
  methods: {
    generateImgUrl() {
      if (this.smiles) {
        ketcher
          .generateImage(this.smiles, {
            outputFormat: "svg", // 生成图片的类型，可以是"svg"或"png"
            backgroundColor: "255, 255, 255" // 背景颜色
          })
          .then(res => {
            this.imgUrl = window.URL.createObjectURL(res); // res是blob类型，用该方法转为url后可以在用img展示
          });
      } else {
        this.imgUrl = null;
      }
    }
  }
};
</script>

<style scoped></style>
