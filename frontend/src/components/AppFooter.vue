<template>
  <v-footer app height="56" class="custom-footer">
    <div class="copyright">
      &copy; {{ (new Date()).getFullYear() }} 示例科技 版权所有（静态演示）
    </div>
  </v-footer>
</template>
<style scoped>
.custom-footer {
  border-top: 1px solid #e8edf7;
  background: #f8faff;
}

.copyright {
  margin: 0 auto;
  color: #8692ad;
  font-size: 13px;
}
</style>
