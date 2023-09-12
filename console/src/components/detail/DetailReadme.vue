<script lang="ts" setup>
import type { ApplicationDetail } from "@/types";
import { prependDomain } from "@/utils/resource";

const props = withDefaults(
  defineProps<{
    app?: ApplicationDetail;
  }>(),
  {
    app: undefined,
  }
);

function getReadme() {
  const readme = props.app?.readme?.html;

  const dom = new DOMParser().parseFromString(readme + "", "text/html");
  const images = dom.querySelectorAll("img");
  images.forEach((image) => {
    const src = image.getAttribute("src");
    if (src) {
      image.setAttribute("src", prependDomain(src));
    }
  });

  const videos = dom.querySelectorAll("video");
  videos.forEach((video) => {
    const src = video.getAttribute("src");
    if (src) {
      video.setAttribute("src", prependDomain(src));
    }
  });

  const links = dom.querySelectorAll("a");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (href) {
      link.setAttribute("href", prependDomain(href));
      link.setAttribute("target", "_blank");
    }
  });

  return dom.body.innerHTML;
}
</script>

<template>
  <div
    v-if="app?.application.spec.screenshots?.length"
    id="screenshots-target"
    class="as-flex as-flex-1 as-overflow-auto as-rounded-md as-bg-gray-100 as-p-2"
  >
    <ul role="list" class="as-flex as-min-h-min as-gap-2">
      <li
        v-for="(screenshot, index) in app.application.spec.screenshots"
        :key="index"
        class="as-group as-relative as-w-72 as-cursor-pointer as-overflow-hidden as-rounded"
      >
        <div class="as-aspect-h-10 as-aspect-w-16 as-block as-w-full as-bg-gray-100">
          <img
            :src="prependDomain(screenshot.url)"
            :alt="screenshot.description"
            class="as-h-full as-w-full as-transform-gpu as-object-cover as-transition-all group-hover:as-opacity-75"
            loading="lazy"
          />
        </div>
        <p
          class="as-absolute as-bottom-0 as-hidden as-h-1/3 as-w-full as-content-end as-justify-center as-truncate as-bg-gradient-to-t as-from-gray-300 as-to-transparent as-p-1 as-text-xs as-text-slate-200 as-ease-in-out group-hover:as-grid"
        >
          {{ screenshot.description }}
        </p>
      </li>
    </ul>
  </div>
  <article id="app-readme-target" class="markdown-body !as-mt-4 !as-bg-transparent" v-html="getReadme()"></article>
</template>
