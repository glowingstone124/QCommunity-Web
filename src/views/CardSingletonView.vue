<template>
	<div>
		<div style="position:absolute; left:-9999px; top:-9999px;">
			<ArtCardForQueryUsage
				:username="username"
				:scale="1"
				@ready="generateImage"
			/>
		</div>

		<div v-if="cardImage">
			<img :src="cardImage" alt="Card" />
		</div>
	</div>
</template>


<script setup lang="ts">
import { ref } from 'vue';
import ArtCardForQueryUsage from '@/components/ArtCardForQueryUsage.vue';
import html2canvas from 'html2canvas';

const username = 'glowingstone124';
const cardImage = ref<string | null>(null);

function generateImage() {
	const el = document.querySelector('.wrapper') as HTMLElement;
	if (!el) return;

	html2canvas(el, {  useCORS: true, backgroundColor: null }).then(canvas => {
		cardImage.value = canvas.toDataURL('image/png');
	});
}
</script>
