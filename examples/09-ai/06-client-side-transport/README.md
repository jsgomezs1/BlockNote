# AI Integration with ClientSideTransport

The standard setup is to have BlockNote AI call your server, which then calls an LLM of your choice. In this example, we show how you can use the `ClientSideTransport` to make calls directly to your LLM provider.

To hide API keys of our LLM provider, we do still route calls through a proxy server using `fetchViaProxy` (this is optional).

## Setup

1. Create a `.env` file in this directory with your Groq API key:
   ```
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

2. Get your Groq API key from [https://console.groq.com/](https://console.groq.com/)

3. Replace `your_groq_api_key_here` with your actual API key

**Note:** The `.env` file should not be committed to version control as it contains sensitive information.
