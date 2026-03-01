# Дії: підключення Sleep MVP до сайту Scoopy Log (scoopylog.app)

Мета: сторінка **https://scoopylog.app/sleep** працює в тому ж Netlify-проєкті, що й основний сайт додатку Scoopy Log.

---

## Варіант A: Netlify вже збирає цей репозиторій (Sleep MVP = джерело сайту)

Якщо в Netlify Site → **Build & deploy** → **Repository** вказано саме цей репо (Sleep MVP):

1. **Env змінні в Netlify**  
   Site → **Site configuration** → **Environment variables** — додай / перевір:

   | Змінна | Значення | Scopes |
   |--------|----------|--------|
   | `NEXT_PUBLIC_APP_URL` | `https://scoopylog.app` | All |
   | `OPENAI_API_KEY` | твій ключ | All |
   | `STRIPE_SECRET_KEY` | `sk_live_...` (продакшн) або `sk_test_...` | All |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_...` з Stripe Dashboard | All |
   | `UPSTASH_REDIS_REST_URL` | вже додано | All |
   | `UPSTASH_REDIS_REST_TOKEN` | вже додано | All |
   | `RESEND_API_KEY` | опційно, для листів з планом | All |
   | `SLEEP_EMAIL_FROM` | опційно, напр. `Scoopy Log <hello@scoopylog.app>` | All |

2. **Домен**  
   Site → **Domain management**: основний домен має бути **scoopylog.app** (або той, який ти використовуєш).

3. **Деплой**  
   Зміни в репо → Netlify сам збирає. Або **Trigger deploy** → **Deploy site**.

4. **Stripe webhook**  
   Stripe Dashboard → Developers → Webhooks → Add endpoint:
   - URL: **https://scoopylog.app/api/stripe/webhook**
   - Подія: **checkout.session.completed**  
   Підписаний секрет скопіюй в `STRIPE_WEBHOOK_SECRET` у Netlify.

Після цього **https://scoopylog.app/sleep** і **https://scoopylog.app/sleep/claim?token=...** мають працювати.

---

## Варіант B: Основний сайт Scoopy Log — інший репозиторій

Якщо зараз на Netlify підключено **інший** репо (наприклад, “Scoopy Log website”), а код Sleep MVP у тебе в окремій папці/репо:

**Варіант B1 — злити код у репо сайту**

1. У репо **Scoopy Log website** має бути Next.js (App Router).
2. Перенеси з проєкту Sleep MVP у цей репо:
   - `src/app/sleep/` (page, claim)
   - `src/app/api/sleep/` (preview, plan, fulfill)
   - `src/app/api/stripe/` (checkout, webhook)
   - `src/app/privacy/`, `src/app/terms/` (якщо ще немає)
   - `src/components/sleep/`
   - `src/lib/plan-store.ts`, `generate-full-plan.ts`, `sleep-email.ts`, `sleep-pdf.ts`
   - `src/types/sleep.ts`
   - Залежності з `package.json`: `@upstash/redis`, `openai`, `stripe`, `resend`, `jspdf`
3. У Netlify залишаєш підключення до репо **Scoopy Log website**, додаєш усі env змінні з таблиці вище.
4. Домен і webhook — як у варіанті A.

**Варіант B2 — змінити репо в Netlify на цей (Sleep MVP)**

1. Netlify → Site → **Build & deploy** → **Link repository** → обрати репо/папку з Sleep MVP.
2. Build command: `npm run build`, Publish: згідно з `netlify.toml` (у нас: `publish = ".next"` + плагін Next.js).
3. Додати env, домен scoopylog.app, webhook — як у варіанті A.

Тоді весь сайт (включно з головною) буде збиратися з цього репо. Якщо головна в іншому репо, краще B1 (перенести `/sleep` у репо сайту).

---

## Що вже зроблено в коді

- **Upstash Redis:** якщо задані `UPSTASH_REDIS_REST_URL` і `UPSTASH_REDIS_REST_TOKEN`, плани зберігаються в Redis (30 днів TTL). Якщо змінних немає — використовується in-memory store (як раніше).
- У Netlify ти вже додав Upstash-змінні — на проді буде Redis.

---

## Короткий чеклист

- [ ] У Netlify обрано правильний репо (цей або репо сайту з перенесеним `/sleep`).
- [ ] У Netlify задано: `NEXT_PUBLIC_APP_URL=https://scoopylog.app`, Stripe, OpenAI, Upstash, опційно Resend.
- [ ] Домен сайту в Netlify = **scoopylog.app**.
- [ ] Stripe webhook: URL **https://scoopylog.app/api/stripe/webhook**, подія **checkout.session.completed**, секрет у `STRIPE_WEBHOOK_SECRET`.
- [ ] Після деплою перевірити: https://scoopylog.app/sleep (прев’ю → оплата → лист з лінком → https://scoopylog.app/sleep/claim?token=...).

Якщо напишеш, який саме варіант у тебе (A чи B, і який репо зараз на Netlify), можу розписати кроки ще конкретніше під твій випадок.
