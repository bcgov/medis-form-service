<script>
import BaseNotificationContainer from '~/components/base/BaseNotificationContainer.vue';
import BCGovHeader from '~/components/bcgov/BCGovHeader.vue';
import BCGovNavBar from './components/bcgov/BCGovNavBar.vue';
import BCGovFooter from '~/components/bcgov/BCGovFooter.vue';

export default {
  components: {
    BaseNotificationContainer,
    BCGovHeader,
    BCGovNavBar,
    BCGovFooter,
  },
  provide() {
    return {
      setWideLayout: this.setWideLayout,
    };
  },
  data() {
    return {
      isWideLayout: false,
    };
  },
  computed: {
    isValidRoute() {
      return (
        this.$route.name === 'FormSubmit' ||
        this.$route.name === 'FormView' ||
        this.$route.name === 'FormSuccess'
      );
    },
  },
  methods: {
    setWideLayout(isWide) {
      this.isWideLayout = isWide;
    },
  },
};
</script>

<template>
  <v-layout ref="app" class="app">
    <v-main class="app">
      <BaseNotificationContainer />
      <BCGovHeader />
      <BCGovNavBar />
      <RouterView v-slot="{ Component }">
        <transition name="component-fade" mode="out-in">
          <component
            :is="Component"
            :class="[isWideLayout && isValidRoute ? 'main-wide' : 'main']"
          />
        </transition>
      </RouterView>
      <BCGovFooter />
    </v-main>
  </v-layout>
</template>

<style lang="scss" scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  -webkit-box-flex: 1;
}

.main {
  flex: 1 0 auto;
}

.main-wide {
  flex: 1 0 auto;
  max-width: 100%;
}

@media (min-width: 1024px) {
  .main-wide {
    padding-left: 65px;
    padding-right: 65px;
  }
}
</style>
