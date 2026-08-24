<script setup lang="ts">
defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <div class="brand-logo" :class="{ 'brand-logo--compact': compact }" aria-label="有米出行 YOMI">
    <span class="brand-logo__mark" aria-hidden="true"><span>Y</span></span>
    <span v-if="!compact" class="brand-logo__wordmark">
      <span>有米出行</span>
      <b>YOMI</b>
    </span>
  </div>
</template>

<style scoped>
.brand-logo {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.brand-logo__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--brand-light), var(--brand-dark));
  color: #fff;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 800;
  box-shadow: var(--shadow-brand);
}

.brand-logo__wordmark {
  display: flex;
  min-width: 0;
  flex-direction: column;
  color: #fff;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: 0;
}

.brand-logo__wordmark b {
  color: var(--brand-light);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.brand-logo--compact .brand-logo__mark {
  width: 36px;
  height: 36px;
  flex-basis: 36px;
}
</style>
