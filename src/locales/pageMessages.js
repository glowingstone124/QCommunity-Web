import zhOnboarding from './pageMessages/zh/onboarding.js';
import zhActivity from './pageMessages/zh/activity.js';
import zhAccount from './pageMessages/zh/account.js';
import zhWorld from './pageMessages/zh/world.js';
import zhContent from './pageMessages/zh/content.js';
import enOnboarding from './pageMessages/en/onboarding.js';
import enActivity from './pageMessages/en/activity.js';
import enAccount from './pageMessages/en/account.js';
import enWorld from './pageMessages/en/world.js';
import enContent from './pageMessages/en/content.js';

export const pageMessages = {
	zh: {
		...zhOnboarding,
		...zhActivity,
		...zhAccount,
		...zhWorld,
		...zhContent,
	},
	en: {
		...enOnboarding,
		...enActivity,
		...enAccount,
		...enWorld,
		...enContent,
	},
};
