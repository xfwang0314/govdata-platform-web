<script lang="ts" setup>
import { computed } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  ApartmentOutlined,
  ApiOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
} from '@antdv-next/icons';

const userStore = useUserStore();

const displayName = computed(
  () =>
    userStore.userInfo?.realName || userStore.userInfo?.username || '管理员',
);

const overviewItems = [
  { label: '数据资源', hint: '目录与资源统一归集', value: '--' },
  { label: '接入部门', hint: '跨部门数据协同', value: '--' },
  { label: '共享接口', hint: '服务能力统一发布', value: '--' },
  { label: '质量规则', hint: '治理规则持续完善', value: '--' },
];

const capabilityItems = [
  {
    description: '统一管理数据目录、元数据、资源归属与开放属性。',
    icon: DatabaseOutlined,
    title: '数据资源目录',
  },
  {
    description: '建立标准、质量、血缘与问题闭环的一体化治理体系。',
    icon: CheckCircleOutlined,
    title: '数据治理',
  },
  {
    description: '支撑跨层级、跨地域、跨部门的数据汇聚与交换。',
    icon: ApartmentOutlined,
    title: '交换共享',
  },
  {
    description: '统一编目、发布和管理数据 API 与服务申请。',
    icon: ApiOutlined,
    title: '数据服务',
  },
  {
    description: '覆盖数据分级分类、授权、脱敏和访问控制。',
    icon: SafetyCertificateOutlined,
    title: '安全管理',
  },
  {
    description: '记录关键操作和资源使用过程，满足审计追溯要求。',
    icon: AuditOutlined,
    title: '运行审计',
  },
];
</script>

<template>
  <main class="gov-dashboard">
    <section class="hero-panel">
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="hero-copy">
        <span class="eyebrow">GOVERNMENT DATA HUB</span>
        <h1>汇聚数据要素，赋能政务治理</h1>
        <p>
          {{
            displayName
          }}，欢迎进入政务数据中台。平台基础能力已经就绪，后续将在这里统一承载数据汇聚、治理、共享与服务。
        </p>
        <div class="status-line">
          <span class="status-dot"></span>
          <span>平台基础框架运行正常</span>
        </div>
      </div>
      <div class="hero-mark" aria-hidden="true">
        <span class="orbit orbit-one"></span>
        <span class="orbit orbit-two"></span>
        <img src="/govdata-logo.svg" alt="" />
      </div>
    </section>

    <section class="overview-grid" aria-label="平台数据概览">
      <article
        v-for="item in overviewItems"
        :key="item.label"
        class="metric-card"
      >
        <div>
          <span class="metric-label">{{ item.label }}</span>
          <p>{{ item.hint }}</p>
        </div>
        <strong>{{ item.value }}</strong>
      </article>
    </section>

    <section class="content-panel">
      <header class="section-heading">
        <div>
          <span class="section-index">01 / CAPABILITIES</span>
          <h2>中台能力规划</h2>
        </div>
        <p>保留通用管理底座，业务模块将按照政务数据全生命周期逐步建设。</p>
      </header>

      <div class="capability-grid">
        <article
          v-for="(item, index) in capabilityItems"
          :key="item.title"
          class="capability-card"
          :style="{ '--delay': `${index * 55}ms` }"
        >
          <span class="capability-icon">
            <component :is="item.icon" />
          </span>
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
          <span class="build-tag">待建设</span>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.gov-dashboard {
  --gov-blue: #1558a6;
  --gov-deep: #082e62;
  --gov-cyan: #56b8e9;

  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at 88% 4%, rgb(30 112 190 / 10%), transparent 28%),
    linear-gradient(180deg, #f4f8fc 0%, #f8fafc 100%);
}

.hero-panel {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  min-height: 310px;
  overflow: hidden;
  color: white;
  background: linear-gradient(
    112deg,
    rgb(5 38 82 / 98%) 0%,
    rgb(15 80 151 / 96%) 62%,
    rgb(21 100 174 / 92%) 100%
  );
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 18px;
  box-shadow: 0 24px 58px rgb(15 65 118 / 18%);
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgb(255 255 255 / 35%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 35%) 1px, transparent 1px);
  background-size: 42px 42px;
  opacity: 0.12;
  mask-image: linear-gradient(90deg, black, transparent 92%);
}

.hero-copy {
  position: relative;
  z-index: 1;
  align-self: center;
  max-width: 760px;
  padding: 54px 24px 54px 58px;
}

.eyebrow,
.section-index {
  font-size: 11px;
  font-weight: 700;
  color: #8fd3ff;
  letter-spacing: 0.22em;
}

.hero-copy h1 {
  margin: 16px 0 14px;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: clamp(30px, 4vw, 48px);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.06em;
}

.hero-copy p {
  max-width: 680px;
  margin: 0;
  font-size: 15px;
  line-height: 1.9;
  color: rgb(231 243 255 / 78%);
}

.status-line {
  display: flex;
  gap: 9px;
  align-items: center;
  margin-top: 26px;
  font-size: 13px;
  color: #d9efff;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #65e6ad;
  border-radius: 50%;
  box-shadow: 0 0 0 5px rgb(101 230 173 / 13%);
}

.hero-mark {
  position: relative;
  display: grid;
  place-items: center;
}

.hero-mark img {
  position: relative;
  z-index: 2;
  width: 116px;
  filter: drop-shadow(0 16px 28px rgb(0 22 54 / 30%));
  animation: mark-enter 700ms ease-out both;
}

.orbit {
  position: absolute;
  border: 1px solid rgb(143 211 255 / 24%);
  border-radius: 50%;
}

.orbit-one {
  width: 210px;
  height: 210px;
}

.orbit-two {
  width: 270px;
  height: 270px;
  border-style: dashed;
  animation: orbit-spin 26s linear infinite;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.metric-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 112px;
  padding: 22px 24px;
  background: rgb(255 255 255 / 92%);
  border: 1px solid #e0e9f2;
  border-radius: 14px;
  box-shadow: 0 8px 26px rgb(32 73 112 / 5%);
}

.metric-label {
  font-size: 15px;
  font-weight: 650;
  color: #1f344d;
}

.metric-card p {
  margin: 7px 0 0;
  font-size: 12px;
  color: #8190a3;
}

.metric-card strong {
  font-family: Georgia, serif;
  font-size: 34px;
  font-weight: 500;
  color: var(--gov-blue);
}

.content-panel {
  padding: 30px;
  margin-top: 18px;
  background: rgb(255 255 255 / 94%);
  border: 1px solid #e0e9f2;
  border-radius: 18px;
}

.section-heading {
  display: flex;
  gap: 24px;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 23px;
  border-bottom: 1px solid #edf1f5;
}

.section-index {
  color: var(--gov-blue);
}

.section-heading h2 {
  margin: 7px 0 0;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: 25px;
  color: #142d49;
}

.section-heading > p {
  max-width: 440px;
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: #7a899b;
  text-align: right;
}

.capability-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 22px;
}

.capability-card {
  position: relative;
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 15px;
  min-height: 132px;
  padding: 22px;
  overflow: hidden;
  background: linear-gradient(145deg, #fff, #f8fbfe);
  border: 1px solid #e6edf4;
  border-radius: 12px;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
  animation: card-enter 500ms ease-out var(--delay) both;
}

.capability-card:hover {
  border-color: #b5d1ed;
  box-shadow: 0 14px 30px rgb(23 75 128 / 9%);
  transform: translateY(-3px);
}

.capability-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  font-size: 20px;
  color: var(--gov-blue);
  background: #eaf3fc;
  border-radius: 10px;
}

.capability-card h3 {
  margin: 1px 0 8px;
  font-size: 15px;
  color: #1b344f;
}

.capability-card p {
  margin: 0;
  font-size: 12px;
  line-height: 1.75;
  color: #7c8b9d;
}

.build-tag {
  position: absolute;
  right: 14px;
  bottom: 12px;
  font-size: 10px;
  color: #8a9caf;
  letter-spacing: 0.08em;
}

@keyframes mark-enter {
  from {
    opacity: 0;
    transform: scale(0.82) rotate(-5deg);
  }

  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}

@keyframes orbit-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:global(.dark) .gov-dashboard {
  background: #0d1622;
}

:global(.dark) .metric-card,
:global(.dark) .content-panel,
:global(.dark) .capability-card {
  background: #152131;
  border-color: #283748;
}

:global(.dark) .metric-label,
:global(.dark) .section-heading h2,
:global(.dark) .capability-card h3 {
  color: #e7f1fb;
}

@media (max-width: 1024px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .capability-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .gov-dashboard {
    padding: 14px;
  }

  .hero-panel {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    padding: 40px 28px;
  }

  .hero-mark {
    display: none;
  }

  .overview-grid,
  .capability-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-heading > p {
    text-align: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-mark img,
  .orbit-two,
  .capability-card {
    animation: none;
  }
}
</style>
