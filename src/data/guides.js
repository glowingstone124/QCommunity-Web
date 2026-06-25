export const guideSections = [
	{
		key: 'start',
		title: '开始游玩',
		items: [
			{
				id: 'README',
				title: 'Quantum Original Wiki',
				description: '服务器 Wiki 首页与讨论群信息。',
			},
			{
				id: 'connectingToServer',
				title: '如何连接到服务器',
				description: '版本、地址、分服切换与连接异常处理。',
			},
			{
				id: 'things_to_know',
				title: '入服须知',
				description: '服务资格、行为规范、隐私与内容规则。',
			},
			{
				id: 'commands',
				title: '指令大全',
				description: '常用服务器指令及其用途。',
			},
		],
	},
	{
		key: 'server',
		title: '服务器资料',
		items: [
			{
				id: 'server_buildings',
				title: '服务器建筑一览',
				description: '观赏性建筑、功能性建筑和推荐前往方式。',
			},
			{
				id: 'metro',
				title: '地铁线路图',
				description: '当前线路图与二期工程规划。',
			},
			{
				id: 'changes',
				title: '原版特性更改',
				description: '交通、游戏性和辅助机制的服务器改动。',
			},
			{
				id: 'Industry',
				title: '机器使用注意事项',
				description: '轻型、重型和危险机器的使用规约。',
			},
			{
				id: 'RulesForBuildingsInProtectedZone',
				title: '保护区制度',
				description: '保护区分类、纳入标准和管理规则。',
			},
			{
				id: 'affiliatedaccount',
				title: '附属账号说明',
				description: '附属账号注册、权限和责任说明。',
			},
		],
	},
	{
		key: 'community',
		title: '社区与合规',
		items: [
			{
				id: 'CONTRIBUTION',
				title: 'Wiki 贡献指南',
				description: '通过 Markdown 和 Pull Request 贡献内容。',
			},
			{
				id: 'DisclaimerofComplianceforImagesUsed',
				title: '图片合规性声明',
				description: '视觉素材来源、授权和投诉处理说明。',
			},
		],
	},
]

export const guideItems = guideSections.flatMap((section) =>
	section.items.map((item) => ({
		...item,
		sectionKey: section.key,
		sectionTitle: section.title,
	}))
)

export const defaultGuideId = guideItems[0]?.id || ''
