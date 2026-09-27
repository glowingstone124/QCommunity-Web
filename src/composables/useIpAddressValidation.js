import { ref, watch } from 'vue'

function isValidIpv4(value) {
	const parts = value.split('.')
	return parts.length === 4 && parts.every((part) => {
		if (!/^\d+$/.test(part) || (part.length > 1 && part.startsWith('0'))) return false
		const octet = Number(part)
		return octet >= 0 && octet <= 255
	})
}

function isValidIpv6(value) {
	if (!value.includes(':') || value.includes('%') || !/^[0-9a-fA-F:.]+$/.test(value)) return false
	let candidate = value
	const lastColon = candidate.lastIndexOf(':')
	const ipv4Tail = candidate.slice(lastColon + 1)
	if (ipv4Tail.includes('.')) {
		if (!isValidIpv4(ipv4Tail)) return false
		candidate = `${candidate.slice(0, lastColon)}:0:0`
	}
	if ((candidate.match(/::/g) || []).length > 1) return false
	const hasCompression = candidate.includes('::')
	const groups = candidate.split(':').filter(Boolean)
	if ((!hasCompression && groups.length !== 8) || (hasCompression && groups.length >= 8)) return false
	return groups.every((group) => /^[0-9a-fA-F]{1,4}$/.test(group))
}

export function useIpAddressValidation(ipAddress) {
	const isValidIp = ref(false)

	function validateIpAddress() {
		const value = ipAddress.value
		isValidIp.value = value === value.trim()
			&& value.length <= 45
			&& (isValidIpv4(value) || isValidIpv6(value))
	}

	watch(ipAddress, validateIpAddress)

	return { isValidIp }
}
