# AI Duo — ChatGPT + Gemini starter project

Yeh starter project ek web app hai jo OpenAI aur Google Gemini APIs ko **server ke through** call karta hai. Yeh official ChatGPT/Gemini apps ka clone nahi hai, aur in companies ka endorsed product nahi hai.

## Is ZIP mein kya hai?

- `public/index.html` — app ka interface
- `public/styles.css` — design
- `public/app.js` — ChatGPT/Gemini/Compare buttons aur chat UI
- `server.js` — secure API backend
- `package.json` — Node.js dependencies
- `.env.example` — environment variables ka example

## Android mobile se online deploy karna

Computer ke bina bhi browser se kaam kar sakte ho, lekin Node.js backend ko chalane ke liye online server chahiye.

### A. API keys banao
1. OpenAI platform: https://platform.openai.com/api-keys
2. Gemini API key: https://aistudio.google.com/apikey
3. API keys ko is chat mein, HTML/JS files mein, GitHub repository mein, ya public ZIP mein mat daalo.
4. Provider accounts par billing/usage limits check karo. API use paid ho sakta hai; ChatGPT/Gemini consumer subscriptions API credits ki guarantee nahi deti.

### B. Project ko GitHub par upload karo
1. https://github.com par sign in/create account karo.
2. New repository banao. Public repository use kar rahe ho to ensure karo ki `.env` ya real keys kabhi upload na hon.
3. ZIP ko Android Files app mein extract karo.
4. Repository page par **Add file → Upload files** use karke extracted project files upload karo. `public` folder ke andar ki files bhi `public/` folder structure mein honi chahiye.
5. `.env.example` mein actual keys mat daalna. `.gitignore` mein `.env` excluded hai.

### C. Node.js host par deploy karo
Is project ko static-only hosting par deploy karne se backend nahi chalega. Node.js support wala host use karo, for example:
- Render: https://render.com
- Railway: https://railway.com

Host ke dashboard mein GitHub repository connect karo aur service configure karo:
- Runtime/environment: Node
- Build command: `npm install`
- Start command: `npm start`

### D. Environment variables set karo
Host ke Environment Variables section mein yeh add karo:
- `OPENAI_API_KEY` = tumhari OpenAI API key
- `GEMINI_API_KEY` = tumhari Gemini API key
- `OPENAI_MODEL` = `gpt-4.1-mini`
- `GEMINI_MODEL` = `gemini-2.5-flash`

Model access aur availability provider ke account ke hisaab se badal sakti hai. Agar model unavailable error aaye, provider dashboard/docs mein available model name check karke environment variable badlo.

Deploy complete hone ke baad host ka HTTPS URL kholo. `/api/health` par `{"ok":true}` dikhna chahiye. Phir main page par chat test karo.

## Important security notes
- API keys ko browser JavaScript mein kabhi mat rakho.
- Real API keys `.env` file ya hosting provider ke secret/environment-variable section mein rakho.
- API calls billable ho sakte hain. Public launch se pehle usage limits, authentication, per-user rate limits, abuse prevention, privacy policy, and terms add karna strongly recommended hai.
- Starter project basic IP-based rate limiting use karta hai; public production app ke liye yeh akela kaafi nahi hai.
- Chat history is starter version mein server par save nahi hoti.
- Compare mode mein dono APIs call hoti hain, isliye dono taraf usage charges ho sakte hain.

## API references
- OpenAI Responses API: https://developers.openai.com/api/reference/resources/responses/methods/create
- Gemini generateContent API: https://ai.google.dev/api/generate-content
