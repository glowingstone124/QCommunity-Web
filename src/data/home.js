export const homeTiles = [
	{
		icon: '✦',
		to: '/register',
		titleKey: 'mainPage.register',
		descriptionKey: 'mainPage_description.register',
	},
	{
		icon: '✱',
		to: '/sponsors',
		titleKey: 'mainPage.greetings',
		descriptionKey: 'mainPage_description.greetings',
	},
	{
		icon: '✺',
		to: '/query',
		titleKey: 'mainPage.query',
		descriptionKey: 'mainPage_description.query',
	},
	{
		icon: '✸',
		to: '/messages',
		titleKey: 'mainPage.message_list',
		descriptionKey: 'mainPage_description.message_list',
	},
	{
		icon: '✶',
		to: '/dashboard',
		titleKey: 'mainPage.dashboard',
		descriptionKey: 'mainPage_description.dashboard',
	},
	{
		icon: '✹',
		to: '/transport',
		titleKey: 'mainPage.transport',
		descriptionKey: 'mainPage_description.transport',
	},
	{
		icon: '✷',
		to: '/miscs',
		titleKey: 'mainPage.miscs',
		descriptionKey: 'mainPage_description.miscs',
	},
	{
		icon: '✻',
		to: '/advancements',
		titleKey: 'mainPage.advancements',
		descriptionKey: 'mainPage_description.advancements',
	},
]

export const homeNews = [
	{
		id: 'style-refresh',
		date: '2026-06-22',
		image: 'https://bucket.glowingstone.cn/pixel_fantasia.png',
		type: {
			zh: '项目进度',
			en: 'Progress',
		},
		title: {
			zh: '官网视觉与导航正在逐步更新',
			en: 'Website visual and navigation refresh is underway',
		},
		description: {
			zh: '我们正在整理 Quantum Original 的官网体验，新的导航、账户中心与功能入口会陆续上线。',
			en: 'We are refining the Quantum Original website experience. Navigation, account center and feature entries will continue to roll out.',
		},
		body: [
			{
				zh: '这一轮调整会先集中在官网的基础体验：导航结构、信息流、账户入口和部分页面的暗色模式会被统一到新的视觉系统中。',
				en: 'This round of changes focuses first on the core website experience: navigation, feed layout, account entry points and dark mode coverage are being aligned with the refreshed visual system.',
			},
			{
				zh: '当前页面仍处在 Beta 阶段。我们会保留可用功能，同时逐步替换旧页面中的临时样式、硬编码文本和不一致的交互状态。',
				en: 'The current pages are still in beta. Existing usable features will remain available while temporary styles, hard-coded text and inconsistent interaction states are replaced over time.',
			},
			{
				zh: '信息流会用于发布网站进度、服务器服务状态和功能更新。后续条目会补充更完整的正文、配图和跳转路径。',
				en: 'The feed will be used for website progress, server service notes and feature updates. Later entries will include fuller article bodies, images and destination links.',
			},
		],
		to: '/news/style-refresh',
	},
	{
		id: 'account-center',
		date: '2026-06-18',
		image: '',
		type: {
			zh: '功能更新',
			en: 'Feature',
		},
		title: {
			zh: '账户中心 Beta 已开放',
			en: 'Account Center beta is available',
		},
		description: {
			zh: '玩家可以在账户中心查看账户概览、白名单状态，并管理部分个性化内容。',
			en: 'Players can view account summaries, whitelist status and manage selected profile settings in Account Center.',
		},
		to: '/account',
	},
	{
		id: 'transport',
		date: '2026-06-12',
		image: 'https://bucket.glowingstone.cn/metro.png',
		type: {
			zh: '服务信息',
			en: 'Service',
		},
		title: {
			zh: '交通路线查询页面正在测试',
			en: 'Transport route query is in testing',
		},
		description: {
			zh: '交通工具会持续补充站点数据与路线提示，用于帮助玩家规划服务器内出行。',
			en: 'Transport tools will continue adding station data and route hints for in-server travel planning.',
		},
		to: '/transport',
	},
]
