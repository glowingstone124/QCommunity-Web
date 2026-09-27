<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { commands } from '@/data/commandReference.js'

const { t } = useI18n()

const query = ref('/')
const activeCommandName = ref(commands[0].name)
const selectedArgs = ref({})

function commandKey(command) {
	return command.name.replace(/^\//, '')
}

function localizeCommand(command) {
	const key = commandKey(command)
	return {
		...command,
		category: t(`commandPage.categories.${key}`),
		description: t(`commandPage.descriptions.${key}`),
		args: command.args.map((arg) => ({
			...arg,
			label: t(`commandPage.argumentLabels.${arg.key}`),
			options: arg.options?.map((option) => ({
				...option,
				description: t(`commandPage.options.${key}.${arg.key}.${option.value}`),
			})),
		})),
	}
}

const localizedCommands = computed(() => commands.map(localizeCommand))

const normalizedQuery = computed(() => query.value.trim().toLowerCase())

const filteredCommands = computed(() => {
	const term = normalizedQuery.value.replace(/^\//, '')

	if (!term) {
		return localizedCommands.value
	}

	return localizedCommands.value.filter((command) => {
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
	localizedCommands.value.find((command) => command.name === activeCommandName.value) || filteredCommands.value[0] || localizedCommands.value[0]
)

const completionOptions = computed(() => {
	const term = normalizedQuery.value

	if (!term || term === '/') {
		return localizedCommands.value.slice(0, 10).map((command) => ({
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
	const command = localizedCommands.value.find((item) => item.name === commandName || item.name.slice(1) === commandName)
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
			description: t('commandPage.fill', { label: arg.label }),
		}))
	}

	if (arg.dynamic === 'onlinePlayerNames') {
		return [
			{ value: '<player>', label: '<player>', description: t('commandPage.onlinePlayerHint') },
		]
	}

	if (arg.dynamic === 'fakePlayerNames') {
		return [
			{ value: '<fakePlayer>', label: '<fakePlayer>', description: t('commandPage.fakePlayerHint') },
		]
	}

	return [
		{ value: `<${arg.placeholder || arg.label}>`, label: `<${arg.placeholder || arg.label}>`, description: t('commandPage.fill', { label: arg.label }) },
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
			<h1>{{ t('commandPage.title') }}</h1>
			<p>{{ t('commandPage.description') }}</p>
		</header>

		<div class="command-console">
			<label class="command-search">
				<span>{{ t('commandPage.command') }}</span>
				<input
					v-model="query"
					type="text"
					autocomplete="off"
					spellcheck="false"
					placeholder="/"
				>
			</label>

			<div class="completion-list" :aria-label="t('commandPage.completion')">
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
			<nav class="command-list" :aria-label="t('commandPage.list')">
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
					<span>{{ t('commandPage.usage') }}</span>
					<code>{{ activeCommand.usage }}</code>
				</div>

				<div v-if="visibleArgs(activeCommand).length" class="arg-builder">
					<section v-for="arg in visibleArgs(activeCommand)" :key="arg.key" class="arg-section">
						<h3>
							{{ arg.label }}
							<span v-if="!arg.required">{{ t('commandPage.optional') }}</span>
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
					<span>{{ t('commandPage.generated') }}</span>
					<code>{{ composedCommand }}</code>
					<button type="button" @click="copyCommand">{{ t('commandPage.copy') }}</button>
				</div>
			</article>
		</div>
	</section>
</template>

<style scoped src="./CommandReference.css"></style>
