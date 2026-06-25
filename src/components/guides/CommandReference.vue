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
		name: '/myloc',
		category: '信息',
		description: '向公屏发送你当前所在世界与坐标。',
		usage: '/myloc',
		keywords: ['location', 'coords', 'coordinate', '坐标', '位置'],
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
				options: [
					{ value: 'query', label: 'query', description: '查询消息同步状态' },
					{ value: 'disable', label: 'disable', description: '禁用服务器消息同步' },
					{ value: 'enable', label: 'enable', description: '启用服务器消息同步' },
				],
			},
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
				options: [
					{ value: 'query', label: 'query', description: '查询伤害指示器状态' },
					{ value: 'enable', label: 'enable', description: '启用' },
					{ value: 'disable', label: 'disable', description: '禁用' },
				],
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
		return commands.slice(0, 6).map((command) => ({
			type: 'command',
			value: command.name,
			label: command.name,
			description: command.description,
			command,
		}))
	}

	if (!term.includes(' ')) {
		return filteredCommands.value.slice(0, 8).map((command) => ({
			type: 'command',
			value: command.name,
			label: command.name,
			description: command.description,
			command,
		}))
	}

	const [commandName, partial = ''] = term.split(/\s+/, 2)
	const command = commands.find((item) => item.name === commandName || item.name.slice(1) === commandName)
	const arg = command?.args[0]

	if (!arg) {
		return []
	}

	return arg.options
		.filter((option) => option.value.includes(partial))
		.map((option) => ({
			type: 'argument',
			value: `${command.name} ${option.value}`,
			label: option.label,
			description: option.description,
			command,
			argKey: arg.key,
			argValue: option.value,
		}))
})

const composedCommand = computed(() => {
	const command = activeCommand.value

	if (!command.args.length) {
		return command.name
	}

	const args = command.args.map((arg) => selectedArgs.value[`${command.name}:${arg.key}`] || `<${arg.label}>`)
	return [command.name, ...args].join(' ')
})

function selectCommand(command) {
	activeCommandName.value = command.name
	query.value = command.name
}

function applyCompletion(option) {
	activeCommandName.value = option.command.name
	query.value = option.value

	if (option.type === 'argument') {
		selectedArgs.value = {
			...selectedArgs.value,
			[`${option.command.name}:${option.argKey}`]: option.argValue,
		}
	}
}

function setArg(command, arg, value) {
	selectedArgs.value = {
		...selectedArgs.value,
		[`${command.name}:${arg.key}`]: value,
	}
	query.value = `${command.name} ${value}`
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

				<div v-if="activeCommand.args.length" class="arg-builder">
					<section v-for="arg in activeCommand.args" :key="arg.key" class="arg-section">
						<h3>{{ arg.label }}</h3>
						<div class="arg-options">
							<button
								v-for="option in arg.options"
								:key="option.value"
								type="button"
								class="arg-option"
								:class="{ 'is-selected': selectedArgs[`${activeCommand.name}:${arg.key}`] === option.value }"
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
