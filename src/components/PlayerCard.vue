<template>
	<div class="player-info">
		<img :src="avatar" alt="avatar" />
		<span class="info">
			<h1 :class="{ 'online-id': online }">{{ username }}</h1>
			<span v-if="qq"><p class="qq">{{ qq }}</p></span>
			<span>
				<p :style="{ color: banned ? 'red' : 'var(--text)' }">
					{{ banned ? '被封禁' : (online ? '正在游玩' : '当前离线') }}
				</p>
			</span>
		</span>
	</div>
</template>

<script>
export default {
	name: "PlayerInfoCard",
	props: {
		username: {
			type: String,
			required: true
		},
		avatar: {
			type: String,
			required: false,
			default: "https://crafthead.net/avatar/8667ba71b85a4004af54457a9734eed7"
		},
		banned: {
			type: Boolean,
			required: true
		},
		online: {
			type: Boolean,
			required: true
		},
		qq: {
			type: String,
			required: true,
			default: ""
		},
		found: {
			type: Boolean,
			required: true,
			default: false,
		}
	}
};
</script>

<style scoped>
@import "/src/assets/main.css";
.player-info {
	max-width: 100%;
	padding: 0.4vw;
	display: flex;
	flex-direction: row;
	align-items: center;
	transition: all 0.5s ease;
	border-radius: 10px;
}

@media (max-width: 800px) {
	.player-info {
		flex-direction: column;
		padding: 10px;
	}
	.qq, h1, p {
		font-size: 18px;
	}
	img {
		width: 60px;
	}
}

h1 {
	color: var(--text);
	font-size: 3rem;
	font-family: "Bahnschrift";
	margin: 0;
}
.info {
	display: flex;
	flex-direction: column;
}
span {
	display: flex;
	flex-direction: row;
}
img {
	max-width: 80px;
	margin-right: 30px;
	border-radius: 5px;
}
.qq {
	font-size: 22px;
	color: #C7CACA;
	font-family: "Bahnschrift";
}
.online-id {
	background: linear-gradient(90deg, rgba(0,255,0,1) 0%, rgba(84, 150, 84) 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	animation: gradientAnimation 0.5s ease infinite;
}
@keyframes gradientAnimation {
	0% {
		background-position: 0% 0%;
	}
	100% {
		background-position: 100% 0%;
	}
}
@font-face {
	font-family: "Bahnschrift";
	src: url("/src/assets/bahnschrift.ttf");
}
p {
	margin: 5px;
}
</style>
