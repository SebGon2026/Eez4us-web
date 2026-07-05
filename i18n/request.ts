import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

import { LOCALE_COOKIE, resolveLocale } from '@/lib/locale';
import { enMessages } from '@/messages/en';
import { esMessages } from '@/messages/es';

export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  const locale = resolveLocale({
    cookie: cookieStore.get(LOCALE_COOKIE)?.value,
    ipCountry: headerStore.get('cf-ipcountry'),
    acceptLanguage: headerStore.get('accept-language'),
  });

  return {
    locale,
    messages: locale === 'en' ? enMessages : esMessages,
  };
});
