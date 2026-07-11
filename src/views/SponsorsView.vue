<script setup>
import { ref } from 'vue'

const showDeclaration = ref(false)

const contributors = [
	{ name: 'glowingstone124', roles: ['QAPI3', 'QPlugin', 'Web'] },
	{ name: 'MineCreeper2086', roles: ['QPlugin', 'Web'] },
	{ name: 'Adam Gu', roles: ['QAPI3', 'Web'] },
	{ name: '0x0025 (Code Verse)', roles: ['赞助'] },
	{ name: 'CHJWOS_', roles: ['赞助'] },
	{ name: 'mcjiangshi56', roles: ['赞助'] },
	{ name: 'QiuZhi__', roles: ['赞助'] },
]

const roleClass = (role) => ({
	QAPI3: 'api',
	QPlugin: 'plugin',
	Web: 'web',
	赞助: 'sponsor',
}[role])
</script>

<template>
	<main class="sponsors-page page-shell">
		<header class="sponsors-hero">
			<div class="hero-copy">
				<h1>致谢</h1>
				<p>Quantum Original 的每一步，都离不开这些朋友提供的代码、创作与支持。</p>
			</div>
			<div class="hero-actions">
				<a class="primary-link" href="https://afdian.com/a/glowingstone124">支持我们 <span aria-hidden="true">↗</span></a>
				<router-link class="text-link" to="/"><span aria-hidden="true">←</span> 返回首页</router-link>
			</div>
		</header>

		<section class="credits" aria-labelledby="credits-title">
			<div class="section-heading">
				<div>
					<h2 id="credits-title">贡献者</h2>
					<p>感谢你们共同塑造这个社区。</p>
				</div>
			</div>

			<a class="artist-row" href="https://space.bilibili.com/152309938">
				<img src="/images/miaokuli-avatar.jpg" alt="苗库里头像">
				<span class="artist-copy">
					<strong>苗库里</strong>
					<span class="artist-projects">
						<small>东方系列像素头像</small>
						<small>Pixel Fantasia</small>
					</span>
				</span>
				<span class="visit" aria-hidden="true">访问主页 ↗</span>
			</a>

			<div class="contributor-list">
				<article v-for="(person, index) in contributors" :key="person.name" class="contributor-row" :style="{ '--row-index': index }">
					<h3>{{ person.name }}</h3>
					<div class="roles">
						<span v-for="role in person.roles" :key="role" class="role" :class="roleClass(role)">{{ role }}</span>
					</div>
				</article>
			</div>
		</section>

		<section class="declaration-section">
			<button type="button" class="declaration-toggle" :aria-expanded="showDeclaration" aria-controls="contribution-declaration" @click="showDeclaration = !showDeclaration">
				<span>贡献与赞助声明</span><span aria-hidden="true">{{ showDeclaration ? '−' : '+' }}</span>
			</button>
			<transition name="declaration">
				<div v-if="showDeclaration" id="contribution-declaration" class="declaration-content" data-selectable>
					<p>所有捐赠与贡献均为自愿、无偿行为。捐赠资金由 Quantum Original 统一调配，捐赠完成后不予退款；贡献资源将用于 Quantum Original 及其附属项目，并尽力注明来源。捐赠或贡献不会赋予任何游戏特权。</p>
				</div>
			</transition>
		</section>
	</main>
</template>

<style scoped>
.sponsors-page { width: min(1080px, 100%); min-height: 100%; padding: 0 clamp(1.25rem, 5vw, 4rem) 4rem; }
.sponsors-hero { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 2rem; padding: clamp(3rem, 9vw, 7rem) 0 clamp(2rem, 5vw, 3.5rem); border-bottom: 1px solid var(--split); }
.hero-copy h1 { margin: 0; font-size: clamp(3.5rem, 10vw, 7.5rem); line-height: 0.88; letter-spacing: -0.055em; }
.hero-copy p { max-width: 38rem; margin: 1.4rem 0 0; color: var(--text-secondary); font-size: clamp(1rem, 2vw, 1.2rem); }
.hero-actions { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: 1rem; }
.primary-link, .text-link { display: inline-flex; align-items: center; gap: 0.45rem; font-weight: 700; text-decoration: none; }
.primary-link { min-height: 44px; padding: 0 1.1rem; border: 1px solid var(--primary); background: var(--primary); color: white; }
.primary-link:hover { background: var(--primary-dark); border-color: var(--primary-dark); }
.text-link { color: var(--text-secondary); }
.text-link:hover { color: var(--text-main); }
.credits { padding-top: clamp(2rem, 5vw, 3.5rem); }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
.section-heading h2 { margin: 0; font-size: clamp(1.7rem, 4vw, 2.5rem); }
.section-heading p { margin: 0.35rem 0 0; color: var(--text-secondary); }
.artist-row { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; align-items: center; gap: 1.1rem; padding: 1rem; border: 1px solid var(--primary); color: inherit; text-decoration: none; transition: border-color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-standard); }
.artist-row:hover { border-color: var(--primary-light); transform: translateY(-2px); }
.artist-row img { width: 72px; height: 72px; object-fit: cover; }
.artist-copy { display: grid; gap: 0.25rem; }
.artist-copy strong { font-size: 1.18rem; }
.artist-projects { display: flex; flex-wrap: wrap; gap: 0.35rem 0.8rem; }
.artist-projects small + small { padding-left: 0.8rem; border-left: 1px solid var(--split); }
.artist-copy small, .visit { color: var(--text-secondary); }
.visit { font-size: 0.85rem; font-weight: 700; }
.contributor-list { margin-top: 1.25rem; border-top: 1px solid var(--split); }
.contributor-row { display: grid; grid-template-columns: minmax(12rem, 1fr) minmax(0, 1fr); align-items: center; gap: 1rem; min-height: 76px; padding: 0.9rem 0; border-bottom: 1px solid var(--split); animation: row-in var(--motion-base) var(--ease-standard) both; animation-delay: calc(var(--row-index) * 35ms); }
.contributor-row h3 { min-width: 0; margin: 0; font-size: clamp(1rem, 2vw, 1.16rem); overflow-wrap: anywhere; }
.roles { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 0.45rem; }
.role { padding: 0.3rem 0.65rem; border: 1px solid var(--split); color: var(--text-secondary); font-size: 0.76rem; font-weight: 700; }
.role.api { border-color: color-mix(in srgb, var(--primary) 48%, var(--split)); color: var(--primary); }
.role.plugin { border-color: color-mix(in srgb, var(--success) 48%, var(--split)); color: var(--success); }
.role.sponsor { border-color: color-mix(in srgb, var(--warning) 55%, var(--split)); color: color-mix(in srgb, var(--warning) 82%, var(--text-main)); }
.declaration-section { margin-top: 2.5rem; border-top: 1px solid var(--split); border-bottom: 1px solid var(--split); }
.declaration-toggle { display: flex; justify-content: space-between; width: 100%; padding: 1rem 0; border: 0; background: transparent; color: var(--text-main); cursor: pointer; font-weight: 700; text-align: left; }
.declaration-content { max-width: var(--measure-readable); padding: 0 0 1rem; color: var(--text-secondary); }
.declaration-content p { margin: 0; }
.declaration-enter-active, .declaration-leave-active { transition: opacity var(--motion-fast) ease, transform var(--motion-fast) var(--ease-standard); }
.declaration-enter-from, .declaration-leave-to { opacity: 0; transform: translateY(-5px); }
@keyframes row-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 720px) {
	.sponsors-hero { grid-template-columns: 1fr; align-items: start; }
	.hero-actions { justify-content: flex-start; }
	.contributor-row { grid-template-columns: 1fr; gap: 0.55rem; }
	.roles { justify-content: flex-start; }
}
@media (max-width: 460px) {
	.artist-row { grid-template-columns: 58px minmax(0, 1fr); }
	.artist-row img { width: 58px; height: 58px; }
	.visit { display: none; }
	.artist-projects { display: grid; gap: 0.15rem; }
	.artist-projects small + small { padding-left: 0; border-left: 0; }
	.hero-copy h1 { font-size: 3.6rem; }
}
</style>
