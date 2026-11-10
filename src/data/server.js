export const serverSpecs = {
	version: 'Minecraft 26.2',
	domain: 'qoriginal.vip',
	protocolNote: 'Paper / Velocity',
	authType: 'QQ 验证',
	authTypeKey: 'serverPage.specs.authDesc',
	established: '2022',
	maxRailSpeed: '108 KM/H',
}

export const serverMetrics = [
	{
		id: 'history',
		value: '2022-2026',
		labelKey: 'serverPage.metricHistoryLabel',
		subKey: 'serverPage.metricHistorySub',
	},
	{
		id: 'version',
		value: '26.2',
		labelKey: 'serverPage.metricVersionLabel',
		subKey: 'serverPage.metricVersionSub',
	},
	{
		id: 'railSpeed',
		value: '108 KM/H',
		labelKey: 'serverPage.metricRailLabel',
		subKey: 'serverPage.metricRailSub',
	},
	{
		id: 'tps',
		value: '20.0 TPS',
		labelKey: 'serverPage.metricTpsLabel',
		subKey: 'serverPage.metricTpsSub',
	},
]

export const serverScenes = [
	{
		id: 'genesis',
		index: '01',
		period: '2022 岁末 - 2023',
		periodEn: 'Late 2022 - 2023',
		tagKey: 'serverPage.scene1Tag',
		titleKey: 'serverPage.scene1Title',
		leadKey: 'serverPage.scene1Lead',
		descKey: 'serverPage.scene1Desc',
		image: '/images/server/scene-genesis.jpg',
		imageWebp: '/images/server/scene-genesis.webp',
		imageCaptionKey: 'serverPage.scene1Photo',
		badges: [
			{ key: 'serverPage.badgeVanillaSpec', value: '100% Pure' },
			{ key: 'serverPage.badgeHardware', value: 'Dedicated Host' },
			{ key: 'serverPage.badgeWorldBorder', value: 'Unlimited Chunk' },
		],
		specs: [
			{ labelKey: 'serverPage.specRuntime', value: 'Paper / 20.0 TPS' },
			{ labelKey: 'serverPage.specServerHardware', value: '9900X 物理机' },
			{ labelKey: 'serverPage.specSimulation', value: '16 Chunks' },
			{ labelKey: 'serverPage.specProtection', value: '严格保护区' },
		],
	},
	{
		id: 'transit',
		index: '02',
		period: '2023 - 2024',
		periodEn: '2023 - 2024',
		tagKey: 'serverPage.scene2Tag',
		titleKey: 'serverPage.scene2Title',
		leadKey: 'serverPage.scene2Lead',
		descKey: 'serverPage.scene2Desc',
		image: '/images/server/scene-transit.jpg',
		imageWebp: '/images/server/scene-transit.webp',
		imageCaptionKey: 'serverPage.scene2Photo',
		badges: [
			{ key: 'serverPage.badgeRailSpeed', value: '108 KM/H Max' },
			{ key: 'serverPage.badgeHexSegment', value: '16-Color Routing' },
			{ key: 'serverPage.badgeMetroLines', value: 'Metro 1 & 2' },
		],
		specs: [
			{ labelKey: 'serverPage.specDiamondRail', value: '108 KM/H' },
			{ labelKey: 'serverPage.specEmeraldRail', value: '86 KM/H' },
			{ labelKey: 'serverPage.specVanillaRail', value: '29 KM/H' },
			{ labelKey: 'serverPage.specHexRouting', value: '16 色自动变轨' },
		],
	},
	{
		id: 'qplugin',
		index: '03',
		period: '2024 - 2025',
		periodEn: '2024 - 2025',
		tagKey: 'serverPage.scene3Tag',
		titleKey: 'serverPage.scene3Title',
		leadKey: 'serverPage.scene3Lead',
		descKey: 'serverPage.scene3Desc',
		image: '/images/server/scene-qplugin.jpg',
		imageWebp: '/images/server/scene-qplugin.webp',
		imageCaptionKey: 'serverPage.scene3Photo',
		badges: [
			{ key: 'serverPage.badgeFakePlayer', value: '/fakeplayer' },
			{ key: 'serverPage.badgeRelaySync', value: 'QQ & Web Bridge' },
			{ key: 'serverPage.badgeCombat', value: 'Combat Feedback' },
		],
		specs: [
			{ labelKey: 'serverPage.specFakePlayer', value: '/fakeplayer 挂机' },
			{ labelKey: 'serverPage.specRelayBridge', value: '双向实时中继' },
			{ labelKey: 'serverPage.specLocation', value: '/myloc 坐标广播' },
			{ labelKey: 'serverPage.specDamageIndicator', value: '/damageindicator' },
		],
	},
	{
		id: 'modern',
		index: '04',
		period: '2025 - 2026',
		periodEn: '2025 - 2026',
		tagKey: 'serverPage.scene4Tag',
		titleKey: 'serverPage.scene4Title',
		leadKey: 'serverPage.scene4Lead',
		descKey: 'serverPage.scene4Desc',
		image: '/images/server/scene-modern.jpg',
		imageWebp: '/images/server/scene-modern.webp',
		imageCaptionKey: 'serverPage.scene4Photo',
		badges: [
			{ key: 'serverPage.badgePureVanilla', value: 'Minecraft 26.2' },
			{ key: 'serverPage.badgeAuthVerified', value: 'QQ Auth' },
			{ key: 'serverPage.badgeCommunityHub', value: 'QHub Platform' },
		],
		specs: [
			{ labelKey: 'serverPage.specAccessAuth', value: 'QQ 验证准入' },
			{ labelKey: 'serverPage.specPortal', value: 'QHub 社区枢纽' },
			{ labelKey: 'serverPage.specTransitWeb', value: '全域换乘规划' },
			{ labelKey: 'serverPage.specClientEnhance', value: '可选 QMod 增强' },
		],
	},
]

export const serverModes = [
	{
		id: 'survival',
		nameKey: 'serverPage.survivalName',
		tagKey: 'serverPage.survivalTag',
		command: '/server survival',
		descKey: 'serverPage.survivalDesc',
		features: [
			'serverPage.survivalFeature1',
			'serverPage.survivalFeature2',
			'serverPage.survivalFeature3',
			'serverPage.survivalFeature4',
		],
	},
	{
		id: 'creative',
		nameKey: 'serverPage.creativeName',
		tagKey: 'serverPage.creativeTag',
		command: '/server creative',
		descKey: 'serverPage.creativeDesc',
		features: [
			'serverPage.creativeFeature1',
			'serverPage.creativeFeature2',
			'serverPage.creativeFeature3',
			'serverPage.creativeFeature4',
		],
	},
]

export const serverHighlights = [
	{
		id: 'fakeplayer',
		nameKey: 'serverPage.featureFakePlayerName',
		descKey: 'serverPage.featureFakePlayerDesc',
		command: '/fakeplayer',
	},
	{
		id: 'transit',
		nameKey: 'serverPage.featureTransitName',
		descKey: 'serverPage.featureTransitDesc',
		link: '/transport',
	},
	{
		id: 'flight',
		nameKey: 'serverPage.featureFlightName',
		descKey: 'serverPage.featureFlightDesc',
		command: '/flight',
	},
	{
		id: 'chatRelay',
		nameKey: 'serverPage.featureChatRelayName',
		descKey: 'serverPage.featureChatRelayDesc',
		link: '/messages',
	},
	{
		id: 'combat',
		nameKey: 'serverPage.featureCombatName',
		descKey: 'serverPage.featureCombatDesc',
		command: '/damageindicator',
	},
	{
		id: 'qmod',
		nameKey: 'serverPage.featureQModName',
		descKey: 'serverPage.featureQModDesc',
		link: '/guides',
	},
]

export const qpluginTabs = [
	{
		id: 'mechanics',
		labelKey: 'serverPage.qpluginTabMechanics',
		items: [
			{
				id: 'fakePlayer',
				titleKey: 'serverPage.qpluginFakeTitle',
				descKey: 'serverPage.qpluginFakeDesc',
				badgeKey: 'serverPage.qpluginFakeBadge',
				code: '/fakeplayer spawn <bot_name> -> 协助红石挂机与生电常载',
			},
			{
				id: 'railSystem',
				titleKey: 'serverPage.qpluginRailTitle',
				descKey: 'serverPage.qpluginRailDesc',
				badgeKey: 'serverPage.qpluginRailBadge',
				code: '钻石极速轨 108 KM/H | 绿宝石加速轨 86 KM/H | 16色区段变轨',
			},
		],
	},
	{
		id: 'community',
		labelKey: 'serverPage.qpluginTabCommunity',
		items: [
			{
				id: 'chatRelay',
				titleKey: 'serverPage.qpluginRelayTitle',
				descKey: 'serverPage.qpluginRelayDesc',
				badgeKey: 'serverPage.qpluginRelayBadge',
				code: 'Minecraft In-Game Chat <-> QPlugin Gateway <-> QQ Group (946085440) & Web',
			},
			{
				id: 'qqAuth',
				titleKey: 'serverPage.qpluginAuthTitle',
				descKey: 'serverPage.qpluginAuthDesc',
				badgeKey: 'serverPage.qpluginAuthBadge',
				code: 'QQ Group .auth <code> -> 快速完成白名单通行证绑定',
			},
		],
	},
]

export const serverLandmarks = [
	{
		id: 'fungus',
		name: '菌蓬',
		nameEn: 'Fungus Canopy',
		builder: 'JIYELIN',
		coordinates: '-2317, 827',
		transit: '地铁2号线',
		transitEn: 'Metro Line 2',
		categoryKey: 'serverPage.landmarkWonder',
	},
	{
		id: 'spaceStation',
		name: '空间站',
		nameEn: 'Space Station',
		builder: 'lao_w_ang',
		coordinates: '-1594, 1462',
		transit: '地铁2号线',
		transitEn: 'Metro Line 2',
		categoryKey: 'serverPage.landmarkBuilding',
	},
	{
		id: 'snowCastle',
		name: '雪之城',
		nameEn: 'Snow Castle',
		builder: 'kura',
		coordinates: '-2246, 1269',
		transit: '地铁2号线',
		transitEn: 'Metro Line 2',
		categoryKey: 'serverPage.landmarkBuilding',
	},
	{
		id: 'ancientPavilion',
		name: '古亭',
		nameEn: 'Ancient Pavilion',
		builder: 'hollow_glowing',
		coordinates: '-1482, 1073',
		transit: '地铁1号线',
		transitEn: 'Metro Line 1',
		categoryKey: 'serverPage.landmarkBuilding',
	},
	{
		id: 'nozerpasheim',
		name: '诺泽帕斯海姆',
		nameEn: 'Nozerpasheim',
		builder: 'JIYELIN',
		coordinates: '-2032, 822',
		transit: '地铁1、2号线',
		transitEn: 'Metro Lines 1 & 2',
		categoryKey: 'serverPage.landmarkTown',
	},
]

export const quickSteps = [
	{
		step: '01',
		titleKey: 'serverPage.step1Title',
		descKey: 'serverPage.step1Desc',
		link: '/register',
		actionKey: 'serverPage.step1Action',
	},
	{
		step: '02',
		titleKey: 'serverPage.step2Title',
		descKey: 'serverPage.step2Desc',
		link: '/terms',
		actionKey: 'serverPage.step2Action',
	},
	{
		step: '03',
		titleKey: 'serverPage.step3Title',
		descKey: 'serverPage.step3Desc',
	},
	{
		step: '04',
		titleKey: 'serverPage.step4Title',
		descKey: 'serverPage.step4Desc',
		link: '/dashboard',
		actionKey: 'serverPage.step4Action',
	},
]
