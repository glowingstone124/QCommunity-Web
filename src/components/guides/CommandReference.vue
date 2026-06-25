<script setup>
import { computed, ref } from 'vue'

const commands = [
	{
		name: '/suicide',
		category: '角色',
		description: '使角色自杀。',
		usage: '/suicide',
		keywords: ['death', 'respawn', '自杀', '重生'],
		args: [],
	},
	{
		name: '/shutup',
		category: '聊天',
		description: '控制你的聊天消息是否同步到 QQ 等外部平台。',
		usage: '/shutup <query|disable|enable>',
		keywords: ['chat', 'qq', 'sync', '同步', '聊天'],
		args: [
			{
				key: 'mode',
				label: '模式',
				required: true,
				placeholder: 'query|enable|disable',
				options: [
					{ value: 'query', label: 'query', description: '查询消息同步状态' },
					{ value: 'enable', label: 'enable', description: '启用服务器消息同步' },
					{ value: 'disable', label: 'disable', description: '禁用服务器消息同步' },
				],
			},
		],
	},
	{
		name: '/myloc',
		category: '信息',
		description: '向在线玩家分享当前位置，并提供高亮坐标的点击建议。',
		usage: '/myloc',
		keywords: ['location', 'coords', 'coordinate', '坐标', '位置'],
		args: [],
	},
	{
		name: '/highlight',
		category: '信息',
		description: '用粒子高亮一个坐标方向。游戏内补全会优先给出准星方块或当前位置坐标。',
		usage: '/highlight <x> <y> <z>',
		keywords: ['particle', 'location', 'coords', '坐标', '高亮', '粒子'],
		args: [
			{ key: 'x', label: 'x', required: true, placeholder: 'x' },
			{ key: 'y', label: 'y', required: true, placeholder: 'y' },
			{ key: 'z', label: 'z', required: true, placeholder: 'z' },
		],
	},
	{
		name: '/showitem',
		category: '物品',
		description: '广播你手上持有的物品。',
		usage: '/showitem',
		keywords: ['item', 'hand', 'broadcast', '物品', '展示'],
		args: [],
	},
	{
		name: '/querybind',
		category: '账户',
		description: '查询玩家绑定信息。游戏内补全在线玩家名。',
		usage: '/querybind <player>',
		keywords: ['bind', 'account', 'qq', '绑定', '账户'],
		args: [
			{ key: 'player', label: '玩家名', required: true, placeholder: 'player', dynamic: 'onlinePlayerNames' },
		],
	},
	{
		name: '/summontext',
		category: '展示',
		description: '在准星指向位置生成文字展示。',
		usage: '/summontext <text>',
		keywords: ['text', 'display', '文字', '展示'],
		args: [
			{ key: 'text', label: '文本', required: true, placeholder: 'text' },
		],
	},
	{
		name: '/login',
		category: '账户',
		description: '访客登录。',
		usage: '/login <password>',
		keywords: ['password', 'visitor', 'login', '登录', '访客'],
		args: [
			{ key: 'password', label: '密码', required: true, placeholder: 'password' },
		],
	},
	{
		name: '/damageindicator',
		category: '战斗',
		description: '控制弓箭伤害指示器。启用后，使用弓箭时会显示射击状态和命中伤害。',
		usage: '/damageindicator <query|enable|disable>',
		keywords: ['damage', 'bow', 'indicator', '伤害', '弓箭'],
		args: [
			{
				key: 'mode',
				label: '模式',
				required: true,
				placeholder: 'query|enable|disable',
				options: [
					{ value: 'query', label: 'query', description: '查询伤害指示器状态' },
					{ value: 'enable', label: 'enable', description: '启用' },
					{ value: 'disable', label: 'disable', description: '禁用' },
				],
			},
		],
	},
	{
		name: '/leavemessage',
		category: '消息',
		description: '给离线玩家留言。当前服务端实现要求玩家名和消息各占一个参数。',
		usage: '/leavemessage <player> <message>',
		keywords: ['leave', 'message', 'offline', '留言', '离线'],
		args: [
			{ key: 'player', label: '玩家名', required: true, placeholder: 'player', dynamic: 'onlinePlayerNames' },
			{ key: 'message', label: '消息', required: true, placeholder: 'message' },
		],
	},
	{
		name: '/elite',
		category: '物品',
		description: '将主手物品升级为精英武器，并写入名称和铭文。',
		usage: '/elite <name> <inscription>',
		keywords: ['weapon', 'elite', 'legendary', '铭文', '武器'],
		args: [
			{ key: 'name', label: '武器名', required: true, placeholder: 'weapon_name', suggestions: ['weapon_name'] },
			{ key: 'inscription', label: '铭文', required: true, placeholder: 'inscription', suggestions: ['inscription'] },
		],
	},
	{
		name: '/gm',
		category: '角色',
		description: '切换自己的游戏模式，仅允许生存和旁观。',
		usage: '/gm <s|sc>',
		keywords: ['gamemode', 'survival', 'spectator', '模式'],
		args: [
			{
				key: 'mode',
				label: '模式',
				required: true,
				placeholder: 's|sc',
				options: [
					{ value: 's', label: 's', description: '切换到生存模式' },
					{ value: 'sc', label: 'sc', description: '切换到旁观模式' },
				],
			},
		],
	},
	{
		name: '/firework',
		category: '活动',
		description: '新年烟花。活动未开始时不可用。',
		usage: '/firework <get|launch> [type]',
		keywords: ['newyear', 'firework', '烟花', '新年'],
		args: [
			{
				key: 'action',
				label: '操作',
				required: true,
				placeholder: 'get|launch',
				options: [
					{ value: 'get', label: 'get', description: '获取新年烟花' },
					{ value: 'launch', label: 'launch', description: '在身边燃放随机烟花' },
				],
			},
			{
				key: 'type',
				label: '类型',
				required: false,
				placeholder: 'type',
				dependsOn: { key: 'action', value: 'get' },
				options: [
					{ value: '1', label: '1', description: '烟花方案 1' },
					{ value: '2', label: '2', description: '烟花方案 2' },
					{ value: '3', label: '3', description: '烟花方案 3' },
					{ value: '4', label: '4', description: '烟花方案 4' },
				],
			},
		],
	},
	{
		name: '/newyeartnt',
		category: '活动',
		description: '获取新年爆竹。活动未开始时不可用。',
		usage: '/newyeartnt give',
		keywords: ['newyear', 'tnt', 'firecracker', '新年', '爆竹'],
		args: [
			{
				key: 'action',
				label: '操作',
				required: true,
				placeholder: 'give',
				options: [
					{ value: 'give', label: 'give', description: '获取新年爆竹' },
				],
			},
		],
	},
	{
		name: '/newyeardumplings',
		category: '活动',
		description: '获取新年团子。活动未开始时不可用。',
		usage: '/newyeardumplings',
		keywords: ['newyear', 'snowball', 'dumpling', '新年', '团子'],
		args: [],
	},
	{
		name: '/flight',
		category: '飞行',
		description: '配置飞行仪表、公开飞行信息和飞行目的地。',
		usage: '/flight <report|gui|dest> ...',
		keywords: ['flight', 'elytra', 'destination', '飞行', '仪表', '目的地'],
		args: [
			{
				key: 'section',
				label: '模块',
				required: true,
				placeholder: 'report|gui|dest',
				options: [
					{ value: 'report', label: 'report', description: '公开飞行信息' },
					{ value: 'gui', label: 'gui', description: '显示或隐藏飞行仪表盘' },
					{ value: 'dest', label: 'dest', description: '管理飞行目的地' },
					{ value: 'destination', label: 'destination', description: 'dest 的完整别名' },
				],
			},
			{
				key: 'toggle',
				label: '开关',
				required: true,
				placeholder: 'on|off',
				dependsOnAny: [
					{ key: 'section', value: 'report' },
					{ key: 'section', value: 'gui' },
				],
				options: [
					{ value: 'on', label: 'on', description: '开启' },
					{ value: 'off', label: 'off', description: '关闭' },
				],
			},
			{
				key: 'destAction',
				label: '目的地操作',
				required: true,
				placeholder: 'set|unset|list',
				dependsOnAny: [
					{ key: 'section', value: 'dest' },
					{ key: 'section', value: 'destination' },
				],
				options: [
					{ value: 'set', label: 'set', description: '设置目的地' },
					{ value: 'unset', label: 'unset', description: '清除目的地' },
					{ value: 'list', label: 'list', description: '列出可用目的地' },
				],
			},
			{
				key: 'destination',
				label: '目的地',
				required: true,
				placeholder: 'XCA|ZCA|FDA|NONE',
				dependsOn: { key: 'destAction', value: 'set' },
				options: [
					{ value: 'XCA', label: 'XCA', description: '飞行目的地 XCA' },
					{ value: 'ZCA', label: 'ZCA', description: '飞行目的地 ZCA' },
					{ value: 'FDA', label: 'FDA', description: '飞行目的地 FDA' },
					{ value: 'NONE', label: 'NONE', description: '无目的地' },
				],
			},
		],
	},
	{
		name: '/fakeplayer',
		category: '假人',
		description: '管理服务器假人：生成、移除、列出或打开背包。',
		usage: '/fakeplayer <spawn|remove|list|inventory> ...',
		keywords: ['fakeplayer', 'bot', 'inventory', '假人', '背包'],
		args: [
			{
				key: 'action',
				label: '操作',
				required: true,
				placeholder: 'spawn|remove|list|inventory',
				options: [
					{ value: 'spawn', label: 'spawn', description: '在当前位置生成假人' },
					{ value: 'remove', label: 'remove', description: '移除指定假人' },
					{ value: 'list', label: 'list', description: '查看假人列表' },
					{ value: 'inventory', label: 'inventory', description: '打开假人背包' },
					{ value: 'inv', label: 'inv', description: 'inventory 的短别名' },
				],
			},
			{
				key: 'name',
				label: '假人名',
				required: true,
				placeholder: 'name',
				dependsOnAny: [
					{ key: 'action', value: 'spawn' },
					{ key: 'action', value: 'remove' },
					{ key: 'action', value: 'inventory' },
					{ key: 'action', value: 'inv' },
				],
				dynamic: 'fakePlayerNames',
			},
			{
				key: 'skinPlayer',
				label: '皮肤来源',
				required: false,
				placeholder: 'skinPlayer',
				dependsOn: { key: 'action', value: 'spawn' },
				dynamic: 'onlinePlayerNames',
			},
		],
	},
]

const query = ref('/')
const activeCommandName = ref(commands[0].name)
const selectedArgs = ref({})

const normalizedQuery = computed(() => query.value.trim().toLowerCase())

const filteredCommands = computed(() => {
	const term = normalizedQuery.value.replace(/^\//, '')

	if (!term) {
		return commands
	}

	return commands.filter((command) => {
		const haystack = [
			command.name,
			command.category,
			command.description,
			command.usage,
			...command.keywords,
			...command.args.flatMap((arg) => arg.options?.map((option) => `${option.label} ${option.description}`) || []),
		].join(' ').toLowerCase()

		return haystack.includes(term)
	})
})

const activeCommand = computed(() =>
	commands.find((command) => command.name === activeCommandName.value) || filteredCommands.value[0] || commands[0]
)

const completionOptions = computed(() => {
	const term = normalizedQuery.value

	if (!term || term === '/') {
		return commands.slice(0, 10).map((command) => ({
			type: 'command',
			value: command.name,
			label: command.name,
			description: command.description,
			command,
		}))
	}

	if (!term.includes(' ')) {
		return filteredCommands.value.slice(0, 10).map((command) => ({
			type: 'command',
			value: command.name,
			label: command.name,
			description: command.description,
			command,
		}))
	}

	const parts = term.split(/\s+/)
	const commandName = parts[0]
	const command = commands.find((item) => item.name === commandName || item.name.slice(1) === commandName)
	const argIndex = Math.max(0, parts.length - 2)
	const arg = command ? visibleArgs(command)[argIndex] : null
	const partial = parts[parts.length - 1] || ''

	if (!arg) {
		return []
	}

	return suggestionsForArg(arg)
		.filter((option) => option.value.toLowerCase().includes(partial))
		.map((option) => ({
			type: 'argument',
			value: [...parts.slice(0, -1), option.value].join(' '),
			label: option.label,
			description: option.description,
			command,
			argKey: arg.key,
			argValue: option.value,
		}))
})

const composedCommand = computed(() => {
	const command = activeCommand.value

	const args = visibleArgs(command)

	if (!args.length) {
		return command.name
	}

	return [
		command.name,
		...args
			.filter((arg) => arg.required || selectedArgs.value[`${command.name}:${arg.key}`])
			.map((arg) => selectedArgs.value[`${command.name}:${arg.key}`] || `<${arg.placeholder || arg.label}>`),
	].join(' ')
})

function selectCommand(command) {
	activeCommandName.value = command.name
	query.value = command.name
}

function applyCompletion(option) {
	activeCommandName.value = option.command.name

	if (option.type === 'argument') {
		selectedArgs.value = {
			...selectedArgs.value,
			[`${option.command.name}:${option.argKey}`]: option.argValue,
		}
		query.value = composedCommand.value
		return
	}

	query.value = option.value
}

function setArg(command, arg, value) {
	const visibleKeys = new Set(visibleArgs(command).map((item) => item.key))
	selectedArgs.value = {
		...Object.fromEntries(Object.entries(selectedArgs.value).filter(([key]) => {
			const [, argKey] = key.split(':')
			return visibleKeys.has(argKey)
		})),
		[`${command.name}:${arg.key}`]: value,
	}
	query.value = composedCommand.value
}

function dependencyMatches(command, dependency) {
	return selectedArgs.value[`${command.name}:${dependency.key}`] === dependency.value
}

function isArgVisible(command, arg) {
	if (arg.dependsOn) {
		return dependencyMatches(command, arg.dependsOn)
	}

	if (arg.dependsOnAny) {
		return arg.dependsOnAny.some((dependency) => dependencyMatches(command, dependency))
	}

	return true
}

function visibleArgs(command) {
	return command.args.filter((arg) => isArgVisible(command, arg))
}

function suggestionsForArg(arg) {
	if (arg.options) {
		return arg.options
	}

	if (arg.suggestions) {
		return arg.suggestions.map((value) => ({
			value,
			label: value,
			description: `填入 ${arg.label}`,
		}))
	}

	if (arg.dynamic === 'onlinePlayerNames') {
		return [
			{ value: '<player>', label: '<player>', description: '游戏内会补全在线玩家名' },
		]
	}

	if (arg.dynamic === 'fakePlayerNames') {
		return [
			{ value: '<fakePlayer>', label: '<fakePlayer>', description: '游戏内会补全当前假人名' },
		]
	}

	return [
		{ value: `<${arg.placeholder || arg.label}>`, label: `<${arg.placeholder || arg.label}>`, description: `填入 ${arg.label}` },
	]
}

function optionKey(command, arg) {
	return `${command.name}:${arg.key}`
}

async function copyCommand() {
	await navigator.clipboard?.writeText(composedCommand.value)
}
</script>

<template>
	<section class="command-reference">
		<header class="command-header">
			<h1>指令一览</h1>
			<p>输入指令、关键词或参数，使用补全候选快速定位可用命令。</p>
		</header>

		<div class="command-console">
			<label class="command-search">
				<span>Command</span>
				<input
					v-model="query"
					type="text"
					autocomplete="off"
					spellcheck="false"
					placeholder="/"
				>
			</label>

			<div class="completion-list" aria-label="补全候选">
				<button
					v-for="option in completionOptions"
					:key="`${option.type}:${option.value}`"
					type="button"
					class="completion-item"
					@click="applyCompletion(option)"
				>
					<strong>{{ option.label }}</strong>
					<span>{{ option.description }}</span>
				</button>
			</div>
		</div>

		<div class="command-layout">
			<nav class="command-list" aria-label="指令列表">
				<button
					v-for="command in filteredCommands"
					:key="command.name"
					type="button"
					class="command-list-item"
					:class="{ 'is-active': command.name === activeCommand.name }"
					@click="selectCommand(command)"
				>
					<span>{{ command.category }}</span>
					<strong>{{ command.name }}</strong>
					<small>{{ command.description }}</small>
				</button>
			</nav>

			<article class="command-detail">
				<div class="detail-heading">
					<span>{{ activeCommand.category }}</span>
					<h2>{{ activeCommand.name }}</h2>
					<p>{{ activeCommand.description }}</p>
				</div>

				<div class="usage-block">
					<span>Usage</span>
					<code>{{ activeCommand.usage }}</code>
				</div>

				<div v-if="visibleArgs(activeCommand).length" class="arg-builder">
					<section v-for="arg in visibleArgs(activeCommand)" :key="arg.key" class="arg-section">
						<h3>
							{{ arg.label }}
							<span v-if="!arg.required">可选</span>
						</h3>
						<div class="arg-options">
							<button
								v-for="option in suggestionsForArg(arg)"
								:key="option.value"
								type="button"
								class="arg-option"
								:class="{ 'is-selected': selectedArgs[optionKey(activeCommand, arg)] === option.value }"
								@click="setArg(activeCommand, arg, option.value)"
							>
								<strong>{{ option.label }}</strong>
								<span>{{ option.description }}</span>
							</button>
						</div>
					</section>
				</div>

				<div class="command-output">
					<span>Generated</span>
					<code>{{ composedCommand }}</code>
					<button type="button" @click="copyCommand">复制</button>
				</div>
			</article>
		</div>
	</section>
</template>

<style scoped>
.command-reference {
	display: grid;
	gap: clamp(1rem, 3vw, 1.6rem);
	width: min(1040px, 100%);
	padding-bottom: 5rem;
}

.command-header {
	display: grid;
	gap: 0.75rem;
}

.command-header h1,
.detail-heading h2,
.arg-section h3 {
	margin: 0;
	color: var(--title-color);
	letter-spacing: 0;
}

.command-header h1 {
	font-size: clamp(2rem, 5vw, 4.2rem);
	font-weight: 680;
	line-height: 1.04;
}

.command-header p,
.detail-heading p {
	max-width: 720px;
	margin: 0;
	color: var(--text-secondary);
	font-size: clamp(1rem, 2vw, 1.18rem);
	line-height: 1.65;
}

.command-console,
.command-detail,
.command-list-item {
	border: 1px solid color-mix(in srgb, var(--text-main) 12%, transparent);
	background: var(--background);
}

.command-console {
	display: grid;
	gap: 0.75rem;
	padding: 1rem;
}

.command-search {
	display: grid;
	gap: 0.45rem;
}

.command-search span,
.usage-block span,
.command-output span,
.detail-heading span {
	color: var(--primary);
	font-size: 0.78rem;
	font-weight: 780;
	text-transform: uppercase;
}

.command-search input {
	width: 100%;
	border: 1px solid var(--split);
	background: var(--code-bg);
	color: var(--code-text);
	font-family: var(--font-mono);
	font-size: clamp(1rem, 2vw, 1.2rem);
	padding: 0.9rem 1rem;
	box-sizing: border-box;
	outline: none;
}

.command-search input:focus {
	border-color: var(--primary);
}

.completion-list {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 0.5rem;
}

.completion-item,
.arg-option,
.command-output button {
	border: 1px solid var(--split);
	background: var(--background-secondary);
	color: var(--text-main);
	cursor: pointer;
}

.completion-item {
	display: grid;
	gap: 0.22rem;
	text-align: left;
	padding: 0.7rem 0.8rem;
}

.completion-item strong,
.command-list-item strong,
.arg-option strong {
	color: var(--title-color);
	font-family: var(--font-mono);
}

.completion-item span,
.command-list-item small,
.arg-option span {
	color: var(--text-secondary);
	font-size: 0.84rem;
	line-height: 1.42;
}

.command-layout {
	display: grid;
	grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
	gap: 1rem;
	align-items: start;
}

.command-list {
	display: grid;
	gap: 0.55rem;
}

.command-list-item {
	display: grid;
	gap: 0.35rem;
	text-align: left;
	padding: 0.85rem;
	cursor: pointer;
}

.command-list-item span {
	color: var(--primary);
	font-size: 0.76rem;
	font-weight: 760;
}

.command-list-item:hover,
.command-list-item:focus-visible,
.command-list-item.is-active,
.completion-item:hover,
.completion-item:focus-visible,
.arg-option:hover,
.arg-option:focus-visible,
.arg-option.is-selected,
.command-output button:hover,
.command-output button:focus-visible {
	border-color: var(--primary);
	outline: none;
}

.command-list-item.is-active,
.arg-option.is-selected {
	background: color-mix(in srgb, var(--primary) 10%, var(--background));
}

.command-detail {
	display: grid;
	gap: 1.1rem;
	padding: clamp(1rem, 3vw, 1.4rem);
}

.detail-heading {
	display: grid;
	gap: 0.55rem;
}

.detail-heading h2 {
	font-family: var(--font-mono);
	font-size: clamp(1.7rem, 4vw, 3rem);
}

.usage-block,
.command-output {
	display: grid;
	gap: 0.55rem;
}

.usage-block code,
.command-output code {
	display: block;
	overflow: auto;
	background: var(--code-bg);
	color: var(--code-text);
	font-family: var(--font-mono);
	font-size: 1rem;
	padding: 0.85rem 1rem;
}

.arg-builder {
	display: grid;
	gap: 0.9rem;
}

.arg-section {
	display: grid;
	gap: 0.65rem;
}

.arg-section h3 {
	font-size: 1rem;
}

.arg-options {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 0.55rem;
}

.arg-option {
	display: grid;
	gap: 0.28rem;
	text-align: left;
	padding: 0.75rem;
}

.command-output {
	grid-template-columns: 1fr auto;
	align-items: end;
}

.command-output span {
	grid-column: 1 / -1;
}

.command-output button {
	height: 100%;
	padding: 0 1rem;
	font-weight: 720;
}

@media (max-width: 860px) {
	.command-layout {
		grid-template-columns: 1fr;
	}

	.command-list {
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
	}
}

@media (max-width: 560px) {
	.command-output {
		grid-template-columns: 1fr;
	}

	.command-output button {
		min-height: 2.75rem;
	}
}
</style>
