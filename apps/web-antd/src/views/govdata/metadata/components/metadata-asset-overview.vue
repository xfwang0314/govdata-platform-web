<script setup lang="ts">
import type {
  MetadataAssetView,
  MetadataOptionsView,
} from '#/api/govdata/metadata/model';

import {
  Button,
  Collapse,
  CollapsePanel,
  Descriptions,
  DescriptionsItem,
  message,
} from 'antdv-next';
const props = defineProps<{
  asset: MetadataAssetView;
  datasourceName: string;
  options?: MetadataOptionsView;
  ownerDeptName: string;
}>();
function label(
  items: undefined | { label: string; value: string }[],
  value: number | string,
) {
  return (
    items?.find((item) => String(item.value) === String(value))?.label ??
    '未设置'
  );
}
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    message.success('定位键已复制');
  } catch {
    message.error('复制失败，请手动复制');
  }
}
</script>
<template>
  <section class="space-y-5" aria-label="资产概览">
    <Descriptions :column="{ xs: 1, sm: 1, md: 2 }" size="small" :colon="false">
      <DescriptionsItem label="所属数据源">
        {{ datasourceName || '加载中' }}
      </DescriptionsItem>
      <DescriptionsItem label="权属部门">
        {{ ownerDeptName || '加载中' }}
      </DescriptionsItem>
      <DescriptionsItem label="业务名称">
        {{ asset.businessName || '未设置' }}
      </DescriptionsItem>
      <DescriptionsItem label="当前自动修订">
        {{
          asset.currentRevisionNo === null
            ? '暂未生成自动修订'
            : `第 ${asset.currentRevisionNo} 次自动修订`
        }}
      </DescriptionsItem>
      <DescriptionsItem label="技术状态">
        {{ label(props.options?.technicalStatuses, asset.technicalStatus) }}
      </DescriptionsItem>
      <DescriptionsItem label="治理状态">
        {{ label(props.options?.governanceStatuses, asset.governanceStatus) }}
      </DescriptionsItem>
      <DescriptionsItem label="安全分类分级">
        {{ label(props.options?.classifications, asset.classificationCode) }} ·
        {{ label(props.options?.securityLevels, asset.securityLevel) }}
      </DescriptionsItem>
      <DescriptionsItem label="数据管理员">
        {{ asset.stewardUserId ? `用户 ${asset.stewardUserId}` : '未指定' }}
      </DescriptionsItem>
      <DescriptionsItem label="首次发现">
        {{ asset.firstSeenTime?.replace('T', ' ') || '—' }}
      </DescriptionsItem>
      <DescriptionsItem label="最近采集">
        {{ asset.lastSeenTime?.replace('T', ' ') || '—' }}
      </DescriptionsItem>
    </Descriptions>
    <section class="space-y-2">
      <h4 class="font-semibold">业务说明</h4>
      <p class="whitespace-pre-wrap break-words text-muted-foreground">
        {{ asset.description || '暂无业务说明' }}
      </p>
    </section>
    <section class="space-y-2">
      <h4 class="font-semibold">源端注释</h4>
      <p class="whitespace-pre-wrap break-words text-muted-foreground">
        {{ asset.commentText || '暂无源端注释' }}
      </p>
    </section>
    <Collapse ghost>
      <CollapsePanel key="identifiers" header="技术标识">
        <Descriptions :column="1" size="small" :colon="false">
          <DescriptionsItem label="授权资源">
            {{ asset.authzResourceId ?? '尚未建立映射' }}
</DescriptionsItem><DescriptionsItem label="规范化定位键">
            <span class="break-all">{{ asset.canonicalKey }}</span><Button size="small" type="link" @click="copy(asset.canonicalKey)">
              复制
            </Button>
          </DescriptionsItem>
        </Descriptions>
      </CollapsePanel>
    </Collapse>
  </section>
</template>
